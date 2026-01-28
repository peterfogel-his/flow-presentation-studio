-- Add navigation_mode column to blocks table
ALTER TABLE public.blocks 
ADD COLUMN navigation_mode TEXT NOT NULL DEFAULT 'none' 
CHECK (navigation_mode IN ('stop', 'pause', 'none'));

-- Migrate existing waypoints to 'stop' navigation mode
UPDATE public.blocks 
SET navigation_mode = 'stop' 
WHERE is_waypoint = true;