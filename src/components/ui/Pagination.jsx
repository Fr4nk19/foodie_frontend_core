import { ChevronLeft, ChevronRight } from 'lucide-react'

const PER_PAGE_OPTIONS = [15, 25, 50, 100]

/**
 * Pagination component.
 *
 * Props:
 *   meta      – { current_page, last_page, per_page, total, from, to }
 *   onPage    – (page: number) => void
 *   onPerPage – (perPage: number) => void
 */
export default function Pagination({ meta, onPage, onPerPage }) {
  if (!meta || meta.total === 0) return null

  const { current_page, last_page, per_page, total, from, to } = meta

  // Build visible page numbers with ellipsis
  const pages = buildPageList(current_page, last_page)

  return (
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Info left */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>
          {from}–{to} de <span className="font-medium text-gray-700">{total}</span>
        </span>

        {/* Per-page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Mostrar</span>
          <select
            value={per_page}
            onChange={(e) => { onPage(1); onPerPage(Number(e.target.value)) }}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls right */}
      {last_page > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={() => onPage(current_page - 1)}
            disabled={current_page === 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition ${
                  p === current_page
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPage(current_page + 1)}
            disabled={current_page === last_page}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/** Returns an array like [1, 2, '...', 7, 8, 9, '...', 20] */
function buildPageList(current, last) {
  if (last <= 7) return range(1, last)

  const delta = 2
  const left  = Math.max(current - delta, 1)
  const right = Math.min(current + delta, last)
  const pages = []

  if (left > 1) {
    pages.push(1)
    if (left > 2) pages.push('...')
  }

  for (let i = left; i <= right; i++) pages.push(i)

  if (right < last) {
    if (right < last - 1) pages.push('...')
    pages.push(last)
  }

  return pages
}

function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}
