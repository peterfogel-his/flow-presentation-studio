import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Heading1,
  Type,
  Image,
  List,
  Palette,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockRenderer } from './BlockRenderer';
import type { Block, BlockType } from '@/types/block';
import type { Json } from '@/integrations/supabase/types';

interface BlockCanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onBlockCreate: (type: BlockType, afterPosition: number) => void;
  onBlockUpdate: (blockId: string, updates: Partial<Block>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockMove: (blockId: string, direction: 'up' | 'down') => void;
  onImageUpload: (blockId: string, file: File) => void;
}

const blockTypeConfig: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'background', label: 'Bakgrund', icon: <Palette className="h-4 w-4" /> },
  { type: 'heading', label: 'Rubrik', icon: <Heading1 className="h-4 w-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { type: 'image', label: 'Bild', icon: <Image className="h-4 w-4" /> },
  { type: 'list', label: 'Lista', icon: <List className="h-4 w-4" /> },
];

export function BlockCanvas({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
  onBlockMove,
  onImageUpload,
}: BlockCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadBlockId = useRef<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadBlockId.current) {
      onImageUpload(activeUploadBlockId.current, file);
    }
    e.target.value = '';
  };

  const triggerImageUpload = (blockId: string) => {
    activeUploadBlockId.current = blockId;
    fileInputRef.current?.click();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-2">
        {/* Add block at start if empty or always show */}
        <AddBlockButton position={-1} onCreate={onBlockCreate} />

        {blocks.map((block, index) => (
          <div key={block.id} id={`block-${block.id}`}>
            <div
              className={cn(
                'group relative rounded-lg transition-all duration-200',
                selectedBlockId === block.id
                  ? 'ring-2 ring-primary shadow-md'
                  : 'hover:ring-1 hover:ring-border'
              )}
              onClick={() => onBlockSelect(block.id)}
            >
              {/* Block toolbar - left side */}
              <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockMove(block.id, 'up');
                  }}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockMove(block.id, 'down');
                  }}
                  disabled={index === blocks.length - 1}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Delete button - right side */}
              <div className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockDelete(block.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {/* Block content */}
              <div className="p-3 bg-card rounded-lg">
                <BlockRenderer
                  block={block}
                  onUpdate={(content) =>
                    onBlockUpdate(block.id, { content: content as Json })
                  }
                  onImageUpload={() => triggerImageUpload(block.id)}
                />
              </div>
            </div>

            {/* Add block button after each block */}
            <AddBlockButton position={block.position} onCreate={onBlockCreate} />
          </div>
        ))}
      </div>
    </main>
  );
}

function AddBlockButton({
  position,
  onCreate,
}: {
  position: number;
  onCreate: (type: BlockType, afterPosition: number) => void;
}) {
  return (
    <div className="flex justify-center py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
          >
            <Plus className="h-4 w-4 mr-1" />
            Lägg till
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {blockTypeConfig.map(({ type, label, icon }) => (
            <DropdownMenuItem key={type} onClick={() => onCreate(type, position)}>
              {icon}
              <span className="ml-2">{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
