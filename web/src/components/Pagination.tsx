interface Props {
  page: number
  totalPages: number
  total: number
  onPage: (page: number) => void
}

export function Pagination({ page, totalPages, total, onPage }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs text-muted">
        {total} task{total === 1 ? '' : 's'} · page {page} of {totalPages}
      </span>
      <button
        className="btn btn-sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← Prev
      </button>
      <button
        className="btn btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next →
      </button>
    </div>
  )
}
