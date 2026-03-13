/**
 * Market data provider interface.
 * All providers must implement getSnapshot and getHistoricalCandles.
 */
module.exports = {
  /**
   * @typedef {Object} Snapshot
   * @property {string} symbol
   * @property {number} price
   * @property {number} [volume]
   * @property {number} [open]
   * @property {number} [high]
   * @property {number} [low]
   * @property {number} [close]
   * @property {string} timestamp
   */

  /**
   * @typedef {Object} Candle
   * @property {string} datetime
   * @property {number} open
   * @property {number} high
   * @property {number} low
   * @property {number} close
   * @property {number} volume
   */

  /**
   * Get current snapshot for a symbol
   * @param {string} symbol
   * @returns {Promise<Snapshot|null>}
   */
  async getSnapshot(symbol) {
    throw new Error('getSnapshot not implemented');
  },

  /**
   * Get historical candles
   * @param {string} symbol
   * @param {string} interval - e.g. '5min', '1h'
   * @param {Object} [options] - start, end, size
   * @returns {Promise<Candle[]>}
   */
  async getHistoricalCandles(symbol, interval, options = {}) {
    throw new Error('getHistoricalCandles not implemented');
  },
};
