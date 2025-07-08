'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import useSWR from 'swr';
import { Upload as UploadIcon, FileImage } from 'lucide-react';

type Settings = {
  minDeposit?: number;
  depositLimits?: {
    min: number;
    max: number;
  };
  bankDetails?: Array<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }>;
};

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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const { data: settings, error: settingsError } = useSWR<Settings>(
    isAuthenticated() ? '/api/admin/settings' : null,
    async (url: string) => {
      let authToken = getCookie('token') || '';
      if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('token') || '';
      }

      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          router.push('/login');
          throw new Error('Session expired');
        }
        throw new Error('Failed to load settings');
      }

      return response.json();
    }
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đăng nhập' });
      router.push('/login');
    }
    if (settingsError) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải cài đặt' });
    }
  }, [user, isAuthenticated, router, settingsError, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!amount) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập số tiền' });
      return;
    }

    if (!file) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng tải lên ảnh xác nhận giao dịch' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Kích thước ảnh tối đa là 5MB' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Chỉ chấp nhận file ảnh định dạng JPG, JPEG hoặc PNG' });
      return;
    }

    if (settings && Number(amount) < (settings.minDeposit || 0)) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: `Số tiền nạp tối thiểu là ${(settings.minDeposit || 0).toLocaleString()} đ`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let authToken = getCookie('token') || '';
      if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('token') || '';
      }

      if (!authToken) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('bill', file);

      // Add CSRF token if needed
      const csrfToken = getCookie('csrf-token') || '';
      
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-CSRF-Token': csrfToken,
          // Let the browser set the Content-Type with boundary
        },
        credentials: 'include',
        body: formData,
      });

      // Handle different response statuses
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Có lỗi xảy ra khi gửi yêu cầu');
      }

      const result = await res.json();

      if (res.ok) {
        toast({ 
          title: 'Thành công', 
          description: 'Yêu cầu nạp tiền đã được gửi. Vui lòng chờ xác nhận từ quản trị viên.' 
        });
        setAmount('');
        setFile(null);
        setPreviewUrl(null);
        const fileInput = document.getElementById('bill') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 10000);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể gửi yêu cầu. Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p>Vui lòng đăng nhập để tiếp tục</p>
          <Button 
            onClick={() => router.push('/login')} 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Đi đến trang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="deposit-page" className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-700 p-6">
            <CardTitle className="text-2xl font-semibold text-white">Nạp tiền</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="amount" className="text-gray-400 block mb-2">Số tiền (VND)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập số tiền cần nạp"
                  className="bg-gray-700 text-white border-gray-600 focus:border-blue-500 w-full"
                  min={settings?.minDeposit || 0}
                  required
                />
                {settings && (
                  <p className="text-sm text-gray-500 mt-1">
                    Số tiền tối thiểu: {(settings.minDeposit || 0).toLocaleString()} đ
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bill" className="text-gray-400 block mb-2">
                  Ảnh xác nhận giao dịch
                </Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="bill"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                      file ? 'border-green-500' : 'border-gray-600 hover:border-gray-500'
                    } bg-gray-700 hover:bg-gray-700/50 transition-colors`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      {previewUrl ? (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded-md mb-2 border border-gray-600"
                          />
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            ✓
                          </div>
                        </div>
                      ) : (
                        <>
                          <FileImage className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-300 mb-1">
                            <span className="font-medium">Nhấn để tải lên</span> hoặc kéo thả ảnh
                          </p>
                          <p className="text-xs text-gray-400">
                            Định dạng: JPG, PNG (tối đa 5MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="bill"
                      name="bill"
                      type="file"
                      className="hidden"
                      accept="image/jpeg, image/png, image/jpg"
                      onChange={handleFileChange}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
                {file && (
                  <div className="mt-2 text-sm text-gray-400">
                    Đã chọn: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!amount || !file || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Gửi yêu cầu nạp tiền
                  </span>
                )}
              </Button>
            </form>
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
