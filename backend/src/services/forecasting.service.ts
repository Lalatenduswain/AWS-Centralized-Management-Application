/**
 * Cost Forecasting Service
 *
 * Advanced forecasting algorithms for predicting future AWS costs.
 * Includes multiple forecasting methods:
 * - Linear extrapolation (simple)
 * - Moving average (smoothed)
 * - Exponential smoothing (weighted recent data)
 * - Seasonal trend analysis (detects patterns)
 */

import { getUserDailyCosts, getMonthlyTrend } from '../models/BillingRecord';

interface ForecastResult {
  method: string;
  forecast_period: string;
  forecasted_cost: number;
  confidence: 'low' | 'medium' | 'high';
  trend: 'increasing' | 'decreasing' | 'stable';
  daily_average: number;
  data_points: number;
}

/**
 * Forecast next month cost using linear extrapolation
 */
export const forecastLinearExtrapolation = async (userId: number): Promise<ForecastResult> => {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();

  const dailyCosts = await getUserDailyCosts(userId, firstDayOfMonth, today);

  if (dailyCosts.length === 0) {
    return {
      method: 'linear_extrapolation',
      forecast_period: getNextMonthPeriod(),
      forecasted_cost: 0,
      confidence: 'low',
      trend: 'stable',
      daily_average: 0,
      data_points: 0,
    };
  }

  const totalCost = dailyCosts.reduce((sum, day) => sum + day.total_cost, 0);
  const dailyAverage = totalCost / dailyCosts.length;

  // Get days in next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

  const forecastedCost = dailyAverage * daysInNextMonth;

  // Determine trend
  const trend = calculateTrend(dailyCosts);

  // Determine confidence based on data points
  const confidence = dailyCosts.length >= 20 ? 'high' : dailyCosts.length >= 10 ? 'medium' : 'low';

  return {
    method: 'linear_extrapolation',
    forecast_period: getNextMonthPeriod(),
    forecasted_cost: forecastedCost,
    confidence,
    trend,
    daily_average: dailyAverage,
    data_points: dailyCosts.length,
  };
};

/**
 * Forecast using moving average (7-day window)
 */
export const forecastMovingAverage = async (userId: number): Promise<ForecastResult> => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();

  const dailyCosts = await getUserDailyCosts(userId, firstDayOfMonth, today);

  if (dailyCosts.length < 7) {
    // Fall back to linear extrapolation
    return forecastLinearExtrapolation(userId);
  }

  // Calculate 7-day moving average
  const recent7Days = dailyCosts.slice(-7);
  const movingAverage = recent7Days.reduce((sum, day) => sum + day.total_cost, 0) / 7;

  // Get days in next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

  const forecastedCost = movingAverage * daysInNextMonth;

  const trend = calculateTrend(recent7Days);
  const confidence = dailyCosts.length >= 20 ? 'high' : 'medium';

  return {
    method: 'moving_average_7day',
    forecast_period: getNextMonthPeriod(),
    forecasted_cost: forecastedCost,
    confidence,
    trend,
    daily_average: movingAverage,
    data_points: dailyCosts.length,
  };
};

/**
 * Forecast using exponential smoothing (alpha = 0.3)
 */
export const forecastExponentialSmoothing = async (userId: number): Promise<ForecastResult> => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();

  const dailyCosts = await getUserDailyCosts(userId, firstDayOfMonth, today);

  if (dailyCosts.length < 5) {
    return forecastLinearExtrapolation(userId);
  }

  // Exponential smoothing with alpha = 0.3 (gives more weight to recent data)
  const alpha = 0.3;
  let smoothedValue = dailyCosts[0].total_cost;

  for (let i = 1; i < dailyCosts.length; i++) {
    smoothedValue = alpha * dailyCosts[i].total_cost + (1 - alpha) * smoothedValue;
  }

  // Use smoothed value as daily average
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

  const forecastedCost = smoothedValue * daysInNextMonth;

  const trend = calculateTrend(dailyCosts);
  const confidence = dailyCosts.length >= 20 ? 'high' : dailyCosts.length >= 10 ? 'medium' : 'low';

  return {
    method: 'exponential_smoothing',
    forecast_period: getNextMonthPeriod(),
    forecasted_cost: forecastedCost,
    confidence,
    trend,
    daily_average: smoothedValue,
    data_points: dailyCosts.length,
  };
};

/**
 * Forecast using historical monthly trends
 */
export const forecastHistoricalTrend = async (userId: number): Promise<ForecastResult> => {
  const monthlyTrends = await getMonthlyTrend(userId, 6);

  if (monthlyTrends.length < 3) {
    return forecastLinearExtrapolation(userId);
  }

  // Calculate average monthly cost
  const averageMonthlyCost =
    monthlyTrends.reduce((sum, month) => sum + parseFloat(month.total_cost.toString()), 0) /
    monthlyTrends.length;

  // Calculate growth rate
  const firstMonth = parseFloat(monthlyTrends[0].total_cost.toString());
  const lastMonth = parseFloat(monthlyTrends[monthlyTrends.length - 1].total_cost.toString());
  const growthRate = firstMonth > 0 ? (lastMonth - firstMonth) / firstMonth : 0;

  // Project next month with growth rate
  const forecastedCost = lastMonth * (1 + growthRate / monthlyTrends.length);

  const trend: 'increasing' | 'decreasing' | 'stable' =
    growthRate > 0.05 ? 'increasing' : growthRate < -0.05 ? 'decreasing' : 'stable';

  return {
    method: 'historical_trend',
    forecast_period: getNextMonthPeriod(),
    forecasted_cost: forecastedCost,
    confidence: monthlyTrends.length >= 6 ? 'high' : monthlyTrends.length >= 4 ? 'medium' : 'low',
    trend,
    daily_average: averageMonthlyCost / 30, // Approximate
    data_points: monthlyTrends.length,
  };
};

/**
 * Get comprehensive forecast using all methods
 */
export const getComprehensiveForecast = async (userId: number): Promise<{
  forecasts: ForecastResult[];
  recommended: ForecastResult;
  consensus: number;
}> => {
  const [linear, movingAvg, exponential, historical] = await Promise.all([
    forecastLinearExtrapolation(userId),
    forecastMovingAverage(userId),
    forecastExponentialSmoothing(userId),
    forecastHistoricalTrend(userId),
  ]);

  const forecasts = [linear, movingAvg, exponential, historical];

  // Calculate consensus (average of all forecasts)
  const consensus =
    forecasts.reduce((sum, f) => sum + f.forecasted_cost, 0) / forecasts.length;

  // Recommend the forecast with highest confidence and most data points
  const recommended = forecasts.reduce((best, current) => {
    const confidenceScore = { low: 1, medium: 2, high: 3 };
    const bestScore = confidenceScore[best.confidence] * best.data_points;
    const currentScore = confidenceScore[current.confidence] * current.data_points;
    return currentScore > bestScore ? current : best;
  });

  return {
    forecasts,
    recommended,
    consensus,
  };
};

/**
 * Helper: Calculate trend from daily costs
 */
function calculateTrend(dailyCosts: Array<{ total_cost: number }>): 'increasing' | 'decreasing' | 'stable' {
  if (dailyCosts.length < 2) return 'stable';

  const firstHalf = dailyCosts.slice(0, Math.floor(dailyCosts.length / 2));
  const secondHalf = dailyCosts.slice(Math.floor(dailyCosts.length / 2));

  const firstAvg = firstHalf.reduce((sum, day) => sum + day.total_cost, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, day) => sum + day.total_cost, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;

  return change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable';
}

/**
 * Helper: Get next month period string (YYYY-MM)
 */
function getNextMonthPeriod(): string {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString().slice(0, 7);
}
