import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { WaypointSidebar } from '@/components/editor/WaypointSidebar';
import { BlockCanvas } from '@/components/editor/BlockCanvas';
import { BlockSettings } from '@/components/editor/BlockSettings';
import type { Block, Presentation, Waypoint, BlockType } from '@/types/block';
import type { Json } from '@/integrations/supabase/types';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Fetch presentation and blocks
  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      // Fetch presentation
      const { data: presData, error: presError } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (presError || !presData) {
        toast.error('Kunde inte hämta presentation');
        navigate('/');
        return;
      }

      setPresentation(presData as Presentation);

      // Fetch blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .eq('presentation_id', id)
        .order('position', { ascending: true });

      if (blocksError) {
        toast.error('Kunde inte hämta block');
        console.error(blocksError);
      } else {
        setBlocks((blocksData || []) as Block[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, user, navigate]);

  // Get waypoints from blocks
  const waypoints: Waypoint[] = blocks
    .filter((block) => block.is_waypoint)
    .map((block) => ({
      blockId: block.id,
      title: block.waypoint_title || getDefaultWaypointTitle(block),
      position: block.position,
    }));

  function getDefaultWaypointTitle(block: Block): string {
    const content = block.content as Record<string, unknown>;
    if (block.type === 'heading' && content.text) {
      return String(content.text).slice(0, 30);
    }
    if (block.type === 'background') {
      return `Sektion ${block.position + 1}`;
    }
    return `Block ${block.position + 1}`;
  }

  // Save presentation title
  const handleSave = async () => {
    if (!presentation) return;
    setSaving(true);

    const { error } = await supabase
      .from('presentations')
      .update({
        title: presentation.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', presentation.id);

    if (error) {
      toast.error('Kunde inte spara');
      console.error(error);
    } else {
      toast.success('Sparat!');
    }
    setSaving(false);
  };

  // Create new block
  const handleBlockCreate = async (type: BlockType, afterPosition: number) => {
    if (!id) return;

    // Shift positions for blocks after insertion point
    const blocksToUpdate = blocks.filter((b) => b.position > afterPosition);
    for (const block of blocksToUpdate) {
      await supabase
        .from('blocks')
        .update({ position: block.position + 1 })
        .eq('id', block.id);
    }

    // Default content based on type
    const defaultContent: Record<BlockType, Json> = {
      background: { type: 'color', value: '#f5f5f5' },
      heading: { text: '', level: 1 },
      text: { text: '' },
      image: { src: '', alt: '' },
      list: { items: [''], style: 'bullet' },
    };

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        presentation_id: id,
        type,
        position: afterPosition + 1,
        content: defaultContent[type],
        is_waypoint: type === 'background',
      })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte skapa block');
      console.error(error);
    } else if (data) {
      setBlocks((prev) => {
        const updated = prev.map((b) =>
          b.position > afterPosition ? { ...b, position: b.position + 1 } : b
        );
        return [...updated, data as Block].sort((a, b) => a.position - b.position);
      });
      setSelectedBlockId(data.id);
    }
  };

  // Debounced save to database
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingUpdatesRef = useRef<Map<string, Partial<Block>>>(new Map());

  const saveToDatabase = useCallback(async (blockId: string, updates: Partial<Block>) => {
    const { error } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', blockId);

    if (error) {
      toast.error('Kunde inte spara ändringar');
      console.error(error);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update block content - optimistic update with debounced save
  const handleBlockUpdate = useCallback((blockId: string, updates: Partial<Block>) => {
    // 1. Immediately update local state (optimistic)
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );

    // 2. Merge with pending updates for this block
    const existing = pendingUpdatesRef.current.get(blockId) || {};
    pendingUpdatesRef.current.set(blockId, { ...existing, ...updates });

    // 3. Debounce the save (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      // Save all pending updates
      pendingUpdatesRef.current.forEach((pendingUpdates, id) => {
        saveToDatabase(id, pendingUpdates);
      });
      pendingUpdatesRef.current.clear();
    }, 500);
  }, [saveToDatabase]);

  // Delete block
  const handleBlockDelete = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const { error } = await supabase.from('blocks').delete().eq('id', blockId);

    if (error) {
      toast.error('Kunde inte ta bort block');
      console.error(error);
    } else {
      // Update positions
      const blocksAfter = blocks.filter((b) => b.position > block.position);
      for (const b of blocksAfter) {
        await supabase
          .from('blocks')
          .update({ position: b.position - 1 })
          .eq('id', b.id);
      }

      setBlocks((prev) =>
        prev
          .filter((b) => b.id !== blockId)
          .map((b) =>
            b.position > block.position ? { ...b, position: b.position - 1 } : b
          )
      );
      setSelectedBlockId(null);
    }
  };

  // Move block
  const handleBlockMove = async (blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const block = blocks[blockIndex];
    const targetBlock = blocks[targetIndex];

    // Swap positions in database
    await Promise.all([
      supabase.from('blocks').update({ position: targetBlock.position }).eq('id', block.id),
      supabase.from('blocks').update({ position: block.position }).eq('id', targetBlock.id),
    ]);

    // Update local state
    setBlocks((prev) => {
      const updated = [...prev];
      const tempPos = updated[blockIndex].position;
      updated[blockIndex] = { ...updated[blockIndex], position: updated[targetIndex].position };
      updated[targetIndex] = { ...updated[targetIndex], position: tempPos };
      return updated.sort((a, b) => a.position - b.position);
    });
  };

  // Image upload
  const handleImageUpload = async (blockId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Kunde inte ladda upp bild');
      console.error(uploadError);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

    await handleBlockUpdate(blockId, {
      content: { src: urlData.publicUrl, alt: file.name } as unknown as Json,
    });
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  if (loading || authLoading) {
    return (
      <div className="h-screen flex">
        <Skeleton className="w-64 h-full" />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="w-80 h-full" />
      </div>
    );
  }

  if (!presentation) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader
        title={presentation.title}
        presentationId={presentation.id}
        saving={saving}
        onTitleChange={(title) => setPresentation({ ...presentation, title })}
        onSave={handleSave}
      />

      <div className="flex-1 flex overflow-hidden">
        <WaypointSidebar
          waypoints={waypoints}
          onWaypointClick={(blockId) => {
            setSelectedBlockId(blockId);
            document.getElementById(`block-${blockId}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }}
        />

        <BlockCanvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onBlockSelect={setSelectedBlockId}
          onBlockCreate={handleBlockCreate}
          onBlockUpdate={handleBlockUpdate}
          onBlockDelete={handleBlockDelete}
          onBlockMove={handleBlockMove}
          onImageUpload={handleImageUpload}
        />

        <BlockSettings
          block={selectedBlock}
          onUpdate={(updates) => {
            if (selectedBlockId) {
              handleBlockUpdate(selectedBlockId, updates);
            }
          }}
        />
      </div>
    </div>
  );
}
