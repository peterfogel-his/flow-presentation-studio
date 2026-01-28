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
  NavigationMode,
} from '@/types/block';

// Types for slide structure with pause support
type SlideStep = {
  blocks: Block[];
  pauseIndex: number;
};

type Slide = {
  waypoint: Waypoint;
  startPosition: number;
  endPosition: number;
  steps: SlideStep[];
  background?: BackgroundContent;
};

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Wave transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const [previousSlideIndex, setPreviousSlideIndex] = useState<number | null>(null);

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

  // Build slides with steps (pause support)
  const slides: Slide[] = useMemo(() => {
    if (blocks.length === 0) return [];

    const sorted = [...blocks].sort((a, b) => a.position - b.position);
    
    // Find all stops (blocks with navigation_mode === 'stop' or is_waypoint for backwards compat)
    const stopBlocks = sorted.filter(b => 
      b.navigation_mode === 'stop' || (b.is_waypoint && !b.navigation_mode)
    );
    
    // If no stops, create one from the first block
    if (stopBlocks.length === 0 && sorted.length > 0) {
      stopBlocks.push(sorted[0]);
    }

    const getLastBackgroundUpTo = (pos: number): BackgroundContent | undefined => {
      const bg = sorted
        .filter((b) => b.type === 'background' && b.position <= pos)
        .slice(-1)[0];
      return bg ? (bg.content as unknown as BackgroundContent) : undefined;
    };

    return stopBlocks.map((stopBlock, idx) => {
      const start = stopBlock.position;
      const end = idx < stopBlocks.length - 1 
        ? stopBlocks[idx + 1].position - 1 
        : sorted[sorted.length - 1].position;
      
      // Get all content blocks between this stop and the next
      const sectionBlocks = sorted.filter(
        (b) => b.position >= start && b.position <= end && b.type !== 'background'
      );

      // Group blocks into steps based on pauses
      const steps: SlideStep[] = [];
      let currentStepBlocks: Block[] = [];
      let pauseIndex = 0;

      sectionBlocks.forEach((block, i) => {
        // If this block is a pause, start a new step
        if (block.navigation_mode === 'pause' && i > 0) {
          if (currentStepBlocks.length > 0) {
            steps.push({ blocks: currentStepBlocks, pauseIndex });
            pauseIndex++;
          }
          currentStepBlocks = [block];
        } else {
          currentStepBlocks.push(block);
        }
      });

      // Push the last step
      if (currentStepBlocks.length > 0) {
        steps.push({ blocks: currentStepBlocks, pauseIndex });
      }

      // Ensure at least one step exists
      if (steps.length === 0) {
        steps.push({ blocks: [], pauseIndex: 0 });
      }

      return {
        waypoint: {
          blockId: stopBlock.id,
          title: stopBlock.waypoint_title || `Stopp ${idx + 1}`,
          position: stopBlock.position,
        },
        startPosition: start,
        endPosition: end,
        steps,
        background: getLastBackgroundUpTo(start),
      };
    });
  }, [blocks]);

  // Navigation functions
  const goNext = () => {
    if (slides.length === 0 || isTransitioning) return;
    
    const currentSlide = slides[currentSlideIndex];
    
    // Check if there are more steps in current slide
    if (currentStepIndex < currentSlide.steps.length - 1) {
      // Go to next step (pause reveal) - no wave transition
      setCurrentStepIndex(s => s + 1);
    } else if (currentSlideIndex < slides.length - 1) {
      // Go to next slide with wave transition
      startWaveTransition(currentSlideIndex + 1, 'forward');
    }
  };

  const goPrev = () => {
    if (slides.length === 0 || isTransitioning) return;
    
    // Check if we can go back a step
    if (currentStepIndex > 0) {
      setCurrentStepIndex(s => s - 1);
    } else if (currentSlideIndex > 0) {
      // Go to previous slide with wave transition
      startWaveTransition(currentSlideIndex - 1, 'backward');
    }
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlideIndex) return;
    const direction = index > currentSlideIndex ? 'forward' : 'backward';
    startWaveTransition(index, direction);
  };

  const startWaveTransition = (newIndex: number, direction: 'forward' | 'backward') => {
    setPreviousSlideIndex(currentSlideIndex);
    setTransitionDirection(direction);
    setIsTransitioning(true);
    setCurrentSlideIndex(newIndex);
    setCurrentStepIndex(0); // Reset step index for new slide

    // End transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousSlideIndex(null);
    }, 1200); // Match animation duration
  };

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
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, slides, currentSlideIndex, currentStepIndex, isTransitioning]);

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

  // Clamp index if slides change
  useEffect(() => {
    if (slides.length === 0) return;
    setCurrentSlideIndex((i) => Math.min(i, slides.length - 1));
  }, [slides.length]);

  const currentSlide = slides[currentSlideIndex];
  const previousSlide = previousSlideIndex !== null ? slides[previousSlideIndex] : null;

  // Get visible blocks based on current step
  const visibleBlocks = useMemo(() => {
    if (!currentSlide) return [];
    
    // Show all blocks from step 0 to currentStepIndex
    return currentSlide.steps
      .slice(0, currentStepIndex + 1)
      .flatMap(step => step.blocks);
  }, [currentSlide, currentStepIndex]);

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
      {/* Previous slide (exits during transition) */}
      {isTransitioning && previousSlide && (
        <div 
          className={cn(
            "absolute inset-0 z-20",
            transitionDirection === 'forward' ? 'animate-wave-exit-up' : 'animate-wave-exit-down'
          )}
        >
          <SlideBackground background={previousSlide.background} />
          <EdgeImages 
            blocks={previousSlide.steps.flatMap(s => s.blocks)} 
            slideKey={previousSlide.waypoint.blockId} 
          />
          <div className="relative z-10 h-full w-full">
            <div className="h-full w-full flex items-center justify-center px-6 md:px-12">
              <div className="w-full max-w-5xl space-y-10">
                {previousSlide.steps.flatMap(s => s.blocks)
                  .filter(filterNonEdgeBlocks)
                  .map((block) => <PresentBlock key={block.id} block={block} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current slide */}
      <div 
        className={cn(
          "absolute inset-0",
          isTransitioning 
            ? transitionDirection === 'forward' 
              ? 'animate-wave-enter-up z-10' 
              : 'animate-wave-enter-down z-10'
            : 'z-10'
        )}
      >
        <SlideBackground background={currentSlide.background} />

        {/* Edge images */}
        <EdgeImages blocks={visibleBlocks} slideKey={currentSlide.waypoint.blockId} />

        {/* Content */}
        <div className="relative z-10 h-full w-full">
          <div className="h-full w-full overflow-hidden">
            <div className="h-full w-full flex items-center justify-center px-6 md:px-12">
              <div className="w-full max-w-5xl space-y-10">
                {visibleBlocks.length === 0 ? (
                  <div className="text-muted-foreground">(Tomt stopp)</div>
                ) : (
                  visibleBlocks
                    .filter(filterNonEdgeBlocks)
                    .map((block, index) => (
                      <PresentBlock 
                        key={block.id} 
                        block={block} 
                        shouldAnimate={!isTransitioning}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Slide progress indicator */}
      {slides.length > 1 && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.waypoint.blockId}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentSlideIndex
                  ? 'bg-primary scale-125'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              title={slide.waypoint.title}
            />
          ))}
        </div>
      )}

      {/* Step indicator (if current slide has multiple steps) */}
      {currentSlide.steps.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1">
          {currentSlide.steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index <= currentStepIndex
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      )}

      {/* Click zones for navigation */}
      <button
        type="button"
        aria-label="Föregående"
        onClick={goPrev}
        className="absolute inset-y-0 left-0 w-1/5 z-30 cursor-pointer bg-transparent"
        disabled={isTransitioning}
      />
      <button
        type="button"
        aria-label="Nästa"
        onClick={goNext}
        className="absolute inset-y-0 right-0 w-1/5 z-30 cursor-pointer bg-transparent"
        disabled={isTransitioning}
      />
    </div>
  );
}

// Helper to filter out edge images
function filterNonEdgeBlocks(block: Block): boolean {
  if (block.type !== 'image') return true;
  const layout = (block.layout_settings || { alignment: 'center', width: '100%', layout: 'contained' }) as unknown as LayoutSettings;
  return layout.layout !== 'edge-left' && layout.layout !== 'edge-right' && layout.layout !== 'full-width';
}

// Edge images component
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

function SlideBackground({ background }: { background?: BackgroundContent }) {
  if (!background) {
    return <div className="absolute inset-0 bg-background" />;
  }

  const value = background.value || '#ffffff';
  
  const isGradientValue = 
    value.includes('linear-gradient') || 
    value.includes('radial-gradient') || 
    value.includes('conic-gradient');

  if (background.type === 'image' && value) {
    return (
      <div
        className="absolute inset-0 animate-ken-burns"
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
        className="absolute inset-0" 
        style={{ background: value }} 
      />
    );
  }

  return (
    <div 
      className="absolute inset-0" 
      style={{ backgroundColor: value }} 
    />
  );
}

function PresentBlock({ block, shouldAnimate = true }: { block: Block; shouldAnimate?: boolean }) {
  const animation =
    (block.animation_settings || { type: 'slide-up', delay: 0, duration: 500 }) as unknown as AnimationSettings;
  const layout = (block.layout_settings || { alignment: 'center', width: '100%', layout: 'contained' }) as unknown as LayoutSettings;

  const getAnimationClass = () => {
    if (!shouldAnimate) return '';
    
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
        return block.type === 'image' ? 'animate-ken-burns' : 'animate-fade-scale-in';
      default:
        return 'animate-slide-in-up'; // Default to slide-up
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
        animationDelay: shouldAnimate ? `${animation.delay}ms` : undefined,
        animationDuration: shouldAnimate ? `${animation.duration}ms` : undefined,
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
