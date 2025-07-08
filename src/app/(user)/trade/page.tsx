"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useToast } from "@/components/ui/use-toast";
import { generateSessionId } from '@/lib/sessionUtils';
import { Loader2, AlertCircle, RefreshCw, ArrowDown, ArrowUp, ChevronDown, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import RightColumn from './RightColumn';
import LiquidityTable from '@/components/LiquidityTable';

// Constants
const QUICK_AMOUNTS = [100000, 1000000, 5000000, 10000000, 30000000, 50000000, 100000000, 200000000];
const SESSION_DURATION = 60; // 60 seconds per session
const RESULT_DELAY = 5; // 5 seconds delay for result
const TRADING_HOURS = { start: 9, end: 17 }; // Trading from 9:00 to 17:00

// Types
export interface TradeHistoryRecord {
  id: string;
  sessionId: string;
  direction: "UP" | "DOWN";
  amount: number;
  status: "pending" | "completed";
  result: "win" | "lose" | null;
  profit: number;
  createdAt: string;
}

interface TradeResult {
  status: "idle" | "win" | "lose";
  direction?: "UP" | "DOWN";
  profit?: number;
  amount?: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatAmount = (value: string): string => {
  const num = parseFloat(value.replace(/,/g, ""));
  return isNaN(num) ? '' : num.toLocaleString('vi-VN');
};

export default function TradePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(user?.balance || 1000000); // Initialize with user balance or demo value
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryRecord[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => generateSessionId(new Date()));
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_DURATION);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"UP" | "DOWN" | null>(null);
  const [tradeResult, setTradeResult] = useState<TradeResult>({ status: "idle" });
  const processedTradesRef = useRef<Set<string>>(new Set());

  // Check if within trading hours
  const isWithinTradingHours = (date: Date): boolean => {
    const hours = date.getHours();
    return hours >= TRADING_HOURS.start && hours < TRADING_HOURS.end;
  };

  // Generate session timing
  const getSessionTimeRange = (time: Date) => {
    if (!(time instanceof Date) || isNaN(time.getTime())) {
      console.error('Invalid Date provided to getSessionTimeRange');
      return { startTime: null, endTime: null };
    }
    if (!isWithinTradingHours(time)) {
      return { startTime: null, endTime: null };
    }
    const sessionTime = new Date(time);
    sessionTime.setSeconds(1, 0);
    const startTime = new Date(sessionTime);
    const endTime = new Date(sessionTime.getTime() + (SESSION_DURATION * 1000 - 1)); // End at hh:mm:59
    return { startTime, endTime };
  };

  // Session and timing management
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
      toast({ variant: 'destructive', title: 'Vui lòng đăng nhập để sử dụng tính năng này' });
      return;
    }

    const startNewSession = () => {
      const now = new Date();
      if (!isWithinTradingHours(now)) {
        setCurrentSessionId('N/A');
        setTimeLeft(0);
        return;
      }
      const newSessionId = generateSessionId(now);
      setCurrentSessionId(newSessionId);
      const { startTime, endTime } = getSessionTimeRange(now);
      if (startTime && endTime) {
        const secondsUntilEnd = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        setTimeLeft(Math.max(0, secondsUntilEnd));
      } else {
        setTimeLeft(0);
      }
    };

    startNewSession();

    const timer = setInterval(() => {
      const now = new Date();
      if (!isWithinTradingHours(now)) {
        setCurrentSessionId('N/A');
        setTimeLeft(0);
        setTradeResult({ status: 'idle' });
        setTradeHistory(prev =>
          prev.map(trade =>
            trade.status === 'pending' ? { ...trade, status: 'completed', result: null, profit: 0 } : trade
          )
        );
        return;
      }

      const newSessionId = generateSessionId(now);
      if (newSessionId !== currentSessionId) {
        setCurrentSessionId(newSessionId);
        setTradeResult({ status: 'idle' });
        setTradeHistory(prev =>
          prev.map(trade =>
            trade.sessionId === currentSessionId && trade.status === 'pending'
              ? { ...trade, status: 'completed', result: null, profit: 0 }
              : trade
          )
        );
        const { startTime, endTime } = getSessionTimeRange(now);
        if (startTime && endTime) {
          const secondsUntilEnd = Math.floor((endTime.getTime() - now.getTime()) / 1000);
          setTimeLeft(Math.max(0, secondsUntilEnd));
        }
      } else {
        setTimeLeft(prev => (prev <= 1 ? SESSION_DURATION : prev - 1));
      }
    }, 1000);

    setIsLoading(false);

    return () => clearInterval(timer);
  }, [authLoading, user, router, toast, currentSessionId]);

  // Handle trade results after session ends
  useEffect(() => {
    if (timeLeft !== 0 || !isWithinTradingHours(new Date())) return;

    const pendingTrades = tradeHistory.filter(
      trade =>
        trade.status === 'pending' &&
        trade.sessionId === currentSessionId &&
        !processedTradesRef.current.has(trade.id)
    );

    if (pendingTrades.length === 0) return;

    pendingTrades.forEach(trade => processedTradesRef.current.add(trade.id));

    const timeout = setTimeout(async () => {
      for (const trade of pendingTrades) {
        const adminResult = await getAdminResult(trade.sessionId);
        if (!adminResult) {
          console.error(`No result for session ${trade.sessionId}`);
          setTradeHistory(prev =>
            prev.map(t =>
              t.id === trade.id
                ? { ...t, status: 'completed', result: null, profit: 0 }
                : t
            )
          );
          continue;
        }

        const isWin = trade.direction === adminResult;
        const profit = isWin ? parseFloat((trade.amount * 0.9).toFixed(2)) : 0;

        await saveTradeResult(trade.id, isWin ? 'win' : 'lose', profit);

        setTradeHistory(prev =>
          prev.map(t =>
            t.id === trade.id
              ? { ...t, status: 'completed', result: isWin ? 'win' : 'lose', profit }
              : t
          )
        );

        if (isWin) {
          setBalance(prev => prev + trade.amount + profit);
        }

        setTradeResult({
          status: isWin ? 'win' : 'lose',
          direction: trade.direction,
          profit,
          amount: trade.amount,
        });
      }
    }, RESULT_DELAY * 1000);

    return () => clearTimeout(timeout);
  }, [timeLeft, currentSessionId, tradeHistory]);

  // Get trade result from admin API (mocked for now)
  const getAdminResult = async (sessionId: string): Promise<'UP' | 'DOWN' | null> => {
    try {
      // Mock result for demo
      return Math.random() > 0.5 ? 'UP' : 'DOWN';
      // Uncomment for actual API call
      /*
      const response = await fetch(`/api/trades/admin-result?sessionId=${sessionId}`);
      const data = await response.json();
      if (data.success && data.result) {
        return data.result as 'UP' | 'DOWN';
      }
      return null;
      */
    } catch (error) {
      console.error('Error fetching admin result:', error);
      return null;
    }
  };

  // Save trade result to database
  const saveTradeResult = async (tradeId: string, result: 'win' | 'lose', profit: number) => {
    try {
      // Mock save for demo
      console.log(`Saving trade result: tradeId=${tradeId}, result=${result}, profit=${profit}`);
      // Uncomment for actual API call
      /*
      const response = await fetch('/api/trades/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tradeId,
          result,
          profit,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save trade result');
      }
      */
    } catch (error) {
      console.error('Error saving trade result:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu kết quả giao dịch. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  // Handle amount changes
  const addAmount = useCallback((value: number) => {
    setAmount(prev => {
      const current = parseFloat(prev.replace(/,/g, "")) || 0;
      const newAmount = Math.max(100000, current + value);
      return newAmount.toString();
    });
  }, []);

  // Handle trade action
  const handleAction = useCallback((direction: "UP" | "DOWN") => {
    const amountValue = parseFloat(amount.replace(/,/g, ""));
    if (!amount || isNaN(amountValue) || amountValue < 100000) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền phải lớn hơn hoặc bằng 100,000 VND',
        variant: 'destructive',
      });
      return;
    }
    if (amountValue > balance) {
      toast({
        title: 'Lỗi',
        description: 'Số dư không đủ để đặt lệnh',
        variant: 'destructive',
      });
      return;
    }
    if (!isWithinTradingHours(new Date()) || currentSessionId === 'N/A') {
      toast({
        title: 'Lỗi',
        description: 'Không thể đặt lệnh ngoài giờ giao dịch (9:00 - 17:00)',
        variant: 'destructive',
      });
      return;
    }
    setSelectedAction(direction);
    setIsConfirming(true);
  }, [amount, balance, currentSessionId, toast]);

  // Confirm trade
  const confirmTrade = useCallback(() => {
    if (!selectedAction || !amount || currentSessionId === 'N/A') return;

    setIsSubmitting(true);
    setIsConfirming(false);

    const amountNum = Number(amount.replace(/,/g, ""));
    const newTrade: TradeHistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sessionId: currentSessionId,
      direction: selectedAction,
      amount: amountNum,
      status: 'pending',
      result: null,
      profit: 0,
      createdAt: new Date().toISOString(),
    };

    setTradeHistory(prev => [newTrade, ...prev].slice(0, 30)); // Limit to 30 trades
    setBalance(prev => prev - amountNum);
    setAmount('');
    setSelectedAction(null);

    toast({
      title: 'Thành công',
      description: `Đã đặt lệnh ${selectedAction === 'UP' ? 'LÊN' : 'XUỐNG'} thành công`,
    });

    setIsSubmitting(false);
  }, [selectedAction, amount, currentSessionId, toast]);

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
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
    <div className="min-h-screen bg-gray-900">
      <div className="p-4 md:p-8">
        <Dialog
          open={tradeResult.status === "win" || tradeResult.status === "lose"}
          onOpenChange={(open) => !open && setTradeResult({ status: "idle" })}
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
            <DialogHeader>
              <DialogTitle className="text-white text-center">
                Phiên hiện tại <span className="text-red-500">{currentSessionId || 'N/A'}</span>
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
          <div className="lg:col-span-8 lg:order-2 order-1">
            <RightColumn
              isLoading={isLoading}
              tradeHistory={tradeHistory}
              formatCurrency={formatCurrency}
            />
          </div>

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
                  <span>{formatCurrency(balance || 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-300 rounded-md shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ChevronDown className="h-4 w-4 text-gray-700" />
                  <CardTitle className="text-gray-900 text-base font-medium">Đặt lệnh</CardTitle>
                  <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded ml-auto">
                    Phiên: {currentSessionId || 'N/A'}
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
                    <Button variant="outline" size="icon" onClick={() => addAmount(-100000)} disabled={isSubmitting}>
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
                      disabled={isSubmitting}
                    />
                    <Button variant="outline" size="icon" onClick={() => addAmount(100000)} disabled={isSubmitting}>
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
                        disabled={isSubmitting}
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
                    <span>{currentSessionId || 'N/A'}</span>
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
                    disabled={isLoading || !amount || isSubmitting || currentSessionId === 'N/A'}
                  >
                    LÊN <ArrowUp className="h-5 w-5 ml-2" />
                  </Button>
                  <Button
                    type="button"
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-lg font-bold flex items-center justify-center"
                    onClick={() => handleAction("DOWN")}
                    disabled={isLoading || !amount || isSubmitting || currentSessionId === 'N/A'}
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
      </div>
    </div>
  );
}
