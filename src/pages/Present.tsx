import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Slide, Block, BlockContent, LayoutSettings } from '@/types/presentation';

export default function Present() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blocks, setBlocks] = useState<Record<string, Block[]>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const getAnimationClass = (animationType: string) => {
    switch (animationType) {
      case 'fade':
        return 'animate-fade-scale-in';
      case 'slide-left':
        return 'animate-slide-in-left';
      case 'slide-right':
        return 'animate-slide-in-right';
      case 'slide-up':
        return 'animate-slide-in-up';
      case 'ken-burns':
        return 'animate-ken-burns';
      default:
        return '';
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
    };
  };

  const renderBlock = (block: Block) => {
    const content = getContent(block);
    const layout = getLayoutSettings(block);
    const animationClass = getAnimationClass(block.animation_type);
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
              animationClass,
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
          <p className={cn('text-xl leading-relaxed mb-4', animationClass, alignmentClass)}>
            {content.text}
          </p>
        );

      case 'image':
        return content.src ? (
          <div className={cn('mb-6', animationClass, alignmentClass)}>
            <img
              src={content.src}
              alt={content.alt || ''}
              className={cn(
                'max-w-full max-h-[60vh] rounded-lg mx-auto',
                block.animation_type === 'ken-burns' && 'animate-ken-burns'
              )}
            />
          </div>
        ) : null;

      default:
        return null;
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

  const currentSlide = slides[currentIndex];
  const currentBlocks = blocks[currentSlide.id] || [];

  return (
    <div 
      className="fixed inset-0 bg-background"
      style={{
        backgroundColor: currentSlide.background_type === 'color' 
          ? currentSlide.background_value 
          : undefined,
        backgroundImage: currentSlide.background_type === 'image' 
          ? `url(${currentSlide.background_value})` 
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
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
          'absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full',
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
          'absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full',
          'bg-background/20 hover:bg-background/40 transition-all',
          'opacity-0 hover:opacity-100',
          currentIndex === slides.length - 1 && 'invisible'
        )}
        onClick={goNext}
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Slide content */}
      <div 
        key={currentSlide.id}
        className={cn(
          'h-full flex flex-col items-center justify-center p-16',
          getAnimationClass(currentSlide.transition_type)
        )}
      >
        <div className="max-w-4xl w-full">
          {currentBlocks.map((block, index) => {
            const hasAnimation = block.animation_type && block.animation_type !== 'none';
            return (
              <div 
                key={block.id}
                style={hasAnimation ? { 
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                  animationFillMode: 'forwards'
                } : undefined}
                className={getAnimationClass(block.animation_type)}
              >
                {renderBlock(block)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex 
                ? 'bg-primary w-6' 
                : 'bg-primary/30 hover:bg-primary/50'
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-4 right-4 text-sm text-muted-foreground">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
}
