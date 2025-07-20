import { z } from "zod";
import type { ObjectId } from 'mongoose';

// MongoDB User interface (matches the server model)
export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  profilePhoto?: string;
  firebaseUid?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface InsertUser {
  email: string;
  name: string;
  profilePhoto?: string;
  firebaseUid?: string;
}

// Index interface
export interface Index {
  _id: ObjectId;
  prompt: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  isPublic: boolean;
  totalValue: number;
  performance1d: number;
  performance7d: number;
  performance30d: number;
  performance1y: number;
  benchmarkSp500: number;
  benchmarkNasdaq: number;
  aiAnalysis?: {
    investmentThesis: string;
    riskProfile: string;
    sectorBreakdown: string;
    keyStrengths: string[];
    potentialRisks: string[];
    expectedPerformance: string;
  };
  stocks?: Stock[];
}

export interface InsertIndex {
  prompt: string;
  name: string;
  description?: string;
  userId?: string;
  isPublic?: boolean;
  totalValue?: number;
  performance1d?: number;
  performance7d?: number;
  performance30d?: number;
  performance1y?: number;
  benchmarkSp500?: number;
  benchmarkNasdaq?: number;
  aiAnalysis?: {
    investmentThesis: string;
    riskProfile: string;
    sectorBreakdown: string;
    keyStrengths: string[];
    potentialRisks: string[];
    expectedPerformance: string;
  };
}

// Stock interface
export interface Stock {
  _id?: ObjectId;
  indexId: string | ObjectId;
  symbol: string;
  name: string;
  price: number;
  sector?: string;
  marketCap?: number;
  weight: number;
  change1d: number;
  changePercent1d: number;
}

export interface InsertStock {
  indexId: string | ObjectId;
  symbol: string;
  name: string;
  price: number;
  sector?: string;
  marketCap?: number;
  weight?: number;
  change1d?: number;
  changePercent1d?: number;
}

// Historical data interface
export interface HistoricalData {
  _id?: ObjectId;
  indexId: string | ObjectId;
  date: Date;
  value: number;
  sp500Value: number;
  nasdaqValue: number;
}

export interface InsertHistoricalData {
  indexId: string | ObjectId;
  date: Date;
  value: number;
  sp500Value: number;
  nasdaqValue: number;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  profilePhoto: z.string().optional(),
  firebaseUid: z.string().optional(),
});

export const insertIndexSchema = z.object({
  prompt: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().optional(),
  isPublic: z.boolean().default(false),
  totalValue: z.number().default(0),
  performance1d: z.number().default(0),
  performance7d: z.number().default(0),
  performance30d: z.number().default(0),
  performance1y: z.number().default(0),
  benchmarkSp500: z.number().default(0),
  benchmarkNasdaq: z.number().default(0),
});

export const insertStockSchema = z.object({
  indexId: z.union([z.string(), z.any()]), // ObjectId
  symbol: z.string().min(1),
  name: z.string().min(1),
  price: z.number(),
  sector: z.string().optional(),
  marketCap: z.number().optional(),
  weight: z.number().default(1),
  change1d: z.number().default(0),
  changePercent1d: z.number().default(0),
});

export const insertHistoricalDataSchema = z.object({
  indexId: z.union([z.string(), z.any()]), // ObjectId
  date: z.date(),
  value: z.number(),
  sp500Value: z.number(),
  nasdaqValue: z.number(),
});
