import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from 'src/auth/auth.module';
import { CaslModule } from 'src/casl/casl.module';
import { MediaModule } from 'src/media/media.module';
@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    forwardRef(() => AuthModule),
    CaslModule,
    MediaModule,
  ],
  exports: [UserService],
})
export class UserModule {}
