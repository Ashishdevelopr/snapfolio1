import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '@/shared/schema';
import { Key } from 'react';

interface StockTableProps {
  stocks: Stock[];
}

export function StockTable({ stocks }: StockTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A';
    
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getSectorColor = (sector?: string) => {
    if (!sector) return 'bg-gray-100 text-gray-700';
    
    const sectorColors: Record<string, string> = {
      'Technology': 'bg-blue-100 text-blue-700',
      'Healthcare': 'bg-green-100 text-green-700',
      'Financial': 'bg-yellow-100 text-yellow-700',
      'Energy': 'bg-orange-100 text-orange-700',
      'Consumer': 'bg-purple-100 text-purple-700',
      'Industrial': 'bg-gray-100 text-gray-700',
      'Materials': 'bg-brown-100 text-brown-700',
      'Utilities': 'bg-cyan-100 text-cyan-700',
      'Real Estate': 'bg-pink-100 text-pink-700',
      'Communication': 'bg-indigo-100 text-indigo-700',
    };
    
    const matchingKey = Object.keys(sectorColors).find(key => 
      sector.toLowerCase().includes(key.toLowerCase())
    );
    
    return sectorColors[matchingKey || ''] || 'bg-gray-100 text-gray-700';
  };

  const getRelevanceColor = (relevance: string) => {
    const relevanceColors: Record<string, string> = {
      'High': 'bg-green-100 text-green-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'Low': 'bg-gray-100 text-gray-700',
    };
    return relevanceColors[relevance] || 'bg-gray-100 text-gray-700';
  };

  // Generate relevance and reason based on stock data
  const getStockAnalysis = (stock: Stock) => {
    const relevance = stock.marketCap && stock.marketCap > 1e11 ? 'High' : 
                     stock.marketCap && stock.marketCap > 1e9 ? 'Medium' : 'Low';
    
    let reason = '';
    if (stock.sector) {
      if (stock.sector.toLowerCase().includes('technology')) {
        reason = 'Major tech innovator with strong market position and growth potential.';
      } else if (stock.sector.toLowerCase().includes('healthcare')) {
        reason = 'Healthcare leader with innovative produc  ts and stable revenue streams.';
      } else if (stock.sector.toLowerCase().includes('financial')) {
        reason = 'Financial services leader with strong balance sheet and market presence.';
      } else if (stock.sector.toLowerCase().includes('energy')) {
        reason = 'Energy sector leader with diversified operations and stable cash flows.';
      } else if (stock.sector.toLowerCase().includes('consumer')) {
        reason = 'Consumer goods leader with strong brand recognition and market share.';
      } else {
        reason = `${stock.sector} sector leader with established market position.`;
      }
    } else {
      reason = 'Established company with strong fundamentals and market presence.';
    }

    return { relevance, reason };
  };

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="text-gray-900 dark:text-gray-100">Assets</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100">Market Cap</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100">Relevance</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100">Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => {
            const { relevance, reason } = getStockAnalysis(stock);
            
            return (
              <TableRow key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {/* Company Logo */}
                    <img
                      src={`https://logo.clearbit.com/${stock.symbol ? stock.symbol.toLowerCase() + '.com' : 'placeholder.com'}`}
                      alt={stock.symbol + ' logo'}
                      className="w-8 h-8 rounded bg-white border border-gray-200 dark:border-gray-700 object-contain"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/fallback-logo.png'; }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{stock.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {formatMarketCap(stock.marketCap)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={getRelevanceColor(relevance)}
                  >
                    {relevance}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {reason}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {stocks.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No stocks found in this index.
        </div>
      )}
    </div>
  );
}
