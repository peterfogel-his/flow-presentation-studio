import type { Json } from '@/integrations/supabase/types';

// Block types
export type BlockType = 'background' | 'heading' | 'text' | 'image' | 'list';

// Content types for each block
export interface BackgroundContent {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

export interface HeadingContent {
  text: string;
  level: 1 | 2 | 3;
}

export interface TextContent {
  text: string;
}

export interface ImageContent {
  src: string;
  alt: string;
}

export interface ListContent {
  items: string[];
  style: 'bullet' | 'numbered' | 'none';
}

export type BlockContent = 
  | BackgroundContent 
  | HeadingContent 
  | TextContent 
  | ImageContent 
  | ListContent;

// Layout settings
export interface LayoutSettings {
  alignment: 'left' | 'center' | 'right';
  width: string;
  position?: 'left' | 'center' | 'right';
  layout?: 'contained' | 'full-width' | 'edge-left' | 'edge-right';
}

// Animation settings
export interface AnimationSettings {
  type: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'scale' | 'ken-burns';
  delay: number;
  duration: number;
}

// Block from database
export interface Block {
  id: string;
  presentation_id: string;
  type: BlockType;
  position: number;
  content: Json;
  layout_settings: Json;
  animation_settings: Json;
  is_waypoint: boolean;
  waypoint_title: string | null;
  z_index: number;
  created_at: string;
  updated_at: string;
}

// Presentation from database
export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  settings: Json;
  created_at: string;
  updated_at: string;
}

// Waypoint for navigation
export interface Waypoint {
  blockId: string;
  title: string;
  position: number;
}

// Helper to get typed content
export function getBlockContent<T extends BlockContent>(block: Block): T {
  return (block.content || {}) as unknown as T;
}

export function getLayoutSettings(block: Block): LayoutSettings {
  const settings = block.layout_settings as Record<string, unknown> | null;
  return {
    alignment: 'center',
    width: '100%',
    ...settings,
  } as LayoutSettings;
}

export function getAnimationSettings(block: Block): AnimationSettings {
  const settings = block.animation_settings as Record<string, unknown> | null;
  return {
    type: 'slide-up',
    delay: 0,
    duration: 500,
    ...settings,
  } as AnimationSettings;
}
