// src/dms/dms.module.ts (antes files.module.ts)
import { Module } from '@nestjs/common';
import { DmsService } from './dms.service';
import { DmsController } from './dms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'), 
      serveRoot: '/uploads',
    }),
  ],
  controllers: [DmsController],
  providers: [DmsService],
  exports: [DmsService],
})
export class DmsModule {} 