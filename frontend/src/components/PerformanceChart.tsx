import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface PerformanceChartProps {
  indexId: string;
  guestBacktesting?: any; // Accept guest backtesting data
}

interface NapkinChartData {
  title: string;
  description: string;
  data: Array<{
    label: string;
    value: number;
    change: number;
    sector?: string;
  }>;
  performance: {
    '1d': number;
    '7d': number;
    '30d': number;
    '1y': number;
  };
  benchmarks: {
    sp500: number;
    nasdaq: number;
  };
}

const timeRanges = [
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
  { label: '10Y', value: '10Y' },
];

// Smoothing and downsampling helpers
interface ChartDatum {
  [key: string]: any;
  asset: number;
  date: string;
}

function movingAverage(data: ChartDatum[], windowSize: number = 7): ChartDatum[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  const result: ChartDatum[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, d) => sum + (d.asset ?? 0), 0) / window.length;
    result.push({ ...data[i], asset: avg });
  }
  return result;
}

function downsample(data: ChartDatum[], step: number = 3): ChartDatum[] {
  return data.filter((_, idx) => idx % step === 0);
}

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export function PerformanceChart({ indexId, guestBacktesting }: PerformanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [napkinChartData, setNapkinChartData] = useState<NapkinChartData | null>(null);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('10Y');
  
  const periods = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
  ];

  const { data: backtestData, isLoading, error } = useQuery({
    queryKey: ['backtest', indexId, timeRange],
    queryFn: async () => {
      const response = await authService.apiRequest(
        `${import.meta.env.VITE_API_URL || 'https://generatedassets1.onrender.com/api'}/indexes/backtest/${indexId}?period=${timeRange}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch backtest data');
      }
      return response.json();
    },
    enabled: !guestBacktesting && isValidObjectId(indexId),
  });

  const generateNapkinChart = async () => {
    if (!indexId) {
      toast({
        title: "Error",
        description: "Index ID is required to generate chart",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingChart(true);
    setChartError(null);

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://generatedassets1.onrender.com/api'}/napkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ indexId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate chart');
      }

      const chartData = await response.json();
      setNapkinChartData(chartData);
      
      toast({
        title: "Success!",
        description: "Napkin AI chart generated successfully",
      });
    } catch (error) {
      console.error('Napkin chart generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate chart';
      setChartError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingChart(false);
    }
  };

  const openNapkinEditor = () => {
    if (napkinChartData) {
      // Open Napkin AI editor with the chart data
      const napkinUrl = `https://napkin.ai/create?data=${encodeURIComponent(JSON.stringify(napkinChartData))}`;
      window.open(napkinUrl, '_blank');
    }
  };

  const formatPercent = (value: number) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(2)}%`;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const assetData = payload.find((p: any) => p.dataKey === 'asset');
      const benchmarkData = payload.find((p: any) => p.dataKey === 'benchmark');
      return (
        <div className="p-3 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg shadow-lg border border-gray-700">
          <p className="font-bold text-base mb-2">{label}</p>
          {assetData && <p style={{ color: '#8b5cf6' }}>Asset: {formatPercent(assetData.value)}</p>}
          {benchmarkData && <p style={{ color: '#60a5fa' }}>S&P 500: {formatPercent(benchmarkData.value)}</p>}
        </div>
      );
    }
    return null;
  };

  // If guestBacktesting is provided, use it directly
  if (guestBacktesting) {
    // Extract chart data and stats from guestBacktesting
    const chartData = guestBacktesting.chartData || [];
    // Map portfolioValue to asset for compatibility
    const formattedChartData = chartData.map((d: any) => ({
      ...d,
      date: typeof d.date === 'string' ? d.date.split('T')[0] : d.date,
      asset: d.asset ?? d.portfolioValue // Ensure 'asset' field exists for chart
    }));
    // Defensive extraction for totalReturn and maxDrawdown
    let totalReturn = 0;
    let maxDrawdown = 0;
    if (guestBacktesting.performance) {
      // Try both '1Y' and '1y' keys for compatibility
      const perf = guestBacktesting.performance;
      const tr = perf['1Y']?.portfolioReturn ?? perf['1y']?.portfolioReturn ?? perf['1Y'] ?? perf['1y'];
      const md = perf['1Y']?.maxDrawdown ?? perf['1y']?.maxDrawdown ?? perf.maxDrawdown;
      totalReturn = typeof tr === 'number' && !isNaN(tr) ? tr : 0;
      maxDrawdown = typeof md === 'number' && !isNaN(md) ? md : 0;
    }
    // Smooth but do not downsample for better visibility
    const smoothedData = movingAverage(formattedChartData, 7);
    const displayData = smoothedData;
    return (
      <Card className="glass-card hover-lift">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gradient">Backtest Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6 text-center">
            <div>
              <p className="text-sm text-gray-400">Total returns</p>
              <p className="text-3xl font-bold text-green-400">{totalReturn.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Max drawdown</p>
              <p className="text-3xl font-bold text-red-400">{maxDrawdown.toFixed(2)}%</p>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#6b7280' }}
                  tickLine={{ stroke: '#4b5563' }}
                  axisLine={{ stroke: '#4b5563' }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  stroke="#9ca3af" 
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: '#6b7280' }}
                  tickLine={{ stroke: '#4b5563' }}
                  axisLine={{ stroke: '#4b5563' }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="asset"
                  name="Asset"
                  stroke="#a259ff"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gradient">Backtest Performance</CardTitle>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-sm transition-all duration-200 ${
                  timeRange === range.value 
                    ? 'gradient-primary text-white shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
           <div className="h-96 flex items-center justify-center text-red-500">
            Error: {(error as Error).message}
          </div>
        ) : backtestData ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
              <div>
                <p className="text-sm text-gray-400">Total returns</p>
                <p className="text-3xl font-bold text-green-400">{formatPercent(backtestData.totalReturn)}</p>
                <p className="text-sm text-gray-500">{formatPercent(backtestData.sp500TotalReturn)} S&P</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Max drawdown</p>
                <p className="text-3xl font-bold text-red-400">{formatPercent(backtestData.maxDrawdown)}</p>
                <p className="text-sm text-gray-500">{formatPercent(backtestData.sp500MaxDrawdown)} S&P</p>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const smoothedData = movingAverage(backtestData.chartData, 7);
                  const displayData = downsample(smoothedData, 3);
                  return (
                    <LineChart data={displayData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        tick={{ fill: '#6b7280' }}
                        tickLine={{ stroke: '#4b5563' }}
                        axisLine={{ stroke: '#4b5563' }}
                      />
                      <YAxis 
                        stroke="#9ca3af" 
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fill: '#6b7280' }}
                        tickLine={{ stroke: '#4b5563' }}
                        axisLine={{ stroke: '#4b5563' }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a259ff', strokeDasharray: '3 3' }}/>
                      <Line
                        type="monotone"
                        dataKey="asset"
                        name="Asset"
                        stroke="#a259ff"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />
                    </LineChart>
                  );
                })()}
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}
