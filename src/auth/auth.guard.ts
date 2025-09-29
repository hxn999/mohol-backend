
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { UserPayload } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private caslAbilityFactory:CaslAbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request:Request = context.switchToHttp().getRequest();
    const token = request.cookies['accessToken']
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload:UserPayload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
      request['ability'] = this.caslAbilityFactory.createForUser(payload)
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  
}
