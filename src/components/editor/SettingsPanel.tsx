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
    };
  };

  return (
    <div className="w-64 editor-panel border-l h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Slide settings */}
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
                onValueChange={(value) => onSlideUpdate({ background_type: value })}
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

          {/* Block settings (when a block is selected) */}
          {selectedBlock && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Block-inställningar</h3>

                <div className="space-y-2">
                  <Label className="text-xs">Animation</Label>
                  <Select
                    value={selectedBlock.animation_type}
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
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
