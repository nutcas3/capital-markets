import { Request, Response } from 'express';
import { BotService } from '../services/bot.service';
import { AuthService } from '../auth/auth.service';
import { logger } from '../../../libs/utils/logger';

export class MessageController {
  private botService: BotService;
  private authService: AuthService;

  constructor() {
    this.botService = new BotService();
    this.authService = new AuthService();
  }

  handleIncomingMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entry } = req.body;

      // WhatsApp message structure validation
      if (!entry || !entry[0]?.changes?.[0]?.value?.messages?.[0]) {
        res.sendStatus(400);
        return;
      }

      const message = entry[0].changes[0].value.messages[0];
      const from = message.from; // Phone number
      
      // Verify session or create new one
      const session = await this.authService.getOrCreateSession(from);
      
      if (!session.isVerified && message.text?.body !== 'start') {
        await this.botService.sendVerificationMessage(from);
        res.sendStatus(200);
        return;
      }

      // Process the message
      const response = await this.botService.processMessage(message, session);
      
      // Send response back to WhatsApp
      await this.botService.sendMessage(from, response);

      res.sendStatus(200);
    } catch (error) {
      logger.error('Error processing message:', error);
      res.sendStatus(500);
    }
  };
}
