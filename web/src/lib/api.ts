import type {
  GlobalStats,
  Task,
  TaskDetail,
  TaskInput,
  TaskListQuery,
  TaskListResponse,
} from './types'

const BASE = '/api'

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : (body.message ?? message)
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, message)
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

function toQueryString(query: TaskListQuery): string {
  const params = new URLSearchParams()
  if (query.status?.length) params.set('status', query.status.join(','))
  if (query.priority?.length) params.set('priority', query.priority.join(','))
  if (query.search) params.set('search', query.search)
  if (query.assignee) params.set('assignee', query.assignee)
  if (query.scope) params.set('scope', query.scope)
  if (query.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortDir) params.set('sortDir', query.sortDir)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  const s = params.toString()
  return s ? `?${s}` : ''
}

export const api = {
  listTasks: (query: TaskListQuery) =>
    request<TaskListResponse>(`/tasks${toQueryString(query)}`),

  getTask: (id: string) => request<TaskDetail>(`/tasks/${id}`),

  getStats: () => request<GlobalStats>('/tasks/stats'),

  listAssignees: () => request<string[]>('/tasks/assignees'),

  createTask: (input: TaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),

  addSubtask: (parentId: string, input: TaskInput) =>
    request<Task>(`/tasks/${parentId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTask: (id: string, input: TaskInput) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  deleteTask: (id: string) =>
    request<{ id: string; deletedCount: number }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
}

export { ApiError }
