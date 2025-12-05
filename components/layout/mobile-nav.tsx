'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Skull,
  BookOpen,
  Dices,
  Settings,
  Menu,
  UserPlus,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
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

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menü öffnen</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar border-sidebar-border p-0">
        <SheetHeader className="h-16 px-4 border-b border-sidebar-border flex flex-row items-center">
          <span className="text-2xl">🎲</span>
          <SheetTitle className="text-sidebar-foreground ml-2">P&P Helfer</SheetTitle>
        </SheetHeader>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
