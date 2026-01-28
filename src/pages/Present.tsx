import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Block,
  Waypoint,
  BackgroundContent,
  HeadingContent,
  TextContent,
  ImageContent,
  ListContent,
  AnimationSettings,
  LayoutSettings,
} from '@/types/block';

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  // Fetch blocks
  useEffect(() => {
    if (!id) return;

    const fetchBlocks = async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('presentation_id', id)
        .order('position', { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setBlocks((data || []) as Block[]);
      }
      setLoading(false);
    };

    fetchBlocks();
  }, [id]);

  // Get waypoints
  const waypoints: Waypoint[] = useMemo(() => {
    const wps = blocks
      .filter((b) => b.is_waypoint)
      .map((b) => ({
        blockId: b.id,
        title: b.waypoint_title || `Block ${b.position + 1}`,
        position: b.position,
      }))
      .sort((a, b) => a.position - b.position);

    // Ensure we always have at least one waypoint
    if (wps.length === 0 && blocks.length > 0) {
      wps.push({ blockId: blocks[0].id, title: 'Start', position: blocks[0].position });
    }

    return wps;
  }, [blocks]);

  type Slide = {
    waypoint: Waypoint;
    startPosition: number;
    endPosition: number; // inclusive
    blocks: Block[];
    background?: BackgroundContent;
  };

  const slides: Slide[] = useMemo(() => {
    if (blocks.length === 0 || waypoints.length === 0) return [];

    const sorted = [...blocks].sort((a, b) => a.position - b.position);

    const getLastBackgroundUpTo = (pos: number): BackgroundContent | undefined => {
      const bg = sorted
        .filter((b) => b.type === 'background' && b.position <= pos)
        .slice(-1)[0];
      return bg ? (bg.content as unknown as BackgroundContent) : undefined;
    };

    return waypoints.map((wp, idx) => {
      const start = wp.position;
      const end = idx < waypoints.length - 1 ? waypoints[idx + 1].position - 1 : sorted[sorted.length - 1].position;
      const between = sorted.filter((b) => b.position >= start && b.position <= end && b.type !== 'background');
      return {
        waypoint: wp,
        startPosition: start,
        endPosition: end,
        blocks: between,
        background: getLastBackgroundUpTo(start),
      };
    });
  }, [blocks, waypoints]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          navigate('/');
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextWaypoint();
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevWaypoint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, waypoints, currentWaypointIndex]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen?.();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  };

  const goToNextWaypoint = () => {
    if (currentWaypointIndex < waypoints.length - 1) {
      setCurrentWaypointIndex((i) => i + 1);
    }
  };

  const goToPrevWaypoint = () => {
    if (currentWaypointIndex > 0) {
      setCurrentWaypointIndex((i) => i - 1);
    }
  };

  // Clamp index if waypoints/slides change
  useEffect(() => {
    if (slides.length === 0) return;
    setCurrentWaypointIndex((i) => Math.min(i, slides.length - 1));
  }, [slides.length]);

  const currentSlide = slides[currentWaypointIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Ingen presentation hittades</p>
        <Button onClick={() => navigate('/')}>Tillbaka</Button>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Kunde inte bygga slides</p>
        <Button onClick={() => navigate('/')}>Tillbaka</Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen bg-background relative overflow-hidden"
    >
      <SlideBackground background={currentSlide.background} slideKey={currentSlide.waypoint.blockId} />

      {/* Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="bg-background/80 backdrop-blur"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-background/80 backdrop-blur"
          onClick={() => navigate('/')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Waypoint progress */}
      {waypoints.length > 1 && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
          {waypoints.map((wp, index) => (
            <button
              key={wp.blockId}
              onClick={() => {
                setCurrentWaypointIndex(index);
              }}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentWaypointIndex
                  ? 'bg-primary scale-125'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              title={wp.title}
            />
          ))}
        </div>
      )}

      {/* Edge images (rendered outside centered container) */}
      <EdgeImages blocks={currentSlide.blocks} slideKey={currentSlide.waypoint.blockId} />

      {/* Content (one slide = all blocks between two waypoints) */}
      <div className="relative z-10 h-full w-full">
        <div className="h-full w-full overflow-hidden">
          <div
            key={currentSlide.waypoint.blockId}
            className="h-full w-full flex items-center justify-center px-6 md:px-12 animate-slide-in-up-slow"
          >
            <div className="w-full max-w-5xl space-y-10">
              {currentSlide.blocks.length === 0 ? (
                <div className="text-muted-foreground">(Tomt stopp)</div>
              ) : (
                currentSlide.blocks
                  .filter((block) => {
                    // Filter out edge images as they're rendered separately
                    if (block.type !== 'image') return true;
                    const layout = (block.layout_settings || { alignment: 'center', width: '100%', layout: 'contained' }) as unknown as LayoutSettings;
                    return layout.layout !== 'edge-left' && layout.layout !== 'edge-right' && layout.layout !== 'full-width';
                  })
                  .map((block) => <PresentBlock key={block.id} block={block} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click zones for navigation */}
      <button
        type="button"
        aria-label="Föregående stopp"
        onClick={goToPrevWaypoint}
        className="absolute inset-y-0 left-0 w-1/5 z-20 cursor-pointer bg-transparent"
      />
      <button
        type="button"
        aria-label="Nästa stopp"
        onClick={goToNextWaypoint}
        className="absolute inset-y-0 right-0 w-1/5 z-20 cursor-pointer bg-transparent"
      />
    </div>
  );
}

// Edge images component for edge-left, edge-right, full-width layouts
function EdgeImages({ blocks, slideKey }: { blocks: Block[]; slideKey: string }) {
  const edgeBlocks = blocks.filter((block) => {
    if (block.type !== 'image') return false;
    const layout = (block.layout_settings || { alignment: 'center', width: '100%', layout: 'contained' }) as unknown as LayoutSettings;
    return layout.layout === 'edge-left' || layout.layout === 'edge-right' || layout.layout === 'full-width';
  });

  if (edgeBlocks.length === 0) return null;

  return (
    <>
      {edgeBlocks.map((block) => {
        const content = block.content as unknown as ImageContent;
        const layout = (block.layout_settings || { alignment: 'center', width: '100%', layout: 'contained' }) as unknown as LayoutSettings;
        const animation = (block.animation_settings || { type: 'slide-up' }) as unknown as AnimationSettings;
        const isKenBurns = animation.type === 'ken-burns';

        if (layout.layout === 'full-width') {
          return (
            <div
              key={`${slideKey}-${block.id}`}
              className="absolute inset-0 z-[5] animate-slide-in-up-slow"
              style={{ zIndex: block.z_index + 5 }}
            >
              <img
                src={content.src}
                alt={content.alt || ''}
                className={cn('w-full h-full object-cover', isKenBurns && 'animate-ken-burns')}
              />
            </div>
          );
        }

        if (layout.layout === 'edge-left') {
          return (
            <div
              key={`${slideKey}-${block.id}`}
              className="absolute left-0 top-0 bottom-0 w-1/2 z-[5] animate-slide-in-left"
              style={{ zIndex: block.z_index + 5 }}
            >
              <img
                src={content.src}
                alt={content.alt || ''}
                className={cn('w-full h-full object-cover', isKenBurns && 'animate-ken-burns')}
              />
            </div>
          );
        }

        if (layout.layout === 'edge-right') {
          return (
            <div
              key={`${slideKey}-${block.id}`}
              className="absolute right-0 top-0 bottom-0 w-1/2 z-[5] animate-slide-in-right"
              style={{ zIndex: block.z_index + 5 }}
            >
              <img
                src={content.src}
                alt={content.alt || ''}
                className={cn('w-full h-full object-cover', isKenBurns && 'animate-ken-burns')}
              />
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

function SlideBackground({ background, slideKey }: { background?: BackgroundContent; slideKey: string }) {
  if (!background) {
    return <div key={slideKey} className="absolute inset-0 bg-background animate-bg-crossfade" />;
  }

  const value = background.value || '#ffffff';
  
  // Detect if value is a gradient string
  const isGradientValue = 
    value.includes('linear-gradient') || 
    value.includes('radial-gradient') || 
    value.includes('conic-gradient');

  if (background.type === 'image' && value) {
    return (
      <div
        key={slideKey}
        className="absolute inset-0 animate-bg-crossfade animate-ken-burns"
        style={{
          backgroundImage: `url(${value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    );
  }

  if (background.type === 'gradient' || isGradientValue) {
    return (
      <div 
        key={slideKey}
        className="absolute inset-0 animate-bg-crossfade" 
        style={{ background: value }} 
      />
    );
  }

  // Default: solid color
  return (
    <div 
      key={slideKey}
      className="absolute inset-0 animate-bg-crossfade" 
      style={{ backgroundColor: value }} 
    />
  );
}

function PresentBlock({ block }: { block: Block }) {
  const animation =
    (block.animation_settings || { type: 'slide-up', delay: 0, duration: 500 }) as unknown as AnimationSettings;
  const layout = (block.layout_settings || { alignment: 'center', width: '100%', layout: 'contained' }) as unknown as LayoutSettings;

  // Check if this is an edge/full-width image that should be rendered separately
  const isEdgeImage = block.type === 'image' && 
    (layout.layout === 'edge-left' || layout.layout === 'edge-right' || layout.layout === 'full-width');

  const getAnimationClass = () => {
    switch (animation.type) {
      case 'none':
        return '';
      case 'fade':
        return 'animate-fade-scale-in';
      case 'slide-left':
        return 'animate-slide-in-left';
      case 'slide-right':
        return 'animate-slide-in-right';
      case 'slide-up':
        return 'animate-slide-in-up';
      case 'scale':
        return 'animate-fade-scale-in';
      case 'ken-burns':
        // Ken Burns only makes sense for images
        return block.type === 'image' ? 'animate-ken-burns' : 'animate-fade-scale-in';
      default:
        return '';
    }
  };

  const getAlignmentClass = () => {
    switch (layout.alignment) {
      case 'left':
        return 'text-left items-start';
      case 'right':
        return 'text-right items-end';
      default:
        return 'text-center items-center';
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col justify-center',
        getAlignmentClass(),
        getAnimationClass()
      )}
      style={{
        zIndex: block.z_index + 10,
        animationDelay: `${animation.delay}ms`,
        animationDuration: `${animation.duration}ms`,
      }}
    >
      <BlockContent block={block} layout={layout} />
    </div>
  );
}

function BlockContent({ block, layout }: { block: Block; layout: LayoutSettings }) {
  switch (block.type) {
    case 'heading': {
      const content = block.content as unknown as HeadingContent;
      const Tag = `h${content.level || 1}` as 'h1' | 'h2' | 'h3';
      return (
        <Tag
          className={cn(
            content.level === 1 && 'text-5xl md:text-7xl font-bold',
            content.level === 2 && 'text-3xl md:text-5xl font-semibold',
            content.level === 3 && 'text-2xl md:text-3xl font-medium'
          )}
        >
          {content.text}
        </Tag>
      );
    }

    case 'text': {
      const content = block.content as unknown as TextContent;
      return <p className="text-xl md:text-2xl leading-relaxed whitespace-pre-wrap">{content.text}</p>;
    }

    case 'image': {
      const content = block.content as unknown as ImageContent;
      const animation = (block.animation_settings || { type: 'slide-up' }) as unknown as AnimationSettings;
      const isKenBurns = animation.type === 'ken-burns';
      
      return (
        <img
          src={content.src}
          alt={content.alt || ''}
          className={cn(
            'rounded-lg shadow-lg',
            layout.layout === 'contained' && 'max-w-2xl mx-auto',
            isKenBurns && 'animate-ken-burns'
          )}
        />
      );
    }

    case 'list': {
      const content = block.content as unknown as ListContent;
      const ListTag = content.style === 'numbered' ? 'ol' : 'ul';
      return (
        <ListTag
          className={cn(
            'text-xl md:text-2xl space-y-2',
            content.style === 'bullet' && 'list-disc list-inside',
            content.style === 'numbered' && 'list-decimal list-inside'
          )}
        >
          {content.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    }

    default:
      return null;
  }
}
