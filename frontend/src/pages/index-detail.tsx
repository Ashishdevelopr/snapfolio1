import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockTable } from '@/components/StockTable';
import { PerformanceChart } from '@/components/PerformanceChart';
import type { Stock } from '@/shared/schema';
import { 
  ArrowLeft, 
  Share, 
  Edit,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Globe,
  Lock
} from 'lucide-react';
import { Link } from 'wouter';
import { authService } from '@/lib/auth';

interface IndexData {
  _id: string;
  id?: number;
  name: string;
  description?: string;
  prompt?: string;
  isPublic: boolean;
  totalValue: number;
  performance1d: number;
  performance1y?: number;
  benchmarkSp500?: number;
  benchmarkNasdaq?: number;
  createdAt: string | Date;
  stocks: Stock[];
  aiAnalysis?: {
    investmentThesis: string;
    riskProfile: string;
    sectorBreakdown: string;
    keyStrengths: string[];
    potentialRisks: string[];
    expectedPerformance: string;
  };
}

export default function IndexDetail() {
  const [match, params] = useRoute('/index/:id');
  const indexId = params?.id || null;

  const { data: indexData, isLoading, error } = useQuery<IndexData>({
    queryKey: ['index', indexId],
    queryFn: async () => {
      const response = await authService.apiRequest(`https://generatedassets1.onrender.com/api/index/${indexId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch index');
      }
      return response.json();
    },
    enabled: !!indexId,
  });

  if (!match || !indexId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Index</h1>
          <Link href="/">
            <Button>Go Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !indexData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Index Not Found</h1>
          <p className="text-gray-400 mb-4">The requested index could not be found.</p>
          <Link href="/">
            <Button>Go Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(typeof date === 'string' ? new Date(date) : date);
  };

  const isPositive = indexData.performance1d >= 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/90 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <div className="flex items-center space-x-2 p-2 flex-grow">
                        <a href="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="w-12 h-12" />
            <div className="text-white text-2xl font-bold">Snapfolio</div></a>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-white hover:text-gray-300 transition-colors">Dashboard</Link>
            <Link href="/indexes" className="text-white hover:text-gray-300 transition-colors">My Indexes</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Index Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(indexData.totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">1D Performance</span>
              </div>
              <div className={`text-2xl font-bold ${isPositive ? 'performance-positive' : 'performance-negative'}`}>
                {isPositive ? '+' : ''}{indexData.performance1d?.toFixed(2) || '0.00'}%
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">vs S&P 500</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                +{((indexData.performance1d || 0) - 0.8).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">vs NASDAQ</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                +{((indexData.performance1d || 0) + 0.3).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Index Description */}
        {indexData.description && (
          <Card className="glass-card hover-lift mb-8">
            <CardHeader>
              <CardTitle className="text-gradient">Investment Thesis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{indexData.description}</p>
              <div className="mt-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  Generated from: "{indexData.prompt}"
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Chart and Napkin AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left side: Performance metrics */}
          <div className="lg:col-span-2">
            <PerformanceChart 
              indexId={indexData._id}
            />
          </div>

          {/* Right side: Napkin AI Chart */}
          <div className="space-y-6">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gradient">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {((indexData.performance1y || indexData.performance1d || 0) - 8.9).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Return</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {0.85}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Stability</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(indexData.performance1y || indexData.performance1d || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gradient">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Stocks</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{indexData.stocks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Market Cap</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {indexData.stocks && indexData.stocks.length > 0 
                        ? `$${((indexData.stocks.reduce((sum, stock) => sum + (stock.marketCap || 0), 0) / indexData.stocks.length) / 1e9).toFixed(1)}B`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Top Sector</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {indexData.stocks && indexData.stocks.length > 0 
                        ? (() => {
                            const sectors = indexData.stocks.map(s => s.sector).filter(Boolean);
                            const sectorCounts = sectors.reduce((acc, sector) => {
                              acc[sector!] = (acc[sector!] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const topSector = Object.entries(sectorCounts).sort(([,a], [,b]) => b - a)[0];
                            return topSector ? topSector[0] : 'N/A';
                          })()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Holdings Table */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle className="text-gradient">Holdings ({indexData.stocks?.length || 0} stocks)</CardTitle>
          </CardHeader>
          <CardContent>
            <StockTable stocks={indexData.stocks || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
