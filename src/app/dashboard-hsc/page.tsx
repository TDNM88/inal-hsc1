"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!response.ok || !data.user?.isAdmin) {
          throw new Error('Unauthorized');
        }
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Bạn không có quyền truy cập trang này',
          variant: 'destructive',
        });
        router.push('/login');
      }
    };

    checkAdmin();
  }, [router, toast]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển quản trị</h1>
          <button
            onClick={() => {
              // Handle logout
              fetch('/api/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="text-red-600 hover:text-red-800"
          >
            Đăng xuất
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Chào mừng đến với trang quản trị</h2>
            <p className="text-gray-600">Vui lòng chọn chức năng từ menu bên trái.</p>
            
            {/* Add your admin dashboard content here */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Example cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Tổng người dùng</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">1,234</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add more cards as needed */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
