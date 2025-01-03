import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevicePlatform, DeviceToken } from '../entities/device-token.entity';

@Injectable()
export class DeviceTokensService {
  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  async registerToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
    deviceModel?: string,
    osVersion?: string,
  ) {
    let deviceToken = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (deviceToken) {
      deviceToken.userId = userId;
      deviceToken.platform = platform;
      deviceToken.deviceModel = deviceModel;
      deviceToken.osVersion = osVersion;
      deviceToken.isActive = true;
      deviceToken.lastUsedAt = new Date();
    } else {
      deviceToken = this.deviceTokenRepository.create({
        userId,
        token,
        platform,
        deviceModel,
        osVersion,
        isActive: true,
        lastUsedAt: new Date(),
      });
    }

    return await this.deviceTokenRepository.save(deviceToken);
  }

  async deactivateToken(token: string) {
    const deviceToken = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (deviceToken) {
      deviceToken.isActive = false;
      await this.deviceTokenRepository.save(deviceToken);
    }
  }

  async getUserActiveTokens(userId: string, platform?: DevicePlatform) {
    const query = this.deviceTokenRepository
      .createQueryBuilder('deviceToken')
      .where('deviceToken.userId = :userId', { userId })
      .andWhere('deviceToken.isActive = :isActive', { isActive: true });

    if (platform) {
      query.andWhere('deviceToken.platform = :platform', { platform });
    }

    return await query.getMany();
  }

  async updateLastUsed(token: string) {
    await this.deviceTokenRepository.update(
      { token },
      { lastUsedAt: new Date() },
    );
  }

  async cleanupInactiveTokens(daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    await this.deviceTokenRepository
      .createQueryBuilder()
      .delete()
      .from(DeviceToken)
      .where('lastUsedAt < :thresholdDate', { thresholdDate })
      .execute();
  }
}
