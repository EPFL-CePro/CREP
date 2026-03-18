'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { getAllExams } from '@/app/lib/database'
import { Exam } from '@/types/exam';

export default function ExamsTable() {
  const [globalFilter, setGlobalFilter] = React.useState(''); // Plain text searching, searching in the whole table
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  React.useEffect(() =>  {
    (async function() {
        const allExams = await getAllExams() as Exam[];

        setExams(allExams);
    })();
  }, [])

  const columns:ColumnDef<Exam>[] = [
    {
      accessorKey: 'name',
      header: 'Cours',
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => row.original.code,
    },
  ]

  const table = useReactTable({
    data: exams,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()

      return (
        row.original.name.toLowerCase().includes(search) ||
        row.original.code.toLowerCase().includes(search)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rowCount = table.getRowModel().rows.length

  return (
    <div className="min-h-screen px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto">
        <div className="mb-8">
          <div className="w-1/3 min-w-80 flex h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-5 shadow-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search an exam..."
              className="border-none bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-none border border-slate-300 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-[#f2f2f4]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-300">
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()
                    const canFilter = header.column.getCanFilter()

                    return (
                      <th
                        key={header.id}
                        className="border-r border-slate-300 px-7 py-5 text-left text-2xl font-bold text-slate-900 last:border-r-0"
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-2"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}

                              <span
                                aria-hidden="true"
                                className="inline-block text-lg text-red-600"
                              >
                                {isSorted === 'asc' && '▼'}
                                {isSorted === 'desc' && '▲'}
                              </span>
                            </button>
  
                            {canFilter && (
                              <input
                                type="text"
                                value={(header.column.getFilterValue() ?? '') as string}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                placeholder="Filtrer..."
                                className="w-72 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none placeholder:text-slate-400"
                              />
                            )}
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {rowCount === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-7 py-10 text-xl text-slate-500"
                  >
                    No result
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-7 py-5 text-[2.05rem] leading-none text-slate-900 md:text-[1.1rem]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}