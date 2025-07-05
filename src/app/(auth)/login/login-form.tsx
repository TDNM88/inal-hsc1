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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!email || !password) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ email và mật khẩu',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
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

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Quên mật khẩu?
              </Link>
            </div>
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
