'use client'

import { YearFilter } from '@/app/_components/dateFilters/yearFilter'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { fetchCheckInCounterData } from '@/lib/firestoreUtils'
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    Cell,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts'

const COLORS = ['#B6CCE2', '#4A7CA5', '#23425B', '#1A2633']

type ChartData = {
    name: string
    value: number
}

type CheckInCounterEntry = {
    docId: string
    data: Record<string, number>
}

const QUARTERS = [
    { label: 'Q1: JUL-SEP', months: ['7', '8', '9'] },
    { label: 'Q2: OCT-DEC', months: ['10', '11', '12'] },
    { label: 'Q3: JAN-MAR', months: ['1', '2', '3'] },
    { label: 'Q4: APR-JUN', months: ['4', '5', '6'] },
]

const PieChart = () => {
    const [entries, setEntries] = useState<CheckInCounterEntry[]>([])
    const [calendarYears, setCalendarYears] = useState<number[]>([])
    const [fiscalYears, setFiscalYears] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
    const [isExporting, setIsExporting] = useState(false)

    const [data, setData] = useState<ChartData[]>([
        { name: 'Hygiene Kits', value: 0 },
        { name: 'Hot Meals', value: 0 },
        { name: 'Snack Packs', value: 0 },
        { name: 'Client Check-Ins', value: 0 },
    ])

    const [dateFilterType, setDateFilterType] = useState<'calendar' | 'fiscal'>(
        'calendar',
    )
    const [selectedYear, setSelectedYear] = useState<string>('all')
    const [selectedMonths, setSelectedMonths] = useState<string[]>([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
    ])
    const [selectedQuarters, setSelectedQuarters] = useState<string[]>([
        'Q1: JUL-SEP',
        'Q2: OCT-DEC',
        'Q3: JAN-MAR',
        'Q4: APR-JUN',
    ])
    const [isFilterVisible, setIsFilterVisible] = useState(true)

    const [isLargeScreen, setIsLargeScreen] = useState(false)

    // Track screen size for layout switching
    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)')
        setIsLargeScreen(mediaQuery.matches)

        const handler = (event: MediaQueryListEvent) =>
            setIsLargeScreen(event.matches)
        mediaQuery.addEventListener('change', handler)

        return () => {
            mediaQuery.removeEventListener('change', handler)
        }
    }, [])

    // Set all quarters as selected when switching to fiscal year
    useEffect(() => {
        if (dateFilterType === 'fiscal') {
            setSelectedQuarters([
                'Q1: JUL-SEP',
                'Q2: OCT-DEC',
                'Q3: JAN-MAR',
                'Q4: APR-JUN',
            ])
        }
    }, [dateFilterType])

    // Fetch data once
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const fetchedEntries = await fetchCheckInCounterData()
                setEntries(fetchedEntries)

                const uniqueCalendarYears = Array.from(
                    new Set(
                        fetchedEntries.map((entry) =>
                            parseInt(entry.docId.split('-')[0]),
                        ),
                    ),
                )
                    .filter((year): year is number => !isNaN(year))
                    .sort((a, b) => b - a)

                setCalendarYears(uniqueCalendarYears)

                const uniqueFiscalYears = Array.from(
                    new Set(
                        fetchedEntries.map((entry) => {
                            const [yearStr, monthStr] = entry.docId.split('-')
                            const year = parseInt(yearStr)
                            const month = parseInt(monthStr) // 1-indexed

                            if (isNaN(year) || isNaN(month)) return NaN

                            // Fiscal year: July (7) and onward maps to next year
                            return month >= 7 ? year + 1 : year
                        })
                    )
                )
                    .filter((year): year is number => !isNaN(year))
                    .sort((a, b) => b - a)

                setFiscalYears(uniqueFiscalYears)
                
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Apply filters to compute pie data
    useEffect(() => {
        const totals = { 'Hygiene Kits': 0, 'Hot Meals': 0, 'Snack Packs': 0 }
        let checkInCount = 0

        entries.forEach(({ docId, data }) => {
            const [year, monthStr] = docId.split('-')
            const recordYear =
                dateFilterType === 'fiscal'
                    ? parseInt(monthStr) >= 7
                        ? parseInt(year) + 1
                        : parseInt(year)
                    : parseInt(year)
            const recordMonth = parseInt(monthStr).toString()

            if (selectedYear !== 'all' && recordYear !== parseInt(selectedYear))
                return

            if (dateFilterType === 'calendar') {
                if (!selectedMonths.includes(recordMonth)) return
            } else {
                const isInSelectedQuarter = selectedQuarters.some((quarter) => {
                    const quarterMonths =
                        QUARTERS.find((q) => q.label === quarter)?.months || []
                    return quarterMonths.includes(recordMonth)
                })
                if (!isInSelectedQuarter) return
            }

            totals['Hygiene Kits'] += data['Hygiene Kit'] || 0
            totals['Hot Meals'] += data['Hot Meal'] || 0
            totals['Snack Packs'] += data['Snack Pack'] || 0
            checkInCount += 1
        })

        setData([
            { name: 'Hygiene Kits', value: totals['Hygiene Kits'] },
            { name: 'Hot Meals', value: totals['Hot Meals'] },
            { name: 'Snack Packs', value: totals['Snack Packs'] },
            { name: 'Client Check-Ins', value: checkInCount },
        ])
    }, [
        entries,
        dateFilterType,
        selectedYear,
        selectedMonths,
        selectedQuarters,
    ])

    const total = data.reduce((sum, d) => sum + d.value, 0)

    const handleMonthToggle = (month: string) => {
        setSelectedMonths((prev) =>
            prev.includes(month)
                ? prev.filter((m) => m !== month)
                : [...prev, month],
        )
    }

    const handleQuarterToggle = (quarter: string) => {
        setSelectedQuarters((prev) =>
            prev.includes(quarter)
                ? prev.filter((q) => q !== quarter)
                : [...prev, quarter],
        )
    }

    const exportData = async (format: 'pdf' | 'png') => {
        try {
            setIsExporting(true)
            const el = document.getElementById('exportContainer')
            if (!el) throw new Error('Export element not found')

            const today = new Date().toLocaleDateString('en-CA')
            const filename = `CheckIns_${today}.${format}`

            if (format === 'pdf') {
                const html2pdf = (await import('html2pdf.js')).default
                await html2pdf()
                    .set({
                        filename,
                        image: { type: 'jpeg', quality: 1 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            scrollY: 0,
                            logging: false,
                            backgroundColor: '#ffffff',
                        },
                        jsPDF: {
                            unit: 'in',
                            format: 'a4',
                            orientation: 'portrait',
                            compress: true,
                        },
                    })
                    .from(el)
                    .save()
            } else {
                // For PNG export
                const html2canvas = (await import('html2canvas')).default
                const canvas = await html2canvas(el, {
                    scale: 2,
                    useCORS: true,
                    scrollY: 0,
                })
                const link = document.createElement('a')
                link.download = filename
                link.href = canvas.toDataURL('image/png')
                link.click()
            }
        } catch (err) {
            console.error('Export failed:', err)
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="flex w-full flex-col lg:flex-row lg:justify-between">
            {/* Chart/Table View */}
            <div className="order-2 flex flex-col items-center lg:order-1">
                <div className="mb-4 flex w-full items-center justify-between">
                    <h2 className="text-2xl font-bold">Check-Ins</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`px-2 py-1 ${
                                viewMode === 'chart'
                                    ? 'font-semibold text-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Chart
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-2 py-1 ${
                                viewMode === 'table'
                                    ? 'font-semibold text-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Table
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex h-[500px] w-[500px] items-center justify-center text-lg">
                        Loading data...
                    </div>
                ) : (
                    <div
                        id="exportContainer"
                        className="flex w-full flex-col items-center p-8"
                    >
                        {viewMode === 'chart' ? (
                            <div className="flex flex-col items-center">
                                <div className="relative h-[500px] w-[500px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <RechartsPieChart>
                                            <Pie
                                                data={data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={120}
                                                outerRadius={240}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.map((entry, idx) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={
                                                            COLORS[
                                                                idx %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="mb-1 text-lg font-bold tracking-widest text-gray-400">
                                            TOTAL
                                        </span>
                                        <span className="text-6xl font-extrabold">
                                            {total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Custom Legend */}
                                <div className="mt-12 flex justify-center gap-16">
                                    {data.map((entry, idx) => {
                                        const percent = total
                                            ? Math.round(
                                                  (entry.value / total) * 100,
                                              )
                                            : 0
                                        return (
                                            <div
                                                key={entry.name}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="inline-block h-4 w-4 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                COLORS[
                                                                    idx %
                                                                        COLORS.length
                                                                ],
                                                        }}
                                                    />
                                                    <span className="font-semibold text-gray-700">
                                                        {entry.name}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {entry.value.toLocaleString()}{' '}
                                                    ({percent}%)
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[300px]">
                                                Category
                                            </TableHead>
                                            <TableHead className="w-[200px] text-right">
                                                Count
                                            </TableHead>
                                            <TableHead className="w-[200px] border-r border-gray-200 text-right">
                                                Percentage
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((entry, idx) => {
                                            const percent = total
                                                ? Math.round(
                                                      (entry.value / total) *
                                                          100,
                                                  )
                                                : 0
                                            return (
                                                <TableRow key={entry.name}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="inline-block h-4 w-4 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        COLORS[
                                                                            idx %
                                                                                COLORS.length
                                                                        ],
                                                                }}
                                                            />
                                                            <span className="font-semibold">
                                                                {entry.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {entry.value.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="border-r border-gray-200 text-right">
                                                        {percent}%
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        <TableRow className="border-b border-gray-200 bg-gray-50">
                                            <TableCell className="font-bold">
                                                Total
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {total.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="border-r border-gray-200" />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}

                {/* Export Button */}
                <div className="mt-4 flex justify-start">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isExporting}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {isExporting ? 'Exporting...' : 'Export'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="bottom"
                            align="start"
                            sideOffset={5}
                            className="w-[160px] data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                        >
                            <DropdownMenuItem onClick={() => exportData('pdf')}>
                                Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportData('png')}>
                                Export as PNG
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="order-1 mb-8 w-full lg:order-2 lg:mb-0 lg:w-[400px]">
                <YearFilter
                    calendarYears={calendarYears}
                    fiscalYears={fiscalYears}
                    isFilterVisible={isFilterVisible}
                    setIsFilterVisible={setIsFilterVisible}
                    dateFilterType={dateFilterType}
                    setDateFilterType={setDateFilterType}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedMonths={selectedMonths}
                    handleMonthToggle={handleMonthToggle}
                    selectedQuarters={selectedQuarters}
                    handleQuarterToggle={handleQuarterToggle}
                    layout={isLargeScreen ? 'vertical' : 'horizontal'}
                />
            </div>
        </div>
    )
}

export default PieChart
