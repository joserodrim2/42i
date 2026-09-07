import { Controller, Get } from '@nestjs/common';

/** Landing route at the API root (`GET /api`) — lists the available endpoints. */
@Controller()
export class AppController {
  @Get()
  info() {
    return {
      name: 'Task Handler API',
      status: 'ok',
      endpoints: [
        'GET    /api/health',
        'GET    /api/tasks',
        'GET    /api/tasks/stats',
        'GET    /api/tasks/:id',
        'POST   /api/tasks',
        'POST   /api/tasks/:id/subtasks',
        'PATCH  /api/tasks/:id',
        'DELETE /api/tasks/:id',
      ],
    };
  }
}
