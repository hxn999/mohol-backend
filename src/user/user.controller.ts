import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { FindQueryDto } from './dto/findQueryDto';
import { UpdateUserDto } from './dto/updateUserDto';

@Controller('user')
export class UserController {

    constructor(private userService: UserService) { }


    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.userService.findOne(id);
    }

    @Post('find')
    async find(@Body() body: FindQueryDto) {
        return this.userService.findMany(body);
    }

    @Patch('update/:id')
    async updateAddress(@Body() updatedUser: UpdateUserDto , @Param('id') id: string) {
        return this.userService.updateOne(id,updatedUser);
    }

    


}
