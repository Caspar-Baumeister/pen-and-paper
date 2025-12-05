import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AppCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
}

export function AppCard({
  title,
  description,
  children,
  footer,
  className,
  headerClassName,
  contentClassName,
  icon
}: AppCardProps) {
  return (
    <Card className={cn(
      'bg-card border-border shadow-lg shadow-black/10',
      'hover:shadow-xl hover:shadow-black/15 transition-shadow duration-200',
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn('pb-3', headerClassName)}>
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
          </div>
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(contentClassName)}>
        {children}
      </CardContent>
      {footer && <CardFooter className="pt-3">{footer}</CardFooter>}
    </Card>
  )
}

