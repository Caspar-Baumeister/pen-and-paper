'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Skull,
  BookOpen,
  Dices,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
  {
    title: 'Übersicht',
    href: '/',
    icon: LayoutDashboard
  },
  {
    title: 'Charaktere',
    href: '/characters',
    icon: UserPlus
  },
  {
    title: 'NPC-Generator',
    href: '/npcs',
    icon: Users
  },
  {
    title: 'Monstergenerator',
    href: '/monsters',
    icon: Skull
  },
  {
    title: 'Bestiarium',
    href: '/bestiary',
    icon: BookOpen
  },
  {
    title: 'Eigene Tabellen',
    href: '/tables',
    icon: Dices
  },
  {
    title: 'Einstellungen',
    href: '/settings',
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            <span className="font-semibold text-sidebar-foreground">P&P Helfer</span>
          </div>
        )}
        {isCollapsed && <span className="text-2xl mx-auto">🎲</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground',
                isCollapsed && 'justify-center'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'w-full text-sidebar-foreground hover:bg-sidebar-accent',
            isCollapsed && 'px-2'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Einklappen
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
