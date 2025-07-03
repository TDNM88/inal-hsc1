"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowUp, ArrowDown, Clock, BarChart2, DollarSign, RefreshCw, ChevronDown, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TradingViewSymbolOverview from "@/components/TradingViewSymbolOverview";
import TradingViewAdvancedChart from "@/components/TradingViewAdvancedChart";
import LiquidityTable from "@/components/LiquidityTable";
import TradingViewTickerTape from "@/components/TradingViewTickerTape";

// Constants
const QUICK_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000, 200000000];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Define types
interface Session {
  sessionId: string;
  result: string | null;
  status: string;
  startTime: string | Date;
  endTime?: string | Date;
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
  
  // State for UI components
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedAction, setSelectedAction] = useState<"UP" | "DOWN" | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [marketData, setMarketData] = useState([
    { symbol: "XAU/USD", price: 2337.16, change: 12.5, changePercent: 0.54 },
    { symbol: "OIL", price: 85.20, change: -0.45, changePercent: -0.53 },
  ]);
  
  // State for trade results
  const [tradeResult, setTradeResult] = useState<{
    status: "idle" | "win" | "lose" | "processing";
    direction?: "UP" | "DOWN";
    entryPrice?: number;
    exitPrice?: number;
    amount?: number;
    profit?: number;
  }>({ status: "idle" });

  // States for time and session management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(59);
  
  // Session management states
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session>({ 
    sessionId: 'N/A', 
    result: null, 
    startTime: new Date(),
    status: 'pending'
  });
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<Session[]>([]);
  
  // User orders and balance
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState<'UP' | 'DOWN'>('UP');
  const [balance, setBalance] = useState<number>(user?.balance || 0);
  
  // Trade history
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);
  
  // Error messages
  const [error, setError] = useState<string | null>(null);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };
  
  // Format amount for input
  const formatAmount = (val: string) => {
    if (!val) return "";
    return Number(val.replace(/,/g, "")).toLocaleString("en-US");
  };
  
  // Add/subtract amount
  const addAmount = (increment: number) => {
    setAmount((prev) => {
      const value = parseInt(prev.replace(/,/g, "") || "0", 10);
      return (value + increment).toString();
    });
  };

  // Generate session ID from time
  const generateSessionId = (time: Date): string => {
    return `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}_${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  };

  // Initialize user data and authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      toast({ variant: 'destructive', title: 'Vui lòng đăng nhập để sử dụng tính năng này' });
    }
    
    if (user && user.balance) {
      setBalance(user.balance);
    }
    
    if (token && user) {
      fetchSessions();
      setTradeHistory([]);
    }
  }, [token, user, loading, router, toast]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) return;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    
    const connectWebSocket = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log('Đã thử kết nối WebSocket nhiều lần không thành công. Đang tạm dừng kết nối.');
        return;
      }
      
      try {
        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws`;
        console.log(`Đang kết nối WebSocket đến: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          reconnectAttempts = 0;
          
          if (token) {
            ws.send(JSON.stringify({ type: 'auth', token }));
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'sessionUpdate') {
              handleSessionUpdate(data);
            } else if (data.type === 'balanceUpdate') {
              setBalance(data.balance);
            }
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected, trying to reconnect...');
          reconnectAttempts++;
          
          const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
          setTimeout(connectWebSocket, delay);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, token]);

  // Update time and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (currentSession && currentSession.startTime !== 'N/A') {
        const startTime = new Date(currentSession.startTime);
        const endTime = currentSession.endTime ? new Date(currentSession.endTime) : new Date(startTime.getTime() + 60000);
        
        const secondsLeft = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        setCountdown(secondsLeft);
        setTimeLeft(secondsLeft);
        
        if (secondsLeft === 0 && currentSession.status === 'pending' && !currentSession.result) {
          fetchSessionResult(currentSession.sessionId);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentSession]);

  // Handle WebSocket session update
  const handleSessionUpdate = (data: any) => {
    const { sessionId, result, status } = data;
    
    if (currentSession.sessionId === sessionId) {
      if (status === 'completed' && result) {
        const updatedSession = { ...currentSession, result, status };
        setCurrentSession(updatedSession);
        handlePayout(updatedSession);
        
        if (futureSessions.length > 0) {
          const [nextSession, ...remainingSessions] = futureSessions;
          setCurrentSession(nextSession);
          setFutureSessions(remainingSessions);
          
          setPastSessions(prev => [updatedSession, ...prev].slice(0, 20));
        }
      }
    } else if (futureSessions.some(session => session.sessionId === sessionId)) {
      setFutureSessions(prev => 
        prev.map(session => 
          session.sessionId === sessionId ? { ...session, result, status } : session
        )
      );
    } else if (pastSessions.some(session => session.sessionId === sessionId)) {
      setPastSessions(prev => 
        prev.map(session => 
          session.sessionId === sessionId ? { ...session, result, status } : session
        )
      );
    } else {
      fetchSessions();
    }
  };

  // Fetch session result
  const fetchSessionResult = async (sessionId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch session result');
      
      const session = await response.json();
      
      if (session.result && session.status === 'completed') {
        if (currentSession.sessionId === sessionId) {
          handleSessionUpdate({ 
            sessionId, 
            result: session.result, 
            status: 'completed' 
          });
        }
      }
    } catch (error) {
      console.error('Error fetching session result:', error);
    }
  };

  // Fetch sessions from API
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      if (!navigator.onLine) {
        console.log('Offline mode detected, using mock data');
        return useMockSessions();
      }
      
      if (!token) {
        console.error('No auth token available');
        return useMockSessions();
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
      
      const sessions = await response.json();
      const now = new Date();
      
      processSessionData(sessions, now);
      
      return sessions;
    } catch (error) {
      console.error('Error in fetchSessions:', error);
      setError('Không thể tải phiên giao dịch. Vui lòng thử lại sau.');
      return useMockSessions();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock sessions for offline mode
  const useMockSessions = (): Session[] => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    
    const mockSessions: Session[] = [];
    
    for (let i = 0; i < 12; i++) {
      const sessionStart = new Date(startOfDay.getTime() + i * 10 * 60 * 1000);
      const sessionEnd = new Date(sessionStart.getTime() + 10 * 60 * 1000);
      const isPast = sessionEnd < now;
      const isCurrent = sessionStart <= now && sessionEnd >= now;
      
      const session: Session = {
        sessionId: generateSessionId(sessionStart),
        startTime: sessionStart,
        endTime: sessionEnd,
        status: isPast ? 'completed' : isCurrent ? 'running' : 'upcoming',
        result: isPast ? (Math.random() > 0.5 ? 'UP' : 'DOWN') : null
      };
      
      mockSessions.push(session);
    }
    
    return processSessionData(mockSessions, now);
  };
  
  // Process session data
  const processSessionData = (sessions: Session[], now: Date): Session[] => {
    const processed = sessions.map(session => {
      const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime || Date.now());
      const endTime = session.endTime ? (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : new Date(startTime.getTime() + 10 * 60000);
      
      let status: string;
      if (startTime > now) {
        status = 'upcoming';
      } else if (now >= startTime && now < endTime) {
        status = 'running';
      } else {
        status = 'completed';
      }
      
      return {
        ...session,
        startTime,
        endTime,
        status
      };
    });
    
    const running = processed.filter(session => session.status === 'running');
    const completed = processed.filter(session => session.status === 'completed');
    const upcoming = processed.filter(session => session.status === 'upcoming');
    
    setSessions(processed);
    setPastSessions(completed);
    setCurrentSession(running[0] || { sessionId: 'N/A', result: null, startTime: new Date(), endTime: new Date(), status: 'pending' });
    setFutureSessions(upcoming);
    
    return processed;
  };
  
  // Handle action (UP/DOWN)
  const handleAction = (type: "UP" | "DOWN") => {
    const betAmount = Number(amount.replace(/,/g, ""));
    if (!betAmount || isNaN(betAmount)) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng nhập số tiền hợp lệ" });
      return;
    }
    if (betAmount < 100000) {
      toast({ variant: "destructive", title: "Lỗi", description: "Số tiền tối thiểu là 100,000 VND" });
      return;
    }
    if (user && betAmount > balance) {
      toast({ variant: "destructive", title: "Lỗi", description: "Số dư không đủ" });
      return;
    }
    setSelectedAction(type);
    setIsConfirming(true);
  };
  
  // Handle payout when session ends
  const handlePayout = (session: Session) => {
    const sessionOrders = userOrders.filter((order: Order) => order.sessionId === session.sessionId);
    
    if (sessionOrders.length === 0) return;
    
    sessionOrders.forEach((order: Order) => {
      const orderAmount = order.amount;
      const orderType = order.type;
      const sessionResult = session.result;
      
      if (orderType === sessionResult) {
        const profit = orderAmount * 0.95;
        setBalance((prev: number) => prev + orderAmount + profit);
        
        setTradeHistory((prev: TradeHistoryRecord[]) => {
          return prev.map((item: TradeHistoryRecord) => {
            if (item.session.toString() === session.sessionId.split('_')[1].replace(':', '')) {
              return { ...item, status: 'win', profit };
            }
            return item;
          });
        });
        
        toast({
          title: 'Thắng!',
          description: `Bạn đã thắng ${formatCurrency(profit)} VND từ lệnh ${orderType}`,
          variant: 'default'
        });
      } else {
        setTradeHistory((prev: TradeHistoryRecord[]) => {
          return prev.map((item: TradeHistoryRecord) => {
            if (item.session.toString() === session.sessionId.split('_')[1].replace(':', '')) {
              return { ...item, status: 'lose', profit: -orderAmount };
            }
            return item;
          });
        });
        
        toast({
          title: 'Thua!',
          description: `Bạn đã thua ${formatCurrency(orderAmount)} VND từ lệnh ${orderType}`,
          variant: 'destructive'
        });
      }
    });
  };
  
  // Confirm trade order
  const confirmTrade = async () => {
    if (!selectedAction || !user || !token || !currentSession) return;
    
    const amountNum = Number(amount.replace(/,/g, ""));
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          amount: amountNum,
          type: selectedAction,
          userId: user.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to place order');
      }
        
      const newOrder = await response.json();
      
      setUserOrders(prev => [...prev, newOrder]);
      
      const tradeId = Date.now();
      const newHistoryItem: TradeHistoryRecord = {
        id: tradeId,
        session: parseInt(currentSession.sessionId.split('_')[1].replace(':', '')),
        direction: selectedAction,
        amount: amountNum,
        status: "pending",
        profit: 0
      };
      setTradeHistory(prev => [...prev, newHistoryItem]);
      
      setBalance(prev => prev - amountNum);
      
      toast({ title: 'Thành công', description: 'Đặt lệnh thành công' });
      setAmount('');
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: 'Không thể đặt lệnh. Vui lòng thử lại sau.' 
      });
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
      setSelectedAction(null);
    }
  };

  // Handle place order
  const handlePlaceOrder = () => {
    handleAction(orderType);
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 px-2 md:px-4 pt-4 pb-8">
        {/* Left Column - Order controls */}
        <div className="lg:col-span-3 space-y-4">
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
                <span>{formatCurrency(balance)} VND</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-gray-300 rounded-md shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ChevronDown className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-gray-900 text-base font-medium">Đặt lệnh</CardTitle>
                <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded ml-auto">ID: {currentSession.sessionId}</span>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div className="border border-green-500 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <ArrowUp className="h-5 w-5 text-green-500 mr-1" />
                      <span className="text-green-500 font-semibold">LÊN</span>
                    </div>
                    <Badge variant={orderType === "UP" ? "default" : "outline"} 
                          className={orderType === "UP" ? "bg-green-600 hover:bg-green-700" : "text-green-500 border-green-500"} 
                          onClick={() => setOrderType("UP")}>
                      Đang chọn
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                    onClick={() => handleAction("UP")}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4" />}
                    Đặt Lệnh Lên
                  </Button>
                </div>
  
                <div className="border border-red-500 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <ArrowDown className="h-5 w-5 text-red-500 mr-1" />
                      <span className="text-red-500 font-semibold">XUỐNG</span>
                    </div>
                    <Badge variant={orderType === "DOWN" ? "default" : "outline"} 
                          className={orderType === "DOWN" ? "bg-red-600 hover:bg-red-700" : "text-red-500 border-red-500"} 
                          onClick={() => setOrderType("DOWN")}>
                      Đang chọn
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => handleAction("DOWN")}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDown className="mr-2 h-4 w-4" />}
                    Đặt Lệnh Xuống
                  </Button>
                </div>
              </div>
  
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <h3 className="text-white text-lg">Số tiền đặt:</h3>
                  <span className="ml-2 text-green-400 font-semibold">
                    {formatCurrency(balance)} VND
                  </span>
                </div>
                
                <div className="relative flex items-center">
                  <DollarSign className="absolute left-3 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    value={formatAmount(amount)}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 pr-20 bg-gray-700 border-gray-600 text-white"
                    placeholder="Nhập số tiền"
                  />
                  <div className="absolute right-3 flex items-center space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => addAmount(-100000)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => addAmount(100000)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(val.toString())}
                      className="text-xs"
                    >
                      {formatCurrency(val)}
                    </Button>
                  ))}
                </div>
                
                <Button 
                  className="w-full mt-2" 
                  size="lg" 
                  onClick={handlePlaceOrder}
                  disabled={!amount || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Đặt lệnh {orderType === "UP" ? "LÊN" : "XUỐNG"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
  
        {/* Middle Section - Chart and Session Info */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700 pb-2">
              <CardTitle className="text-white flex justify-between items-center">
                <span>TradingView Chart</span>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  XAU/USD
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[450px] lg:h-[500px]">
              <TradingViewAdvancedChart />
            </CardContent>
          </Card>
  
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700 pb-3">
              <CardTitle className="text-white flex justify-between items-center flex-wrap gap-2">
                <span>Phiên hiện tại: {currentSession.sessionId}</span>
                <div className="flex items-center bg-gray-900 px-4 py-2 rounded-full">
                  <Clock className="mr-2 h-5 w-5 text-blue-400" />
                  <span className="text-blue-400 font-mono text-lg">{countdown}s</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <div className="text-gray-300">Bắt đầu: {new Date(currentSession.startTime).toLocaleTimeString()}</div>
                <div className="text-gray-300">
                  Kết thúc: {currentSession.endTime ? new Date(currentSession.endTime).toLocaleTimeString() : 'Đang tính toán'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Section - Market Data and History */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700 pb-3">
              <CardTitle className="text-white flex justify-between items-center">
                <span>Thông tin thị trường</span>
                <Button
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => fetchSessions()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {marketData.map((market, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="text-white font-medium">{market.symbol}</div>
                      <div className="text-gray-400 text-xs">Forex</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">${market.price.toFixed(2)}</div>
                      <div className={market.change > 0 ? "text-green-500" : "text-red-500"}>
                        {market.change > 0 ? "+" : ""}{market.change.toFixed(2)} ({market.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
  
              <div className="mt-6">
                <h3 className="text-white font-medium mb-3">Thông tin phiên</h3>
                
                <div className="bg-gray-700 p-3 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300">Phiên hiện tại:</span>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {currentSession.sessionId}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300">Trạng thái:</span>
                    <span className="text-white">
                      {currentSession.status === 'pending' ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Kết quả:</span>
                    <span className="text-white">
                      {currentSession.result ? (
                        currentSession.result === 'UP' ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            LÊN
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-red-600 hover:bg-red-700">
                            XUỐNG
                          </Badge>
                        )
                      ) : (
                        'Chưa có'
                      )}
                    </span>
                  </div>
                </div>
  
                <h4 className="text-white text-sm mb-2">Phiên sắp diễn ra:</h4>
                <div className="space-y-2">
                  {futureSessions.slice(0, 3).map((session, index) => (
                    <div key={index} className="bg-gray-700/50 p-2 rounded flex justify-between items-center">
                      <span className="text-gray-300 text-xs">{session.sessionId}</span>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                        Sắp diễn ra
                      </Badge>
                    </div>
                  ))}
                  {futureSessions.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-1">
                      Không có phiên nào sắp diễn ra
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
  
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700 pb-3">
              <CardTitle className="text-white">
                Lịch sử giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tradeHistory.length > 0 ? (
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700 sticky top-0">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-300 px-3 py-2">Phiên</th>
                        <th className="text-left text-xs font-medium text-gray-300 px-3 py-2">Lệnh</th>
                        <th className="text-right text-xs font-medium text-gray-300 px-3 py-2">Số tiền</th>
                        <th className="text-right text-xs font-medium text-gray-300 px-3 py-2">Lợi nhuận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {tradeHistory
                        .filter(trade => trade.status !== "pending")
                        .map((trade) => (
                          <tr key={trade.id} className="hover:bg-gray-700/50">
                            <td className="px-3 py-2 text-sm text-white">
                              {trade.session}
                            </td>
                            <td className="px-3 py-2">
                              {trade.direction === "UP" ? (
                                <Badge className="bg-green-600">LÊN</Badge>
                              ) : (
                                <Badge className="bg-red-600">XUỐNG</Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-gray-300">
                              {formatCurrency(trade.amount)}
                            </td>
                            <td className={`px-3 py-2 text-right text-sm ${
                              trade.profit > 0 ? "text-green-500" : "text-red-500"
                            }`}>
                              {trade.profit > 0 ? "+" : ""}
                              {formatCurrency(trade.profit)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-gray-400">
                  Chưa có lịch sử giao dịch
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận lệnh</DialogTitle>
            <DialogDescription>
              Bạn đang đặt lệnh {selectedAction} với số tiền {formatCurrency(Number(amount.replace(/,/g, "")))} VND cho phiên {currentSession.sessionId}.
              Bạn có chắc chắn muốn tiếp tục?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirming(false)}>
              Hủy
            </Button>
            <Button onClick={confirmTrade} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}