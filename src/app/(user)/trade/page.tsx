"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, Loader2, Minus, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LiquidityTable from '@/components/LiquidityTable';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import RightColumn from './RightCollum';

// Constants
const QUICK_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000, 200000000];
const API_BASE_URL = 'https://inal-hsc-api.vercel.app';

// Define types
interface Session {
  sessionId: string;
  result: string | null;
  status: string;
  startTime: Date;
  endTime?: Date;
}

interface Order {
  id: string;
  amount: number;
  type: 'UP' | 'DOWN';
  sessionId: string;
  createdAt: string;
  userId: string;
}

interface TradeHistoryRecord {
  id: number;
  session: number;
  direction: "UP" | "DOWN";
  amount: number;
  status: "pending" | "win" | "lose";
  profit: number;
}

export default function TradePage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm tạo ID phiên theo định dạng yymmddhhmm
  const generateSessionId = useCallback((time: Date): string => {
    const year = String(time.getFullYear()).slice(-2);
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  }, []);

  // Hàm tạo thời gian bắt đầu và kết thúc của phiên
  const getSessionTimeRange = useCallback((time: Date) => {
    if (!(time instanceof Date) || isNaN(time.getTime())) {
      time = new Date();
    }
    
    const startTime = new Date(time);
    startTime.setSeconds(0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 1);
    
    return { startTime, endTime };
  }, []);

  // Kiểm tra xác thực ngay lập tức trước khi render nội dung
  useEffect(() => {
    console.log('Token:', token); // Debug token
    if (!loading && !user) {
      router.replace('/auth/login');
      toast({ variant: 'destructive', title: 'Vui lòng đăng nhập để sử dụng tính năng này' });
    }
  }, [loading, user, router, toast]);

  // State declarations
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<"UP" | "DOWN" | null>(null);
  const [timeLeft, setTimeLeft] = useState(59);
  const [marketData, setMarketData] = useState([
    { symbol: "XAU/USD", price: 2337.16, change: 12.5, changePercent: 0.54 },
    { symbol: "OIL", price: 85.20, change: -0.45, changePercent: -0.53 },
  ]);
  const [tradeResult, setTradeResult] = useState<{
    status: "idle" | "win" | "lose" | "processing";
    direction?: "UP" | "DOWN";
    entryPrice?: number;
    exitPrice?: number;
    amount?: number;
    profit?: number;
  }>({ status: "idle" });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo currentSession
  const now = new Date();
  const { startTime, endTime } = getSessionTimeRange(now);
  const [currentSession, setCurrentSession] = useState<Session>({
    sessionId: generateSessionId(now),
    result: null,
    status: 'pending',
    startTime,
    endTime
  });
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<Session[]>([]);

  // Hàm định dạng tiền tệ
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Hàm kiểm tra và cập nhật phiên hiện tại
  const checkAndUpdateSession = useCallback((now: Date) => {
    const currentSessionId = generateSessionId(now);
    
    if (currentSession.sessionId === 'N/A' || currentSession.sessionId !== currentSessionId) {
      console.log('Phát hiện phiên mới:', currentSessionId);
      const { startTime, endTime } = getSessionTimeRange(now);
      
      const newSession = {
        sessionId: currentSessionId,
        result: null,
        status: 'pending' as const,
        startTime,
        endTime
      };
      
      if (currentSession.sessionId !== 'N/A') {
        setPastSessions(prev => [currentSession, ...prev].slice(0, 20));
      }
      
      setCurrentSession(newSession);
      
      // Đồng bộ timeLeft với thời gian hệ thống
      setTimeLeft(59 - now.getSeconds());
      
      // Chỉ gọi fetchSessions nếu token hợp lệ
      if (token) {
        fetchSessions().catch(error => {
          console.error('Lỗi khi tải danh sách phiên:', error.message);
          toast({
            title: 'Lỗi',
            description: `Không thể tải thông tin phiên: ${error.message}. Dùng phiên cục bộ.`,
            variant: 'destructive'
          });
        });
      }
      
      return true;
    }
    return false;
  }, [currentSession, generateSessionId, getSessionTimeRange, token, toast]);

  // Hàm lấy danh sách phiên từ server
  const fetchSessions = useCallback(async () => {
    if (!token) {
      console.warn('Không có token, bỏ qua fetchSessions');
      return;
    }
    
    try {
      console.log('Fetching sessions from:', `${API_BASE_URL}/api/sessions`);
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Không thể tải dữ liệu phiên`);
      }
      
      const data = await response.json();
      const now = new Date();
      const currentSessionId = generateSessionId(now);
      
      const running: Session[] = [];
      const past: Session[] = [];
      const future: Session[] = [];
      
      for (const session of data) {
        const sessionTime = new Date(session.startTime);
        const sessionEndTime = new Date(sessionTime.getTime() + 60 * 1000);
        
        if (session.sessionId === currentSessionId) {
          running.push({
            ...session,
            startTime: sessionTime,
            endTime: sessionEndTime
          });
        } else if (sessionTime < now) {
          past.push({
            ...session,
            startTime: sessionTime,
            endTime: new Date(sessionTime.getTime() + 60 * 1000)
          });
        } else {
          future.push({
            ...session,
            startTime: sessionTime,
            endTime: new Date(sessionTime.getTime() + 60 * 1000)
          });
        }
      }
      
      if (running.length === 0) {
        const { startTime, endTime } = getSessionTimeRange(now);
        running.push({
          sessionId: currentSessionId,
          result: null,
          status: 'pending',
          startTime,
          endTime
        });
      }
      
      setCurrentSession(running[0]);
      setPastSessions(past);
      setFutureSessions(future);
      
      return { running: running[0], past, future };
      
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách phiên:', error.message);
      toast({
        title: 'Lỗi',
        description: `Không thể tải thông tin phiên: ${error.message}. Dùng phiên cục bộ.`,
        variant: 'destructive'
      });
      return null; // Trả về null thay vì throw để không làm crash loadInitialData
    }
  }, [token, generateSessionId, getSessionTimeRange, toast]);

  // Hàm xử lý kết quả phiên
  const handleSessionUpdate = useCallback((data: any) => {
    const { sessionId, result, status } = data;
    
    if (currentSession.sessionId === sessionId) {
      const updatedSession = { ...currentSession, result, status };
      setCurrentSession(updatedSession);
      
      if (status === 'completed' && result) {
        handlePayout(updatedSession);
      }
    }
    
    if (futureSessions.some(session => session.sessionId === sessionId)) {
      setFutureSessions(prev => 
        prev.map(session => 
          session.sessionId === sessionId 
            ? { ...session, result, status } 
            : session
        )
      );
    }
    
    if (pastSessions.some(session => session.sessionId === sessionId)) {
      setPastSessions(prev => 
        prev.map(session => 
          session.sessionId === sessionId 
            ? { ...session, result, status } 
            : session
        )
      );
    }
  }, [currentSession, futureSessions, pastSessions]);

  // Hàm xử lý đặt lệnh
  const handlePlaceOrder = () => {
    if (!selectedAction || !currentAmount) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn hướng và nhập số tiền',
        variant: 'destructive'
      });
      return;
    }
    
    if (Number(currentAmount) > balance) {
      toast({
        title: 'Lỗi',
        description: 'Số dư không đủ để đặt lệnh',
        variant: 'destructive'
      });
      return;
    }
    
    setIsConfirming(true);
  };

  // Xác nhận đặt lệnh
  const confirmPlaceOrder = async () => {
    if (!selectedAction || !currentAmount || !token) {
      setIsConfirming(false);
      toast({
        title: 'Lỗi',
        description: 'Thiếu thông tin để đặt lệnh hoặc token không hợp lệ',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log('Placing order to:', `${API_BASE_URL}/api/trades/place-order`);
      const response = await fetch(`${API_BASE_URL}/api/trades/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          direction: selectedAction,
          amount: Number(currentAmount),
          asset: 'XAU/USD'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Đặt lệnh thất bại`);
      }
      
      const result = await response.json();
      
      setBalance(prev => prev - Number(currentAmount));
      
      setTradeHistory(prev => [
        {
          id: Date.now(),
          session: parseInt(currentSession.sessionId.slice(-4)),
          direction: selectedAction,
          amount: Number(currentAmount),
          status: 'pending',
          profit: 0
        },
        ...prev
      ]);
      
      toast({
        title: 'Thành công',
        description: 'Đặt lệnh thành công',
      });
      
      setCurrentAmount('');
      setSelectedAction(null);
      
    } catch (error: any) {
      console.error('Lỗi khi đặt lệnh:', error.message);
      toast({
        title: 'Lỗi',
        description: `Đã xảy ra lỗi khi đặt lệnh: ${error.message}. Vui lòng thử lại.`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };
  
  // Hàm xử lý thanh toán
  const handlePayout = useCallback((session: Session) => {
    if (!session.result) return;
    
    const sessionOrders = userOrders.filter(order => order.sessionId === session.sessionId);
    
    sessionOrders.forEach(order => {
      const isWin = order.type === session.result;
      const profit = isWin ? order.amount * 1.8 : 0;
      
      setTradeHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          session: parseInt(session.sessionId.slice(-4)),
          direction: order.type,
          amount: order.amount,
          status: isWin ? 'win' : 'lose',
          profit: isWin ? profit - order.amount : -order.amount
        }
      ]);
      
      if (isWin) {
        setBalance(prev => prev + profit);
      }
    });
  }, [userOrders]);

  // Đếm ngược client-side
  useEffect(() => {
    const startClientSideCountdown = () => {
      if (!intervalRef.current) {
        console.log('Starting client-side countdown');
        intervalRef.current = setInterval(() => {
          const now = new Date();
          setTimeLeft((prev) => {
            const currentSeconds = now.getSeconds();
            const newTimeLeft = prev > 0 ? 59 - currentSeconds : 59;
            console.log('Client-side updating timeLeft:', newTimeLeft);
            if (newTimeLeft === 59) {
              checkAndUpdateSession(now);
            }
            return newTimeLeft;
          });
        }, 1000);
      }
    };

    const stopClientSideCountdown = () => {
      if (intervalRef.current) {
        console.log('Stopping client-side countdown');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startClientSideCountdown();
    
    return () => {
      stopClientSideCountdown();
    };
  }, [checkAndUpdateSession]);

  // Tải dữ liệu ban đầu khi component mount
  useEffect(() => {
    if (!token) {
      console.warn('No token available, skipping loadInitialData');
      return;
    }
    
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user data
        console.log('Fetching user from:', `${API_BASE_URL}/api/users/me`);
        const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!userResponse.ok) {
          throw new Error(`HTTP ${userResponse.status}: Không thể tải thông tin người dùng`);
        }
        const userData = await userResponse.json();
        setBalance(userData.balance || 0);
        
        // Fetch trade history
        console.log('Fetching trade history from:', `${API_BASE_URL}/api/trades/history`);
        const historyResponse = await fetch(`${API_BASE_URL}/api/trades/history`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!historyResponse.ok) {
          throw new Error(`HTTP ${historyResponse.status}: Không thể tải lịch sử giao dịch`);
        }
        const historyData = await historyResponse.json();
        setTradeHistory(historyData);
        
        // Fetch sessions
        const sessionsData = await fetchSessions();
        if (!sessionsData) {
          console.warn('Failed to fetch sessions, using local session');
        }
        
      } catch (error: any) {
        console.error('Lỗi khi tải dữ liệu ban đầu:', error.message);
        toast({
          title: 'Lỗi',
          description: `Không thể tải dữ liệu: ${error.message}. Vui lòng làm mới trang.`,
          variant: 'destructive'
        });
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [token, fetchSessions, toast]);

  // Hàm xử lý hành động chọn hướng giao dịch
  const handleAction = (direction: "UP" | "DOWN") => {
    setSelectedAction(direction);
    handlePlaceOrder();
  };

  // Hiển thị loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Tải lại trang
        </Button>
      </div>
    );
  }

  // Xác nhận lệnh
  const confirmTrade = (event: React.MouseEvent<HTMLButtonElement>) => {
    confirmPlaceOrder();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-4 md:p-8">
        {isLoading || loading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-white">Đang tải...</span>
          </div>
        ) : (
          <>
            <Dialog
              open={tradeResult.status === "win" || tradeResult.status === "lose"}
              onOpenChange={(open) => !open && setTradeResult(prev => ({ ...prev, status: "idle" }))}
            >
              <DialogContent className="sm:max-w-[425px] bg-gray-800 border-green-500">
                <DialogHeader>
                  <DialogTitle className={`text-2xl text-center ${tradeResult.status === "win" ? "text-green-500" : "text-red-500"}`}>
                    {tradeResult.status === "win" ? "Chúc mừng bạn đã thắng!" : "Rất tiếc, bạn đã thua"}
                  </DialogTitle>
                  <DialogDescription className="text-center text-white">
                    {tradeResult.profit && tradeResult.profit > 0 ? "+" : ""}
                    {tradeResult.profit ? formatCurrency(tradeResult.profit) : 0} VND
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-gray-400">Lệnh:</div>
                    <div className="text-white">
                      {tradeResult.direction === "UP" ? "LÊN" : tradeResult.direction === "DOWN" ? "XUỐNG" : "-"}
                    </div>
                    <div className="text-gray-400">Giá vào:</div>
                    <div className="text-white">{tradeResult.entryPrice?.toFixed(2) || "-"}</div>
                    <div className="text-gray-400">Giá đóng:</div>
                    <div className="text-white">{tradeResult.exitPrice?.toFixed(2) || "-"}</div>
                    <div className="text-gray-400">Số tiền:</div>
                    <div className="text-white">
                      {tradeResult.amount ? formatCurrency(tradeResult.amount) : 0} VND
                    </div>
                    <div className="text-gray-400">Lợi nhuận:</div>
                    <div className={`font-bold ${(tradeResult.profit || 0) >= 0 ? "text-green-500" : "text-red-600"}`}>
                      {tradeResult.profit && tradeResult.profit > 0 ? "+" : ""}
                      {tradeResult.profit ? formatCurrency(tradeResult.profit) : 0} VND
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setTradeResult({ status: "idle" })}
                  >
                    Đóng
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
              <DialogContent className="sm:max-w-[425px] bg-gray-800">
                <DialogHeader className="flex items-center justify-center">
                  <DialogTitle className="text-white text-center">
                    Phiên hiện tại <span className="text-red-500">{currentSession.sessionId}</span>
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-gray-300 text-center">
                  XÁC NHẬN
                </DialogDescription>
                <DialogFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setIsConfirming(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    className={`flex-1 ${selectedAction === "UP" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                    onClick={confirmTrade}
                  >
                    Xác nhận
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cột bên phải hiển thị đầu tiên trên mobile để đưa bảng giá lên đầu */}
              <div className="lg:col-span-8 lg:order-2 order-1">
                <RightColumn
                  isLoading={isLoading}
                  tradeHistory={tradeHistory}
                  formatCurrency={formatCurrency}
                />
              </div>

              {/* Cột bên trái hiển thị thứ hai trên mobile */}
              <div className="lg:col-span-4 space-y-6 lg:order-1 order-2">
                <Card className="bg-white border border-gray-300 rounded-md shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="h-4 w-4 text-gray-700" />
                      <CardTitle className="text-gray-900 text-base font-medium">Số dư</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-6 px-4">
                    <div className="flex items-center justify-between text-gray-900 text-lg font-semibold uppercase">
                      <span>SỐ DƯ:</span>
                      <span>{formatCurrency(balance || 0)} VND</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-300 rounded-md shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="h-4 w-4 text-gray-700" />
                      <CardTitle className="text-gray-900 text-base font-medium">Đặt lệnh</CardTitle>
                      <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded ml-auto">
                        Phiên: {currentSession.sessionId}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="amount" className="text-sm text-gray-400">
                          Số tiền (VND)
                        </label>
                        <span className="text-xs text-gray-400">Tối thiểu: {formatCurrency(100000)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentAmount((prev) => (Math.max(0, Number(prev) - 100000)).toString())}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id="amount"
                          type="text"
                          value={formatCurrency(Number(currentAmount) || 0)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (/^\d*$/.test(raw)) setCurrentAmount(raw);
                          }}
                          placeholder="Nhập số tiền"
                        />
                        <Button variant="outline" size="icon" onClick={() => setCurrentAmount((prev) => (Number(prev) + 100000).toString())}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {QUICK_AMOUNTS.map((value) => (
                          <Button
                            key={value}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-sm font-semibold bg-white hover:bg-gray-100"
                            onClick={() => setCurrentAmount(value.toString())}
                          >
                            {value >= 1000000 ? `+${value / 1000000}M` : `+${value / 1000}K`}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1 mb-4 text-sm text-gray-900">
                      <div className="flex justify-between">
                        <span>Ngày:</span>
                        <span>{new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giờ:</span>
                        <span>{new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Phiên hiện tại:</span>
                        <span>{currentSession.sessionId}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="border border-red-600 rounded bg-gray-100 text-center py-3">
                        <div className="text-sm text-gray-900">Hãy đặt lệnh:</div>
                        <div className="text-xl font-bold text-red-600">{String(timeLeft).padStart(2, '0')}s</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button
                        type="button"
                        className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg font-bold flex items-center justify-center"
                        onClick={() => handleAction("UP")}
                        disabled={isLoading || !currentAmount}
                      >
                        LÊN <ArrowUp className="h-5 w-5 ml-2" />
                      </Button>
                      <Button
                        type="button"
                        className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg font-bold flex items-center justify-center"
                        onClick={() => handleAction("DOWN")}
                        disabled={isLoading || !currentAmount}
                      >
                        XUỐNG <ArrowDown className="h-5 w-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-gray-300 rounded-md shadow">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Cập nhật</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LiquidityTable />
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}