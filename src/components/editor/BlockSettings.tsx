import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Sparkles, Layers } from 'lucide-react';
import type { Block, AnimationSettings, LayoutSettings } from '@/types/block';
import type { Json } from '@/integrations/supabase/types';

interface BlockSettingsProps {
  block: Block | null;
  onUpdate: (updates: Partial<Block>) => void;
}

export function BlockSettings({ block, onUpdate }: BlockSettingsProps) {
  if (!block) {
    return (
      <aside className="w-72 border-l border-border bg-card p-4">
        <p className="text-sm text-muted-foreground text-center mt-8">
          Välj ett block för att se inställningar
        </p>
      </aside>
    );
  }

  const animationSettings: AnimationSettings = {
    type: 'slide-up',
    delay: 0,
    duration: 500,
    ...((block.animation_settings as Record<string, unknown>) || {}),
  } as AnimationSettings;

  const layoutSettings: LayoutSettings = {
    alignment: 'center',
    width: '100%',
    ...((block.layout_settings as Record<string, unknown>) || {}),
  } as LayoutSettings;

  const updateAnimation = (updates: Partial<AnimationSettings>) => {
    onUpdate({
      animation_settings: { ...animationSettings, ...updates } as unknown as Json,
    });
  };

  const updateLayout = (updates: Partial<LayoutSettings>) => {
    onUpdate({
      layout_settings: { ...layoutSettings, ...updates } as unknown as Json,
    });
  };

  return (
    <aside className="w-72 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Blockinställningar</h3>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{block.type}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Navigation mode settings */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Navigationsläge
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Läge</Label>
            <Select
              value={block.navigation_mode || 'none'}
              onValueChange={(value) => onUpdate({ 
                navigation_mode: value as 'stop' | 'pause' | 'none',
                is_waypoint: value === 'stop' // backwards compat
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget (visas direkt)</SelectItem>
                <SelectItem value="pause">Paus (delvis stopp)</SelectItem>
                <SelectItem value="stop">Stopp (ny sektion)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {block.navigation_mode === 'stop' && 'Skapar en ny sektion med wave-transition'}
              {block.navigation_mode === 'pause' && 'Nästa tryck visar detta block'}
              {(!block.navigation_mode || block.navigation_mode === 'none') && 'Visas tillsammans med föregående'}
            </p>
          </div>

          {block.navigation_mode === 'stop' && (
            <div className="space-y-2">
              <Label htmlFor="waypoint-title" className="text-sm">
                Stopp-titel
              </Label>
              <Input
                id="waypoint-title"
                value={block.waypoint_title || ''}
                onChange={(e) => onUpdate({ waypoint_title: e.target.value })}
                placeholder="Lämna tomt för automatisk titel"
              />
            </div>
          )}
        </section>

        {/* Animation settings */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Animation
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Typ</Label>
            <Select
              value={animationSettings.type}
              onValueChange={(value) => updateAnimation({ type: value as AnimationSettings['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen</SelectItem>
                <SelectItem value="fade">Tona in</SelectItem>
                <SelectItem value="slide-left">Glid från vänster</SelectItem>
                <SelectItem value="slide-right">Glid från höger</SelectItem>
                <SelectItem value="slide-up">Glid upp</SelectItem>
                <SelectItem value="scale">Zooma in</SelectItem>
                <SelectItem value="ken-burns">Ken Burns (bild)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {animationSettings.type !== 'none' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Fördröjning: {animationSettings.delay}ms</Label>
                <Slider
                  value={[animationSettings.delay]}
                  onValueChange={([value]) => updateAnimation({ delay: value })}
                  min={0}
                  max={2000}
                  step={100}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Längd: {animationSettings.duration}ms</Label>
                <Slider
                  value={[animationSettings.duration]}
                  onValueChange={([value]) => updateAnimation({ duration: value })}
                  min={100}
                  max={2000}
                  step={100}
                />
              </div>
            </>
          )}
        </section>

        {/* Layout settings */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="h-4 w-4" />
            Layout
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Justering</Label>
            <Select
              value={layoutSettings.alignment}
              onValueChange={(value) => updateLayout({ alignment: value as LayoutSettings['alignment'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Vänster</SelectItem>
                <SelectItem value="center">Centrerat</SelectItem>
                <SelectItem value="right">Höger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Lager (djup)</Label>
            <Select
              value={block.z_index === 0 ? 'background' : block.z_index <= 5 ? 'middle' : 'foreground'}
              onValueChange={(value) => {
                const zValue = value === 'background' ? 0 : value === 'middle' ? 5 : 10;
                onUpdate({ z_index: zValue });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="background">Bakgrund (långsam parallax)</SelectItem>
                <SelectItem value="middle">Mellan (medium parallax)</SelectItem>
                <SelectItem value="foreground">Förgrund (normal hastighet)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Påverkar hur snabbt blocket rör sig vid scroll
            </p>
          </div>

          {block.type === 'image' && (
            <div className="space-y-2">
              <Label className="text-sm">Bildlayout</Label>
              <Select
                value={layoutSettings.layout || 'contained'}
                onValueChange={(value) => updateLayout({ layout: value as LayoutSettings['layout'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contained">Inramad</SelectItem>
                  <SelectItem value="full-width">Helbredd</SelectItem>
                  <SelectItem value="edge-left">Kant vänster</SelectItem>
                  <SelectItem value="edge-right">Kant höger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
