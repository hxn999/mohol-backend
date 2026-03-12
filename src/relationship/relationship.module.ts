import { Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [RelationshipController],
    providers: [RelationshipService],
    exports: [RelationshipService],
})
export class RelationshipModule { }
