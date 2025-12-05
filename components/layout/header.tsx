'use client'

import { useAppStore } from '@/lib/store/useAppStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { MobileNav } from './mobile-nav'

export function Header() {
  const { currentArea, setCurrentArea, areas, isLoading } = useAppStore()

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <MobileNav />
          <h1 className="text-lg lg:text-xl font-semibold text-foreground">
            Pen-&-Paper-Leitstand
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground">Aktuelles Gebiet:</span>
          <Select
            value={currentArea}
            onValueChange={setCurrentArea}
            disabled={isLoading || areas.length === 0}
          >
            <SelectTrigger className="w-36 lg:w-44 bg-secondary border-border">
              <SelectValue placeholder="Gebiet wählen …" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  <span className="flex items-center gap-2">
                    <span>{area.icon}</span>
                    <span>{area.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
