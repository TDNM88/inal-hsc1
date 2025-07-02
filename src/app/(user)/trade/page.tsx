"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import UserMenu from '@/components/user-menu';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Badge } from '@/components/ui/badge';

export default function TradePage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState<'Lên' | 'Xuống'>('Lên');
  const [countdown, setCountdown] = useState(59);

  const { data: sessionData, error: sessionError } = useSWR(
    token ? '/api/sessions?page=1&limit=1' : null,
    url => fetcher(url, token || ''),
    { refreshInterval: 5000 }
  );

  const currentSession = sessionData?.sessions[0] || { sessionId: 'N/A', result: 'Chưa có', startTime: 'N/A' };

  useEffect(() => {
    if (!loading && !user) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng đăng nhập' });
      router.push('/login');
    }
  }, [user, loading, router, toast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 0 ? 59 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/trade');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'sessionUpdate') {
        toast({ title: 'Cập nhật phiên', description: `Phiên ${message.sessionId} đã kết thúc: ${message.result}` });
      }
    };
    return () => ws.close();
  }, [toast]);

  const handlePlaceOrder = async () => {
    if (!amount) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập số tiền' });
      return;
    }

    if (user.status.betLocked) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Tài khoản của bạn bị khóa cược' });
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          type: orderType,
          sessionId: currentSession.sessionId,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đặt lệnh thành công' });
        setAmount('');
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể đặt lệnh' });
    }
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex justify-end p-4 border-b border-gray-700">
        <UserMenu user={user} logout={logout} />
      </header>
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Phiên giao dịch hiện tại</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-white">Phiên: {currentSession.sessionId}</div>
                <div className="text-3xl font-bold text-red-500">{countdown}s</div>
                <div className="text-sm text-white">
                  Kết quả: <Badge className={currentSession.result === 'Lên' ? 'bg-green-500' : currentSession.result === 'Xuống' ? 'bg-red-500' : 'bg-gray-500'}>{currentSession.result}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Đặt lệnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Số tiền cược</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Số tiền (VND)"
                  className="bg-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Loại lệnh</Label>
                <div className="flex gap-2">
                  <Button
                    className={orderType === 'Lên' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700'}
                    onClick={() => setOrderType('Lên')}
                  >
                    Lên
                  </Button>
                  <Button
                    className={orderType === 'Xuống' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700'}
                    onClick={() => setOrderType('Xuống')}
                  >
                    Xuống
                  </Button>
                </div>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handlePlaceOrder}
                disabled={!amount || currentSession.status !== 'pending'}
              >
                Đặt lệnh
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
