import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { SlidePanel } from '@/components/editor/SlidePanel';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { SettingsPanel } from '@/components/editor/SettingsPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Presentation, Slide, Block, BlockContent } from '@/types/presentation';
import type { Json } from '@/integrations/supabase/types';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeSlide, setActiveSlide] = useState<Slide | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch presentation data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      // Fetch presentation
      const { data: presData, error: presError } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (presError || !presData) {
        toast.error('Kunde inte hitta presentationen');
        navigate('/');
        return;
      }

      setPresentation(presData);

      // Fetch slides
      const { data: slidesData } = await supabase
        .from('slides')
        .select('*')
        .eq('presentation_id', id)
        .order('position');

      const typedSlides = slidesData || [];
      setSlides(typedSlides);
      
      if (typedSlides.length > 0) {
        setActiveSlide(typedSlides[0]);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  // Fetch blocks when active slide changes
  useEffect(() => {
    if (!activeSlide) {
      setBlocks([]);
      setSelectedBlock(null);
      return;
    }

    const fetchBlocks = async () => {
      const { data } = await supabase
        .from('blocks')
        .select('*')
        .eq('slide_id', activeSlide.id)
        .order('position');

      setBlocks(data || []);
      setSelectedBlock(null);
    };

    fetchBlocks();
  }, [activeSlide?.id]);

  // Save presentation
  const handleSave = useCallback(async () => {
    if (!presentation) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('presentations')
      .update({ 
        title: presentation.title,
        updated_at: new Date().toISOString()
      })
      .eq('id', presentation.id);

    if (error) {
      toast.error('Kunde inte spara');
    } else {
      toast.success('Sparat!');
    }
    
    setSaving(false);
  }, [presentation]);

  // Create slide
  const handleSlideCreate = async (afterPosition?: number) => {
    if (!id) return;

    const newPosition = afterPosition !== undefined ? afterPosition + 1 : slides.length;
    
    // If inserting in middle, update positions of subsequent slides
    if (afterPosition !== undefined && afterPosition < slides.length - 1) {
      const slidesToUpdate = slides.filter(s => s.position > afterPosition);
      for (const slide of slidesToUpdate) {
        await supabase
          .from('slides')
          .update({ position: slide.position + 1 })
          .eq('id', slide.id);
      }
    }

    const { data, error } = await supabase
      .from('slides')
      .insert({
        presentation_id: id,
        position: newPosition,
        title: `Stopp ${newPosition + 1}`,
      })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte skapa stopp');
    } else if (data) {
      // Refetch all slides to get correct positions
      const { data: refreshedSlides } = await supabase
        .from('slides')
        .select('*')
        .eq('presentation_id', id)
        .order('position');
      
      setSlides(refreshedSlides || []);
      setActiveSlide(data);
    }
  };

  // Duplicate slide
  const handleSlideDuplicate = async (slide: Slide) => {
    if (!id) return;

    // Create new slide after the current one
    const newPosition = slide.position + 1;
    
    // Update positions of subsequent slides
    const slidesToUpdate = slides.filter(s => s.position > slide.position);
    for (const s of slidesToUpdate) {
      await supabase
        .from('slides')
        .update({ position: s.position + 1 })
        .eq('id', s.id);
    }

    // Create the new slide
    const { data: newSlide, error: slideError } = await supabase
      .from('slides')
      .insert({
        presentation_id: id,
        position: newPosition,
        title: slide.title ? `${slide.title} (kopia)` : `Stopp ${newPosition + 1}`,
        background_type: slide.background_type,
        background_value: slide.background_value,
        transition_type: slide.transition_type,
        settings: slide.settings,
      })
      .select()
      .single();

    if (slideError || !newSlide) {
      toast.error('Kunde inte duplicera stopp');
      return;
    }

    // Fetch blocks from original slide and copy them
    const { data: originalBlocks } = await supabase
      .from('blocks')
      .select('*')
      .eq('slide_id', slide.id)
      .order('position');

    if (originalBlocks && originalBlocks.length > 0) {
      const blocksToInsert = originalBlocks.map(block => ({
        slide_id: newSlide.id,
        type: block.type,
        content: block.content,
        position: block.position,
        animation_type: block.animation_type,
        animation_settings: block.animation_settings,
        layout_settings: block.layout_settings,
      }));

      await supabase.from('blocks').insert(blocksToInsert);
    }

    // Refetch all slides
    const { data: refreshedSlides } = await supabase
      .from('slides')
      .select('*')
      .eq('presentation_id', id)
      .order('position');
    
    setSlides(refreshedSlides || []);
    setActiveSlide(newSlide);
    toast.success('Stopp duplicerat!');
  };

  // Delete slide
  const handleSlideDelete = async (slideId: string) => {
    if (slides.length <= 1) {
      toast.error('Du måste ha minst ett stopp');
      return;
    }

    const { error } = await supabase
      .from('slides')
      .delete()
      .eq('id', slideId);

    if (error) {
      toast.error('Kunde inte ta bort stopp');
    } else {
      const newSlides = slides.filter((s) => s.id !== slideId);
      setSlides(newSlides);
      
      if (activeSlide?.id === slideId) {
        setActiveSlide(newSlides[0] || null);
      }
    }
  };

  // Update slide
  const handleSlideUpdate = async (updates: Partial<Slide>) => {
    if (!activeSlide) return;

    const updatedSlide = { ...activeSlide, ...updates };
    setActiveSlide(updatedSlide);
    setSlides(slides.map((s) => s.id === activeSlide.id ? updatedSlide : s));

    const { title, background_type, background_value, transition_type } = updates;
    const dbUpdates: Record<string, unknown> = {};
    if (title !== undefined) dbUpdates.title = title;
    if (background_type !== undefined) dbUpdates.background_type = background_type;
    if (background_value !== undefined) dbUpdates.background_value = background_value;
    if (transition_type !== undefined) dbUpdates.transition_type = transition_type;

    await supabase
      .from('slides')
      .update(dbUpdates)
      .eq('id', activeSlide.id);
  };

  // Create block
  const handleBlockCreate = async (type: string) => {
    if (!activeSlide) return;

    const newPosition = blocks.length;
    const content: BlockContent = type === 'heading' 
      ? { text: '', level: 1 } 
      : type === 'text' 
      ? { text: '' } 
      : {};

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        slide_id: activeSlide.id,
        type,
        content: content as Json,
        position: newPosition,
      })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte skapa block');
    } else if (data) {
      setBlocks([...blocks, data]);
      setSelectedBlock(data);
    }
  };

  // Update block content
  const handleBlockContentUpdate = async (blockId: string, content: Json) => {
    const updatedBlocks = blocks.map((b) => b.id === blockId ? { ...b, content } : b);
    setBlocks(updatedBlocks);
    
    // Update selected block if it's the one being edited
    if (selectedBlock?.id === blockId) {
      setSelectedBlock({ ...selectedBlock, content });
    }

    await supabase
      .from('blocks')
      .update({ content })
      .eq('id', blockId);
  };

  // Update block settings
  const handleBlockUpdate = async (blockId: string, updates: Partial<Block>) => {
    const updatedBlock = blocks.find((b) => b.id === blockId);
    if (!updatedBlock) return;

    const newBlock = { ...updatedBlock, ...updates };
    setBlocks(blocks.map((b) => b.id === blockId ? newBlock : b));
    
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(newBlock);
    }

    const { animation_type, layout_settings } = updates;
    const dbUpdates: Record<string, unknown> = {};
    if (animation_type !== undefined) dbUpdates.animation_type = animation_type;
    if (layout_settings !== undefined) dbUpdates.layout_settings = layout_settings;

    await supabase
      .from('blocks')
      .update(dbUpdates)
      .eq('id', blockId);
  };

  // Delete block
  const handleBlockDelete = async (blockId: string) => {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      toast.error('Kunde inte ta bort block');
    } else {
      setBlocks(blocks.filter((b) => b.id !== blockId));
      if (selectedBlock?.id === blockId) {
        setSelectedBlock(null);
      }
    }
  };

  // Handle image upload
  const handleImageUpload = async (blockId: string, file: File) => {
    if (!user) {
      toast.error('Du måste vara inloggad');
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${blockId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Kunde inte ladda upp bilden');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    // Update block content with the image URL
    await handleBlockContentUpdate(blockId, { src: publicUrl, alt: file.name } as unknown as Json);
    
    setUploading(false);
    toast.success('Bild uppladdad!');
  };

  // Handle block select
  const handleBlockSelect = (block: Block | null) => {
    setSelectedBlock(block);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b bg-card flex items-center px-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 flex">
          <div className="w-64 border-r p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <EditorHeader
        title={presentation.title}
        presentationId={presentation.id}
        saving={saving}
        onTitleChange={(title) => setPresentation({ ...presentation, title })}
        onSave={handleSave}
      />

      <div className="flex-1 flex overflow-hidden">
        <SlidePanel
          slides={slides}
          activeSlideId={activeSlide?.id || null}
          onSlideSelect={setActiveSlide}
          onSlideCreate={handleSlideCreate}
          onSlideDuplicate={handleSlideDuplicate}
          onSlideDelete={handleSlideDelete}
          onSlideReorder={setSlides}
        />

        <div 
          className="flex-1 flex flex-col"
          style={{
            backgroundColor: activeSlide?.background_type === 'color' 
              ? activeSlide.background_value 
              : undefined,
          }}
        >
          <BlockEditor
            blocks={blocks}
            selectedBlockId={selectedBlock?.id || null}
            uploading={uploading}
            onBlockCreate={handleBlockCreate}
            onBlockUpdate={handleBlockContentUpdate}
            onBlockDelete={handleBlockDelete}
            onBlockSelect={handleBlockSelect}
            onImageUpload={handleImageUpload}
          />
        </div>

        <SettingsPanel
          slide={activeSlide}
          selectedBlock={selectedBlock}
          onSlideUpdate={handleSlideUpdate}
          onBlockUpdate={handleBlockUpdate}
        />
      </div>
    </div>
  );
}
