import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Token non fourni');
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      // Attacher l'utilisateur au client socket pour une utilisation ultérieure
      client.handshake.auth.user = user;

      return Boolean(user);
    } catch (err) {
      throw new WsException('Token non valide');
    }
  }

  private extractToken(client: Socket): string | undefined {
    const auth =
      client.handshake?.auth?.token || client.handshake?.headers?.authorization;

    if (!auth) {
      return undefined;
    }

    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
