'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { useToast } from 'components/ui/use-toast';
import { Upload } from 'lucide-react';

export default function DepositPage() {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập số tiền hợp lệ' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('amount', amount);

      const res = await fetch('/api/deposits', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast({ title: 'Thành công', description: result.message || 'Yêu cầu nạp tiền đã được gửi' });
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          setAmount('');
        }, 2000);
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: result.message || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể gửi yêu cầu. Vui lòng thử lại sau.',
      });
    }
  };

  return (
    <div id="deposit-page" className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-700 p-6">
            <CardTitle className="text-2xl font-semibold text-white">Nạp tiền</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-gray-400">Số tiền</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Số tiền (VND)"
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
              />
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!amount || Number(amount) <= 0}
            >
              <Upload className="h-5 w-5 mr-2" />
              Gửi yêu cầu
            </Button>
          </CardContent>
        </Card>
      </div>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Thông báo</h3>
            <p className="text-gray-300">Chuyển tiền thành công!</p>
            <Button
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowPopup(false)}
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
