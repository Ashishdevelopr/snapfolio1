import { 
  type User, 
  type InsertUser,
  type Index,
  type InsertIndex,
  type Stock,
  type InsertStock,
  type HistoricalData,
  type InsertHistoricalData
} from "./shared/schema";
import { IndexModel } from "./models/Index";
import { UserModel } from "./models/User";
import { HistoricalDataModel } from "./models/HistoricalData";
import mongoose from "mongoose";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Index methods
  getIndex(id: string): Promise<Index | undefined>;
  createIndex(index: InsertIndex): Promise<Index>;
  updateIndex(id: string, updates: Partial<Index>): Promise<Index | undefined>;
  getAllIndexes(userId?: string): Promise<Index[]>;
  getTrendingIndexes(): Promise<Index[]>;
  
  // Stock methods
  addStockToIndex(indexId: string, stock: InsertStock): Promise<Stock>;
  getStocksByIndexId(indexId: string): Promise<Stock[]>;
  updateStock(id: string, updates: Partial<Stock>): Promise<Stock | undefined>;
  
  // Historical data methods
  addHistoricalData(data: InsertHistoricalData): Promise<HistoricalData>;
  getHistoricalData(indexId: string, days?: number): Promise<HistoricalData[]>;
  
  // Portfolio methods
  getPortfolioSummary(userId: string): Promise<{
    totalValue: number;
    totalChange1d: number;
    totalChangePercent1d: number;
    activeIndexes: number;
    totalStocks: number;
    avgPerformance: number;
  }>;
  
  // Global statistics methods
  getGlobalStats(): Promise<{
    totalIndexes: number;
    totalUsers: number;
    totalStocks: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private indexes: Map<string, Index>;
  private stocks: Map<string, Stock>;
  private historicalData: Map<string, HistoricalData>;
  private currentUserId: number;
  private currentIndexId: number;
  private currentStockId: number;
  private currentHistoricalId: number;

  constructor() {
    this.users = new Map();
    this.indexes = new Map();
    this.stocks = new Map();
    this.historicalData = new Map();
    this.currentUserId = 1;
    this.currentIndexId = 1;
    this.currentStockId = 1;
    this.currentHistoricalId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = `user-${this.currentUserId++}`;
    const user: User = { 
      _id: id as any, 
      ...insertUser, 
      createdAt: new Date(),
      lastLogin: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getIndex(id: string): Promise<Index | undefined> {
    return this.indexes.get(id);
  }

  async createIndex(index: InsertIndex): Promise<Index> {
    const id = `index-${this.currentIndexId++}`;
    const newIndex: Index = {
      _id: id as any,
      name: index.name,
      prompt: index.prompt,
      description: index.description || undefined,
      userId: index.userId || '',
      createdAt: new Date(),
      isPublic: index.isPublic || false,
      totalValue: index.totalValue || 0,
      performance1d: index.performance1d || 0,
      performance7d: index.performance7d || 0,
      performance30d: index.performance30d || 0,
      performance1y: index.performance1y || 0,
      benchmarkSp500: index.benchmarkSp500 || 0,
      benchmarkNasdaq: index.benchmarkNasdaq || 0,
    };
    this.indexes.set(id, newIndex);
    return newIndex;
  }

  async updateIndex(id: string, updates: Partial<Index>): Promise<Index | undefined> {
    const existing = this.indexes.get(id);
    if (!existing) return undefined;
    
    const updated: Index = { ...existing, ...updates };
    this.indexes.set(id, updated);
    return updated;
  }

  async getAllIndexes(userId?: string): Promise<Index[]> {
    const allIndexes = Array.from(this.indexes.values());
    if (userId) {
      return allIndexes.filter(index => index.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return allIndexes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrendingIndexes(): Promise<Index[]> {
    return Array.from(this.indexes.values())
      .filter(index => index.isPublic)
      .sort((a, b) => b.performance7d - a.performance7d)
      .slice(0, 10);
  }

  async addStockToIndex(indexId: string, stock: InsertStock): Promise<Stock> {
    const id = `stock-${this.currentStockId++}`;
    const newStock: Stock = {
      _id: id as any,
      indexId: indexId,
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      sector: stock.sector || undefined,
      marketCap: stock.marketCap || undefined,
      weight: stock.weight || 1,
      change1d: stock.change1d || 0,
      changePercent1d: stock.changePercent1d || 0,
    };
    this.stocks.set(id, newStock);
    return newStock;
  }

  async getStocksByIndexId(indexId: string): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .filter(stock => stock.indexId === indexId);
  }

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock | undefined> {
    const existing = this.stocks.get(id);
    if (!existing) return undefined;
    
    const updated: Stock = { ...existing, ...updates };
    this.stocks.set(id, updated);
    return updated;
  }

  async addHistoricalData(insertData: InsertHistoricalData): Promise<HistoricalData> {
    const id = `historical-${this.currentHistoricalId++}`;
    const data: HistoricalData = { 
      _id: id as any,
      ...insertData 
    };
    this.historicalData.set(id, data);
    return data;
  }

  async getHistoricalData(indexId: string, days?: number): Promise<HistoricalData[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (days || 30));
    
    return Array.from(this.historicalData.values())
      .filter(data => 
        data.indexId === indexId && 
        new Date(data.date) >= cutoffDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getPortfolioSummary(userId: string): Promise<{
    totalValue: number;
    totalChange1d: number;
    totalChangePercent1d: number;
    activeIndexes: number;
    totalStocks: number;
    avgPerformance: number;
  }> {
    const userIndexes = Array.from(this.indexes.values()).filter(index => index.userId === userId);
    const allStocks = Array.from(this.stocks.values());
    
    const totalValue = userIndexes.reduce((sum, index) => sum + index.totalValue, 0);
    const totalChange1d = userIndexes.reduce((sum, index) => 
      sum + (index.totalValue * index.performance1d / 100), 0
    );
    const totalChangePercent1d = totalValue > 0 ? (totalChange1d / totalValue) * 100 : 0;
    const avgPerformance = userIndexes.length > 0 ? 
      userIndexes.reduce((sum, index) => sum + index.performance1d, 0) / userIndexes.length : 0;

    return {
      totalValue,
      totalChange1d,
      totalChangePercent1d,
      activeIndexes: userIndexes.length,
      totalStocks: allStocks.length,
      avgPerformance,
    };
  }

  async getGlobalStats(): Promise<{
    totalIndexes: number;
    totalUsers: number;
    totalStocks: number;
  }> {
    return {
      totalIndexes: this.indexes.size,
      totalUsers: this.users.size,
      totalStocks: this.stocks.size,
    };
  }
}

export const storage = new MemStorage();

export const storageMongoose = {
  async createIndex(data: InsertIndex & { userId?: string }) {
    const index = new IndexModel({ ...data, stocks: [] });
    await index.save();
    return index.toObject();
  },
  async getIndex(id: string | number) {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    return IndexModel.findById(id).lean();
  },
  async getAllIndexes(userId?: string) {
    const query = userId ? { userId } : {};
    return IndexModel.find(query).sort({ createdAt: -1 }).lean();
  },
  async getTrendingIndexes() {
    return IndexModel.find({ isPublic: true })
      .sort({ performance7d: -1 })
      .limit(10)
      .lean();
  },
  async addStockToIndex(indexId: string | mongoose.Types.ObjectId, stock: InsertStock) {
    const index = await IndexModel.findById(indexId);
    if (!index) throw new Error("Index not found");
    index.stocks.push(stock);
    await index.save();
    return stock;
  },
  async getStocksByIndexId(indexId: string | mongoose.Types.ObjectId) {
    const index = await IndexModel.findById(indexId).lean();
    return index ? index.stocks : [];
  },
  async updateIndex(id: string | mongoose.Types.ObjectId, updates: any) {
    return IndexModel.findByIdAndUpdate(id, updates, { new: true }).lean();
  },
  async addHistoricalData(data: InsertHistoricalData) {
    const doc = new HistoricalDataModel({
      ...data,
      indexId: data.indexId,
    });
    await doc.save();
    return doc.toObject();
  },
  async getHistoricalData(indexId: string | mongoose.Types.ObjectId, days?: number) {
    const query: any = { indexId };
    let cursor = HistoricalDataModel.find(query).sort({ date: 1 });
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      cursor = cursor.where('date').gte(since.getTime());
    }
    return cursor.lean();
  },
  async getGlobalStats() {
    const [totalIndexes, totalUsers, totalStocks] = await Promise.all([
      IndexModel.countDocuments(),
      UserModel.countDocuments(),
      IndexModel.aggregate([
        { $unwind: '$stocks' },
        { $count: 'totalStocks' }
      ]).then(result => result[0]?.totalStocks || 0)
    ]);
    
    return {
      totalIndexes,
      totalUsers,
      totalStocks,
    };
  },
};
