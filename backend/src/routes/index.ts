import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { IndexModel as Index } from '../models/Index';
import { generateBacktestingData, getDetailedBacktest } from '../services/backtesting';

const router = express.Router();

// Generate detailed backtest data for an index
router.get('/backtest/:indexId', authenticateToken, async (req, res) => {
  try {
    const { indexId } = req.params;
    const { period = '10Y' } = req.query;

    const index = await Index.findById(indexId);

    if (!index) {
      return res.status(404).json({ message: 'Index not found' });
    }

    // This is mock data generation. In a real scenario, you'd fetch actual historical data.
    const backtestData = generateBacktestingData(index.stocks as any, index.name || "");
    
    const detailedBacktest = getDetailedBacktest(backtestData.historical, period as any);

    res.json(detailedBacktest);
  } catch (error) {
    console.error('Backtest error:', error);
    res.status(500).json({ message: 'Failed to generate backtest data' });
  }
});

export default router; 