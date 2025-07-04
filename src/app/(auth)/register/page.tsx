"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, fullName, password }),
      });
      const data = await response.json().catch(e => ({ message: 'Lỗi phân tích JSON từ server' }));
      if (response.ok) {
        toast({ title: 'Đăng ký thành công', description: 'Đang chuyển đến trang đăng nhập...' });
        
        // Sử dụng window.location để đảm bảo chuyển hướng mạnh
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        console.error('Lỗi đăng ký:', data, response.status);
        toast({ 
          variant: 'destructive', 
          title: `Lỗi (${response.status})`, 
          description: data.message || data.error || 'Lỗi server không xác định'
        });
      }
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể kết nối với server API' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Đăng ký tài khoản mới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                placeholder="Nhập họ và tên của bạn"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Đã có tài khoản? </span>
              <a href="/login" className="text-blue-600 hover:underline cursor-pointer">
                Đăng nhập
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
