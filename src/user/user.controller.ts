import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FindQueryDto } from './dto/findQueryDto';
import { UpdateUserDto } from './dto/updateUserDto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AbilitiesGuard } from 'src/casl/abilities.guard';
import { CheckAbility } from 'src/casl/abilities.decorator';
import { Action } from 'src/casl/actionEnum';
import { RequestWithAuth } from 'src/auth/auth.controller';
import { AddToCartDto } from './dto/addToCart';
import { User } from 'src/database/database.types';
import { UpdateCartQuantityDto } from './dto/updateCartQuantity.dto';
import { RemoveCartItemDto } from './dto/removeCartItem.dto';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('')
  // @UseGuards(AuthGuard, AbilitiesGuard)
  // @CheckAbility(Action.Read, 'all')
  async findAll() {
    console.log("hi")
    return this.userService.findAll();
  }

  @Get('single/:id')
  async findOne(@Param('id') id: string) {
    console.log('hiiii');
    return this.userService.findOne(id);
  }

  


  @Post('find')
  async find(@Body() body: FindQueryDto) {
    return this.userService.findMany(body);
  }

  // @UseGuards(AuthGuard, AbilitiesGuard)
  @Patch('update')
  async updateAddress(@Req() req:RequestWithAuth, @Body() updatedUser: UpdateUserDto) {
    return this.userService.updateOne(req.user.id, updatedUser);
  }



}
