'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

// Wrapper to animate any component
export const MotionDiv = motion.div;

interface MotionCardProps extends React.ComponentProps<typeof Card> {
    delay?: number;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
    ({ className, delay = 0, ...props }, ref) => {
        return (
            <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: delay, ease: 'easeOut' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
                <Card ref={ref} className={cn('transition-shadow hover:shadow-lg', className)} {...props} />
            </MotionDiv>
        );
    }
);
MotionCard.displayName = 'MotionCard';

// Re-export subcomponents for convenience
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter };
