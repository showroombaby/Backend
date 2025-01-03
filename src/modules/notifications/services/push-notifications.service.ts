import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as apn from 'apn';

@Injectable()
export class PushNotificationsService {
  private provider: apn.Provider;

  constructor(private readonly configService: ConfigService) {
    this.provider = new apn.Provider({
      token: {
        key: this.configService.get<string>('APPLE_PUSH_KEY'),
        keyId: this.configService.get<string>('APPLE_PUSH_KEY_ID'),
        teamId: this.configService.get<string>('APPLE_TEAM_ID'),
      },
      production: this.configService.get<string>('NODE_ENV') === 'production',
    });
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: any,
  ) {
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
      throw new Error(`Push notification error: ${error.message}`);
    }
  }

  async sendBatchNotifications(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: any,
  ) {
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
