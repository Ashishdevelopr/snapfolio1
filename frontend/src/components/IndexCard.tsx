import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Share, 
  MoreHorizontal,
  Users,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Globe,
  Lock
} from 'lucide-react';
import { Stock } from '@/shared/schema';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

// Flexible interface that can handle both schema Index and MongoDB data
interface FlexibleIndex {
  id?: number;
  _id?: string;
  name: string;
  description?: string | null;
  prompt?: string;
  userId?: number | string | null;
  createdAt: Date | string;
  isPublic?: boolean;
  totalValue?: number;
  performance1d?: number;
  performance7d?: number;
  performance30d?: number;
  performance1y?: number;
  benchmarkSp500?: number;
  benchmarkNasdaq?: number;
  stocks?: Stock[];
  creatorName?: string;
}

interface IndexCardProps {
  index: FlexibleIndex;
  variant?: 'recent' | 'trending';
  onClick?: () => void;
  currentUserId?: string;
  onPublicToggle?: (id: string, newStatus: boolean) => void;
}

export function IndexCard({ index, variant = 'recent', onClick, currentUserId, onPublicToggle }: IndexCardProps) {
  const isPositive = (index.performance1d || 0) >= 0;
  const performance = variant === 'trending' ? (index.performance7d || 0) : (index.performance1d || 0);
  const timeLabel = variant === 'trending' ? '7 days' : 'Today';
  const [isPublic, setIsPublic] = useState(!!index.isPublic);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleTogglePublic = async () => {
    if (!index._id) return;
    setLoading(true);
    try {
      const response = await authService.apiRequest(
        `https://generatedassets1.onrender.com/api/index/${index._id}/toggle-public`,
        {
          method: "PATCH",
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setIsPublic(data.isPublic);
      if (onPublicToggle) onPublicToggle(index._id, data.isPublic);
      toast({
        title: 'Index Visibility Updated',
        description: `Index is now ${data.isPublic ? 'public' : 'private'}.`,
      });
    } catch (error: any) {
      console.error('Toggle error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update index visibility',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'trending') {
    return (
      <Card 
        className="glass-card hover-lift cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                Trending
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{index.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {index.stocks?.length || 0} stocks • Created {formatDate(index.createdAt)}
          </p>
          
          <div className="flex justify-between items-center">
            <span className={`text-lg font-semibold ${isPositive ? 'performance-positive' : 'performance-negative'}`}>
              {isPositive ? '+' : ''}{performance.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{timeLabel}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-lg px-2">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={onClick}>
            {index.name}
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Created by {index.creatorName || (index.userId === currentUserId ? 'You' : 'Unknown')}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDate(index.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1 relative group">
              <BarChart3 className="h-3 w-3" />
              <span className="cursor-help">{index.stocks?.length || 0} stocks</span>
              {index.stocks && index.stocks.length > 0 && (
                <div className="absolute left-0 top-6 p-3 glass-card shadow-lg z-20 w-72 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Holdings ({index.stocks.length} stocks):</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {index.stocks.map((stock, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{stock.symbol}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">({stock.name})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-gray-100">${stock.price}</div>
                          <div className={`text-xs ${(stock.changePercent1d || 0) >= 0 ? 'performance-positive' : 'performance-negative'}`}>
                            {(stock.changePercent1d || 0) >= 0 ? '+' : ''}{(stock.changePercent1d || 0).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {isPublic ? (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center space-x-1">
                <Globe className="h-3 w-3 mr-1" /> Public
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 flex items-center space-x-1">
                <Lock className="h-3 w-3 mr-1" /> Private
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className={`text-lg font-semibold flex items-center ${isPositive ? 'performance-positive' : 'performance-negative'}`}> 
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {isPositive ? '+' : ''}{performance.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{timeLabel}</div>
          {/* Toggle only if user owns the index */}
          {index.userId === currentUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublic}
              disabled={loading}
              className={`flex items-center space-x-1 text-xs px-2 py-1 h-7 ${
                isPublic 
                  ? 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {loading ? (
                <div className="w-3 h-3 border border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full animate-spin" />
              ) : isPublic ? (
                <>
                  <Eye className="h-3 w-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" />
                  <span>Private</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span>Value: {formatCurrency(index.totalValue || 0)}</span>
          </div>
          <span className={`${(index.performance1d || 0) > 0 ? 'performance-positive' : 'performance-negative'}`}>
            vs S&P 500: {(index.performance1d || 0) > 0 ? '+' : ''}{((index.performance1d || 0) - 0.8).toFixed(1)}%
          </span>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
