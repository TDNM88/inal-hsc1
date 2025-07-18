import React from 'react';
import { Loader2, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TradingViewTickerTape from '@/components/TradingViewTickerTape';
import TradingViewAdvancedChart from '@/components/TradingViewAdvancedChart';
import LiquidityTable from '@/components/LiquidityTable';

// Define props for the component
interface RightColumnProps {
  isLoading: boolean;
  tradeHistory: {
    session: number;
    direction: 'UP' | 'DOWN';
    amount: number;
    status: 'pending' | 'win' | 'lose';
  }[];
  formatCurrency: (value: number) => string;
}

const RightColumn: React.FC<RightColumnProps> = ({ isLoading, tradeHistory, formatCurrency }) => {
  return (
    <div className="space-y-6 lg:col-span-8">
      {/* Market Data Ticker */}
      <Card className="bg-white border-gray-300 rounded-md shadow">
        <CardContent className="p-0">
          <TradingViewTickerTape />
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-white border-gray-300 h-[650px] overflow-hidden rounded-md shadow">
        <CardContent className="h-full w-full p-0">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <TradingViewAdvancedChart
              symbol="TVC:GOLD"
              interval="1"
              theme="dark"
              height={460}
              interactive={false}
            />
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="relative z-10 bg-white border-gray-300 rounded-md shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-900">Lịch sử lệnh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 text-sm text-left text-gray-900">
              <thead className="bg-gray-100 uppercase text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Phiên</th>
                  <th scope="col" className="px-4 py-2 font-medium">Loại</th>
                  <th scope="col" className="px-4 py-2 font-medium">Số tiền</th>
                  <th scope="col" className="px-4 py-2 font-medium">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <BarChart2 className="w-8 h-8 mb-2" />
                        <p>Chưa đặt lệnh nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tradeHistory.map((rec, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{rec.session}</td>
                      <td
                        className={`px-4 py-2 font-semibold ${
                          rec.direction === 'UP' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {rec.direction === 'UP' ? 'LÊN' : 'XUỐNG'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(rec.amount)} VND</td>
                      <td
                        className={`px-4 py-2 font-semibold ${
                          rec.status === 'pending'
                            ? 'text-gray-500'
                            : rec.status === 'win'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {rec.status === 'pending' ? 'Đợi kết quả' : rec.status === 'win' ? 'Thắng' : 'Thua'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity / Market Overview */}
      <Card className="bg-white border-gray-300 rounded-md shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-900">Thanh khoản</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LiquidityTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default RightColumn;