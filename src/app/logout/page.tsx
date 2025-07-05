'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthSession } from '@/lib/simple-auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Xóa thông tin đăng nhập
    clearAuthSession();
    
    // Chuyển hướng về trang đăng nhập
    router.push('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Đang đăng xuất...</h1>
        <p>Vui lòng đợi trong giây lát.</p>
      </div>
    </div>
  );
}
