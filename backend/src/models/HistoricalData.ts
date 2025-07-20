import mongoose from "mongoose";

const HistoricalDataSchema = new mongoose.Schema({
  indexId: { type: mongoose.Schema.Types.ObjectId, ref: 'Index', required: true },
  date: { type: Date, required: true },
  value: { type: Number, required: true },
  sp500Value: { type: Number, required: true },
  nasdaqValue: { type: Number, required: true },
});

export const HistoricalDataModel = mongoose.model("HistoricalData", HistoricalDataSchema); 