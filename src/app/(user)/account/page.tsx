"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function AccountPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Form state cho thông tin ngân hàng
  const [bankForm, setBankForm] = useState({
    fullName: '',
    bankType: 'Ngân hàng',
    bankName: '',
    accountNumber: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Xử lý query parameter tab từ URL
  useEffect(() => {
    // Lấy query parameter từ URL
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    
    // Nếu có tab parameter và là tab hợp lệ, set activeTab
    if (tabParam && ['overview', 'bank', 'verify', 'password'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  // Load thông tin ngân hàng nếu đã có
  useEffect(() => {
    if (user && user.bank) {
      setBankForm({
        fullName: user.bank.accountHolder || '',
        bankType: 'Ngân hàng',
        bankName: user.bank.name || '',
        accountNumber: user.bank.accountNumber || ''
      });
      
      // Kiểm tra trạng thái xác minh
      setIsVerified(user.bank.verified === true);
    }
  }, [user]);
  
  // Handle tab selection and close mobile menu when a tab is selected
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };
  
  // Handle form input changes
  const handleBankFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Submit bank information
  const handleSubmitBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!bankForm.fullName || !bankForm.bankName || !bankForm.accountNumber) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/users/bank-info', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountHolder: bankForm.fullName,
          name: bankForm.bankName,
          accountNumber: bankForm.accountNumber
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Thông tin ngân hàng đã được cập nhật' });
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: data.message || 'Không thể cập nhật thông tin' });
      }
    } catch (error) {
      console.error('Bank info update error:', error);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể kết nối đến máy chủ' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đăng nhập' });
      router.push('/login');
    }
  }, [user, loading, router, toast]);

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh] text-gray-400">Đang tải...</div>;
  }

  if (!user) {
    return null;
  }

  // Định dạng ngày đăng ký
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[90vh] bg-[#0F1924] text-white flex flex-col md:flex-row">
      {/* Mobile menu button */}
      <div className="flex items-center justify-between p-4 md:hidden border-b border-gray-800">
        <h1 className="text-xl font-bold">Tài khoản</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:bg-blue-900"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
      
      {/* Menu bên trái - hidden on mobile unless toggled */}
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-[250px] flex-col space-y-1 p-4 md:border-r border-gray-800`}>
        <Button
          variant="link"
          className={`justify-start px-4 py-2 ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-white hover:bg-blue-900'}`}
          onClick={() => handleTabSelect('overview')}
        >
          Tổng quan
        </Button>
        <Button
          variant="link"
          className={`justify-start px-4 py-2 ${activeTab === 'bank' ? 'bg-blue-600 text-white' : 'text-white hover:bg-blue-900'}`}
          onClick={() => handleTabSelect('bank')}
        >
          Thông tin ngân hàng
        </Button>
        <Button
          variant="link"
          className={`justify-start px-4 py-2 ${activeTab === 'verify' ? 'bg-blue-600 text-white' : 'text-white hover:bg-blue-900'}`}
          onClick={() => handleTabSelect('verify')}
        >
          Xác minh danh tính
        </Button>
        <Button
          variant="link"
          className={`justify-start px-4 py-2 ${activeTab === 'password' ? 'bg-blue-600 text-white' : 'text-white hover:bg-blue-900'}`}
          onClick={() => handleTabSelect('password')}
        >
          Thay đổi mật khẩu
        </Button>
      </div>

      {/* Khu vực thông tin chính */}
      <div className="flex-1 p-4 md:p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-medium mb-4">tdnm</h2>
              <p className="text-gray-400">ID: {user.id || '69934'}</p>
              <p className="text-gray-400">Ngày đăng ký: {formatDate(user.createdAt) || '24/06/2025 12:37'}</p>
              <div className="mt-2">
                <span className="inline-block bg-orange-600 text-white text-xs px-3 py-1 rounded">
                  Chưa xác minh
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg mb-2">Tổng tài sản quy đổi</h3>
              <p className="text-3xl font-bold">{user.balance?.available?.toLocaleString() || '0'}VND</p>
              
              <div className="mt-4 flex space-x-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => router.push('/deposit')}
                >
                  Nạp tiền
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => router.push('/withdraw')}
                >
                  Rút tiền
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg mb-3">Danh sách tài sản</h3>
              <div className="border-b border-gray-700 pb-2 mb-2 flex justify-between">
                <span className="text-gray-400">Bank</span>
                <span className="text-gray-400">Có sẵn</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Ngân hàng</span>
                <span>{user.balance?.available?.toLocaleString() || '0'}VND</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-medium">Thông tin ngân hàng</h2>
              {isVerified && (
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded">
                  Đã xác minh
                </span>
              )}
            </div>
            
            {isVerified ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Họ tên</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.fullName} 
                    readOnly 
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Loại</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.bankType} 
                    readOnly 
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Ngân hàng</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.bankName} 
                    readOnly 
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Số tài khoản</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.accountNumber} 
                    readOnly 
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBankInfo} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">Họ tên <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="fullName"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.fullName}
                    onChange={handleBankFormChange}
                    placeholder="Nhập tên, vui lòng nhập thêm khoảng cách cho mỗi từ"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Loại <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value="Ngân hàng"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Ngân hàng <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="bankName"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.bankName}
                    onChange={handleBankFormChange}
                    placeholder="Nhập tên ngân hàng"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Số tài khoản <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="accountNumber"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                    value={bankForm.accountNumber}
                    onChange={handleBankFormChange}
                    placeholder="Nhập số tài khoản ngân hàng của bạn"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                
                <div className="mt-4 bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-3">
                  <p className="text-sm">Thông tin ngân hàng là bắt buộc để thực hiện lệnh rút tiền.</p>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium mb-4">Xác minh danh tính</h2>
            <p className="text-gray-300">Vui lòng tải lên các giấy tờ tùy thân để xác minh danh tính của bạn</p>
            <div className="grid grid-cols-1 gap-4 mt-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-gray-400 mb-1">CMND/CCCD mặt trước</label>
                <div className="border-2 border-dashed border-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-500">Kéo và thả hoặc click để tải file lên</p>
                  <input type="file" className="hidden" />
                  <Button className="mt-2 bg-blue-600 hover:bg-blue-700">Tải lên</Button>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">CMND/CCCD mặt sau</label>
                <div className="border-2 border-dashed border-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-500">Kéo và thả hoặc click để tải file lên</p>
                  <input type="file" className="hidden" />
                  <Button className="mt-2 bg-blue-600 hover:bg-blue-700">Tải lên</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium mb-4">Thay đổi mật khẩu</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                />
              </div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                Cập nhật mật khẩu
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
