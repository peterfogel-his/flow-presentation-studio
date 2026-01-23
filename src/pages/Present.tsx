import { useState, useEffect, useRef } from 'react';
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
  const waypoints: Waypoint[] = blocks
    .filter((b) => b.is_waypoint)
    .map((b) => ({
      blockId: b.id,
      title: b.waypoint_title || `Block ${b.position + 1}`,
      position: b.position,
    }));

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
      const nextWaypoint = waypoints[currentWaypointIndex + 1];
      scrollToBlock(nextWaypoint.blockId);
      setCurrentWaypointIndex(currentWaypointIndex + 1);
    }
  };

  const goToPrevWaypoint = () => {
    if (currentWaypointIndex > 0) {
      const prevWaypoint = waypoints[currentWaypointIndex - 1];
      scrollToBlock(prevWaypoint.blockId);
      setCurrentWaypointIndex(currentWaypointIndex - 1);
    }
  };

  const scrollToBlock = (blockId: string) => {
    document.getElementById(`present-block-${blockId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Get current background
  const getCurrentBackground = (upToPosition: number): string => {
    const bgBlocks = blocks.filter((b) => b.type === 'background' && b.position <= upToPosition);
    if (bgBlocks.length === 0) return '#ffffff';
    const lastBg = bgBlocks[bgBlocks.length - 1];
    const content = lastBg.content as unknown as BackgroundContent;
    if (content.type === 'color') return content.value;
    if (content.type === 'gradient') return content.value;
    if (content.type === 'image') return `url(${content.value})`;
    return '#ffffff';
  };

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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background relative overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
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
                scrollToBlock(wp.blockId);
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

      {/* Content */}
      <div className="relative">
        {blocks.map((block) => (
          <PresentBlock
            key={block.id}
            block={block}
            background={block.type === 'background' ? undefined : getCurrentBackground(block.position)}
          />
        ))}
      </div>
    </div>
  );
}

function PresentBlock({ block, background }: { block: Block; background?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  const animation = (block.animation_settings || { type: 'none', delay: 0, duration: 500 }) as unknown as AnimationSettings;
  const layout = (block.layout_settings || { alignment: 'center', width: '100%' }) as unknown as LayoutSettings;

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAnimationClass = () => {
    if (!isVisible || animation.type === 'none') return 'opacity-0';
    switch (animation.type) {
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
        return 'animate-ken-burns';
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

  // Background blocks are sticky
  if (block.type === 'background') {
    const content = block.content as unknown as BackgroundContent;
    const bgStyle =
      content.type === 'image'
        ? { backgroundImage: `url(${content.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: content.value };

    return (
      <div
        id={`present-block-${block.id}`}
        ref={blockRef}
        className="sticky top-0 min-h-screen -mb-screen"
        style={{ ...bgStyle, zIndex: block.z_index }}
      />
    );
  }

  return (
    <div
      id={`present-block-${block.id}`}
      ref={blockRef}
      className={cn(
        'relative min-h-[50vh] flex flex-col justify-center px-8 py-16',
        getAlignmentClass(),
        getAnimationClass()
      )}
      style={{
        zIndex: block.z_index + 10,
        animationDelay: `${animation.delay}ms`,
        animationDuration: `${animation.duration}ms`,
      }}
    >
      <div className="max-w-4xl w-full mx-auto">
        <BlockContent block={block} layout={layout} />
      </div>
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
      return (
        <img
          src={content.src}
          alt={content.alt || ''}
          className={cn(
            'rounded-lg shadow-lg',
            layout.layout === 'full-width' && 'w-full',
            layout.layout === 'contained' && 'max-w-2xl mx-auto'
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
