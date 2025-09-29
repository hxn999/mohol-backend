import { Module } from '@nestjs/common';
import { jwtConstants } from './constants';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { UserModule } from 'src/user/user.module';

@Module({
    imports: [
        
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '60s' },
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService,CaslAbilityFactory],
})
export class AuthModule { }
