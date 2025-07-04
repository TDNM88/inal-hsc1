'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { fetcher } from '@/lib/fetcher';
import useSWR from 'swr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

export default function OrdersPage() {
  const { user, token, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('deposits');
  const pageSize = 10;

  // Fetch deposit history
  const { 
    data: depositData, 
    error: depositError, 
    isLoading: depositLoading 
  } = useSWR(
    activeTab === 'deposits' ? `/api/deposits/history?page=${currentPage}&limit=${pageSize}` : null,
    fetcher
  );

  // Fetch withdrawal history
  const { 
    data: withdrawalData, 
    error: withdrawalError, 
    isLoading: withdrawalLoading 
  } = useSWR(
    activeTab === 'withdrawals' ? `/api/withdrawals/history?page=${currentPage}&limit=${pageSize}` : null,
    fetcher
  );

  // Reset pagination when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Get status badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'warning' as const, label: 'Đang xử lý' };
      case 'approved':
        return { variant: 'success' as const, label: 'Đã duyệt' };
      case 'rejected':
        return { variant: 'destructive' as const, label: 'Từ chối' };
      default:
        return { variant: 'secondary' as const, label: status };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate total pages
  const totalPages = activeTab === 'deposits'
    ? (depositData ? Math.ceil(depositData.total / pageSize) : 0)
    : (withdrawalData ? Math.ceil(withdrawalData.total / pageSize) : 0);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isLoading = activeTab === 'deposits' ? depositLoading : withdrawalLoading;
  const error = activeTab === 'deposits' ? depositError : withdrawalError;
  const data = activeTab === 'deposits' ? depositData : withdrawalData;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Lịch sử giao dịch</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="deposits">Lịch sử nạp tiền</TabsTrigger>
          <TabsTrigger value="withdrawals">Lịch sử rút tiền</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deposits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử nạp tiền</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
                </div>
              ) : !data || !data.deposits || data.deposits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có lịch sử nạp tiền nào.
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left">ID</th>
                          <th className="py-3 px-4 text-left">Ngày</th>
                          <th className="py-3 px-4 text-right">Số tiền</th>
                          <th className="py-3 px-4 text-left">Trạng thái</th>
                          <th className="py-3 px-4 text-left">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.deposits.map((deposit: any) => {
                          const statusBadge = getStatusBadge(deposit.status);
                          return (
                            <tr key={deposit._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-500">
                                {deposit._id.substring(deposit._id.length - 6)}
                              </td>
                              <td className="py-3 px-4">
                                {formatDate(deposit.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-right font-medium">
                                {deposit.amount.toLocaleString('vi-VN')} VND
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={statusBadge.variant}>
                                  {statusBadge.label}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm max-w-[200px] truncate">
                                {deposit.notes || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                      >
                        Trước
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Simple pagination logic to show 5 pages max
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 3 + i;
                        }
                        if (pageNum > totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdrawals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử rút tiền</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
                </div>
              ) : !data || !data.withdrawals || data.withdrawals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có lịch sử rút tiền nào.
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left">ID</th>
                          <th className="py-3 px-4 text-left">Ngày</th>
                          <th className="py-3 px-4 text-right">Số tiền</th>
                          <th className="py-3 px-4 text-left">Ngân hàng</th>
                          <th className="py-3 px-4 text-left">Số tài khoản</th>
                          <th className="py-3 px-4 text-left">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.withdrawals.map((withdrawal: any) => {
                          const statusBadge = getStatusBadge(withdrawal.status);
                          return (
                            <tr key={withdrawal._id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-500">
                                {withdrawal._id.substring(withdrawal._id.length - 6)}
                              </td>
                              <td className="py-3 px-4">
                                {formatDate(withdrawal.createdAt)}
                              </td>
                              <td className="py-3 px-4 text-right font-medium">
                                {withdrawal.amount.toLocaleString('vi-VN')} VND
                              </td>
                              <td className="py-3 px-4">
                                {withdrawal.bankName || 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                {withdrawal.accountNumber || 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant={statusBadge.variant}>
                                  {statusBadge.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-6">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                      >
                        Trước
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Simple pagination logic to show 5 pages max
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 3 + i;
                        }
                        if (pageNum > totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
