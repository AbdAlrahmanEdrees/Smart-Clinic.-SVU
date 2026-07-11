import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService:UsersService
    ){}
    @Get()
    @ApiBody({})
    @ApiResponse({description:"list of all users",status:HttpStatus.OK})
    @HttpCode(HttpStatus.OK)
    getUsers(){
        this.usersService
    }
}
