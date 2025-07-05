'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!username || !password) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username: username.trim(),
        password: password.trim(),
        callbackUrl: searchParams?.get('callbackUrl') || '/dashboard',
      });

      if (result?.error) {
        // Handle specific error messages
        let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
        
        if (result.error.includes('CredentialsSignin')) {
          errorMessage = 'Email hoặc mật khẩu không chính xác';
        } else if (result.error.includes('AccountNotActive')) {
          errorMessage = 'Tài khoản của bạn chưa được kích hoạt';
        }
        
        throw new Error(errorMessage);
      }

      if (result?.url) {
        // Show success message before redirect
        toast({
          title: 'Đăng nhập thành công',
          description: 'Đang chuyển hướng...',
          variant: 'default',
        });
        
        // Small delay to show success message
        const redirectUrl = result.url || '/dashboard';
        setTimeout(() => {
          router.push(redirectUrl);
        }, 500);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Lỗi đăng nhập',
        description: error.message || 'Đã xảy ra lỗi khi đăng nhập',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập tài khoản
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tên đăng nhập"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Quên mật khẩu?
            </Link>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng nhập
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Hoặc</span>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/register">
              <Button variant="outline" className="w-full">
                Tạo tài khoản mới
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
