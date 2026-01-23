import { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBlockProps {
  children: ReactNode;
  animationType?: string;
  delay?: number;
}

export function AnimatedBlock({ children, animationType, delay = 0 }: AnimatedBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // If no animation, render immediately visible
  const hasAnimation = animationType && animationType !== 'none';

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

  const getAnimationStyles = () => {
    if (!hasAnimation) {
      return {};
    }

    const baseTransition = 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    
    if (!isVisible) {
      switch (animationType) {
        case 'slide-left':
          return { opacity: 0, transform: 'translateX(-60px)', transition: baseTransition };
        case 'slide-right':
          return { opacity: 0, transform: 'translateX(60px)', transition: baseTransition };
        case 'slide-up':
          return { opacity: 0, transform: 'translateY(60px)', transition: baseTransition };
        case 'fade':
          return { opacity: 0, transform: 'scale(0.95)', transition: baseTransition };
        default:
          return { opacity: 0, transform: 'translateY(40px)', transition: baseTransition };
      }
    }

    return {
      opacity: 1,
      transform: 'translateX(0) translateY(0) scale(1)',
      transition: baseTransition,
      transitionDelay: `${delay}ms`,
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
