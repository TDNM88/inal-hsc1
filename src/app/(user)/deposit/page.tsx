'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { useToast } from 'components/ui/use-toast';
import useSWR from 'swr';
import { Upload } from 'lucide-react';

// Hàm lấy cookie
function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

export default function DepositPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [bill, setBill] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [billUrl, setBillUrl] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const { data: settings, error: settingsError } = useSWR(
    isAuthenticated() ? '/api/admin/settings' : null,
    async (url) => {
      let authToken = getCookie('token') || '';
      if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('token') || '';
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          router.push('/login');
          throw new Error('Phiên đăng nhập đã hết hạn');
        }
        throw new Error('Không thể tải cài đặt');
      }
      
      return response.json();
    }
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đăng nhập' });
      router.push('/login');
    }
  }, [user, isAuthenticated, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBill(file);
      handleUploadFile(file);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setBillUrl(null);
    
    try {
      let authToken = getCookie('token') || '';
      if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('token') || '';
      }
      
      if (!authToken) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          router.push('/login');
          throw new Error('Phiên đăng nhập đã hết hạn');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload thất bại');
      }
      
      const data = await response.json();
      setBillUrl(data.url);
      toast({
        title: 'Thành công',
        description: 'Tải lên ảnh thành công',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải lên ảnh. Vui lòng thử lại.',
      });
      setBill(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !bill) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập số tiền và tải lên bill' });
      return;
    }

    if (settings && Number(amount) < settings.minDeposit) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: `Số tiền nạp tối thiểu là ${settings.minDeposit.toLocaleString()} đ`,
      });
      return;
    }

    if (!billUrl) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đợi ảnh được tải lên hoàn tất' });
      return;
    }

    try {
      let authToken = getCookie('token') || '';
      if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('token') || '';
      }
      
      if (!authToken) {
        throw new Error('Vui lòng đăng nhập lại');
      }
      
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(amount),
          bill: billUrl,
          status: 'pending',
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Yêu cầu nạp tiền đã được gửi' });
        setTimeout(() => {
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 5000); // Popup closes after 5 seconds
        }, 5000); // Popup appears 5 seconds after success
        setAmount('');
        setBill(null);
        setBillUrl(null);
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể gửi yêu cầu. Vui lòng thử lại sau.',
      });
    }
  };

  if (!isAuthenticated()) {
    return <div>Vui lòng đăng nhập để tiếp tục</div>;
  }

  return (
    <div id="deposit-page" className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-700 p-6">
            <CardTitle className="text-2xl font-semibold text-white">Nạp tiền</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-gray-400">Số tiền</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Số tiền (VND)"
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
              />
              {settings && (
                <p className="text-sm text-gray-500 mt-1">
                  Tối thiểu: {settings.minDeposit.toLocaleString()} đ
                </p>
              )}
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!amount}
            >
              {isUploading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Gửi yêu cầu
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Thông tin thanh toán</h3>
            <div className="space-y-2 text-gray-300">
              <p><strong>Tên ngân hàng:</strong> ABBANK</p>
              <p><strong>Số tài khoản:</strong> 0387473721</p>
              <p><strong>Chủ tài khoản:</strong> VU VAN MIEN</p>
            </div>
            <Button
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowPopup(false)}
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
