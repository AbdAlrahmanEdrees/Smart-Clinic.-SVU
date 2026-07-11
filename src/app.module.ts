import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core"; // Added missing import
import { EmailModule } from "./auth/email/email.module";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './admin/users/users.module';

// Make sure this path points to your actual guard location
import { AtGuard } from "./common/guards/at.guard";
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EmailModule,
    DoctorModule,
    AppointmentModule,
  ],
  providers: [
    // This forces the AtGuard to run on EVERY request in the application.
    // By default, every single endpoint will be protected.
    // To open an endpoint, use the @MyPublic decorator to bypass this guard.
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule { }