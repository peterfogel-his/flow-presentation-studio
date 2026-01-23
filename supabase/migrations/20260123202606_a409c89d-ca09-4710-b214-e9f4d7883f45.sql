-- ========================================
-- FlowDeck 2.0: Block-based presentation model
-- ========================================

-- First, drop existing tables that use the old slide-based model
-- (we're starting fresh with a new architecture)
DROP TABLE IF EXISTS public.blocks CASCADE;
DROP TABLE IF EXISTS public.slides CASCADE;
DROP TABLE IF EXISTS public.presentations CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;

-- ========================================
-- Table: presentations
-- ========================================
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  description TEXT,
  settings JSONB DEFAULT '{"theme": "light"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- RLS policies for presentations
CREATE POLICY "Users can view their own presentations" 
  ON public.presentations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presentations" 
  ON public.presentations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations" 
  ON public.presentations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations" 
  ON public.presentations FOR DELETE 
  USING (auth.uid() = user_id);

-- ========================================
-- Table: blocks
-- Core of the new architecture - everything is a block
-- ========================================
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text',
  position INTEGER NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_settings JSONB DEFAULT '{"alignment": "center", "width": "100%"}'::jsonb,
  animation_settings JSONB DEFAULT '{"type": "none", "delay": 0, "duration": 500}'::jsonb,
  is_waypoint BOOLEAN NOT NULL DEFAULT false,
  waypoint_title TEXT,
  z_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocks
CREATE POLICY "Users can view blocks of their presentations" 
  ON public.blocks FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = blocks.presentation_id 
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create blocks in their presentations" 
  ON public.blocks FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = blocks.presentation_id 
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update blocks in their presentations" 
  ON public.blocks FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = blocks.presentation_id 
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete blocks in their presentations" 
  ON public.blocks FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.presentations 
    WHERE presentations.id = blocks.presentation_id 
    AND presentations.user_id = auth.uid()
  ));

-- Index for fast block ordering
CREATE INDEX idx_blocks_presentation_position ON public.blocks(presentation_id, position);
CREATE INDEX idx_blocks_waypoints ON public.blocks(presentation_id, is_waypoint) WHERE is_waypoint = true;

-- ========================================
-- Table: media_assets (recreate for file storage)
-- ========================================
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_assets
CREATE POLICY "Users can view their own media assets" 
  ON public.media_assets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own media assets" 
  ON public.media_assets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media assets" 
  ON public.media_assets FOR DELETE 
  USING (auth.uid() = user_id);

-- ========================================
-- Trigger for updated_at
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();