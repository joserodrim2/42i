import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Get()
  list(@Query() query: QueryTasksDto) {
    return this.tasks.list(query);
  }

  /** Global effort figures over the whole hierarchy. Declared before `:id`. */
  @Get('stats')
  stats() {
    return this.tasks.stats();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.findOne(id);
  }

  /** Convenience: create a subtask directly under `:id`. */
  @Post(':id/subtasks')
  addSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create({ ...dto, parentId: id });
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.remove(id);
  }
}
