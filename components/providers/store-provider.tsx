'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store/useAppStore'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initializeFromServer = useAppStore((state) => state.initializeFromServer)

  useEffect(() => {
    initializeFromServer()
  }, [initializeFromServer])

  return <>{children}</>
}

