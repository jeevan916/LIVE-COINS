export const calculateSMA = (data: number[], period: number) => {
  return data.map((_, i, arr) => {
    if (i < period - 1) return null;
    const sum = arr.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr, 0);
    return sum / period;
  });
};

export const calculateRSI = (data: number[], period: number = 14) => {
  let gains = 0;
  let losses = 0;
  const rsi = new Array(data.length).fill(null);

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;

    if (i >= period) {
      if (i === period) {
        gains /= period;
        losses /= period;
      } else {
        gains = (gains * (period - 1) + (change > 0 ? change : 0)) / period;
        losses = (losses * (period - 1) + (change < 0 ? -change : 0)) / period;
      }
      const rs = gains / (losses === 0 ? 1 : losses);
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }
  return rsi;
};

export const calculateEMA = (data: number[], period: number) => {
  const k = 2 / (period + 1);
  let ema = data[0];
  return data.map((val) => {
    ema = val * k + ema * (1 - k);
    return ema;
  });
};

export const calculateMACD = (data: number[], fast: number = 12, slow: number = 26, signal: number = 9) => {
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);
  const macd = fastEMA.map((val, i) => val - slowEMA[i]);
  const signalLine = calculateEMA(macd, signal);
  return { macd, signalLine };
};
