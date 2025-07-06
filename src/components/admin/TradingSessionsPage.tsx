'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Session = {
  sessionId: string;
  result: 'UP' | 'DOWN';
  startTime: string;
  endTime: string;
  status: 'active' | 'completed';
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function TradingSessionsPage({ token }: { token: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session>({
    sessionId: '',
    result: 'UP',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 60000).toISOString(),
    status: 'active'
  });
  const [countdown, setCountdown] = useState(60);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;

  // Generate session ID based on current date and time
  const generateSessionId = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  };

  // Save session result to database
  const saveSessionResult = async (session: Session) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(session)
      });

      if (!response.ok) {
        throw new Error('Failed to save session result');
      }

      toast({
        title: 'Thành công',
        description: 'Đã lưu kết quả phiên giao dịch',
      });

      // Refresh sessions list
      await fetchSessions(currentPage);
    } catch (error) {
      console.error('Error saving session result:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu kết quả phiên giao dịch',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch sessions from database
  const fetchSessions = async (page: number) => {
    try {
      const response = await fetch(`/api/admin/sessions?page=${page}&limit=${sessionsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách phiên giao dịch',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize current session and set up countdown
  useEffect(() => {
    fetchSessions(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const now = new Date();
    const currentSessionId = generateSessionId(now);
    const nextMinute = new Date(now);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    nextMinute.setSeconds(0);
    nextMinute.setMilliseconds(0);

    const newCurrentSession = {
      sessionId: currentSessionId,
      result: 'UP' as const,
      startTime: now.toISOString(),
      endTime: nextMinute.toISOString(),
      status: 'active' as const
    };

    setCurrentSession(newCurrentSession);

    // Set up countdown timer
    const timer = setInterval(() => {
      const secondsLeft = Math.ceil((nextMinute.getTime() - new Date().getTime()) / 1000);
      setCountdown(Math.max(0, secondsLeft));

      // When countdown reaches 0, save the session and start a new one
      if (secondsLeft <= 0) {
        saveSessionResult({
          ...newCurrentSession,
          status: 'completed',
          endTime: new Date().toISOString()
        }).then(() => {
          // After saving, start a new session
          const newNow = new Date();
          const newSessionId = generateSessionId(newNow);
          const newNextMinute = new Date(newNow);
          newNextMinute.setMinutes(newNextMinute.getMinutes() + 1);
          newNextMinute.setSeconds(0);
          newNextMinute.setMilliseconds(0);

          const nextSession = {
            sessionId: newSessionId,
            result: 'UP' as const,
            startTime: newNow.toISOString(),
            endTime: newNextMinute.toISOString(),
            status: 'active' as const
          };

          setCurrentSession(nextSession);
          setCountdown(60);
          fetchSessions(currentPage);
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPage]);

  // Handle manual result update
  const handleResultChange = (result: 'UP' | 'DOWN') => {
    setCurrentSession(prev => ({
      ...prev,
      result
    }));
  };

  // Handle manual save
  const handleSaveClick = async () => {
    await saveSessionResult({
      ...currentSession,
      status: 'completed',
      endTime: new Date().toISOString()
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSessions(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <TrendingUp className="h-4 w-4" />
        <span>/</span>
        <span>Phiên giao dịch</span>
      </div>

      {/* Current Session Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Phiên hiện tại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Mã phiên</Label>
                <div className="text-xl font-bold text-white">{currentSession.sessionId}</div>
              </div>
              <div>
                <Label className="text-gray-400">Thời gian còn lại</Label>
                <div className="text-3xl font-bold text-red-500">{countdown}s</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Kết quả</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={currentSession.result === 'UP' ? 'default' : 'outline'}
                    className={`w-24 ${currentSession.result === 'UP' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => handleResultChange('UP')}
                    disabled={isSaving}
                  >
                    LÊN
                  </Button>
                  <Button
                    variant={currentSession.result === 'DOWN' ? 'default' : 'outline'}
                    className={`w-24 ${currentSession.result === 'DOWN' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => handleResultChange('DOWN')}
                    disabled={isSaving}
                  >
                    XUỐNG
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full md:w-auto" 
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : 'Lưu kết quả'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Lịch sử phiên giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Mã phiên</TableHead>
                  <TableHead className="text-white">Kết quả</TableHead>
                  <TableHead className="text-white">Bắt đầu</TableHead>
                  <TableHead className="text-white">Kết thúc</TableHead>
                  <TableHead className="text-white">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell className="font-medium text-white">{session.sessionId}</TableCell>
                      <TableCell>
                        <Badge
                          variant={session.result === 'UP' ? 'default' : 'destructive'}
                          className={session.result === 'UP' ? 'bg-green-500 hover:bg-green-500' : 'bg-red-500 hover:bg-red-500'}
                        >
                          {session.result === 'UP' ? 'LÊN' : 'XUỐNG'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(session.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {session.endTime ? new Date(session.endTime).toLocaleString() : 'Đang chờ...'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status === 'completed' ? 'Đã hoàn thành' : 'Đang hoạt động'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-4">
                      Không có dữ liệu phiên giao dịch
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="text-sm text-gray-400">
              Trang {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={sessions.length < sessionsPerPage}
            >
              Tiếp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
