import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [AppController, HealthController],
})
export class AppModule {}
