import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info && info.message === 'jwt expired') {
        throw new UnauthorizedException('Token expired');
      }
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
