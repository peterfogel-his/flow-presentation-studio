-- Create presentations table
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  description TEXT,
  settings JSONB DEFAULT '{"theme": "light", "transition": "fade"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create slides (stops) table
CREATE TABLE public.slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  background_type TEXT DEFAULT 'color',
  background_value TEXT DEFAULT '#ffffff',
  transition_type TEXT DEFAULT 'fade',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocks table for content within slides
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slide_id UUID NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  animation_type TEXT DEFAULT 'none',
  animation_settings JSONB DEFAULT '{"duration": 500, "delay": 0}'::jsonb,
  layout_settings JSONB DEFAULT '{"width": "100%", "alignment": "center"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create media_assets table
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

-- Enable RLS on all tables
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Presentations policies
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

-- Slides policies (based on presentation ownership)
CREATE POLICY "Users can view slides of their presentations"
  ON public.slides FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.presentations
    WHERE presentations.id = slides.presentation_id
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create slides in their presentations"
  ON public.slides FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.presentations
    WHERE presentations.id = slides.presentation_id
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update slides in their presentations"
  ON public.slides FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.presentations
    WHERE presentations.id = slides.presentation_id
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete slides in their presentations"
  ON public.slides FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.presentations
    WHERE presentations.id = slides.presentation_id
    AND presentations.user_id = auth.uid()
  ));

-- Blocks policies (based on slide/presentation ownership)
CREATE POLICY "Users can view blocks of their slides"
  ON public.blocks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.presentations ON presentations.id = slides.presentation_id
    WHERE slides.id = blocks.slide_id
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create blocks in their slides"
  ON public.blocks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.presentations ON presentations.id = slides.presentation_id
    WHERE slides.id = blocks.slide_id
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update blocks in their slides"
  ON public.blocks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.presentations ON presentations.id = slides.presentation_id
    WHERE slides.id = blocks.slide_id
    AND presentations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete blocks in their slides"
  ON public.blocks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.presentations ON presentations.id = slides.presentation_id
    WHERE slides.id = blocks.slide_id
    AND presentations.user_id = auth.uid()
  ));

-- Media assets policies
CREATE POLICY "Users can view their own media assets"
  ON public.media_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own media assets"
  ON public.media_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media assets"
  ON public.media_assets FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_presentations_user_id ON public.presentations(user_id);
CREATE INDEX idx_slides_presentation_id ON public.slides(presentation_id);
CREATE INDEX idx_slides_position ON public.slides(presentation_id, position);
CREATE INDEX idx_blocks_slide_id ON public.blocks(slide_id);
CREATE INDEX idx_blocks_position ON public.blocks(slide_id, position);
CREATE INDEX idx_media_assets_user_id ON public.media_assets(user_id);