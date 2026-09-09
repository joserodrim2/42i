import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '../lib/api'
import type { TaskInput, TaskListQuery } from '../lib/types'

const keys = {
  list: (q: TaskListQuery) => ['tasks', 'list', q] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  stats: ['tasks', 'stats'] as const,
}

export function useTaskList(query: TaskListQuery) {
  return useQuery({
    queryKey: keys.list(query),
    queryFn: () => api.listTasks(query),
    // Keep the current results on screen while the next page/filter loads so
    // the grid doesn't collapse to a skeleton on every change.
    placeholderData: keepPreviousData,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => api.getTask(id),
  })
}

export function useStats() {
  return useQuery({ queryKey: keys.stats, queryFn: api.getStats })
}

export function useAssignees() {
  return useQuery({
    queryKey: ['tasks', 'assignees'] as const,
    queryFn: api.listAssignees,
  })
}

/** Invalidates every task query so lists, detail and stats stay in sync. */
function useInvalidateTasks() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['tasks'] })
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (input: TaskInput) => api.createTask(input),
    onSuccess: invalidate,
  })
}

export function useAddSubtask(parentId: string) {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (input: TaskInput) => api.addSubtask(parentId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) =>
      api.updateTask(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: invalidate,
  })
}
