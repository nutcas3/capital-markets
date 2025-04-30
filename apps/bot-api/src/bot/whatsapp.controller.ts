import { Controller, Get, Post, Body, Query, Res, HttpStatus, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { BotService } from './bot.service';
import { AuthService } from '../auth/auth.service';
import { logger } from '@perena/utils';
import { ConfigService } from '@nestjs/config';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly botService: BotService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    
    if (mode && token === verifyToken) {
      res.status(HttpStatus.OK).send(challenge);
    } else {
      res.sendStatus(HttpStatus.FORBIDDEN);
    }
  }

  @Post('webhook')
  async handleIncomingMessage(@Body() webhookData: any, @Res() res: Response) {
    try {
      const { entry } = webhookData;

      // WhatsApp message structure validation
      if (!entry || !entry[0]?.changes?.[0]?.value?.messages?.[0]) {
        res.sendStatus(HttpStatus.BAD_REQUEST);
        return;
      }

      const message = entry[0].changes[0].value.messages[0];
      const from = message.from; // Phone number
      
      // Verify session or create new one
      const session = await this.authService.getOrCreateSession(from);
      
      if (!session.isVerified && message.text?.body !== 'start') {
        // Use the existing method in BotService to get verification message
        const response = this.botService.getVerificationMessage 
          ? this.botService.getVerificationMessage() 
          : 'Please verify your phone number to start trading. Reply with "start" to begin.';
        
        await this.sendMessage(from, response);
        res.sendStatus(HttpStatus.OK);
        return;
      }

      // Process the message using the existing BotService
      const response = await this.botService.processMessage(message);
      
      // Send response back to WhatsApp
      await this.sendMessage(from, response);

      res.sendStatus(HttpStatus.OK);
    } catch (error) {
      logger.error('Error processing message:', error);
      res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async sendMessage(to: string, message: string): Promise<void> {
    // Implementation of sending message to WhatsApp
    // This would use the WhatsApp Business API
    try {
      // This is a placeholder for the actual implementation
      // You would typically make an HTTP request to the WhatsApp API
      logger.info(`Sending message to ${to}: ${message}`);
      
      // Actual implementation would be something like:
      // const whatsappApiUrl = this.configService.get<string>('WHATSAPP_API_URL');
      // const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
      // const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
      
      // await axios.post(
      //   `${whatsappApiUrl}/${phoneNumberId}/messages`,
      //   {
      //     messaging_product: 'whatsapp',
      //     to,
      //     type: 'text',
      //     text: { body: message }
      //   },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${accessToken}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}
