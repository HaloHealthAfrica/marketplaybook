/**
 * Twelve Data API provider - primary for price, candles, ATR, VWAP.
 * https://twelvedata.com/
 */
const axios = require('axios');

const BASE_URL = 'https://api.twelvedata.com';

class TwelveDataProvider {
  constructor() {
    this.apiKey = process.env.TWELVEDATA_API_KEY;
    this.baseURL = BASE_URL;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async getSnapshot(symbol) {
    if (!this.isConfigured()) return null;
    try {
      const { data } = await axios.get(`${this.baseURL}/quote`, {
        params: {
          symbol,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });
      if (!data || data.status === 'error') return null;
      return {
        symbol: data.symbol,
        price: parseFloat(data.close) || parseFloat(data.price),
        volume: parseInt(data.volume, 10) || 0,
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        close: parseFloat(data.close),
        timestamp: data.datetime || new Date().toISOString(),
      };
    } catch (err) {
      console.error('[TwelveData] getSnapshot error:', err.message);
      return null;
    }
  }

  async getHistoricalCandles(symbol, interval = '5min', options = {}) {
    if (!this.isConfigured()) return [];
    try {
      const { size = 100, start, end } = options;
      const params = {
        symbol,
        interval,
        apikey: this.apiKey,
        outputsize: Math.min(size, 5000),
      };
      if (start) params.start = start;
      if (end) params.end = end;

      const { data } = await axios.get(`${this.baseURL}/time_series`, {
        params,
        timeout: 15000,
      });

      if (!data?.values || !Array.isArray(data.values)) return [];

      return data.values.map((v) => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume, 10) || 0,
      })).reverse();
    } catch (err) {
      console.error('[TwelveData] getHistoricalCandles error:', err.message);
      return [];
    }
  }
}

module.exports = new TwelveDataProvider();
