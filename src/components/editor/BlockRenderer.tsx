import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image, Upload, Plus, Trash2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Block } from '@/types/block';

interface BackgroundContent {
  type: 'color' | 'gradient' | 'image';
  value: string;
}

interface HeadingContent {
  text: string;
  level: 1 | 2 | 3;
}

interface TextContent {
  text: string;
}

interface ImageContent {
  src: string;
  alt: string;
}

interface ListContent {
  items: string[];
  style: 'bullet' | 'numbered' | 'none';
}

interface BlockRendererProps {
  block: Block;
  onUpdate: (content: Record<string, unknown>) => void;
  onImageUpload: () => void;
}

export function BlockRenderer({ block, onUpdate, onImageUpload }: BlockRendererProps) {
  const content = block.content as Record<string, unknown>;

  switch (block.type) {
    case 'background':
      return <BackgroundBlock content={content as unknown as BackgroundContent} onUpdate={onUpdate} />;
    case 'heading':
      return <HeadingBlock content={content as unknown as HeadingContent} onUpdate={onUpdate} />;
    case 'text':
      return <TextBlock content={content as unknown as TextContent} onUpdate={onUpdate} />;
    case 'image':
      return (
        <ImageBlock
          content={content as unknown as ImageContent}
          onUpdate={onUpdate}
          onUpload={onImageUpload}
        />
      );
    case 'list':
      return <ListBlock content={content as unknown as ListContent} onUpdate={onUpdate} />;
    default:
      return (
        <div className="p-4 bg-muted rounded text-muted-foreground text-center">
          Okänd blocktyp: {block.type}
        </div>
      );
  }
}

function BackgroundBlock({
  content,
  onUpdate,
}: {
  content: BackgroundContent;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const bgType = content?.type || 'color';
  const bgValue = content?.value || '#ffffff';

  return (
    <div className="flex items-center gap-4 p-2">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Bakgrund</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={bgType}
          onChange={(e) => {
            const newType = e.target.value;
            // Provide sensible defaults when switching types
            const newValue = newType === 'color' ? '#ffffff' 
              : newType === 'gradient' ? 'linear-gradient(135deg, #667eea, #764ba2)' 
              : '';
            onUpdate({ type: newType, value: newValue });
          }}
          className="text-sm border rounded px-2 py-1 bg-background"
        >
          <option value="color">Färg</option>
          <option value="gradient">Gradient</option>
          <option value="image">Bild</option>
        </select>

        {bgType === 'color' && (
          <input
            type="color"
            value={bgValue}
            onChange={(e) => onUpdate({ type: 'color', value: e.target.value })}
            className="h-8 w-12 rounded cursor-pointer"
          />
        )}

        {bgType === 'gradient' && (
          <Input
            value={bgValue}
            onChange={(e) => onUpdate({ type: 'gradient', value: e.target.value })}
            placeholder="linear-gradient(135deg, #667eea, #764ba2)"
            className="w-64 text-sm"
          />
        )}

        {bgType === 'image' && (
          <Input
            value={bgValue}
            onChange={(e) => onUpdate({ type: 'image', value: e.target.value })}
            placeholder="https://..."
            className="w-64 text-sm"
          />
        )}
      </div>

      {/* Preview */}
      <div
        className="w-16 h-8 rounded border"
        style={{
          background:
            bgType === 'color'
              ? bgValue
              : bgType === 'gradient'
              ? bgValue
              : `url(${bgValue}) center/cover`,
        }}
      />
    </div>
  );
}

function HeadingBlock({
  content,
  onUpdate,
}: {
  content: HeadingContent;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const text = content?.text || '';
  const level = content?.level || 1;

  return (
    <div className="flex items-start gap-2">
      <select
        value={level}
        onChange={(e) => onUpdate({ text, level: Number(e.target.value) })}
        className="text-sm border rounded px-2 py-1 bg-background mt-1"
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
      <Input
        value={text}
        onChange={(e) => onUpdate({ text: e.target.value, level })}
        placeholder="Skriv rubrik..."
        className={cn(
          'border-none bg-transparent focus-visible:ring-0 px-0 flex-1',
          level === 1 && 'text-3xl font-bold',
          level === 2 && 'text-2xl font-semibold',
          level === 3 && 'text-xl font-medium'
        )}
      />
    </div>
  );
}

function TextBlock({
  content,
  onUpdate,
}: {
  content: TextContent;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const text = content?.text || '';

  return (
    <Textarea
      value={text}
      onChange={(e) => onUpdate({ text: e.target.value })}
      placeholder="Skriv text..."
      className="border-none bg-transparent focus-visible:ring-0 px-0 resize-none min-h-[60px]"
    />
  );
}

function ImageBlock({
  content,
  onUpdate,
  onUpload,
}: {
  content: ImageContent;
  onUpdate: (content: Record<string, unknown>) => void;
  onUpload: () => void;
}) {
  const src = content?.src || '';
  const alt = content?.alt || '';

  if (!src) {
    return (
      <div
        className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={onUpload}
      >
        <Image className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Klicka för att lägga till bild</span>
      </div>
    );
  }

  return (
    <div className="relative group/image">
      <img src={src} alt={alt} className="max-w-full rounded-lg" />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity flex gap-2">
        <Input
          value={alt}
          onChange={(e) => onUpdate({ src, alt: e.target.value })}
          placeholder="Alt-text..."
          className="w-40 h-8 text-sm bg-background/90"
          onClick={(e) => e.stopPropagation()}
        />
        <Button variant="secondary" size="sm" onClick={onUpload}>
          <Upload className="h-4 w-4 mr-1" />
          Byt
        </Button>
      </div>
    </div>
  );
}

function ListBlock({
  content,
  onUpdate,
}: {
  content: ListContent;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const items = content?.items || [''];
  const style = content?.style || 'bullet';

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onUpdate({ items: newItems, style });
  };

  const addItem = () => {
    onUpdate({ items: [...items, ''], style });
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    onUpdate({ items: newItems, style });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={style}
          onChange={(e) => onUpdate({ items, style: e.target.value })}
          className="text-sm border rounded px-2 py-1 bg-background"
        >
          <option value="bullet">Punktlista</option>
          <option value="numbered">Numrerad</option>
          <option value="none">Ingen</option>
        </select>
      </div>

      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-6 text-muted-foreground text-sm">
              {style === 'bullet' && '•'}
              {style === 'numbered' && `${index + 1}.`}
            </span>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder="Listpunkt..."
              className="flex-1 border-none bg-transparent focus-visible:ring-0 px-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-100"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>

      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" />
        Lägg till rad
      </Button>
    </div>
  );
}
