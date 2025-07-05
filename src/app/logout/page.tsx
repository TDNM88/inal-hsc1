'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        // Redirect sẽ được xử lý bởi hàm logout trong useAuth
      } catch (error) {
        console.error('Logout error:', error);
        router.push('/login');
      }
    };

    performLogout();
  }, [logout, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Đang đăng xuất...</h1>
        <p>Vui lòng đợi trong giây lát.</p>
      </div>
    </div>
  );
}