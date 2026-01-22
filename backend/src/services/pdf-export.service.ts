/**
 * PDF Export Service
 *
 * Generates professional PDF invoices and reports for billing data.
 * Uses PDFKit for PDF generation with custom styling.
 */

import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import { getUserCostByService, getUserCostForPeriod, getTopCostDrivers } from '../models/BillingRecord';
import { getActiveBudgetForUser } from '../models/UserBudget';
import { findUserById } from '../models/User';

/**
 * Generate a monthly invoice PDF
 */
export const generateMonthlyInvoicePDF = async (
  userId: number,
  billingPeriod: string
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch data
      const [user, totalCost, breakdown, budget, topDrivers] = await Promise.all([
        findUserById(userId),
        getUserCostForPeriod(userId, billingPeriod),
        getUserCostByService(userId, billingPeriod),
        getActiveBudgetForUser(userId),
        getTopCostDrivers(userId, billingPeriod, 10),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#2c3e50').text('AWS Cost Invoice', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#7f8c8d').text('AWS Centralized Management', { align: 'center' });
      doc.moveDown(2);

      // Invoice details
      doc.fontSize(10).fillColor('#2c3e50');
      doc.text(`Invoice Period: ${billingPeriod}`, 50, doc.y);
      doc.text(`Invoice Date: ${new Date().toISOString().split('T')[0]}`, 50, doc.y);
      doc.text(`User: ${user.email}`, 50, doc.y);
      doc.moveDown(2);

      // Summary box
      const summaryY = doc.y;
      doc.rect(50, summaryY, 495, 80).fillAndStroke('#f8f9fa', '#dee2e6');

      doc.fontSize(12).fillColor('#2c3e50');
      doc.text('Summary', 70, summaryY + 15);

      doc.fontSize(20).fillColor('#28a745');
      doc.text(`$${totalCost.toFixed(2)} USD`, 70, summaryY + 40);

      if (budget) {
        const monthlyLimit = parseFloat(budget.monthly_limit.toString());
        const percentageUsed = totalCost > 0 ? ((totalCost / monthlyLimit) * 100) : 0;
        const remaining = monthlyLimit - totalCost;

        doc.fontSize(10).fillColor('#6c757d');
        doc.text(`Budget: $${monthlyLimit.toFixed(2)}`, 300, summaryY + 20);
        doc.text(`Used: ${percentageUsed.toFixed(1)}%`, 300, summaryY + 35);
        doc.fillColor(remaining >= 0 ? '#28a745' : '#dc3545');
        doc.text(`Remaining: $${remaining.toFixed(2)}`, 300, summaryY + 50);
      }

      doc.moveDown(3);

      // Cost breakdown table
      const tableTop = doc.y + 20;
      doc.fontSize(14).fillColor('#2c3e50');
      doc.text('Cost Breakdown by Service', 50, tableTop);
      doc.moveDown(1);

      // Table header
      const tableHeaderY = doc.y;
      doc.rect(50, tableHeaderY, 495, 25).fillAndStroke('#f8f9fa', '#dee2e6');

      doc.fontSize(10).fillColor('#495057');
      doc.text('Service', 60, tableHeaderY + 8);
      doc.text('Resource Count', 280, tableHeaderY + 8);
      doc.text('Cost', 420, tableHeaderY + 8);

      let tableY = tableHeaderY + 30;

      // Table rows
      breakdown.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        doc.rect(50, tableY, 495, 20).fillAndStroke(rowColor, '#e9ecef');

        doc.fontSize(9).fillColor('#2c3e50');
        doc.text(item.service_name, 60, tableY + 6, { width: 200 });
        doc.text(item.resource_count.toString(), 280, tableY + 6);
        doc.text(`$${parseFloat(item.total_cost.toString()).toFixed(2)}`, 420, tableY + 6);

        tableY += 20;
      });

      // Total row
      doc.rect(50, tableY, 495, 25).fillAndStroke('#e9ecef', '#dee2e6');
      doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold');
      doc.text('Total', 60, tableY + 8);
      doc.text(`$${totalCost.toFixed(2)}`, 420, tableY + 8);
      doc.font('Helvetica');

      tableY += 30;

      // Top cost drivers section (if space allows)
      if (tableY < 650 && topDrivers.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#2c3e50');
        doc.text('Top Cost Drivers', 50, tableY + 20);
        doc.moveDown(0.5);

        topDrivers.slice(0, 5).forEach((driver, index) => {
          doc.fontSize(9).fillColor('#495057');
          doc.text(
            `${index + 1}. ${driver.service_name} - ${driver.resource_id}: $${parseFloat(driver.total_cost.toString()).toFixed(2)}`,
            60,
            doc.y
          );
        });
      }

      // Footer
      const footerY = 750;
      doc.fontSize(8).fillColor('#7f8c8d');
      doc.text('This is an automated invoice generated by AWS Centralized Management', 50, footerY, {
        align: 'center',
      });
      doc.text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 15, {
        align: 'center',
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a cost summary report PDF
 */
export const generateCostSummaryPDF = async (
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#2c3e50').text('Cost Summary Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#7f8c8d').text('AWS Centralized Management', { align: 'center' });
      doc.moveDown(2);

      // Report details
      doc.fontSize(10).fillColor('#2c3e50');
      doc.text(`Report Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`, 50, doc.y);
      doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 50, doc.y);
      doc.text(`User: ${user.email}`, 50, doc.y);
      doc.moveDown(2);

      // Placeholder for chart or detailed breakdown
      doc.fontSize(12).fillColor('#495057');
      doc.text('This report provides a comprehensive overview of your AWS costs for the selected period.', 50, doc.y, {
        width: 495,
        align: 'justify',
      });

      // Footer
      const footerY = 750;
      doc.fontSize(8).fillColor('#7f8c8d');
      doc.text('AWS Centralized Management - Cost Summary Report', 50, footerY, { align: 'center' });
      doc.text(`Page 1 of 1`, 50, footerY + 15, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
