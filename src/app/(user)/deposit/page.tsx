'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import useSWR from 'swr';
import { Upload } from 'lucide-react';

export default function DepositPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [bill, setBill] = useState<File | null>(null);

  const { data: settings, error: settingsError } = useSWR(
    token ? '/api/admin/settings' : null,
    url => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
  );

  useEffect(() => {
    if (!loading && !user) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đăng nhập' });
      router.push('/login');
    }
  }, [user, loading, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBill(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !bill) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập số tiền và tải lên bill' });
      return;
    }

    if (settings && Number(amount) < settings.minDeposit) {
      toast({ variant: 'destructive', title: 'Lỗi', description: `Số tiền nạp tối thiểu là ${settings.minDeposit.toLocaleString()} đ` });
      return;
    }

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('bill', bill);

    try {
      // Khi gửi FormData với file, không nên set Content-Type header
      // vì trình duyệt sẽ tự động thiết lập với multipart/form-data và boundary phù hợp
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          // Không set Content-Type khi gửi FormData có file
        },
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Yêu cầu nạp tiền đã được gửi' });
        setAmount('');
        setBill(null);
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể gửi yêu cầu' });
    }
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center h-[60vh] text-gray-600">Đang tải...</div>;
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
              <h3 className="text-lg font-medium text-gray-300 mb-4">Thông tin ngân hàng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400">Tên ngân hàng</Label>
                  <Input
                    value={settings?.bankName || ''}
                    readOnly
                    className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Số tài khoản</Label>
                  <Input
                    value={settings?.accountNumber || ''}
                    readOnly
                    className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Chủ tài khoản</Label>
                  <Input
                    value={settings?.accountHolder || ''}
                    readOnly
                    className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Số tiền nạp</Label>
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
            <div>
              <Label className="text-gray-400">Tải lên bill chuyển khoản</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-gray-700 text-white border-gray-600 focus:border-blue-500 file:bg-gray-600 file:text-white file:hover:bg-gray-500"
                />
                {bill && (
                  <span className="text-sm text-gray-400 truncate max-w-xs">{bill.name}</span>
                )}
              </div>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!amount || !bill}
            >
              <Upload className="h-5 w-5 mr-2" />
              Gửi yêu cầu
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}