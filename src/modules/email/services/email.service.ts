import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        text: `Pour réinitialiser votre mot de passe, cliquez sur ce lien : ${resetLink}`,
        html: `
          <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>
          <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Réinitialiser mon mot de passe
          </a>
        `,
      });
      this.logger.debug(`Email de réinitialisation envoyé à ${email}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email à ${email}:`, error);
      throw error;
    }
  }
}
