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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import {
  DeleteResultDto,
  GlobalStatsDto,
  PaginatedTasksDto,
  TaskDetailDto,
  TaskDto,
} from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

const ID_PARAM = { name: 'id', format: 'uuid' } as const;

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  @ApiCreatedResponse({ type: TaskDto })
  @ApiBadRequestResponse({
    description: 'Validation failed, or the parent does not exist',
  })
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List tasks (filter, sort, paginate). Each item carries its subtree rollup.',
  })
  @ApiOkResponse({ type: PaginatedTasksDto })
  list(@Query() query: QueryTasksDto) {
    return this.tasks.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Global effort figures over the whole hierarchy' })
  @ApiOkResponse({ type: GlobalStatsDto })
  stats() {
    return this.tasks.stats();
  }

  @Get('assignees')
  @ApiOperation({
    summary: 'Distinct assignee names in use (for the list filter)',
  })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'string' } } })
  assignees() {
    return this.tasks.assignees();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one task with its full subtree, rollup and ancestors',
  })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: TaskDetailDto })
  @ApiNotFoundResponse({ description: 'Task not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.findOne(id);
  }

  @Post(':id/subtasks')
  @ApiOperation({ summary: 'Create a subtask directly under :id' })
  @ApiParam(ID_PARAM)
  @ApiCreatedResponse({ type: TaskDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  addSubtask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create({ ...dto, parentId: id });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a task' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: TaskDto })
  @ApiBadRequestResponse({
    description:
      'Invalid status transition, re-parent cycle, or an estimate on a task with subtasks',
  })
  @ApiNotFoundResponse({ description: 'Task not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a task and, by cascade, its whole subtree' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ type: DeleteResultDto })
  @ApiNotFoundResponse({ description: 'Task not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasks.remove(id);
  }
}
