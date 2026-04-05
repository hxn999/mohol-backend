import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { DatabaseModule } from 'src/database/database.module';

import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
    imports: [DatabaseModule, CloudinaryModule],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService],
})
export class MediaModule { }
