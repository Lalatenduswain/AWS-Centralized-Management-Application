/**
 * Email Notification Service
 *
 * Handles sending email notifications using Nodemailer.
 * Supports templating with Handlebars for beautiful HTML emails.
 *
 * Configuration:
 * - EMAIL_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (e.g., 587)
 * - EMAIL_USER: SMTP username/email
 * - EMAIL_PASS: SMTP password or app-specific password
 * - EMAIL_FROM: Sender email address
 */

import nodemailer, { Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailHost || !emailUser || !emailPass) {
      console.warn('Email configuration not found. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      console.log('✓ Email service initialized');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Load email templates from templates directory
   */
  private loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/emails');

    try {
      // Ensure templates directory exists
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
        console.log('Created email templates directory:', templatesDir);
      }

      // Load all .hbs files
      const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));

      for (const file of templateFiles) {
        const templateName = file.replace('.hbs', '');
        const templatePath = path.join(templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateContent));
      }

      console.log(`✓ Loaded ${this.templates.size} email templates`);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  /**
   * Send an email using a template
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      // Get template
      const template = this.templates.get(options.template);
      if (!template) {
        throw new Error(`Email template '${options.template}' not found`);
      }

      // Compile template with context
      const html = template(options.context);

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send budget alert email
   */
  async sendBudgetAlert(
    userEmail: string,
    userName: string,
    budgetData: {
      monthlyLimit: number;
      currentSpending: number;
      percentageUsed: number;
      remainingBudget: number;
      daysLeftInMonth: number;
      currency: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `⚠️ Budget Alert: ${budgetData.percentageUsed.toFixed(0)}% of monthly limit used`,
      template: 'budget-alert',
      context: {
        userName,
        monthlyLimit: this.formatCurrency(budgetData.monthlyLimit, budgetData.currency),
        currentSpending: this.formatCurrency(budgetData.currentSpending, budgetData.currency),
        percentageUsed: budgetData.percentageUsed.toFixed(1),
        remainingBudget: this.formatCurrency(budgetData.remainingBudget, budgetData.currency),
        daysLeftInMonth: budgetData.daysLeftInMonth,
        isOverBudget: budgetData.percentageUsed >= 100,
        isWarning: budgetData.percentageUsed >= 90,
        currentYear: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send over-budget alert email
   */
  async sendOverBudgetAlert(
    userEmail: string,
    userName: string,
    budgetData: {
      monthlyLimit: number;
      currentSpending: number;
      overageAmount: number;
      currency: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `🚨 URGENT: You have exceeded your monthly budget`,
      template: 'over-budget-alert',
      context: {
        userName,
        monthlyLimit: this.formatCurrency(budgetData.monthlyLimit, budgetData.currency),
        currentSpending: this.formatCurrency(budgetData.currentSpending, budgetData.currency),
        overageAmount: this.formatCurrency(budgetData.overageAmount, budgetData.currency),
        currentYear: new Date().getFullYear(),
      },
    });
  }

  /**
   * Send daily cost summary email
   */
  async sendDailyCostSummary(
    userEmail: string,
    userName: string,
    costData: {
      yesterdayCost: number;
      monthToDateCost: number;
      averageDailyCost: number;
      topServices: Array<{ service_name: string; cost: number }>;
      currency: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: `📊 Daily Cost Summary - ${new Date().toLocaleDateString()}`,
      template: 'daily-cost-summary',
      context: {
        userName,
        yesterdayCost: this.formatCurrency(costData.yesterdayCost, costData.currency),
        monthToDateCost: this.formatCurrency(costData.monthToDateCost, costData.currency),
        averageDailyCost: this.formatCurrency(costData.averageDailyCost, costData.currency),
        topServices: costData.topServices.map(s => ({
          service_name: s.service_name,
          cost: this.formatCurrency(s.cost, costData.currency),
        })),
        currentDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        currentYear: new Date().getFullYear(),
      },
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✓ Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

// Export singleton instance
export const emailService = new EmailService();
