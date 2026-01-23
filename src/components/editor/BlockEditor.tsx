import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Type, 
  Heading1, 
  Image, 
  Plus,
  GripVertical,
  Trash2,
  Settings2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Block, BlockContent } from '@/types/presentation';
import type { Json } from '@/integrations/supabase/types';

interface BlockEditorProps {
  blocks: Block[];
  onBlockCreate: (type: string) => void;
  onBlockUpdate: (id: string, content: Json) => void;
  onBlockDelete: (id: string) => void;
  onBlockSettings: (block: Block) => void;
}

const blockTypeIcons: Record<string, typeof Type> = {
  text: Type,
  heading: Heading1,
  image: Image,
  video: Image,
  container: Settings2,
};

const blockTypeLabels: Record<string, string> = {
  text: 'Text',
  heading: 'Rubrik',
  image: 'Bild',
  video: 'Video',
  container: 'Container',
};

export function BlockEditor({
  blocks,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
  onBlockSettings,
}: BlockEditorProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const getContent = (block: Block): BlockContent => {
    return (block.content || {}) as BlockContent;
  };

  const renderBlock = (block: Block) => {
    const content = getContent(block);

    switch (block.type) {
      case 'heading':
        return (
          <Input
            value={content.text || ''}
            onChange={(e) => onBlockUpdate(block.id, { text: e.target.value, level: content.level } as unknown as Json)}
            placeholder="Lägg till rubrik..."
            className={cn(
              'border-none bg-transparent focus-visible:ring-0 px-0',
              content.level === 1 && 'text-4xl font-bold',
              content.level === 2 && 'text-2xl font-semibold',
              content.level === 3 && 'text-xl font-medium'
            )}
          />
        );

      case 'text':
        return (
          <Textarea
            value={content.text || ''}
            onChange={(e) => onBlockUpdate(block.id, { text: e.target.value } as unknown as Json)}
            placeholder="Skriv något..."
            className="border-none bg-transparent focus-visible:ring-0 px-0 resize-none min-h-[60px]"
          />
        );

      case 'image':
        return (
          <div className="relative">
            {content.src ? (
              <img
                src={content.src}
                alt={content.alt || ''}
                className="max-w-full rounded-lg"
              />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors">
                <Image className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Klicka för att lägga till bild</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
            {blockTypeLabels[block.type] || block.type} block
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Börja med att lägga till innehåll</p>
            <AddBlockButton onAdd={onBlockCreate} />
          </div>
        ) : (
          <>
            {blocks.map((block) => (
              <div
                key={block.id}
                className={cn(
                  'group relative rounded-lg transition-all duration-200',
                  focusedId === block.id ? 'bg-accent/50' : 'hover:bg-accent/30'
                )}
                onFocus={() => setFocusedId(block.id)}
                onBlur={() => setFocusedId(null)}
              >
                {/* Block toolbar */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 cursor-grab"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Block actions */}
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onBlockSettings(block)}
                  >
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onBlockDelete(block.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Block content */}
                <div className="p-2">
                  {renderBlock(block)}
                </div>
              </div>
            ))}

            {/* Add block at end */}
            <div className="flex justify-center pt-4">
              <AddBlockButton onAdd={onBlockCreate} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddBlockButton({ onAdd }: { onAdd: (type: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Lägg till block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onAdd('heading')}>
          <Heading1 className="h-4 w-4 mr-2" />
          Rubrik
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd('text')}>
          <Type className="h-4 w-4 mr-2" />
          Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAdd('image')}>
          <Image className="h-4 w-4 mr-2" />
          Bild
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
