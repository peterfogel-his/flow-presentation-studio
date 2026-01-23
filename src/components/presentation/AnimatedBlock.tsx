import { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBlockProps {
  children: ReactNode;
  animationType?: string;
  delay?: number;
  parallaxSpeed?: number;
  zIndex?: number;
  slideKey?: string; // Used to reset animations when navigating
  showTextBackground?: boolean; // Semi-transparent background for text contrast
}

export function AnimatedBlock({ 
  children, 
  animationType, 
  delay = 0,
  parallaxSpeed = 1,
  zIndex = 1,
  slideKey,
  showTextBackground = false
}: AnimatedBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // If no animation, render immediately visible
  const hasAnimation = animationType && animationType !== 'none';
  const hasParallax = parallaxSpeed !== 1 && parallaxSpeed !== undefined;

  // Reset visibility when slide changes (for backward navigation)
  useEffect(() => {
    if (hasAnimation) {
      setIsVisible(false);
    }
  }, [slideKey, hasAnimation]);

  // Parallax scroll effect - slower, smoother
  useEffect(() => {
    if (!hasParallax) return;

    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Calculate how far through the viewport the element is
        const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        // Apply parallax based on speed - reduced multiplier for smoother effect
        const offset = (scrollProgress - 0.5) * 50 * (1 - parallaxSpeed);
        setScrollOffset(offset);
      }
    };

    // Find the scroll container (parent with overflow-scroll)
    const scrollContainer = ref.current?.closest('.overflow-y-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial calculation
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasParallax, parallaxSpeed]);

  // Visibility animation - observe and trigger
  useEffect(() => {
    if (!hasAnimation) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Reset when leaving viewport for re-animation
          setIsVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: '-20px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimation, slideKey]);

  const getAnimationStyles = (): React.CSSProperties => {
    // Slower, more elegant transition
    const baseTransition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
    const parallaxTransform = hasParallax ? `translateY(${scrollOffset}px)` : '';
    
    if (!hasAnimation) {
      return {
        transform: parallaxTransform || undefined,
        zIndex,
        position: 'relative' as const,
      };
    }
    
    if (!isVisible) {
      let initialTransform = '';
      switch (animationType) {
        case 'slide-left':
          initialTransform = 'translateX(-40px)';
          break;
        case 'slide-right':
          initialTransform = 'translateX(40px)';
          break;
        case 'slide-up':
          initialTransform = 'translateY(40px)';
          break;
        case 'fade':
          initialTransform = 'scale(0.98)';
          break;
        default:
          initialTransform = 'translateY(30px)';
      }
      return { 
        opacity: 0, 
        transform: `${initialTransform} ${parallaxTransform}`.trim(), 
        transition: baseTransition,
        zIndex,
        position: 'relative' as const,
      };
    }

    return {
      opacity: 1,
      transform: `translateX(0) translateY(0) scale(1) ${parallaxTransform}`.trim(),
      transition: baseTransition,
      transitionDelay: `${delay}ms`,
      zIndex,
      position: 'relative' as const,
    };
  };

  return (
    <div
      ref={ref}
      style={getAnimationStyles()}
      className={cn(
        animationType === 'ken-burns' && isVisible && 'animate-ken-burns',
        showTextBackground && 'bg-background/50 backdrop-blur-sm rounded-lg px-6 py-4'
      )}
    >
      {children}
    </div>
  );
}
