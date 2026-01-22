/**
 * Export Routes
 *
 * API endpoints for exporting billing data in various formats (CSV, PDF).
 *
 * Endpoints:
 * - GET /api/exports/billing-records/csv       - Export billing records as CSV
 * - GET /api/exports/cost-breakdown/csv        - Export cost breakdown as CSV
 * - GET /api/exports/daily-costs/csv           - Export daily costs as CSV
 * - GET /api/exports/top-drivers/csv           - Export top cost drivers as CSV
 * - GET /api/exports/budgets/csv               - Export budgets as CSV
 * - GET /api/exports/assignments/csv           - Export resource assignments as CSV
 * - GET /api/exports/alerts/csv                - Export alerts history as CSV
 * - GET /api/exports/monthly-report/csv        - Export monthly report as CSV
 * - GET /api/exports/monthly-invoice/pdf       - Generate monthly invoice PDF
 * - GET /api/exports/cost-summary/pdf          - Generate cost summary PDF
 * - GET /api/exports/forecast/comprehensive    - Get comprehensive forecast
 */

import express, { Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import {
  exportBillingRecordsToCSV,
  exportCostBreakdownToCSV,
  exportDailyCostsToCSV,
  exportTopDriversToCSV,
  exportBudgetsToCSV,
  exportResourceAssignmentsToCSV,
  exportAlertsToCSV,
  exportMonthlyReportToCSV,
} from '../services/csv-export.service';
import {
  generateMonthlyInvoicePDF,
  generateCostSummaryPDF,
} from '../services/pdf-export.service';
import {
  getComprehensiveForecast,
  forecastLinearExtrapolation,
  forecastMovingAverage,
  forecastExponentialSmoothing,
  forecastHistoricalTrend,
} from '../services/forecasting.service';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * GET /api/exports/billing-records/csv
 * Export billing records as CSV
 */
router.get('/billing-records/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportBillingRecordsToCSV(userId, startDate, endDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=billing-records-${userId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/cost-breakdown/csv
 * Export cost breakdown by service as CSV
 */
router.get('/cost-breakdown/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportCostBreakdownToCSV(userId, period);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cost-breakdown-${period}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/daily-costs/csv
 * Export daily costs as CSV
 */
router.get('/daily-costs/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(userId) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId, startDate, and endDate are required',
      });
    }

    const csv = await exportDailyCostsToCSV(userId, startDate, endDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=daily-costs-${userId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/top-drivers/csv
 * Export top cost drivers as CSV
 */
router.get('/top-drivers/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);
    const limit = parseInt(req.query.limit as string) || 50;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportTopDriversToCSV(userId, period, limit);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=top-drivers-${period}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/budgets/csv
 * Export budgets as CSV
 */
router.get('/budgets/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportBudgetsToCSV(userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=budgets-${userId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/assignments/csv
 * Export resource assignments as CSV
 */
router.get('/assignments/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportResourceAssignmentsToCSV(userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=assignments-${userId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/alerts/csv
 * Export alerts history as CSV
 */
router.get('/alerts/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const limit = parseInt(req.query.limit as string) || 100;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportAlertsToCSV(userId, limit);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=alerts-${userId}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/monthly-report/csv
 * Export comprehensive monthly report as CSV
 */
router.get('/monthly-report/csv', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const csv = await exportMonthlyReportToCSV(userId, period);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${period}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/monthly-invoice/pdf
 * Generate monthly invoice PDF
 */
router.get('/monthly-invoice/pdf', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const pdfBuffer = await generateMonthlyInvoicePDF(userId, period);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${period}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/cost-summary/pdf
 * Generate cost summary PDF
 */
router.get('/cost-summary/pdf', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(userId) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId, startDate, and endDate are required',
      });
    }

    const pdfBuffer = await generateCostSummaryPDF(userId, startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cost-summary.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/forecast/comprehensive
 * Get comprehensive forecast using all methods
 */
router.get('/forecast/comprehensive', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    const forecast = await getComprehensiveForecast(userId);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/exports/forecast/:method
 * Get forecast using specific method
 */
router.get('/forecast/:method', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const method = req.params.method;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId is required',
      });
    }

    let forecast;
    switch (method) {
      case 'linear':
        forecast = await forecastLinearExtrapolation(userId);
        break;
      case 'moving-average':
        forecast = await forecastMovingAverage(userId);
        break;
      case 'exponential':
        forecast = await forecastExponentialSmoothing(userId);
        break;
      case 'historical':
        forecast = await forecastHistoricalTrend(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid forecast method. Use: linear, moving-average, exponential, or historical',
        });
    }

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
