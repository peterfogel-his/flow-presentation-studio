import { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBlockProps {
  children: ReactNode;
  animationType?: string;
  delay?: number;
  parallaxSpeed?: number;
  zIndex?: number;
}

export function AnimatedBlock({ 
  children, 
  animationType, 
  delay = 0,
  parallaxSpeed = 1,
  zIndex = 1
}: AnimatedBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // If no animation, render immediately visible
  const hasAnimation = animationType && animationType !== 'none';
  const hasParallax = parallaxSpeed !== 1 && parallaxSpeed !== undefined;

  // Parallax scroll effect
  useEffect(() => {
    if (!hasParallax) return;

    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Calculate how far through the viewport the element is
        const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        // Apply parallax based on speed (0 = static, 0.5 = slow, 1 = normal)
        const offset = (scrollProgress - 0.5) * 100 * (1 - parallaxSpeed);
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

  // Visibility animation
  useEffect(() => {
    if (!hasAnimation) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2, rootMargin: '-50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimation]);

  const getAnimationStyles = (): React.CSSProperties => {
    const baseTransition = 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
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
          initialTransform = 'translateX(-60px)';
          break;
        case 'slide-right':
          initialTransform = 'translateX(60px)';
          break;
        case 'slide-up':
          initialTransform = 'translateY(60px)';
          break;
        case 'fade':
          initialTransform = 'scale(0.95)';
          break;
        default:
          initialTransform = 'translateY(40px)';
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
        animationType === 'ken-burns' && isVisible && 'animate-ken-burns'
      )}
    >
      {children}
    </div>
  );
}
