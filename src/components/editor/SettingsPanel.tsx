import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Slide, Block, LayoutSettings } from '@/types/presentation';

interface SettingsPanelProps {
  slide: Slide | null;
  selectedBlock: Block | null;
  onSlideUpdate: (updates: Partial<Slide>) => void;
  onBlockUpdate: (id: string, updates: Partial<Block>) => void;
}

// Gradient helper functions
const getGradientColor = (value: string | null, index: number): string => {
  if (!value) return index === 0 ? '#4f46e5' : '#7c3aed';
  const colors = value.match(/#[0-9a-fA-F]{6}/g);
  return colors?.[index] || (index === 0 ? '#4f46e5' : '#7c3aed');
};

const getGradientDirection = (value: string | null): string => {
  if (!value) return 'to-bottom';
  if (value.includes('to right')) return 'to-right';
  if (value.includes('to left')) return 'to-left';
  if (value.includes('to top right')) return 'to-top-right';
  if (value.includes('to bottom right')) return 'to-bottom-right';
  if (value.includes('to top')) return 'to-top';
  return 'to-bottom';
};

const buildGradientValue = (direction: string, color1: string, color2: string): string => {
  const cssDirection = direction.replace(/-/g, ' ');
  return `linear-gradient(${cssDirection}, ${color1}, ${color2})`;
};

export function SettingsPanel({
  slide,
  selectedBlock,
  onSlideUpdate,
  onBlockUpdate,
}: SettingsPanelProps) {
  if (!slide) {
    return (
      <div className="w-64 editor-panel p-4">
        <p className="text-sm text-muted-foreground">Välj ett stopp för att redigera</p>
      </div>
    );
  }

  const getLayoutSettings = (block: Block): LayoutSettings => {
    const settings = block.layout_settings as Record<string, unknown> | null;
    return {
      width: (settings?.width as string) || '100%',
      alignment: (settings?.alignment as 'left' | 'center' | 'right') || 'center',
      imageLayout: (settings?.imageLayout as 'default' | 'full-width' | 'left-edge' | 'right-edge') || 'default',
      parallaxSpeed: (settings?.parallaxSpeed as number) ?? 1,
      zIndex: (settings?.zIndex as number) ?? 1,
      showTextBackground: (settings?.showTextBackground as boolean) ?? false,
    };
  };

  const updateGradientColor = (index: number, color: string) => {
    const currentColors = [
      getGradientColor(slide.background_value, 0),
      getGradientColor(slide.background_value, 1)
    ];
    currentColors[index] = color;
    const direction = getGradientDirection(slide.background_value);
    onSlideUpdate({ 
      background_value: buildGradientValue(direction, currentColors[0], currentColors[1])
    });
  };

  const updateGradientDirection = (direction: string) => {
    const colors = [
      getGradientColor(slide.background_value, 0),
      getGradientColor(slide.background_value, 1)
    ];
    onSlideUpdate({ 
      background_value: buildGradientValue(direction, colors[0], colors[1])
    });
  };

  // Show slide settings when no block is selected, block settings when a block is selected
  const showSlideSettings = !selectedBlock;

  return (
    <div className="w-64 editor-panel border-l h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Slide settings - only when no block is selected */}
          {showSlideSettings && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Stopp-inställningar</h3>
              
              <div className="space-y-2">
                <Label className="text-xs">Titel</Label>
                <Input
                  value={slide.title || ''}
                  onChange={(e) => onSlideUpdate({ title: e.target.value })}
                  placeholder="Titel..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Bakgrund</Label>
                <Select
                  value={slide.background_type}
                  onValueChange={(value) => {
                    // Set default values when changing type
                    let defaultValue = '';
                    if (value === 'color') {
                      defaultValue = '#ffffff';
                    } else if (value === 'gradient') {
                      defaultValue = 'linear-gradient(to bottom, #4f46e5, #7c3aed)';
                    }
                    onSlideUpdate({ background_type: value, background_value: defaultValue });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Färg</SelectItem>
                    <SelectItem value="image">Bild</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {slide.background_type === 'color' && (
                <div className="space-y-2">
                  <Label className="text-xs">Bakgrundsfärg</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={slide.background_value || '#ffffff'}
                      onChange={(e) => onSlideUpdate({ background_value: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={slide.background_value || '#ffffff'}
                      onChange={(e) => onSlideUpdate({ background_value: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              {slide.background_type === 'gradient' && (
                <div className="space-y-3">
                  <Label className="text-xs">Gradient-färger</Label>
                  
                  {/* Start color */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Startfärg</span>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={getGradientColor(slide.background_value, 0)}
                        onChange={(e) => updateGradientColor(0, e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={getGradientColor(slide.background_value, 0)}
                        onChange={(e) => updateGradientColor(0, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* End color */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Slutfärg</span>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={getGradientColor(slide.background_value, 1)}
                        onChange={(e) => updateGradientColor(1, e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={getGradientColor(slide.background_value, 1)}
                        onChange={(e) => updateGradientColor(1, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Direction */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Riktning</span>
                    <Select
                      value={getGradientDirection(slide.background_value)}
                      onValueChange={updateGradientDirection}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to-bottom">Uppifrån och ner ↓</SelectItem>
                        <SelectItem value="to-top">Nedifrån och upp ↑</SelectItem>
                        <SelectItem value="to-right">Vänster till höger →</SelectItem>
                        <SelectItem value="to-left">Höger till vänster ←</SelectItem>
                        <SelectItem value="to-bottom-right">Diagonal ↘</SelectItem>
                        <SelectItem value="to-top-right">Diagonal ↗</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Live preview */}
                  <div 
                    className="h-12 rounded-md border"
                    style={{ 
                      background: slide.background_value || 'linear-gradient(to bottom, #4f46e5, #7c3aed)' 
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Övergång</Label>
                <Select
                  value={slide.transition_type}
                  onValueChange={(value) => onSlideUpdate({ transition_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Tona</SelectItem>
                    <SelectItem value="slide-left">Glid vänster</SelectItem>
                    <SelectItem value="slide-right">Glid höger</SelectItem>
                    <SelectItem value="slide-up">Glid upp</SelectItem>
                    <SelectItem value="none">Ingen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Block settings - only when a block is selected */}
          {selectedBlock && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Block-inställningar</h3>
                <span className="text-xs text-muted-foreground capitalize">{selectedBlock.type}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Animation</Label>
                <Select
                  value={selectedBlock.animation_type || 'none'}
                  onValueChange={(value) => 
                    onBlockUpdate(selectedBlock.id, { animation_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen</SelectItem>
                    <SelectItem value="fade">Tona in</SelectItem>
                    <SelectItem value="slide-left">Glid från vänster</SelectItem>
                    <SelectItem value="slide-right">Glid från höger</SelectItem>
                    <SelectItem value="slide-up">Glid uppåt</SelectItem>
                    <SelectItem value="ken-burns">Ken Burns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Justering</Label>
                <Select
                  value={getLayoutSettings(selectedBlock).alignment}
                  onValueChange={(value) => 
                    onBlockUpdate(selectedBlock.id, { 
                      layout_settings: { 
                        ...getLayoutSettings(selectedBlock), 
                        alignment: value as 'left' | 'center' | 'right' 
                      } 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Vänster</SelectItem>
                    <SelectItem value="center">Centrerad</SelectItem>
                    <SelectItem value="right">Höger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image-specific layout options */}
              {selectedBlock.type === 'image' && (
                <div className="space-y-2">
                  <Label className="text-xs">Bildlayout</Label>
                  <Select
                    value={getLayoutSettings(selectedBlock).imageLayout || 'default'}
                    onValueChange={(value) => 
                      onBlockUpdate(selectedBlock.id, { 
                        layout_settings: { 
                          ...getLayoutSettings(selectedBlock), 
                          imageLayout: value as 'default' | 'full-width' | 'left-edge' | 'right-edge'
                        } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard</SelectItem>
                      <SelectItem value="full-width">Helbild</SelectItem>
                      <SelectItem value="left-edge">Vänsterkant</SelectItem>
                      <SelectItem value="right-edge">Högerkant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Text contrast background - for text blocks */}
              {(selectedBlock.type === 'heading' || selectedBlock.type === 'text') && (
                <div className="space-y-2">
                  <Label className="text-xs">Kontrastbakgrund</Label>
                  <Select
                    value={getLayoutSettings(selectedBlock).showTextBackground ? 'on' : 'off'}
                    onValueChange={(value) => 
                      onBlockUpdate(selectedBlock.id, { 
                        layout_settings: { 
                          ...getLayoutSettings(selectedBlock), 
                          showTextBackground: value === 'on'
                        } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Av</SelectItem>
                      <SelectItem value="on">På (halvtransparent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />
              
              <h4 className="font-medium text-xs text-muted-foreground">Djup & Rörelse</h4>

              <div className="space-y-2">
                <Label className="text-xs">Parallax-effekt</Label>
                <Select
                  value={String(getLayoutSettings(selectedBlock).parallaxSpeed ?? 1)}
                  onValueChange={(value) => 
                    onBlockUpdate(selectedBlock.id, { 
                      layout_settings: { 
                        ...getLayoutSettings(selectedBlock), 
                        parallaxSpeed: parseFloat(value)
                      } 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Statisk (följer bakgrund)</SelectItem>
                    <SelectItem value="0.3">Långsam (djupkänsla)</SelectItem>
                    <SelectItem value="0.6">Medium</SelectItem>
                    <SelectItem value="1">Normal (ingen parallax)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Lager (Z-djup)</Label>
                <Select
                  value={String(getLayoutSettings(selectedBlock).zIndex ?? 1)}
                  onValueChange={(value) => 
                    onBlockUpdate(selectedBlock.id, { 
                      layout_settings: { 
                        ...getLayoutSettings(selectedBlock), 
                        zIndex: parseInt(value)
                      } 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Bakgrund</SelectItem>
                    <SelectItem value="1">Standard</SelectItem>
                    <SelectItem value="2">Mellan</SelectItem>
                    <SelectItem value="3">Förgrund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
