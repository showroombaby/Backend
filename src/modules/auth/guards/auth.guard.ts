import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Role } from '../../users/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('Starting authentication check...');

    try {
      // First check JWT authentication
      const canActivateJwt = await super.canActivate(context);
      this.logger.debug(`JWT authentication result: ${canActivateJwt}`);

      if (!canActivateJwt) {
        this.logger.debug('JWT authentication failed');
        return false;
      }

      // Then check roles
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);

      if (!requiredRoles) {
        this.logger.debug('No roles required, access granted');
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      this.logger.debug(`User from request: ${JSON.stringify(user)}`);
      this.logger.debug(`Token from request: ${request.headers.authorization}`);

      if (!user || !user.role) {
        this.logger.error('No user or role found in request');
        return false;
      }

      const hasRole = requiredRoles.some((role) => user.role === role);
      this.logger.debug(`Has required role: ${hasRole}`);

      return hasRole;
    } catch (error) {
      this.logger.error('Error during authentication:', error);
      return false;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.debug(`HandleRequest - Error: ${JSON.stringify(err)}`);
    this.logger.debug(`HandleRequest - User: ${JSON.stringify(user)}`);
    this.logger.debug(`HandleRequest - Info: ${JSON.stringify(info)}`);

    if (err || !user) {
      if (info && info.message === 'jwt expired') {
        throw new UnauthorizedException('Token expired');
      }
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
