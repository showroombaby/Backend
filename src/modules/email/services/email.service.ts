import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(user: User): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Vérification de votre compte',
        template: 'verification',
        context: {
          name: user.firstName,
          url: `${this.configService.get<string>(
            'APP_URL',
          )}/verify-email?token=${user.id}`,
        },
      });
    } catch (error) {
      this.logger.error("Erreur lors de l'envoi de l'email:", error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        template: 'reset-password',
        context: {
          url: `${this.configService.get<string>(
            'APP_URL',
          )}/reset-password?token=${token}`,
        },
      });
    } catch (error) {
      this.logger.error("Erreur lors de l'envoi de l'email:", error);
      throw error;
    }
  }
}
