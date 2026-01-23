import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Waypoint } from '@/types/block';

interface WaypointSidebarProps {
  waypoints: Waypoint[];
  onWaypointClick: (blockId: string) => void;
}

export function WaypointSidebar({ waypoints, onWaypointClick }: WaypointSidebarProps) {
  return (
    <aside className="w-56 border-r border-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-sidebar-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Stopp
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {waypoints.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">
            Inga stopp ännu. Markera ett block som stopp för att skapa snabblänkar.
          </p>
        ) : (
          <ul className="space-y-1">
            {waypoints.map((waypoint, index) => (
              <li key={waypoint.blockId}>
                <button
                  onClick={() => onWaypointClick(waypoint.blockId)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'transition-colors duration-150',
                    'flex items-center gap-2'
                  )}
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="truncate">{waypoint.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
