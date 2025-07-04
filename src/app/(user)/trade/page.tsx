"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowDown, ArrowUp, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LiquidityTable from '@/components/LiquidityTable';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import TradingViewAdvancedChart from "@/components/TradingViewAdvancedChart";
import TradingViewTickerTape from "@/components/TradingViewTickerTape";
import RightColumn from './RightCollum';

// Constants
const QUICK_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000, 200000000];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const wsRef = useRef<WebSocket | null>(null);

  // Kiểm tra xác thực ngay lập tức trước khi render nội dung
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      toast({ variant: 'destructive', title: 'Vui lòng đăng nhập để sử dụng tính năng này' });
    }
  }, [loading, user, router, toast]);

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedAction, setSelectedAction] = useState<"UP" | "DOWN" | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
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
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [countdown, setCountdown] = useState(59);
  const [balance, setBalance] = useState<number>(0);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Khởi tạo currentSession với giá trị mặc định
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
    // Đảm bảo time là một đối tượng Date hợp lệ
    if (!(time instanceof Date) || isNaN(time.getTime())) {
      time = new Date();
    }
    
    // Thời gian bắt đầu là đầu phút hiện tại
    const startTime = new Date(time);
    startTime.setSeconds(0, 0);
    
    // Thời gian kết thúc là đầu phút kế tiếp
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 1);
    
    return { startTime, endTime };
  }, []);

  // Hàm định dạng tiền tệ
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Khởi tạo state
  const [currentSession, setCurrentSession] = useState<Session>(() => {
    const now = new Date();
    const { startTime, endTime } = getSessionTimeRange(now);
    return {
      sessionId: generateSessionId(now),
      result: null,
      status: 'pending',
      startTime,
      endTime
    };
  });
  
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<Session[]>([]);

  // Hàm kiểm tra và cập nhật phiên hiện tại
  const checkAndUpdateSession = useCallback((now: Date) => {
    const currentSessionId = generateSessionId(now);
    
    // Nếu phiên hiện tại là N/A hoặc khác với ID phiên mới tính toán được
    if (currentSession.sessionId === 'N/A' || currentSession.sessionId !== currentSessionId) {
      console.log('Phát hiện phiên mới:', currentSessionId);
      const { startTime, endTime } = getSessionTimeRange(now);
      
      // Tạo phiên mới
      const newSession = {
        sessionId: currentSessionId,
        result: null,
        status: 'pending' as const,
        startTime,
        endTime
      };
      
      // Lưu phiên cũ vào lịch sử nếu có giá trị
      if (currentSession.sessionId !== 'N/A') {
        setPastSessions(prev => [currentSession, ...prev].slice(0, 20));
      }
      
      setCurrentSession(newSession);
      
      // Làm mới danh sách phiên từ server
      fetchSessions().catch(error => {
        console.error('Lỗi khi tải danh sách phiên:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin phiên. Vui lòng làm mới trang.',
          variant: 'destructive'
        });
      });
      
      return true; // Đã cập nhật phiên mới
    }
    return false; // Không cần cập nhật
  }, [currentSession, generateSessionId, getSessionTimeRange, toast]);

  // Hàm lấy danh sách phiên từ server
  const fetchSessions = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu phiên');
      }
      
      const data = await response.json();
      const now = new Date();
      const currentSessionId = generateSessionId(now);
      
      // Tìm phiên hiện tại và các phiên trước đó
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
            endTime: sessionEndTime
          });
        } else {
          future.push({
            ...session,
            startTime: sessionTime,
            endTime: sessionEndTime
          });
        }
      }
      
      // Nếu không có phiên nào đang chạy, tạo một phiên mới
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
      
      // Cập nhật state
      setCurrentSession(running[0]);
      setPastSessions(past);
      setFutureSessions(future);
      
      return { running: running[0], past, future };
      
    } catch (error) {
      console.error('Lỗi khi tải danh sách phiên:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin phiên. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
      throw error;
    }
  }, [token, generateSessionId, getSessionTimeRange, toast]);

  // Hàm xử lý kết quả phiên
  const handleSessionUpdate = useCallback((data: any) => {
    const { sessionId, result, status } = data;
    
    // Cập nhật phiên hiện tại nếu trùng ID
    if (currentSession.sessionId === sessionId) {
      const updatedSession = { ...currentSession, result, status };
      setCurrentSession(updatedSession);
      
      // Xử lý thanh toán nếu có kết quả
      if (status === 'completed' && result) {
        handlePayout(updatedSession);
      }
    }
    
    // Cập nhật trong danh sách phiên tương lai
    if (futureSessions.some(session => session.sessionId === sessionId)) {
      setFutureSessions(prev => 
        prev.map(session => 
          session.sessionId === sessionId 
            ? { ...session, result, status } 
            : session
        )
      );
    }
    
    // Cập nhật trong danh sách phiên đã qua
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
    if (!selectedAction || !amount) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn hướng và nhập số tiền',
        variant: 'destructive'
      });
      return;
    }
    
    if (Number(amount) > balance) {
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
    if (!selectedAction || !amount || !token) {
      setIsConfirming(false);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/trades/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          direction: selectedAction,
          amount: Number(amount),
          asset: 'XAU/USD' // Hoặc thay đổi tùy theo tài sản giao dịch
        })
      });
      
      if (!response.ok) {
        throw new Error('Đặt lệnh thất bại');
      }
      
      const result = await response.json();
      
      // Cập nhật số dư
      setBalance(prev => prev - Number(amount));
      
      // Thêm vào lịch sử giao dịch
      setTradeHistory(prev => [
        {
          id: Date.now(),
          session: parseInt(currentSession.sessionId.slice(-4)),
          direction: selectedAction,
          amount: Number(amount),
          status: 'pending',
          profit: 0
        },
        ...prev
      ]);
      
      toast({
        title: 'Thành công',
        description: 'Đặt lệnh thành công',
      });
      
      // Đặt lại form
      setAmount('');
      setSelectedAction(null);
      
    } catch (error) {
      console.error('Lỗi khi đặt lệnh:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi đặt lệnh. Vui lòng thử lại.',
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
    
    // Tìm tất cả đơn đặt lệnh của phiên này
    const sessionOrders = userOrders.filter(order => order.sessionId === session.sessionId);
    
    // Tính toán kết quả cho từng đơn
    sessionOrders.forEach(order => {
      const isWin = order.type === session.result;
      const profit = isWin ? order.amount * 1.8 : 0;
      
      // Cập nhật lịch sử giao dịch
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
      
      // Cập nhật số dư nếu thắng
      if (isWin) {
        setBalance(prev => prev + profit);
      }
    });
  }, [userOrders]);

  // Kết nối WebSocket để nhận cập nhật thời gian thực
  useEffect(() => {
    if (!token) return;
    
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`wss://${API_BASE_URL?.replace(/^https?:\/\//, '')}/ws`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          ws.send(JSON.stringify({ type: 'auth', token }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'sessionUpdate') {
            handleSessionUpdate(data.payload);
          } else if (data.type === 'timeUpdate') {
            const now = new Date(data.timestamp);
            setCurrentTime(now);
            
            // Cập nhật countdown
            const countdownValue = 59 - now.getSeconds();
            setCountdown(countdownValue);
            setTimeLeft(countdownValue);
            
            // Kiểm tra và cập nhật phiên nếu cần
            checkAndUpdateSession(now);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Tự động kết nối lại sau 5 giây
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };
        
        wsRef.current = ws;
        
      } catch (error) {
        console.error('Lỗi kết nối WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, checkAndUpdateSession, handleSessionUpdate]);

  // Tải dữ liệu ban đầu khi component mount
  useEffect(() => {
    if (!token) return;
    
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Tải thông tin người dùng
        const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setBalance(userData.balance || 0);
        }
        
        // Tải lịch sử giao dịch
        const historyResponse = await fetch(`${API_BASE_URL}/api/trades/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setTradeHistory(historyData);
        }
        
        // Tải danh sách phiên
        await fetchSessions();
        
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu ban đầu:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải dữ liệu. Vui lòng làm mới trang.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [token, fetchSessions, toast]);

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

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột trái - Số dư, Đặt lệnh, Thanh khoản */}
        <div className="space-y-4">
          {/* Số dư */}
          <Card>
            <CardHeader>
              <CardTitle>Số dư</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(balance)} VND
              </div>
            </CardContent>
          </Card>
          
          {/* Đặt lệnh */}
          <Card>
            <CardHeader>
              <CardTitle>Đặt lệnh giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex space-x-2 mb-4">
                    <Button 
                      variant={selectedAction === 'UP' ? 'default' : 'outline'} 
                      className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                      onClick={() => setSelectedAction('UP')}
                    >
                      <ArrowUp className="mr-2 h-4 w-4" /> TĂNG
                    </Button>
                    <Button 
                      variant={selectedAction === 'DOWN' ? 'default' : 'outline'} 
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
                      onClick={() => setSelectedAction('DOWN')}
                    >
                      <ArrowDown className="mr-2 h-4 w-4" /> GIẢM
                    </Button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Số tiền (VND)</label>
                    <Input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số tiền"
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {QUICK_AMOUNTS.map((value) => (
                        <Button 
                          key={value} 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => setAmount(String(value))}
                        >
                          {new Intl.NumberFormat('vi-VN').format(value)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    disabled={!selectedAction || !amount || isSubmitting}
                    onClick={handlePlaceOrder}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'XÁC NHẬN ĐẶT LỆNH'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Thanh khoản */}
          <Card>
            <CardHeader>
              <CardTitle>Thanh khoản</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mt-4">
                  <LiquidityTable />
                </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Cột phải - Bảng giá, Lịch sử lệnh, Thông tin thị trường */}
        <div className="lg:col-span-2 space-y-4">
          {/* Thông tin phiên hiện tại */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Phiên hiện tại: <span className="text-blue-600">{currentSession?.sessionId || 'Đang tải...'}</span>
                </CardTitle>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Kết thúc sau:</span>
                  <span className="font-mono text-lg font-bold">
                    {String(Math.floor(timeLeft / 10))}{timeLeft % 10}s
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <TradingViewAdvancedChart />
              </div>
            </CardContent>
          </Card>
          
          <RightColumn 
            isLoading={loading}
            tradeHistory={tradeHistory}
            formatCurrency={formatCurrency}
          />
        </div>
        
        {/* Dialog xác nhận đặt lệnh */}
        <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận đặt lệnh</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn đặt lệnh {selectedAction === 'UP' ? 'TĂNG' : 'GIẢM'} với số tiền {new Intl.NumberFormat('vi-VN').format(Number(amount))} VND?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirming(false)}>Hủy</Button>
              <Button 
                onClick={confirmPlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}