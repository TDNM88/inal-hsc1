"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import UserMenu from '@/components/user-menu';

export default function AccountPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đăng nhập' });
      router.push('/login');
    }
  }, [user, loading, router, toast]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex justify-end p-4 border-b border-gray-700">
        <UserMenu user={user} logout={logout} />
      </header>
      <main className="p-6">
        <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Tên đăng nhập</Label>
              <Input value={user.username} readOnly className="bg-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Số dư khả dụng</Label>
              <Input value={user.balance?.available.toLocaleString() + ' đ'} readOnly className="bg-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Số dư đông băng</Label>
              <Input value={user.balance?.frozen.toLocaleString() + ' đ'} readOnly className="bg-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Họ tên</Label>
              <Input value={user.fullName} readOnly className="bg-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Ngân hàng</Label>
              <Input value={user.bank?.name} readOnly className="bg-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Số tài khoản</Label>
              <Input value={user.bank?.accountNumber} readOnly className="bg-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Chủ tài khoản</Label>
              <Input value={user.bank?.accountHolder} readOnly className="bg-gray-700 text-white" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
