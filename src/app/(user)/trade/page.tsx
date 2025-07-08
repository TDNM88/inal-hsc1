"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowUp, ArrowDown, ChevronDown, Plus, Minus, BarChart2, User, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TradingViewAdvancedChart from "@/components/TradingViewAdvancedChart";
import LiquidityTable from "@/components/LiquidityTable";
import TradingViewTickerTape from "@/components/TradingViewTickerTape";
import RightColumn from './RightCollum';

// Constants
const QUICK_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000, 200000000];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const USE_MOCK_DATA = true;

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

  // Kiểm tra xác thực ngay lập tức trước khi render nội dung
  useEffect(() => {
    // Nếu đã tải xong thông tin người dùng và không có thông tin đăng nhập
    if (!loading && !user) {
      // Chuyển hướng về trang đăng nhập
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
  const [countdown, setCountdown] = useState(59);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session>({
    sessionId: 'N/A',
    result: null,
    startTime: new Date(),
    status: 'pending'
  });
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<Session[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState<number>(user?.balance || 0);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const formatAmount = (val: string) => {
    if (!val) return "";
    return Number(val.replace(/,/g, "")).toLocaleString("en-US");
  };

  const addAmount = (increment: number) => {
    setAmount((prev) => {
      const value = parseInt(prev.replace(/,/g, "") || "0", 10);
      return (value + increment).toString();
    });
  };

 // ... Các import và định nghĩa khác ...

const generateSessionId = (time: Date): string => {
  if (!(time instanceof Date) || isNaN(time.getTime())) {
    console.error('Invalid Date provided to generateSessionId');
    return 'INVALID';
  }
  const year = String(time.getFullYear()).slice(-2);
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).toString().padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
};

const getSessionTimeRange = (time: Date) => {
  if (!(time instanceof Date) || isNaN(time.getTime())) {
    console.error('Invalid Date provided to getSessionTimeRange');
    return { startTime: null, endTime: null };
  }
  const sessionTime = new Date(time);
  const hours = sessionTime.getHours();
  if (hours < 9 || hours >= 17) {
    console.warn('Session time outside of 9:00-17:00 range');
    return { startTime: null, endTime: null };
  }
  sessionTime.setSeconds(1, 0);
  const startTime = new Date(sessionTime);
  const endTime = new Date(sessionTime.getTime() + 60000 - 1); // End at hh:mm:59
  return { startTime, endTime };
};

// Đảm bảo fetchSessions và fetchSessionResult được định nghĩa trước
const fetchSessionResult = async (sessionId: string) => {
  if (USE_MOCK_DATA) {
    console.log('Using mock session result data');
    setTimeout(() => {
      if (currentSession && currentSession.sessionId === sessionId) {
        const result = Math.random() > 0.5 ? 'UP' : 'DOWN';
        handleSessionUpdate({
          sessionId,
          result: result,
          status: 'completed'
        });
        setTradeHistory(prev =>
          prev.map(item => {
            if (item.session.toString() === sessionId.slice(-4)) {
              const isWin = item.direction === result;
              return {
                ...item,
                status: isWin ? 'win' : 'lose',
                profit: isWin ? item.amount * 0.95 : -item.amount
              };
            }
            return item;
          })
        );
        const relevantTrades = tradeHistory.filter(t =>
          t.session.toString() === sessionId.slice(-4)
        );
        relevantTrades.forEach(trade => {
          const isWin = trade.direction === result;
          if (isWin) {
            setBalance(prev => prev + trade.amount * 1.95);
          }
        });
      }
    }, 2000);
    return;
  }
  if (!token) {
    console.error('No auth token available');
    return;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    if (!response.ok) throw new Error('Failed to fetch session result');
    const session = await response.json();
    if (session.result && session.status === 'completed') {
      if (currentSession && currentSession.sessionId === sessionId) {
        handleSessionUpdate({
          sessionId,
          result: session.result,
          status: 'completed'
        });
      }
    }
  } catch (error) {
    console.error('Error fetching session result:', error);
    if (USE_MOCK_DATA) {
      setTimeout(() => {
        if (currentSession && currentSession.sessionId === sessionId) {
          const result = Math.random() > 0.5 ? 'UP' : 'DOWN';
          handleSessionUpdate({
            sessionId,
            result: result,
            status: 'completed'
          });
        }
      }, 1000);
    }
  }
};

const fetchSessions = async () => {
  setIsLoading(true);
  try {
    if (!navigator.onLine) {
      return useMockSessions();
    }
    if (!token || USE_MOCK_DATA) {
      console.log('Using mock data for development');
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

useEffect(() => {
  let isMounted = true;
  const updateSession = () => {
    if (!isMounted) return;
    const now = new Date();
    setCurrentTime(now);
    const currentSecond = now.getSeconds();
    const countdownValue = 59 - currentSecond;
    setCountdown(countdownValue);
    setTimeLeft(countdownValue);

    // Only update session if within trading hours (9:00-17:00)
    const hours = now.getHours();
    if (hours < 9 || hours >= 17) {
      setCurrentSession({
        sessionId: 'N/A',
        result: null,
        status: 'pending',
        startTime: new Date(),
        endTime: new Date()
      });
      setCountdown(0);
      return;
    }

    const currentSessionId = generateSessionId(now);
    if (!currentSessionId) {
      console.error('Failed to generate session ID');
      return;
    }
    const shouldUpdateSession = 
      !currentSession?.sessionId || 
      currentSession.sessionId === 'N/A' || 
      currentSession.sessionId !== currentSessionId;
    if (shouldUpdateSession) {
      console.log('Updating to new session:', currentSessionId);
      const { startTime, endTime } = getSessionTimeRange(now);
      if (!startTime || !endTime) {
        console.error('Invalid session time range');
        setCurrentSession({
          sessionId: 'N/A',
          result: null,
          status: 'pending',
          startTime: new Date(),
          endTime: new Date()
        });
        return;
      }
      const newSession = {
        sessionId: currentSessionId,
        result: null,
        status: 'pending',
        startTime: startTime,
        endTime: endTime
      };
      if (currentSession?.sessionId && currentSession.sessionId !== 'N/A') {
        setPastSessions(prev => {
          const updated = [{
            ...currentSession,
            status: 'completed',
            result: currentSession.result || (Math.random() > 0.5 ? 'LÊN' : 'XUỐNG')
          }, ...(prev || [])].slice(0, 20);
          return updated;
        });
      }
      setCurrentSession(newSession);
      fetchSessions().catch(error => {
        console.error('Error fetching sessions:', error);
      });
    }
    if (currentSession?.status) {
      if (countdownValue <= 58 && currentSession.status === 'pending') {
        setCurrentSession(prev => ({ ...(prev || {}), status: 'active' }));
      } else if (countdownValue === 59 && currentSession.status === 'active' && !currentSession.result) {
        fetchSessionResult(currentSession.sessionId).catch(error => {
          console.error('Error fetching session result:', error);
        });
      }
    }
  };
  updateSession();
  const timer = setInterval(updateSession, 1000);
  return () => {
    isMounted = false;
    clearInterval(timer);
  };
}, [currentSession]);

  const fetchSessionResult = async (sessionId: string) => {
    if (USE_MOCK_DATA) {
      console.log('Using mock session result data');
      setTimeout(() => {
        if (currentSession && currentSession.sessionId === sessionId) {
          const result = Math.random() > 0.5 ? 'UP' : 'DOWN';
          handleSessionUpdate({
            sessionId,
            result: result,
            status: 'completed'
          });
          setTradeHistory(prev =>
            prev.map(item => {
              // Với định dạng mới yymmddhhmm, session đã là một số giờ-phút
              // Lấy 4 số cuối của sessionId (giờ và phút)
              if (item.session.toString() === sessionId.slice(-4)) {
                const isWin = item.direction === result;
                return {
                  ...item,
                  status: isWin ? 'win' : 'lose',
                  profit: isWin ? item.amount * 0.95 : -item.amount
                };
              }
              return item;
            })
          );
          // Lấy 4 số cuối của sessionId (giờ và phút) để lọc giao dịch liên quan
          const relevantTrades = tradeHistory.filter(t =>
            t.session.toString() === sessionId.slice(-4)
          );
          relevantTrades.forEach(trade => {
            const isWin = trade.direction === result;
            if (isWin) {
              setBalance(prev => prev + trade.amount * 1.95);
            }
          });
        }
      }, 2000);
      return;
    }
    if (!token) {
      console.error('No auth token available');
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      if (!response.ok) throw new Error('Failed to fetch session result');
      const session = await response.json();
      if (session.result && session.status === 'completed') {
        if (currentSession && currentSession.sessionId === sessionId) {
          handleSessionUpdate({
            sessionId,
            result: session.result,
            status: 'completed'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching session result:', error);
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          if (currentSession && currentSession.sessionId === sessionId) {
            const result = Math.random() > 0.5 ? 'UP' : 'DOWN';
            handleSessionUpdate({
              sessionId,
              result: result,
              status: 'completed'
            });
          }
        }, 1000);
      }
    }
  };

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      if (!navigator.onLine) {
        return useMockSessions();
      }
      if (!token || USE_MOCK_DATA) {
        console.log('Using mock data for development');
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
        setTradeResult({
          status: 'win',
          direction: orderType,
          entryPrice: marketData[0]?.price,
          exitPrice: marketData[0]?.price,
          amount: orderAmount,
          profit,
        });
      } else {
        setTradeResult({
          status: 'lose',
          direction: orderType,
          entryPrice: marketData[0]?.price,
          exitPrice: marketData[0]?.price,
          amount: orderAmount,
          profit: 0,
        });
      }
    });
  };

  const confirmTrade = async () => {
    if (!selectedAction || !user || !currentSession) return;
    const amountNum = Number(amount.replace(/,/g, ""));
    try {
      setIsLoading(true);
      if (USE_MOCK_DATA) {
        console.log('Using mock data for order submission');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockOrderId = `mock-${Date.now()}`;
        const newOrder = {
          id: mockOrderId,
          sessionId: currentSession.sessionId,
          amount: amountNum,
          type: selectedAction,
          userId: user.id,
          createdAt: new Date().toISOString()
        };
        setUserOrders(prev => [...prev, newOrder]);
        const tradeId = Date.now();
        const newHistoryItem: TradeHistoryRecord = {
          id: tradeId,
          // Với định dạng mới yymmddhhmm, lấy 4 số cuối là giờ và phút
          session: parseInt(currentSession.sessionId.slice(-4) || '0'),
          direction: selectedAction,
          amount: amountNum,
          status: "pending",
          profit: 0
        };
        // Giới hạn lịch sử giao dịch chỉ hiển thị 30 lệnh gần nhất
        setTradeHistory(prev => [newHistoryItem, ...prev].slice(0, 30));
        setBalance(prev => prev - amountNum);
        toast({ title: 'Thành công', description: 'Đặt lệnh thành công' });
        setAmount('');
        setIsConfirming(false);
        setIsLoading(false);
        return;
      }
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
        // Với định dạng mới yymmddhhmm, lấy 4 số cuối là giờ và phút
        session: parseInt(currentSession.sessionId.slice(-4)),
        direction: selectedAction,
        amount: amountNum,
        status: "pending",
        profit: 0
      };
      setTradeHistory(prev => [...prev, newHistoryItem]);
      setBalance(prev => prev - amountNum);
      toast({ title: 'Thành công', description: 'Đặt lệnh thành công' });
      setAmount('');
      setIsConfirming(false);
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
              <div className="lg:col-span-4 space-y-6">
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
                        <Button variant="outline" size="icon" onClick={() => addAmount(-100000)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          id="amount"
                          type="text"
                          value={formatAmount(amount)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (/^\d*$/.test(raw)) setAmount(raw);
                          }}
                          placeholder="Nhập số tiền"
                        />
                        <Button variant="outline" size="icon" onClick={() => addAmount(100000)}>
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
                            onClick={() => addAmount(value)}
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
                        disabled={isLoading || !amount}
                      >
                        LÊN <ArrowUp className="h-5 w-5 ml-2" />
                      </Button>
                      <Button
                        type="button"
                        className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg font-bold flex items-center justify-center"
                        onClick={() => handleAction("DOWN")}
                        disabled={isLoading || !amount}
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
              <RightColumn
                isLoading={isLoading}
                tradeHistory={tradeHistory}
                formatCurrency={formatCurrency}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
