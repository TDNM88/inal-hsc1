'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Loader2, Home, Users, History, TrendingUp, ArrowUpCircle, ArrowDownCircle, Settings, Bell, HelpCircle, Edit, Trash2, ChevronLeft, ChevronRight, Upload, FileText, CheckCircle, XCircle, Clock, Eye, User, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { VerificationImageModal } from '@/components/admin/VerificationImageModal';
import useSWR from 'swr';
import UserMenu from '@/components/user-menu';

type PageType = 'dashboard' | 'customers' | 'order-history' | 'trading-sessions' | 'deposit-requests' | 'withdrawal-requests' | 'settings' | 'identity-verification';

const menuItems = [
  { id: 'dashboard' as PageType, title: 'Dashboard', icon: Home },
  { id: 'customers' as PageType, title: 'Khách hàng', icon: Users },
  { id: 'order-history' as PageType, title: 'Lịch sử đặt lệnh', icon: History },
  { id: 'trading-sessions' as PageType, title: 'Phiên giao dịch', icon: TrendingUp },
  { id: 'deposit-requests' as PageType, title: 'Yêu cầu nạp tiền', icon: ArrowUpCircle },
  { id: 'withdrawal-requests' as PageType, title: 'Yêu cầu rút tiền', icon: ArrowDownCircle },
  { id: 'settings' as PageType, title: 'Cài đặt', icon: Settings },
  { id: 'identity-verification' as PageType, title: 'Xác minh danh tính', icon: FileText },
];

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

// Dashboard Page Component
function DashboardPage({ startDate, setStartDate, endDate, setEndDate, token }: any) {
  const { toast } = useToast();
  const { data: statsData, isLoading: statsLoading } = useSWR(
    token ? `/api/admin/stats?startDate=${startDate}&endDate=${endDate}` : null,
    url => fetcher(url, token),
  );
  const { data: ordersData, isLoading: ordersLoading } = useSWR(
    token ? `/api/admin/orders?startDate=${startDate}&endDate=${endDate}&limit=8` : null,
    url => fetcher(url, token),
  );
  const { data: usersData, isLoading: usersLoading } = useSWR(
    token ? `/api/admin/users?startDate=${startDate}&endDate=${endDate}&limit=10` : null,
    url => fetcher(url, token),
  );

  const stats = statsData || { newUsers: 131, totalDeposits: 10498420000, totalWithdrawals: 6980829240, totalUsers: 5600000 };
  const orders = ordersData?.orders || [];
  const users = usersData?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Dashboard</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <span className="text-sm font-medium">Thời gian</span>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-32 h-8" />
          <span>-</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-32 h-8" />
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">Đặt lại</Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">Áp dụng</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tài khoản mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-500">{statsLoading ? '...' : stats.newUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng tiền nạp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{statsLoading ? '...' : stats.totalDeposits.toLocaleString()} đ</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng tiền rút</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{statsLoading ? '...' : stats.totalWithdrawals.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tài khoản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-500">{statsLoading ? '...' : stats.totalUsers}</div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Lệnh mới</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {ordersLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Người dùng</TableHead>
                  <TableHead className="text-white">Phiên</TableHead>
                  <TableHead className="text-white">Loại</TableHead>
                  <TableHead className="text-white">Số tiền</TableHead>
                  <TableHead className="text-white">Kết quả</TableHead>
                  <TableHead className="text-white">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-teal-500 font-medium">{order.user}</TableCell>
                    <TableCell className="text-white">{order.session}</TableCell>
                    <TableCell>
                      <Badge
                        variant={order.type === 'Lên' ? 'default' : 'destructive'}
                        className={order.type === 'Lên' ? 'bg-green-500 hover:bg-green-500' : 'bg-red-500 hover:bg-red-500'}
                      >
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">{order.amount.toLocaleString()}đ</TableCell>
                    <TableCell className="text-green-500 font-semibold">{order.result}</TableCell>
                    <TableCell className="text-gray-400">{order.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Người dùng mới</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {usersLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Tên</TableHead>
                  <TableHead className="text-white">Tên đăng nhập</TableHead>
                  <TableHead className="text-white">Tiền</TableHead>
                  <TableHead className="text-white">Ip login</TableHead>
                  <TableHead className="text-white">Vai trò</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-teal-500 font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-white">{user.username}</TableCell>
                    <TableCell className="text-white">{user.balance?.available.toLocaleString()}</TableCell>
                    <TableCell className="text-white">{user.loginInfo}</TableCell>
                    <TableCell className="text-white">{user.role === 'admin' ? 'Quản trị' : 'Khách hàng'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Customers Page Component
function CustomersPage({ token }: any) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '', password: '', balance: 0, frozenBalance: 0, fullName: '',
    bankName: '', accountNumber: '', accountHolder: '',
  });

  const { data, isLoading, mutate } = useSWR(
    token ? `/api/admin/users?search=${searchTerm}&status=${statusFilter}` : null,
    url => fetcher(url, token),
    { refreshInterval: 5000 }
  );

  const customers = data?.users || [];

  const toggleCustomerStatus = async (customerId: string, field: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${customerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: `Đã cập nhật trạng thái ${field}` });
        mutate();
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật trạng thái' });
    }
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setEditForm({
      username: customer.username,
      password: '',
      balance: customer.balance.available,
      frozenBalance: customer.balance.frozen,
      fullName: customer.fullName,
      bankName: customer.bank?.name || '',
      accountNumber: customer.bank?.accountNumber || '',
      accountHolder: customer.bank?.accountHolder || '',
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    try {
      const res = await fetch(`/api/admin/users/${editingCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã cập nhật thông tin khách hàng' });
        mutate();
        setShowEditModal(false);
        setEditingCustomer(null);
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật khách hàng' });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      try {
        const res = await fetch(`/api/admin/users/${customerId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok) {
          toast({ title: 'Thành công', description: 'Đã xóa khách hàng' });
          mutate();
        } else {
          toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể xóa khách hàng' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Khách hàng</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Tìm kiếm</Label>
          <Input
            placeholder="Tìm theo username, ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">Đặt lại</Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">Áp dụng</Button>
      </div>
      <div className="flex justify-end mb-4">
        <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">+ Thêm tài khoản</Button>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Danh sách khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Tên đăng nhập</TableHead>
                  <TableHead className="text-white">Số dư</TableHead>
                  <TableHead className="text-white">Ip login</TableHead>
                  <TableHead className="text-white">Thông tin xác minh</TableHead>
                  <TableHead className="text-white">Trạng thái</TableHead>
                  <TableHead className="text-white">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => (
                  <TableRow key={customer._id}>
                    <TableCell className="text-teal-400 font-medium">{customer.username}</TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        <div>Số dư: <span className="font-semibold">{customer.balance.available.toLocaleString()}</span></div>
                        <div>Số dư đông băng: <span className="font-semibold">{customer.balance.frozen.toLocaleString()}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{customer.loginInfo}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-white">
                        <div>{customer.fullName}</div>
                        <div>CCCD mặt trước: {customer.verification?.cccdFront ? 'Có' : 'Không'}</div>
                        <div>CCCD mặt sau: {customer.verification?.cccdBack ? 'Có' : 'Không'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>Trạng thái:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'active', customer.status.active)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.status.active ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.status.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {customer.status.active ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Xác minh:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'verified', customer.verification.verified)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.verification.verified ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.verification.verified ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.verification.verified ? 'text-green-600' : 'text-gray-500'}`}>
                            {customer.verification.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Khóa cược:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'betLocked', customer.status.betLocked)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.status.betLocked ? 'bg-red-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status.betLocked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.status.betLocked ? 'text-red-600' : 'text-gray-500'}`}>
                            {customer.status.betLocked ? 'Có' : 'Không'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Khóa rút:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'withdrawLocked', customer.status.withdrawLocked)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.status.withdrawLocked ? 'bg-red-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status.withdrawLocked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.status.withdrawLocked ? 'text-red-600' : 'text-gray-500'}`}>
                            {customer.status.withdrawLocked ? 'Có' : 'Không'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="p-1 bg-transparent hover:bg-blue-800" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="outline" className="p-1 bg-transparent hover:bg-red-800" onClick={() => handleDeleteCustomer(customer._id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Update thông tin</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tên đăng nhập</Label>
                <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="bg-gray-700 text-white" />
              </div>
              <div>
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="bg-gray-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Số dư</Label>
                <Input
                  type="number"
                  value={editForm.balance}
                  onChange={(e) => setEditForm({ ...editForm, balance: Number(e.target.value) })}
                  className="bg-gray-700 text-white"
                />
              </div>
              <div>
                <Label>Số dư đông băng</Label>
                <Input
                  type="number"
                  value={editForm.frozenBalance}
                  onChange={(e) => setEditForm({ ...editForm, frozenBalance: Number(e.target.value) })}
                  className="bg-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-center mb-4">Thông tin xác minh danh tính</h3>
              <div className="mb-4">
                <Label>Họ tên</Label>
                <Input
                  placeholder="Họ tên"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>CCCD mặt trước</Label>
                  <Button variant="outline" className="w-full mt-2 bg-transparent text-white border-gray-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                  </Button>
                </div>
                <div>
                  <Label>CCCD mặt sau</Label>
                  <Button variant="outline" className="w-full mt-2 bg-transparent text-white border-gray-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-center mb-4">Thông tin ngân hàng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Tên ngân hàng</Label>
                  <Input
                    placeholder="Tên ngân hàng"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label>Số tài khoản</Label>
                  <Input
                    placeholder="Số tài khoản"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label>Chủ tài khoản</Label>
                  <Input
                    placeholder="Chủ tài khoản"
                    value={editForm.accountHolder}
                    onChange={(e) => setEditForm({ ...editForm, accountHolder: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-white border-gray-600 w-full sm:w-auto">Đóng</Button>
              <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" onClick={handleSaveCustomer}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Deposit Requests Page Component
function DepositRequestsPage({ startDate, setStartDate, endDate, setEndDate, token }: any) {
  const { toast } = useToast();
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, mutate } = useSWR(
    token ? `/api/deposits?customer=${customerFilter}&status=${statusFilter}&startDate=${startDate}&endDate=${endDate}` : null,
    url => fetcher(url, token),
    { refreshInterval: 5000 }
  );

  const deposits = data?.deposits || [];

  const updateDepositStatus = async (depositId: string, status: 'Đã duyệt' | 'Từ chối') => {
    try {
      const res = await fetch(`/api/deposits/${depositId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: `Yêu cầu nạp tiền đã được ${status}` });
        mutate();
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật trạng thái' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Yêu cầu nạp tiền</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Khách hàng</Label>
          <Input
            placeholder="Khách hàng"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full sm:w-48 bg-gray-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
              <SelectItem value="Đã duyệt">Đã duyệt</SelectItem>
              <SelectItem value="Từ chối">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-40 bg-gray-700 text-white" />
          <span>-</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-40 bg-gray-700 text-white" />
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto text-white border-gray-600">Đặt lại</Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">Áp dụng</Button>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Thời gian</TableHead>
                  <TableHead className="text-white">Khách hàng</TableHead>
                  <TableHead className="text-white">Số tiền</TableHead>
                  <TableHead className="text-white">Bill</TableHead>
                  <TableHead className="text-white">Trạng thái</TableHead>
                  <TableHead className="text-white">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-white">{new Date(deposit.time).toLocaleString()}</TableCell>
                    <TableCell className="text-teal-500">{deposit.customer}</TableCell>
                    <TableCell className="text-white">{deposit.amount.toLocaleString()}đ</TableCell>
                    <TableCell>
                      <Button variant="link" className="text-blue-600 p-0" onClick={() => window.open(deposit.bill, '_blank')}>
                        Xem
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={deposit.status === 'Đã duyệt' ? 'default' : deposit.status === 'Từ chối' ? 'destructive' : 'secondary'}
                        className={
                          deposit.status === 'Đã duyệt' ? 'bg-green-500 hover:bg-green-500' :
                          deposit.status === 'Từ chối' ? 'bg-red-500 hover:bg-red-500' : 'bg-blue-500 hover:bg-blue-500'
                        }
                      >
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {deposit.status === 'Chờ duyệt' ? (
                          <>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto" onClick={() => updateDepositStatus(deposit._id, 'Đã duyệt')}>
                              Phê duyệt
                            </Button>
                            <Button size="sm" variant="outline" className="text-gray-600 bg-transparent border-gray-600 w-full sm:w-auto" onClick={() => updateDepositStatus(deposit._id, 'Từ chối')}>
                              Từ chối
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-gray-400 bg-transparent border-gray-600 w-full sm:w-auto" disabled>Phê duyệt</Button>
                            <Button size="sm" variant="outline" className="text-gray-400 bg-transparent border-gray-600 w-full sm:w-auto" disabled>Từ chối</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Order History Page Component
function OrderHistoryPage({ startDate, setStartDate, endDate, setEndDate, token }: any) {
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useSWR(
    token ? `/api/admin/orders?customer=${customerFilter}&status=${statusFilter}&startDate=${startDate}&endDate=${endDate}` : null,
    url => fetcher(url, token),
    { refreshInterval: 5000 }
  );

  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Lịch sử đặt lệnh</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Khách hàng</Label>
          <Input
            placeholder="Tên khách hàng"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full sm:w-48 bg-gray-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="buy">Lên</SelectItem>
              <SelectItem value="sell">Xuống</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-40 bg-gray-700 text-white" />
          <span>-</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-40 bg-gray-700 text-white" />
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto text-white border-gray-600">Đặt lại</Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">Áp dụng</Button>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Người dùng</TableHead>
                  <TableHead className="text-white">Phiên</TableHead>
                  <TableHead className="text-white">Loại</TableHead>
                  <TableHead className="text-white">Số tiền</TableHead>
                  <TableHead className="text-white">Kết quả</TableHead>
                  <TableHead className="text-white">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-teal-500 font-medium">{order.user}</TableCell>
                    <TableCell className="text-white">{order.session}</TableCell>
                    <TableCell>
                      <Badge
                        variant={order.type === 'Lên' ? 'default' : 'destructive'}
                        className={order.type === 'Lên' ? 'bg-green-500 hover:bg-green-500' : 'bg-red-500 hover:bg-red-500'}
                      >
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">{order.amount.toLocaleString()}đ</TableCell>
                    <TableCell className="text-green-500 font-semibold">{order.result}</TableCell>
                    <TableCell className="text-gray-400">{new Date(order.time).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Trading Sessions Page Component
function TradingSessionsPage({ token }: any) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;
  const [countdown, setCountdown] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>({ sessionId: 'N/A', result: 'Chưa có', startTime: 'N/A', endTime: 'N/A' });
  const [futureSessions, setFutureSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const generateRandomResult = () => Math.random() > 0.5 ? 'Lên' : 'Xuống';
  const generateSessionId = (time: Date) => {
    const year = String(time.getFullYear()).slice(-2);
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  };

  const generateFutureSessions = (startFromTime: Date) => {
    const sessions = [];
    let currentMin = startFromTime.getMinutes();
    let currentHour = startFromTime.getHours();
    let currentDay = startFromTime.getDate();
    let currentMonth = startFromTime.getMonth();
    let currentYear = startFromTime.getFullYear();
    
    for (let i = 0; i < 30; i++) {
      currentMin++;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
        if (currentHour >= 24) {
          currentHour = 0;
          currentDay++;
        }
      }
      
      const startTime = new Date(currentYear, currentMonth, currentDay, currentHour, currentMin, 0);
      const endTime = new Date(currentYear, currentMonth, currentDay, currentHour, currentMin, 59);
      
      sessions.push({
        sessionId: generateSessionId(startTime),
        result: generateRandomResult(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'scheduled'
      });
    }
    
    return sessions;
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setCountdown(59 - now.getSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    const now = new Date();
    
    const currentSessionStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0);
    const currentSessionEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 59);
    
    if (currentSession.sessionId !== generateSessionId(now)) {
      const newCurrentSession = {
        sessionId: generateSessionId(now),
        result: generateRandomResult(),
        startTime: currentSessionStartTime.toISOString(),
        endTime: currentSessionEndTime.toISOString(),
        status: 'active'
      };
      
      setCurrentSession(newCurrentSession);
      const newFutureSessions = generateFutureSessions(now);
      setFutureSessions(newFutureSessions);
      setSessions([newCurrentSession, ...newFutureSessions.slice(0, sessionsPerPage - 1)]);
      setTotalPages(Math.ceil((1 + newFutureSessions.length) / sessionsPerPage));
      setIsLoading(false);
    }
  }, [currentTime, currentSession.sessionId]);
  
  useEffect(() => {
    if (currentPage === 1) {
      setSessions([currentSession, ...futureSessions.slice(0, sessionsPerPage - 1)]);
    } else {
      const startIndex = (currentPage - 1) * sessionsPerPage - 1;
      setSessions(futureSessions.slice(startIndex, startIndex + sessionsPerPage));
    }
  }, [currentPage, currentSession, futureSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Phiên giao dịch</span>
      </div>
      <div className="flex justify-center mb-6">
        <Card className="w-full sm:w-80 text-center bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="text-base sm:text-lg font-semibold text-white">Phiên: {currentSession.sessionId}</div>
              <div className="text-2xl sm:text-3xl font-bold text-red-500">{countdown}s</div>
              <div className="text-sm text-white">
                Kết quả: <span className={`font-semibold ${currentSession.result === 'Lên' ? 'text-green-600' : 'text-red-600'}`}>{currentSession.result}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Lịch sử phiên</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Phiên</TableHead>
                  <TableHead className="text-white">Kết quả</TableHead>
                  <TableHead className="text-white">Thời gian bắt đầu</TableHead>
                  <TableHead className="text-white">Thời gian kết thúc</TableHead>
                  <TableHead className="text-white">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-white font-medium">{session.sessionId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={session.result === 'Lên' ? 'default' : 'destructive'}
                        className={
                          session.result === 'Lên' ? 'bg-green-500 hover:bg-green-500' :
                          'bg-red-500 hover:bg-red-500'
                        }
                      >
                        {session.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{new Date(session.startTime).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-400">{new Date(session.endTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={session.status === 'active' ? 'default' : 'secondary'}
                        className={
                          session.status === 'active' ? 'bg-blue-500 hover:bg-blue-500' :
                          'bg-gray-500 hover:bg-gray-500'
                        }
                      >
                        {session.status === 'active' ? 'Đang diễn ra' : 'Đã lên lịch'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4">
        <div className="text-sm text-gray-400 mb-2 sm:mb-0">{sessionsPerPage} / page</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-white border-gray-600 w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant="outline"
              size="sm"
              className={currentPage === page ? 'bg-blue-600 text-white' : 'text-white border-gray-600 w-full sm:w-auto'}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="text-white border-gray-600 w-full sm:w-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Withdrawal Requests Page Component
function WithdrawalRequestsPage({ startDate, setStartDate, endDate, setEndDate, token }: any) {
  const { toast } = useToast();
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, mutate } = useSWR(
    token ? `/api/withdrawals?customer=${customerFilter}&status=${statusFilter}&startDate=${startDate}&endDate=${endDate}` : null,
    url => fetcher(url, token),
    { refreshInterval: 5000 }
  );

  const withdrawals = data?.withdrawals || [];

  const updateWithdrawalStatus = async (withdrawalId: string, status: 'Đã duyệt' | 'Từ chối') => {
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: `Yêu cầu rút tiền đã được ${status}` });
        mutate();
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật trạng thái' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Yêu cầu rút tiền</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Khách hàng</Label>
          <Input
            placeholder="Khách hàng"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full sm:w-48 bg-gray-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label>Trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
              <SelectItem value="Đã duyệt">Đã duyệt</SelectItem>
              <SelectItem value="Từ chối">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-40 bg-gray-700 text-white" />
          <span>-</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-40 bg-gray-700 text-white" />
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto text-white border-gray-600">Đặt lại</Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">Áp dụng</Button>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Thời gian</TableHead>
                  <TableHead className="text-white">Khách hàng</TableHead>
                  <TableHead className="text-white">Số tiền</TableHead>
                  <TableHead className="text-white">Số tiền nhận</TableHead>
                  <TableHead className="text-white">Ngân hàng</TableHead>
                  <TableHead className="text-white">Số tài khoản</TableHead>
                  <TableHead className="text-white">Chủ tài khoản</TableHead>
                  <TableHead className="text-white">Trạng thái</TableHead>
                  <TableHead className="text-white">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-white">{new Date(withdrawal.time).toLocaleString()}</TableCell>
                    <TableCell className="text-teal-500">{withdrawal.customer}</TableCell>
                    <TableCell className="text-white">{withdrawal.amount.toLocaleString()}đ</TableCell>
                    <TableCell className="text-white">{withdrawal.receivedAmount.toLocaleString()}đ</TableCell>
                    <TableCell className="text-white">{withdrawal.bank}</TableCell>
                    <TableCell className="text-white">{withdrawal.accountNumber}</TableCell>
                    <TableCell className="text-white">{withdrawal.accountHolder}</TableCell>
                    <TableCell>
                      <Badge
                        variant={withdrawal.status === 'Đã duyệt' ? 'default' : withdrawal.status === 'Từ chối' ? 'destructive' : 'secondary'}
                        className={
                          withdrawal.status === 'Đã duyệt' ? 'bg-green-500 hover:bg-green-500' :
                          withdrawal.status === 'Từ chối' ? 'bg-red-500 hover:bg-red-500' : 'bg-blue-500 hover:bg-blue-500'
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {withdrawal.status === 'Chờ duyệt' ? (
                          <>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto" onClick={() => updateWithdrawalStatus(withdrawal._id, 'Đã duyệt')}>
                              Phê duyệt
                            </Button>
                            <Button size="sm" variant="outline" className="text-gray-600 bg-transparent border-gray-600 w-full sm:w-auto" onClick={() => updateWithdrawalStatus(withdrawal._id, 'Từ chối')}>
                              Từ chối
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="text-gray-400 bg-transparent border-gray-600 w-full sm:w-auto" disabled>Phê duyệt</Button>
                            <Button size="sm" variant="outline" className="text-gray-400 bg-transparent border-gray-600 w-full sm:w-auto" disabled>Từ chối</Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Page Component
function SettingsPage({ token }: any) {
  const { toast } = useToast();
  const { data, isLoading, mutate } = useSWR(
    token ? '/api/admin/settings' : null,
    url => fetcher(url, token)
  );

  const [settings, setSettings] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    minDeposit: 0,
    minWithdrawal: 0,
    maxWithdrawal: 0,
    cskh: '',
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Cài đặt đã được cập nhật' });
        mutate();
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật cài đặt' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Cài đặt</span>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Cài đặt hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Thông tin ngân hàng</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Tên ngân hàng</Label>
                    <Input
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label>Số tài khoản</Label>
                    <Input
                      value={settings.accountNumber}
                      onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label>Chủ tài khoản</Label>
                    <Input
                      value={settings.accountHolder}
                      onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                      className="bg-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Hạn mức giao dịch</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Nạp tối thiểu</Label>
                    <Input
                      type="number"
                      value={settings.minDeposit}
                      onChange={(e) => setSettings({ ...settings, minDeposit: Number(e.target.value) })}
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label>Rút tối thiểu</Label>
                    <Input
                      type="number"
                      value={settings.minWithdrawal}
                      onChange={(e) => setSettings({ ...settings, minWithdrawal: Number(e.target.value) })}
                      className="bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label>Rút tối đa</Label>
                    <Input
                      type="number"
                      value={settings.maxWithdrawal}
                      onChange={(e) => setSettings({ ...settings, maxWithdrawal: Number(e.target.value) })}
                      className="bg-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Khác</h3>
                <div>
                  <Label>Link CSKH</Label>
                  <Input
                    value={settings.cskh}
                    onChange={(e) => setSettings({ ...settings, cskh: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" onClick={handleSaveSettings}>Lưu</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Identity Verification Page Component
function IdentityVerificationPage({ token }: { token: string | null }) {
  const { data, error, mutate } = useSWR(
    token ? '/api/admin/verification-requests' : null,
    (url) => fetcher(url, token!)
  );
  const [selectedRequest, setSelectedRequest] = useState<{
    _id: string;
    username: string;
    fullName?: string;
    verification: {
      cccdFront: string;
      cccdBack: string;
      verified: boolean;
    };
    updatedAt: string | Date;
    userName: string;
  } | null>(null);
  const { toast } = useToast();

  const handleVerify = async (userId: string, status: boolean) => {
    try {
      const response = await fetch('/api/admin/verification-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status })
      });

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi cập nhật trạng thái xác minh');
      }

      // Làm mới dữ liệu
      mutate();
      
      toast({
        title: 'Thành công',
        description: `Đã ${status ? 'chấp nhận' : 'từ chối'} yêu cầu xác minh`
      });
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi cập nhật trạng thái xác minh',
        variant: 'destructive'
      });
    }
  };
  
  const handleViewImages = (request: any) => {
    setSelectedRequest({
      ...request,
      userName: request.fullName || request.username
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Đã xảy ra lỗi</h3>
        <p className="text-gray-400 text-sm">Không thể tải dữ liệu yêu cầu xác minh</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => mutate()}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Xác minh danh tính</span>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Yêu cầu xác minh danh tính</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={!data}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                    Không có yêu cầu xác minh nào đang chờ xử lý
                  </TableCell>
                </TableRow>
              ) : (
                data.requests?.map((request: any) => (
                  <TableRow key={request._id} className="hover:bg-gray-700/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <div>{request.fullName || request.username}</div>
                          <div className="text-xs text-gray-400">@{request.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.verified ? 'success' : 'warning'}>
                        {request.verified ? 'Đã xác minh' : 'Chờ xử lý'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(request.updatedAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(request.updatedAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewImages(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem ảnh
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleVerify(request._id, true)}
                          disabled={request.verified}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Duyệt
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleVerify(request._id, false)}
                          disabled={request.verified}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {selectedRequest && (
            <VerificationImageModal
              isOpen={!!selectedRequest}
              onClose={() => setSelectedRequest(null)}
              frontImage={selectedRequest.verification.cccdFront}
              backImage={selectedRequest.verification.cccdBack}
              userName={selectedRequest.userName}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Collapsed by default on mobile
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Chỉ admin mới có quyền truy cập' });
      router.push('/login');
    }
  }, [user, loading, router, toast]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r border-gray-700 flex flex-col justify-between sm:sticky top-0`}>
        <div>
          <div className="flex items-center justify-between p-2 sm:p-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="sm:hidden">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </Button>
            {!isSidebarCollapsed && <span className="text-sm sm:text-lg font-semibold">Admin Dashboard</span>}
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden sm:block">
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${currentPage === item.id ? 'bg-gray-700' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {!isSidebarCollapsed && <span className="text-sm">{item.title}</span>}
              </Button>
            ))}
          </nav>
        </div>
        <div className="p-2 sm:p-4">
          <Button variant="ghost" className="w-full justify-start">
            <HelpCircle className="h-5 w-5 mr-2" />
            {!isSidebarCollapsed && <span className="text-sm">Hỗ trợ</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 sm:gap-4">
            <Bell className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">Thông báo</span>
          </div>
          <UserMenu user={user} logout={logout} />
        </header>
        <main className="flex-1 p-2 sm:p-6 overflow-auto">
          {currentPage === 'dashboard' && <DashboardPage startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} token={token} />}
          {currentPage === 'customers' && <CustomersPage token={token} />}
          {currentPage === 'order-history' && <OrderHistoryPage startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} token={token} />}
          {currentPage === 'trading-sessions' && <TradingSessionsPage token={token} />}
          {currentPage === 'deposit-requests' && <DepositRequestsPage startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} token={token} />}
          {currentPage === 'withdrawal-requests' && <WithdrawalRequestsPage startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} token={token} />}
          {currentPage === 'settings' && <SettingsPage token={token} />}
          {currentPage === 'identity-verification' && <IdentityVerificationPage token={token} />}
        </main>
      </div>
    </div>
  );
}