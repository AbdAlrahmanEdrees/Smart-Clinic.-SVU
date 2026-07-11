import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {  PrismaClient } from '../../../generated/prisma/client';
//################### For MySQL #######################
import {PrismaMariaDb} from '@prisma/adapter-mariadb'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(){
        console.log("DB_HOST IS:", process.env.DB_HOST);
    //###########################################################
    //##################### Aiven MySQL  ########################
    //###########################################################
    const adapter = new PrismaMariaDb({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT),
        ssl: { rejectUnauthorized: false }, // Add this line to force an SSL connection
        connectTimeout: 10000 // Override the 1s default to 10 seconds
        // connectionLimit:5
    });
        super({adapter:adapter});
    }

    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
