'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { authenticateUser, setAuthSession } from '@/lib/simple-auth';

export function SimpleLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { success, user, error } = await authenticateUser(username, password);
      
      if (!success || !user) {
        throw new Error(error || 'Đăng nhập thất bại');
      }

      // Lưu thông tin đăng nhập vào localStorage
      setAuthSession(user);
      
      // Hiển thị thông báo thành công
      toast({
        title: 'Đăng nhập thành công',
        description: 'Đang chuyển hướng...',
        variant: 'default',
      });
      
      // Chuyển hướng sau khi đăng nhập thành công
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto h-16 w-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">
            Đăng nhập
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng đăng nhập để tiếp tục
          </p>
        </div>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="Nhập tên đăng nhập"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Mật khẩu
                    </Label>
                    <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="Nhập mật khẩu"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Đang xử lý...
                    </>
                  ) : 'Đăng nhập'}
                </Button>
              </div>
            </form>
          </CardContent>
          
          <div className="px-6 pb-6">
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/register">
                <Button 
                  variant="outline" 
                  className="w-full py-2 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition duration-200"
                >
                  Tạo tài khoản mới
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
