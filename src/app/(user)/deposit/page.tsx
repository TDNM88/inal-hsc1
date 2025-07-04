"use client";

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
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
    return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  }

  return (
    <div className="text-white">
      <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Nạp tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Thông tin ngân hàng</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">Tên ngân hàng</Label>
                  <Input value={settings?.bankName || ''} readOnly className="bg-gray-700 text-white" />
                </div>
                <div>
                  <Label className="text-white">Số tài khoản</Label>
                  <Input value={settings?.accountNumber || ''} readOnly className="bg-gray-700 text-white" />
                </div>
                <div>
                  <Label className="text-white">Chủ tài khoản</Label>
                  <Input value={settings?.accountHolder || ''} readOnly className="bg-gray-700 text-white" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-white">Số tiền nạp</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Số tiền (VND)"
                className="bg-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Tải lên bill chuyển khoản</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-gray-700 text-white"
                />
                {bill && <span className="text-sm text-gray-400">{bill.name}</span>}
              </div>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={!amount || !bill}
            >
              <Upload className="h-4 w-4 mr-2" />
              Gửi yêu cầu
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
