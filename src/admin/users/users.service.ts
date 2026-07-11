import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma:PrismaService
    ){}
    async getUsers():Promise<User[]>{
        const users = this.prisma.user.findMany();
        return users;
    }
}
