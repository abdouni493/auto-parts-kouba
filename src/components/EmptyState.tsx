import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl mb-2 text-center">{title}</CardTitle>
        <CardDescription className="text-center mb-4 max-w-sm">
          {description}
        </CardDescription>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gradient-primary">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}