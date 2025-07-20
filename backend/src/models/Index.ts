import mongoose from "mongoose";

const StockSchema = new mongoose.Schema({
  symbol: String,
  name: String,
  price: Number,
  sector: String,
  marketCap: Number,
  weight: Number,
  change1d: Number,
  changePercent1d: Number,
  indexId: mongoose.Schema.Types.ObjectId,
});

const IndexSchema = new mongoose.Schema({
  prompt: String,
  name: String,
  description: String,
  userId: { type: String, required: true },
  isPublic: Boolean,
  totalValue: Number,
  performance1d: Number,
  performance7d: Number,
  performance30d: Number,
  performance1y: Number,
  benchmarkSp500: Number,
  benchmarkNasdaq: Number,
  aiAnalysis: {
    investmentThesis: String,
    riskProfile: String,
    sectorBreakdown: String,
    keyStrengths: [String],
    potentialRisks: [String],
    expectedPerformance: String,
  },
  createdAt: { type: Date, default: Date.now },
  stocks: [StockSchema],
});

export const IndexModel = mongoose.model("Index", IndexSchema); 