import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, Printer } from 'lucide-react'

export type SortDir = 'asc' | 'desc'

type Column<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
  sortable?: boolean
}

type Props<T extends { id: string }> = {
  columns: Column<T>[]
  rows: T[]
  emptyMessage: string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onPrint?: (row: T) => void
  onView?: (row: T) => void
  viewTitle?: string
  viewAriaLabel?: string
  printTitle?: string
  printAriaLabel?: string
  /** Si true, Modifier / Supprimer sont désactivés pour cette ligne. */
  isRowLocked?: (row: T) => boolean
  rowLockedTitle?: string
  sortKey?: string | null
  sortDir?: SortDir
  onSort?: (key: string) => void
  /** Contenu des cellules du pied de tableau (clé = column.key). */
  footerCells?: Partial<Record<string, ReactNode>>
  /** Libellé affiché dans la première colonne sans valeur de footer. */
  footerLabel?: ReactNode
  /** Fusionne N colonnes initiales pour le libellé TOTAL. */
  footerLabelColSpan?: number
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage,
  onEdit,
  onDelete,
  onPrint,
  onView,
  viewTitle = 'Afficher la fiche',
  viewAriaLabel = 'Afficher la fiche',
  printTitle = 'Fiche de renseignement',
  printAriaLabel = 'Afficher la fiche de renseignement',
  isRowLocked,
  rowLockedTitle = 'Enregistrement validé — non modifiable',
  sortKey = null,
  sortDir = 'asc',
  onSort,
  footerCells,
  footerLabel = 'TOTAL',
  footerLabelColSpan = 1,
}: Props<T>) {
  const hasActions = Boolean(onEdit || onDelete || onPrint || onView)
  const hasFooter = Boolean(footerCells && Object.keys(footerCells).length > 0)

  if (rows.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const canSort = Boolean(col.sortable && onSort)
              const active = sortKey === col.key
              const SortIcon = !active
                ? ArrowUpDown
                : sortDir === 'asc'
                  ? ArrowUp
                  : ArrowDown
              return (
                <th
                  key={col.key}
                  className={col.className}
                  aria-sort={
                    canSort && active
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : canSort
                        ? 'none'
                        : undefined
                  }
                >
                  {canSort ? (
                    <button
                      type="button"
                      className={`table-sort-btn${active ? ' is-active' : ''}`}
                      onClick={() => onSort?.(col.key)}
                    >
                      <span>{col.header}</span>
                      <SortIcon size={14} aria-hidden />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
            {hasActions && <th className="col-actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const locked = Boolean(isRowLocked?.(row))
            return (
            <tr key={row.id} className={locked ? 'is-row-locked' : undefined}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render(row)}
                </td>
              ))}
              {hasActions && (
                <td className="col-actions">
                  <div className="row-actions">
                    {onEdit && (
                      <button
                        type="button"
                        className="btn-link"
                        disabled={locked}
                        title={locked ? rowLockedTitle : undefined}
                        onClick={() => {
                          if (locked) return
                          onEdit(row)
                        }}
                      >
                        Modifier
                      </button>
                    )}
                    {onView && (
                      <button
                        type="button"
                        className="btn-icon-print"
                        onClick={() => onView(row)}
                        title={viewTitle}
                        aria-label={viewAriaLabel}
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn-link danger"
                        disabled={locked}
                        title={locked ? rowLockedTitle : undefined}
                        onClick={() => {
                          if (locked) return
                          if (
                            window.confirm(
                              'Confirmer la suppression de cet enregistrement ?',
                            )
                          ) {
                            onDelete(row)
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                    {onPrint && (
                      <button
                        type="button"
                        className="btn-icon-print"
                        onClick={() => onPrint(row)}
                        title={printTitle}
                        aria-label={printAriaLabel}
                      >
                        <Printer size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
            )
          })}
        </tbody>
        {hasFooter && footerCells && (
          <tfoot>
            <tr className="data-table-totals">
              {(() => {
                const labelSpan = Math.max(
                  1,
                  Math.min(footerLabelColSpan, columns.length),
                )
                const cells: ReactNode[] = []
                let index = 0
                while (index < columns.length) {
                  const col = columns[index]
                  const value = footerCells[col.key]
                  if (value !== undefined) {
                    cells.push(
                      <td key={col.key} className={col.className}>
                        {value}
                      </td>,
                    )
                    index += 1
                    continue
                  }
                  if (index === 0) {
                    cells.push(
                      <td
                        key={`footer-label-${col.key}`}
                        className="data-table-totals-label"
                        colSpan={labelSpan}
                      >
                        <strong>{footerLabel}</strong>
                      </td>,
                    )
                    index += labelSpan
                    continue
                  }
                  cells.push(<td key={col.key} className={col.className} />)
                  index += 1
                }
                return cells
              })()}
              {hasActions && <td className="col-actions" />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
