import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [HealthController],
})
export class AppModule {}
