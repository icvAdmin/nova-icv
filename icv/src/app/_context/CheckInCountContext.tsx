'use client'

import { getAllCheckInCounts, incrementCheckInCount } from '@/api/events'
import { CheckInCategory } from '@/types/event-types'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type CountsByPeriod = { day: number; month: number; year: number }

interface CheckInCountState {
    hygieneKits: CountsByPeriod
    hotMeals: CountsByPeriod
    snackPacks: CountsByPeriod
}

interface CheckInCountContextType extends CheckInCountState {
    isLoading: boolean
    increment: (item: 'hygieneKits' | 'hotMeals' | 'snackPacks') => void
    decrement: (item: 'hygieneKits' | 'hotMeals' | 'snackPacks') => void
    refetch: () => Promise<void>
}

const defaultCounts: CountsByPeriod = { day: 0, month: 0, year: 0 }

const CheckInCountContext = createContext<CheckInCountContextType | undefined>(undefined)

export function CheckInCountProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true)
    const [hygieneKits, setHygieneKits] = useState<CountsByPeriod>(defaultCounts)
    const [hotMeals, setHotMeals] = useState<CountsByPeriod>(defaultCounts)
    const [snackPacks, setSnackPacks] = useState<CountsByPeriod>(defaultCounts)

    const refetch = useCallback(async () => {
        try {
            const date = new Date()
            const data = await getAllCheckInCounts(date)
            setHygieneKits({
                day: data.day['Hygiene Kit'] ?? 0,
                month: data.month['Hygiene Kit'] ?? 0,
                year: data.year['Hygiene Kit'] ?? 0,
            })
            setHotMeals({
                day: data.day['Hot Meal'] ?? 0,
                month: data.month['Hot Meal'] ?? 0,
                year: data.year['Hot Meal'] ?? 0,
            })
            setSnackPacks({
                day: data.day['Snack Pack'] ?? 0,
                month: data.month['Snack Pack'] ?? 0,
                year: data.year['Snack Pack'] ?? 0,
            })
        } catch (error) {
            console.error('Failed to fetch check-in counts:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        refetch()
    }, [refetch])

    const increment = useCallback(
        (item: 'hygieneKits' | 'hotMeals' | 'snackPacks') => {
            const now = new Date()
            if (item === 'hygieneKits') {
                setHygieneKits((prev) => ({
                    day: prev.day + 1,
                    month: prev.month + 1,
                    year: prev.year + 1,
                }))
                incrementCheckInCount(CheckInCategory.enum['Hygiene Kit'], now)
            } else if (item === 'hotMeals') {
                setHotMeals((prev) => ({
                    day: prev.day + 1,
                    month: prev.month + 1,
                    year: prev.year + 1,
                }))
                incrementCheckInCount(CheckInCategory.enum['Hot Meal'], now)
            } else if (item === 'snackPacks') {
                setSnackPacks((prev) => ({
                    day: prev.day + 1,
                    month: prev.month + 1,
                    year: prev.year + 1,
                }))
                incrementCheckInCount(CheckInCategory.enum['Snack Pack'], now)
            }
        },
        []
    )

    const decrement = useCallback(
        (item: 'hygieneKits' | 'hotMeals' | 'snackPacks') => {
            const now = new Date()
            if (item === 'hygieneKits') {
                setHygieneKits((prev) => ({
                    day: prev.day - 1,
                    month: prev.month - 1,
                    year: prev.year - 1,
                }))
                incrementCheckInCount(CheckInCategory.enum['Hygiene Kit'], now, -1)
            } else if (item === 'hotMeals') {
                setHotMeals((prev) => ({
                    day: prev.day - 1,
                    month: prev.month - 1,
                    year: prev.year - 1,
                }))
                incrementCheckInCount(CheckInCategory.enum['Hot Meal'], now, -1)
            } else if (item === 'snackPacks') {
                setSnackPacks((prev) => ({
                    day: prev.day - 1,
                    month: prev.month - 1,
                    year: prev.year - 1,
                }))
                incrementCheckInCount(CheckInCategory.enum['Snack Pack'], now, -1)
            }
        },
        []
    )

    const value: CheckInCountContextType = {
        hygieneKits,
        hotMeals,
        snackPacks,
        isLoading,
        increment,
        decrement,
        refetch,
    }

    return (
        <CheckInCountContext.Provider value={value}>
            {children}
        </CheckInCountContext.Provider>
    )
}

export function useCheckInCount() {
    const context = useContext(CheckInCountContext)
    if (context === undefined) {
        throw new Error('useCheckInCount must be used within a CheckInCountProvider')
    }
    return context
}
