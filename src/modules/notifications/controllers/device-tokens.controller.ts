import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';
import { DeviceTokensService } from '../services/device-tokens.service';

@ApiTags('device-tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Register a device token' })
  @ApiResponse({
    status: 201,
    description: 'The device token has been registered.',
  })
  async registerToken(
    @Body() registerDeviceTokenDto: RegisterDeviceTokenDto,
    @Req() req,
  ) {
    return await this.deviceTokensService.registerToken(
      req.user.id,
      registerDeviceTokenDto.token,
      registerDeviceTokenDto.platform,
      registerDeviceTokenDto.deviceModel,
      registerDeviceTokenDto.osVersion,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Deactivate a device token' })
  @ApiResponse({
    status: 200,
    description: 'The device token has been deactivated.',
  })
  async deactivateToken(@Body('token') token: string) {
    await this.deviceTokensService.deactivateToken(token);
    return { message: 'Token deactivated successfully' };
  }
}
