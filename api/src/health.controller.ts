import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

class HealthDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}

@ApiTags('meta')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + database connectivity check' })
  @ApiOkResponse({ type: HealthDto })
  async check(): Promise<HealthDto> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
