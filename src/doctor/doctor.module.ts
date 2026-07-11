import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

@Module({
  providers: [DoctorService],
  controllers: [DoctorController]
})
export class DoctorModule { }
