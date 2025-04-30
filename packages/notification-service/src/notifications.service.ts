import { logger } from '@perena/utils';
import * as twilio from 'twilio';
import * as nodemailer from 'nodemailer';

interface NotificationConfig {
  enableWhatsApp: boolean;
  enableSMS: boolean;
  enableEmail: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPass?: string;
  emailFrom?: string;
}

interface TradeNotification {
  walletAddress: string;
  type: 'SWAP_EXECUTED' | 'MINT_SYNTHETIC' | 'REDEEM_SYNTHETIC' | 'DEPOSIT' | 'WITHDRAWAL';
  data: any;
}

interface PriceAlert {
  walletAddress: string;
  assetSymbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
}

export class NotificationService {
  private twilioClient?: twilio.Twilio;
  private emailTransporter?: nodemailer.Transporter;
  private config: NotificationConfig;
  
  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      enableWhatsApp: false,
      enableSMS: false,
      enableEmail: false,
      ...config
    };
    
    this.initProviders();
    logger.info('NotificationService initialized');
  }
  
  private initProviders() {
    // Initialize Twilio if configured
    if ((this.config.enableWhatsApp || this.config.enableSMS) && 
        this.config.twilioAccountSid && 
        this.config.twilioAuthToken) {
      this.twilioClient = twilio(
        this.config.twilioAccountSid,
        this.config.twilioAuthToken
      );
      logger.info('Twilio client initialized');
    }
    
    // Initialize email if configured
    if (this.config.enableEmail && 
        this.config.emailHost && 
        this.config.emailUser && 
        this.config.emailPass) {
      this.emailTransporter = nodemailer.createTransport({
        host: this.config.emailHost,
        port: this.config.emailPort || 587,
        secure: this.config.emailPort === 465,
        auth: {
          user: this.config.emailUser,
          pass: this.config.emailPass
        }
      });
      logger.info('Email transporter initialized');
    }
  }
  
  /**
   * Send a trade notification
   * @param notification Trade notification details
   */
  async sendTradeNotification(notification: TradeNotification): Promise<void> {
    logger.info('Sending trade notification', { type: notification.type });
    
    // Format the notification message
    const message = this.formatTradeNotification(notification);
    
    // Get user contact info (in a real implementation, this would come from a database)
    const userContacts = await this.getUserContacts(notification.walletAddress);
    
    // Send through configured channels
    await Promise.all([
      this.config.enableWhatsApp && userContacts.phoneNumber ? 
        this.sendWhatsAppMessage(userContacts.phoneNumber, message) : 
        Promise.resolve(),
      
      this.config.enableSMS && userContacts.phoneNumber ? 
        this.sendSMS(userContacts.phoneNumber, message) : 
        Promise.resolve(),
      
      this.config.enableEmail && userContacts.email ? 
        this.sendEmail(userContacts.email, `Trade ${notification.type}`, message) : 
        Promise.resolve()
    ]);
  }
  
  /**
   * Send a price alert
   * @param alert Price alert details
   */
  async sendPriceAlert(alert: PriceAlert): Promise<void> {
    logger.info('Sending price alert', { asset: alert.assetSymbol });
    
    // Format the alert message
    const message = this.formatPriceAlert(alert);
    
    // Get user contact info
    const userContacts = await this.getUserContacts(alert.walletAddress);
    
    // Send through configured channels
    await Promise.all([
      this.config.enableWhatsApp && userContacts.phoneNumber ? 
        this.sendWhatsAppMessage(userContacts.phoneNumber, message) : 
        Promise.resolve(),
      
      this.config.enableSMS && userContacts.phoneNumber ? 
        this.sendSMS(userContacts.phoneNumber, message) : 
        Promise.resolve(),
      
      this.config.enableEmail && userContacts.email ? 
        this.sendEmail(userContacts.email, `Price Alert: ${alert.assetSymbol}`, message) : 
        Promise.resolve()
    ]);
  }
  
  /**
   * Send a custom notification
   * @param walletAddress User's wallet address
   * @param title Notification title
   * @param message Notification message
   */
  async sendCustomNotification(walletAddress: string, title: string, message: string): Promise<void> {
    logger.info('Sending custom notification', { title });
    
    // Get user contact info
    const userContacts = await this.getUserContacts(walletAddress);
    
    // Send through configured channels
    await Promise.all([
      this.config.enableWhatsApp && userContacts.phoneNumber ? 
        this.sendWhatsAppMessage(userContacts.phoneNumber, message) : 
        Promise.resolve(),
      
      this.config.enableSMS && userContacts.phoneNumber ? 
        this.sendSMS(userContacts.phoneNumber, message) : 
        Promise.resolve(),
      
      this.config.enableEmail && userContacts.email ? 
        this.sendEmail(userContacts.email, title, message) : 
        Promise.resolve()
    ]);
  }
  
  /**
   * Send a WhatsApp message
   * @param to Recipient phone number
   * @param message Message content
   */
  private async sendWhatsAppMessage(to: string, message: string): Promise<void> {
    if (!this.twilioClient || !this.config.twilioPhoneNumber) {
      logger.warn('Twilio not configured for WhatsApp');
      return;
    }
    
    try {
      await this.twilioClient.messages.create({
        from: `whatsapp:${this.config.twilioPhoneNumber}`,
        to: `whatsapp:${to}`,
        body: message
      });
      logger.info('WhatsApp message sent', { to });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', error);
    }
  }
  
  /**
   * Send an SMS
   * @param to Recipient phone number
   * @param message Message content
   */
  private async sendSMS(to: string, message: string): Promise<void> {
    if (!this.twilioClient || !this.config.twilioPhoneNumber) {
      logger.warn('Twilio not configured for SMS');
      return;
    }
    
    try {
      await this.twilioClient.messages.create({
        from: this.config.twilioPhoneNumber,
        to,
        body: message
      });
      logger.info('SMS sent', { to });
    } catch (error) {
      logger.error('Failed to send SMS', error);
    }
  }
  
  /**
   * Send an email
   * @param to Recipient email
   * @param subject Email subject
   * @param message Email content
   */
  private async sendEmail(to: string, subject: string, message: string): Promise<void> {
    if (!this.emailTransporter || !this.config.emailFrom) {
      logger.warn('Email not configured');
      return;
    }
    
    try {
      await this.emailTransporter.sendMail({
        from: this.config.emailFrom,
        to,
        subject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`
      });
      logger.info('Email sent', { to });
    } catch (error) {
      logger.error('Failed to send email', error);
    }
  }
  
  /**
   * Format a trade notification into a readable message
   * @param notification Trade notification
   * @returns Formatted message
   */
  private formatTradeNotification(notification: TradeNotification): string {
    const { type, data } = notification;
    
    switch (type) {
      case 'SWAP_EXECUTED':
        return `✅ Swap completed!\nAmount: ${data.fromAmount} ${data.fromToken}\nReceived: ${data.receivedAmount} ${data.toToken}\nTransaction: ${this.formatTxHash(data.txHash)}`;
      
      case 'MINT_SYNTHETIC':
        return `✅ Minted ${data.amount} ${data.syntheticAsset}\nCollateral: ${data.collateralAmount} ${data.collateralAsset}\nTransaction: ${this.formatTxHash(data.txHash)}`;
      
      case 'REDEEM_SYNTHETIC':
        return `✅ Redeemed ${data.amount} ${data.syntheticAsset}\nReceived: ${data.collateralReturned} ${data.collateralAsset}\nTransaction: ${this.formatTxHash(data.txHash)}`;
      
      case 'DEPOSIT':
        return `✅ Deposit completed!\nAmount: ${data.amount} ${data.asset}\nTransaction: ${this.formatTxHash(data.txHash)}`;
      
      case 'WITHDRAWAL':
        return `✅ Withdrawal completed!\nAmount: ${data.amount} ${data.asset}\nTransaction: ${this.formatTxHash(data.txHash)}`;
      
      default:
        return `Transaction completed: ${type}\nTransaction: ${this.formatTxHash(data.txHash)}`;
    }
  }
  
  /**
   * Format a price alert into a readable message
   * @param alert Price alert
   * @returns Formatted message
   */
  private formatPriceAlert(alert: PriceAlert): string {
    const direction = alert.direction === 'above' ? 'risen above' : 'fallen below';
    return `🔔 Price Alert: ${alert.assetSymbol} has ${direction} ${alert.targetPrice}.\nCurrent price: ${alert.targetPrice}`;
  }
  
  /**
   * Format a transaction hash for display
   * @param txHash Transaction hash
   * @returns Formatted hash
   */
  private formatTxHash(txHash: string): string {
    // In a real implementation, this would generate a link to a block explorer
    return `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;
  }
  
  /**
   * Get user contact information
   * @param walletAddress User's wallet address
   * @returns User contact info
   */
  private async getUserContacts(walletAddress: string): Promise<{ phoneNumber?: string; email?: string }> {
    // In a real implementation, this would fetch from a database
    // For now, return mock data
    return {
      phoneNumber: '+1234567890', // Mock phone number
      email: 'user@example.com' // Mock email
    };
  }
}
