import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedBlock } from '@/components/presentation/AnimatedBlock';
import type { Slide, Block, BlockContent, LayoutSettings } from '@/types/presentation';

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blocks, setBlocks] = useState<Record<string, Block[]>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  // Fetch slides and blocks
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: slidesData } = await supabase
        .from('slides')
        .select('*')
        .eq('presentation_id', id)
        .order('position');

      const typedSlides = slidesData || [];
      setSlides(typedSlides);

      // Fetch all blocks for all slides
      if (typedSlides.length > 0) {
        const { data: blocksData } = await supabase
          .from('blocks')
          .select('*')
          .in('slide_id', typedSlides.map((s) => s.id))
          .order('position');

        const groupedBlocks: Record<string, Block[]> = {};
        (blocksData || []).forEach((block) => {
          if (!groupedBlocks[block.slide_id]) {
            groupedBlocks[block.slide_id] = [];
          }
          groupedBlocks[block.slide_id].push(block);
        });
        setBlocks(groupedBlocks);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Track current slide via intersection observer
  useEffect(() => {
    if (slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((ref) => ref === entry.target);
            if (index !== -1) {
              setCurrentIndex(index);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [slides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            navigate(-1);
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, isFullscreen, navigate]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    const targetRef = slideRefs.current[index];
    if (targetRef) {
      targetRef.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, slides.length - 1);
    scrollToSlide(nextIndex);
  }, [currentIndex, slides.length, scrollToSlide]);

  const goPrev = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    scrollToSlide(prevIndex);
  }, [currentIndex, scrollToSlide]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const getBackgroundStyle = (slide: Slide): React.CSSProperties => {
    switch (slide.background_type) {
      case 'color':
        return { backgroundColor: slide.background_value || undefined };
      case 'image':
        return {
          backgroundImage: slide.background_value ? `url(${slide.background_value})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'gradient':
        return {
          backgroundImage: slide.background_value || 'linear-gradient(to bottom, #4f46e5, #7c3aed)',
        };
      default:
        return { backgroundColor: 'hsl(var(--background))' };
    }
  };

  const getContent = (block: Block): BlockContent => {
    return (block.content || {}) as BlockContent;
  };

  const getLayoutSettings = (block: Block): LayoutSettings => {
    const settings = block.layout_settings as Record<string, unknown> | null;
    return {
      width: (settings?.width as string) || '100%',
      alignment: (settings?.alignment as 'left' | 'center' | 'right') || 'center',
      imageLayout: (settings?.imageLayout as 'default' | 'full-width' | 'left-edge' | 'right-edge') || 'default',
      parallaxSpeed: (settings?.parallaxSpeed as number) ?? 1,
      zIndex: (settings?.zIndex as number) ?? 1,
    };
  };

  const renderBlock = (block: Block, isEdgeLayout: boolean = false) => {
    const content = getContent(block);
    const layout = getLayoutSettings(block);
    const alignmentClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[layout.alignment];

    switch (block.type) {
      case 'heading':
        const level = content.level || 1;
        const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            className={cn(
              alignmentClass,
              level === 1 && 'text-6xl font-bold mb-8',
              level === 2 && 'text-4xl font-semibold mb-6',
              level === 3 && 'text-2xl font-medium mb-4'
            )}
          >
            {content.text}
          </HeadingTag>
        );

      case 'text':
        return (
          <p className={cn('text-xl leading-relaxed mb-4', alignmentClass)}>
            {content.text}
          </p>
        );

      case 'image':
        if (!content.src) return null;
        
        const imageLayout = layout.imageLayout || 'default';
        
        // Edge-to-edge layouts render differently
        if (imageLayout === 'full-width') {
          return (
            <img
              src={content.src}
              alt={content.alt || ''}
              className="w-full h-full object-cover"
            />
          );
        }
        
        if (imageLayout === 'left-edge' || imageLayout === 'right-edge') {
          return (
            <img
              src={content.src}
              alt={content.alt || ''}
              className="w-full h-full object-cover"
            />
          );
        }
        
        // Default layout
        return (
          <div className={cn('mb-6', alignmentClass)}>
            <img
              src={content.src}
              alt={content.alt || ''}
              className="max-w-full max-h-[60vh] rounded-lg mx-auto"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Check if a block should be rendered as edge-to-edge (outside the container)
  const isEdgeLayout = (block: Block): boolean => {
    if (block.type !== 'image') return false;
    const layout = getLayoutSettings(block);
    return layout.imageLayout === 'full-width' || 
           layout.imageLayout === 'left-edge' || 
           layout.imageLayout === 'right-edge';
  };

  // Get edge layout CSS classes
  const getEdgeLayoutClasses = (block: Block): string => {
    const layout = getLayoutSettings(block);
    switch (layout.imageLayout) {
      case 'full-width':
        return 'absolute inset-0';
      case 'left-edge':
        return 'absolute left-0 top-0 bottom-0 w-1/2';
      case 'right-edge':
        return 'absolute right-0 top-0 bottom-0 w-1/2';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar presentation...</div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Inga stopp i denna presentation</p>
          <Button onClick={() => navigate(-1)}>Tillbaka</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background">
      {/* Controls overlay */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation arrows */}
      <button
        className={cn(
          'fixed left-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full',
          'bg-background/20 hover:bg-background/40 transition-all',
          'opacity-0 hover:opacity-100',
          currentIndex === 0 && 'invisible'
        )}
        onClick={goPrev}
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <button
        className={cn(
          'fixed right-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full',
          'bg-background/20 hover:bg-background/40 transition-all',
          'opacity-0 hover:opacity-100',
          currentIndex === slides.length - 1 && 'invisible'
        )}
        onClick={goNext}
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Scroll container with all slides */}
      <div 
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {slides.map((slide, slideIndex) => {
          const slideBlocks = blocks[slide.id] || [];
          const edgeBlocks = slideBlocks.filter(isEdgeLayout);
          const normalBlocks = slideBlocks.filter(b => !isEdgeLayout(b));
          
          return (
            <section
              key={slide.id}
              ref={(el) => { slideRefs.current[slideIndex] = el; }}
              className="min-h-screen snap-start snap-always flex items-center justify-center relative overflow-hidden"
              style={getBackgroundStyle(slide)}
            >
              {/* Edge-to-edge blocks (rendered behind/beside content) */}
              {edgeBlocks.map((block, blockIndex) => {
                const layout = getLayoutSettings(block);
                return (
                  <div
                    key={block.id}
                    className={cn(getEdgeLayoutClasses(block), 'z-0')}
                  >
                    <AnimatedBlock
                      animationType={block.animation_type}
                      delay={blockIndex * 100}
                      parallaxSpeed={layout.parallaxSpeed}
                      zIndex={layout.zIndex}
                    >
                      {renderBlock(block, true)}
                    </AnimatedBlock>
                  </div>
                );
              })}
              
              {/* Normal blocks (in centered container) */}
              <div className="max-w-4xl w-full px-8 py-16 relative z-10">
                {normalBlocks.map((block, blockIndex) => {
                  const layout = getLayoutSettings(block);
                  return (
                    <AnimatedBlock
                      key={block.id}
                      animationType={block.animation_type}
                      delay={blockIndex * 100}
                      parallaxSpeed={layout.parallaxSpeed}
                      zIndex={layout.zIndex}
                    >
                      {renderBlock(block)}
                    </AnimatedBlock>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {slides.map((_, index) => (
          <button
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex 
                ? 'bg-primary w-6' 
                : 'bg-primary/30 hover:bg-primary/50'
            )}
            onClick={() => scrollToSlide(index)}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-4 right-4 text-sm text-muted-foreground z-50">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
