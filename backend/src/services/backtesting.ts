import { StockData } from './stockData';

interface BacktestResult {
  period: string;
  portfolioReturn: number;
  sp500Return: number;
  nasdaqReturn: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

interface HistoricalPoint {
  date: Date;
  portfolioValue: number;
  sp500Value: number;
  nasdaqValue: number;
}

export function generateBacktestingData(stocks: StockData[], indexName: string): {
  historical: HistoricalPoint[];
  performance: {
    '1M': BacktestResult;
    '3M': BacktestResult;
    '6M': BacktestResult;
    '1Y': BacktestResult;
    '3Y': BacktestResult;
  };
} {
  const periods = ['1M', '3M', '6M', '1Y', '3Y'] as const;
  const performance: Record<string, BacktestResult> = {};
  
  // Generate realistic historical data points
  const historical: HistoricalPoint[] = [];
  const today = new Date();
  const threeYearsAgo = new Date(today);
  threeYearsAgo.setFullYear(today.getFullYear() - 3);
  
  // Generate daily data points for the last 3 years
  for (let d = new Date(threeYearsAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const daysSinceStart = Math.floor((d.getTime() - threeYearsAgo.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simulate portfolio performance based on sector composition
    const portfolioGrowth = calculatePortfolioGrowth(stocks, daysSinceStart, indexName);
    const sp500Growth = calculateSP500Growth(daysSinceStart);
    const nasdaqGrowth = calculateNasdaqGrowth(daysSinceStart);
    
    historical.push({
      date: new Date(d),
      portfolioValue: 10000 * (1 + portfolioGrowth / 100),
      sp500Value: 10000 * (1 + sp500Growth / 100),
      nasdaqValue: 10000 * (1 + nasdaqGrowth / 100)
    });
  }
  
  // Calculate performance metrics for each period
  for (const period of periods) {
    const days = getPeriodDays(period);
    const startIndex = Math.max(0, historical.length - days);
    const periodData = historical.slice(startIndex);
    
    if (periodData.length < 2) continue;
    
    const startValue = periodData[0];
    const endValue = periodData[periodData.length - 1];
    
    const portfolioReturn = ((endValue.portfolioValue - startValue.portfolioValue) / startValue.portfolioValue) * 100;
    const sp500Return = ((endValue.sp500Value - startValue.sp500Value) / startValue.sp500Value) * 100;
    const nasdaqReturn = ((endValue.nasdaqValue - startValue.nasdaqValue) / startValue.nasdaqValue) * 100;
    
    const alpha = portfolioReturn - sp500Return;
    const beta = calculateBeta(periodData);
    const sharpeRatio = calculateSharpeRatio(periodData);
    const maxDrawdown = calculateMaxDrawdown(periodData);
    const volatility = calculateVolatility(periodData);
    
    performance[period] = {
      period,
      portfolioReturn,
      sp500Return,
      nasdaqReturn,
      alpha,
      beta,
      sharpeRatio,
      maxDrawdown,
      volatility
    };
  }
  
  // Ensure all keys are present with defaults if missing
  const emptyResult: BacktestResult = {
    period: '',
    portfolioReturn: 0,
    sp500Return: 0,
    nasdaqReturn: 0,
    alpha: 0,
    beta: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0,
  };

  return {
    historical,
    performance: {
      '1M': performance['1M'] || { ...emptyResult, period: '1M' },
      '3M': performance['3M'] || { ...emptyResult, period: '3M' },
      '6M': performance['6M'] || { ...emptyResult, period: '6M' },
      '1Y': performance['1Y'] || { ...emptyResult, period: '1Y' },
      '3Y': performance['3Y'] || { ...emptyResult, period: '3Y' },
    }
  };
}

function calculatePortfolioGrowth(stocks: StockData[], daysSinceStart: number, indexName: string): number {
  // Base growth rate depending on index theme
  let baseGrowth = 8; // Default 8% annual growth
  let volatility = 15; // Default 15% volatility
  
  if (indexName.toLowerCase().includes('ai') || indexName.toLowerCase().includes('technology')) {
    baseGrowth = 12; // Tech grows faster
    volatility = 25; // But more volatile
  } else if (indexName.toLowerCase().includes('energy') || indexName.toLowerCase().includes('clean')) {
    baseGrowth = 10; // Clean energy growth
    volatility = 30; // High volatility sector
  } else if (indexName.toLowerCase().includes('healthcare')) {
    baseGrowth = 9; // Steady healthcare growth
    volatility = 18; // Moderate volatility
  }
  
  // Calculate sector-weighted performance
  const techWeight = stocks.filter(s => s.sector?.toLowerCase().includes('tech')).length / stocks.length;
  const healthWeight = stocks.filter(s => s.sector?.toLowerCase().includes('health')).length / stocks.length;
  const energyWeight = stocks.filter(s => s.sector?.toLowerCase().includes('energy')).length / stocks.length;
  
  // Adjust growth based on actual sector composition
  baseGrowth += techWeight * 4 + healthWeight * 1 + energyWeight * 2;
  volatility += techWeight * 10 + healthWeight * 3 + energyWeight * 15;
  
  // Convert to daily growth with realistic market cycles
  const annualizedGrowth = baseGrowth / 365;
  const dailyVolatility = volatility / Math.sqrt(365);
  
  // Add market cycle effects (bear/bull markets)
  const cycleEffect = Math.sin((daysSinceStart / 365) * 2 * Math.PI) * 0.1;
  
  // Add random daily fluctuation
  const randomFactor = (Math.random() - 0.5) * dailyVolatility * 2;
  
  return (annualizedGrowth * daysSinceStart) + (cycleEffect * daysSinceStart * 0.1) + (randomFactor * Math.sqrt(daysSinceStart));
}

function calculateSP500Growth(daysSinceStart: number): number {
  // S&P 500 historical average ~10% annual return
  const annualGrowth = 10;
  const dailyGrowth = annualGrowth / 365;
  const volatility = 16; // S&P 500 volatility
  const dailyVolatility = volatility / Math.sqrt(365);
  
  // Market cycles
  const cycleEffect = Math.sin((daysSinceStart / 365) * 2 * Math.PI) * 0.08;
  const randomFactor = (Math.random() - 0.5) * dailyVolatility * 2;
  
  return (dailyGrowth * daysSinceStart) + (cycleEffect * daysSinceStart * 0.08) + (randomFactor * Math.sqrt(daysSinceStart));
}

function calculateNasdaqGrowth(daysSinceStart: number): number {
  // NASDAQ typically outperforms S&P 500 but with higher volatility
  const annualGrowth = 11.5;
  const dailyGrowth = annualGrowth / 365;
  const volatility = 22; // Higher volatility
  const dailyVolatility = volatility / Math.sqrt(365);
  
  const cycleEffect = Math.sin((daysSinceStart / 365) * 2 * Math.PI) * 0.12;
  const randomFactor = (Math.random() - 0.5) * dailyVolatility * 2;
  
  return (dailyGrowth * daysSinceStart) + (cycleEffect * daysSinceStart * 0.1) + (randomFactor * Math.sqrt(daysSinceStart));
}

function getPeriodDays(period: string): number {
  switch (period) {
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case '1Y': return 365;
    case '3Y': return 1095;
    default: return 30;
  }
}

function calculateBeta(data: HistoricalPoint[]): number {
  if (data.length < 2) return 1;
  
  const portfolioReturns = [];
  const marketReturns = [];
  
  for (let i = 1; i < data.length; i++) {
    const portfolioReturn = (data[i].portfolioValue - data[i-1].portfolioValue) / data[i-1].portfolioValue;
    const marketReturn = (data[i].sp500Value - data[i-1].sp500Value) / data[i-1].sp500Value;
    portfolioReturns.push(portfolioReturn);
    marketReturns.push(marketReturn);
  }
  
  // Calculate covariance and variance
  const avgPortfolio = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
  const avgMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    covariance += (portfolioReturns[i] - avgPortfolio) * (marketReturns[i] - avgMarket);
    marketVariance += Math.pow(marketReturns[i] - avgMarket, 2);
  }
  
  covariance /= portfolioReturns.length;
  marketVariance /= marketReturns.length;
  
  return marketVariance === 0 ? 1 : covariance / marketVariance;
}

function calculateSharpeRatio(data: HistoricalPoint[]): number {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    const dailyReturn = (data[i].portfolioValue - data[i-1].portfolioValue) / data[i-1].portfolioValue;
    returns.push(dailyReturn);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Assuming risk-free rate of 2% annually (0.02/365 daily)
  const riskFreeRate = 0.02 / 365;
  
  return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
}

function calculateMaxDrawdown(data: HistoricalPoint[]): number {
  let maxDrawdown = 0;
  let peak = data[0]?.portfolioValue || 10000;
  
  for (const point of data) {
    if (point.portfolioValue > peak) {
      peak = point.portfolioValue;
    }
    
    const drawdown = (peak - point.portfolioValue) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown * 100; // Return as percentage
}

function calculateVolatility(data: HistoricalPoint[]): number {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    const dailyReturn = (data[i].portfolioValue - data[i-1].portfolioValue) / data[i-1].portfolioValue;
    returns.push(dailyReturn);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  
  // Annualized volatility
  return Math.sqrt(variance) * Math.sqrt(365) * 100; // Return as annualized percentage
}

// New function for detailed backtest chart data
export function getDetailedBacktest(
  historicalData: HistoricalPoint[],
  period: '1Y' | '5Y' | '10Y' = '10Y'
): any {
  const periodDaysMap = {
    '1Y': 365,
    '5Y': 365 * 5,
    '10Y': 365 * 10
  };

  const days = periodDaysMap[period];
  const startIndex = Math.max(0, historicalData.length - days);
  const data = historicalData.slice(startIndex);

  if (data.length === 0) {
    return {
      chartData: [],
      totalReturn: 0,
      maxDrawdown: 0,
      sp500TotalReturn: 0,
      sp500MaxDrawdown: 0
    };
  }
  
  const chartData = [];
  let portfolioPeak = data[0].portfolioValue;
  let sp500Peak = data[0].sp500Value;

  for(const point of data) {
    // Calculate returns relative to the start
    const portfolioReturn = (point.portfolioValue / data[0].portfolioValue - 1) * 100;
    const sp500Return = (point.sp500Value / data[0].sp500Value - 1) * 100;

    // Calculate drawdown for portfolio
    if (point.portfolioValue > portfolioPeak) {
      portfolioPeak = point.portfolioValue;
    }
    const portfolioDrawdown = (portfolioPeak - point.portfolioValue) / portfolioPeak * -100;

    chartData.push({
      date: point.date.toISOString().split('T')[0],
      asset: portfolioReturn,
      benchmark: sp500Return,
      drawdown: portfolioDrawdown
    });
  }

  const totalReturn = (data[data.length - 1].portfolioValue / data[0].portfolioValue - 1) * 100;
  const sp500TotalReturn = (data[data.length - 1].sp500Value / data[0].sp500Value - 1) * 100;
  
  const maxDrawdown = calculateMaxDrawdown(data);
  const sp500MaxDrawdown = calculateMaxDrawdown(data.map(d => ({...d, portfolioValue: d.sp500Value})));

  return {
    chartData,
    totalReturn,
    maxDrawdown: -maxDrawdown, // Return as negative percentage
    sp500TotalReturn,
    sp500MaxDrawdown: -sp500MaxDrawdown // Return as negative
  };
}