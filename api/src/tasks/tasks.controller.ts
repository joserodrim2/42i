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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List tasks (filter, sort, paginate). Each item carries its rollup.',
  })
  list(@Query() query: QueryTasksDto) {
    return this.tasks.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Global effort figures over the whole hierarchy' })
  stats() {
    return this.tasks.stats();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one task with its full subtree, rollup and ancestors',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.findOne(id);
  }

  @Post(':id/subtasks')
  @ApiOperation({ summary: 'Create a subtask directly under :id' })
  addSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create({ ...dto, parentId: id });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a task' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a task and, by cascade, its whole subtree' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.remove(id);
  }
}
