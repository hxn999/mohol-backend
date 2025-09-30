import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './createBookDto';

export class UpdateBookDto extends PartialType(CreateBookDto) { }
