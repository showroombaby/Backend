import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as apn from 'apn';

@Injectable()
export class PushNotificationsService {
  private provider: apn.Provider | null = null;
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(private readonly configService: ConfigService) {
    const appleKey = this.configService.get<string>('APPLE_PUSH_KEY');
    const appleKeyId = this.configService.get<string>('APPLE_PUSH_KEY_ID');
    const appleTeamId = this.configService.get<string>('APPLE_TEAM_ID');

    if (appleKey && appleKeyId && appleTeamId) {
      try {
        this.provider = new apn.Provider({
          token: {
            key: appleKey,
            keyId: appleKeyId,
            teamId: appleTeamId,
          },
          production:
            this.configService.get<string>('NODE_ENV') === 'production',
        });
      } catch (error) {
        this.logger.warn(
          '⚠️ Failed to initialize push notifications provider:',
          error.message,
        );
      }
    } else {
      this.logger.warn(
        '⚠️ Push notifications are disabled: missing Apple configuration',
      );
    }
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: any,
  ) {
    if (!this.provider) {
      this.logger.warn('Push notifications are disabled');
      return;
    }

    const notification = new apn.Notification();
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expire dans 1 heure
    notification.badge = 1;
    notification.sound = 'ping.aiff';
    notification.alert = {
      title,
      body,
    };
    notification.payload = { ...data };
    notification.topic = this.configService.get<string>('APPLE_BUNDLE_ID');

    try {
      const result = await this.provider.send(notification, deviceToken);
      if (result.failed.length > 0) {
        throw new Error(
          `Failed to send push notification: ${result.failed[0].response.reason}`,
        );
      }
      return result;
    } catch (error) {
      this.logger.error(`Push notification error: ${error.message}`);
      throw error;
    }
  }

  async sendBatchNotifications(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: any,
  ) {
    if (!this.provider) {
      this.logger.warn('Push notifications are disabled');
      return;
    }

    return Promise.all(
      deviceTokens.map((token) =>
        this.sendNotification(token, title, body, data),
      ),
    );
  }

  onModuleDestroy() {
    if (this.provider) {
      this.provider.shutdown();
    }
  }
}
