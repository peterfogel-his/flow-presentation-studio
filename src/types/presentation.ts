import type { Json } from '@/integrations/supabase/types';

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: string;
  presentation_id: string;
  position: number;
  title: string | null;
  background_type: string;
  background_value: string;
  transition_type: string;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  slide_id: string;
  type: string;
  content: Json;
  position: number;
  animation_type: string;
  animation_settings: Json;
  layout_settings: Json;
  created_at: string;
  updated_at: string;
}

// Helper types for content
export interface BlockContent {
  text?: string;
  src?: string;
  alt?: string;
  level?: number;
  children?: Block[];
}

export interface AnimationSettings {
  duration: number;
  delay: number;
}

export interface LayoutSettings {
  width: string;
  alignment: 'left' | 'center' | 'right';
  // Image layout for edge-to-edge options
  imageLayout?: 'default' | 'full-width' | 'left-edge' | 'right-edge';
  // Parallax and depth settings
  parallaxSpeed?: number; // 0 = static, 0.5 = slow, 1 = normal
  zIndex?: number; // Layer depth 1-5
}

export interface MediaAsset {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  metadata: Json;
  created_at: string;
}
