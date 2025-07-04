"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        login(data.token, data.user);
        toast({ title: 'Đăng nhập thành công', description: 'Đang chuyển hướng...' });
        
        // Sử dụng router.push để điều hướng trong Next.js
        // Nếu là admin, chuyển đến trang quản trị ẩn /dashboard-hsc thay vì /admin
        if (data.user.role === 'admin') {
          router.push('/dashboard-hsc');
        } else {
          router.push('/trade');
        }
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: data.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể đăng nhập' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Tên đăng nhập</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-700 text-white"
                placeholder="Tên đăng nhập"
              />
            </div>
            <div>
              <Label className="text-white">Mật khẩu</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 text-white"
                placeholder="Mật khẩu"
              />
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
