import React from 'react';
import { TrendingUp, BarChart3, MessageSquare, FileText } from 'lucide-react';

/**
 * AnimatedBackground Component
 * 
 * Purpose: Provides animated background elements for the dashboard layout
 * Features:
 * - Floating animated icons related to financial management
 * - Subtle background patterns
 * - Performance optimized animations
 * - Responsive design
 */

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-background" />
      
      {/* Floating animated elements */}
      <div className="absolute top-20 left-10 animate-float-slow">
        <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-primary/20" />
        </div>
      </div>
      
      <div className="absolute top-32 right-20 animate-float-medium">
        <div className="w-8 h-8 bg-accent/5 rounded-full flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-accent/20" />
        </div>
      </div>
      
      <div className="absolute top-60 left-1/4 animate-float-fast">
        <div className="w-10 h-10 bg-secondary/5 rounded-full flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-secondary/20" />
        </div>
      </div>
      
      <div className="absolute bottom-40 right-1/3 animate-float-slow">
        <div className="w-14 h-14 bg-admin/5 rounded-full flex items-center justify-center">
          <FileText className="h-7 w-7 text-admin/20" />
        </div>
      </div>
      
      <div className="absolute bottom-20 left-1/3 animate-float-medium">
        <div className="w-6 h-6 bg-client/5 rounded-full flex items-center justify-center">
          <TrendingUp className="h-3 w-3 text-client/20" />
        </div>
      </div>
      
      {/* Geometric patterns */}
      <div className="absolute top-1/3 right-10 w-20 h-20 border border-primary/10 rounded-lg rotate-45 animate-spin-slow" />
      <div className="absolute bottom-1/3 left-20 w-16 h-16 border border-accent/10 rounded-full animate-pulse-slow" />
      
      {/* Flowing lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 Q250,50 500,100 T1000,100"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          fill="none"
          className="animate-flow"
        />
        <path
          d="M0,200 Q350,150 700,200 T1400,200"
          stroke="url(#line-gradient)"
          strokeWidth="1"
          fill="none"
          className="animate-flow-reverse"
        />
      </svg>
    </div>
  );
};