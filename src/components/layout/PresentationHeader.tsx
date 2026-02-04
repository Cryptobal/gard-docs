'use client';

/**
 * PresentationHeader - Header PREMIUM con glassmorphism espectacular
 */

import { useThemeClasses } from '../presentation/ThemeProvider';
import { cn } from '@/lib/utils';
import { CTALinks } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Sparkles, Phone } from 'lucide-react';

interface PresentationHeaderProps {
  logo?: string;
  cta: CTALinks;
  className?: string;
}

export function PresentationHeader({ 
  logo = '/Logo Gard Blanco.png', 
  cta, 
  className 
}: PresentationHeaderProps) {
  const theme = useThemeClasses();
  
  return (
    <header className={cn('sticky-header group', className)}>
      {/* Glow effect behind header */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo con efecto premium */}
          <Link href="/" className="flex-shrink-0 group/logo relative">
            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-teal-500/0 group-hover/logo:bg-teal-500/20 blur-xl rounded-full transition-all duration-500" />
            
            <div className="relative w-32 h-12 md:w-40 md:h-14 transition-all duration-300 group-hover/logo:scale-110 drop-shadow-2xl">
              <Image
                src={logo}
                alt="Gard Security"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          {/* CTA Principal (Desktop) - ESPECTACULAR */}
          <div className="hidden md:flex items-center gap-6">
            {/* Teléfono con hover effect */}
            {cta.phone && (
              <a
                href={`tel:${cta.phone}`}
                className="group/phone flex items-center gap-2 text-base font-bold text-white/80 hover:text-teal-400 transition-all duration-300"
              >
                <Phone className="w-5 h-5 group-hover/phone:rotate-12 transition-transform" />
                <span>{cta.phone}</span>
              </a>
            )}
            
            {/* CTA Button ÉPICO */}
            <a
              href={cta.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'btn-premium group/cta relative overflow-hidden',
                'inline-flex items-center justify-center gap-3',
                'px-8 py-4 rounded-2xl',
                'text-base font-black text-white uppercase tracking-wide',
                'bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500',
                'hover:from-teal-400 hover:via-teal-300 hover:to-teal-400',
                'transition-all duration-300',
                'hover:scale-110 hover:-rotate-1',
                'shadow-2xl shadow-teal-500/50 hover:shadow-teal-500/80',
                'border-2 border-teal-300/50 hover:border-teal-200/70',
                'animate-pulse'
              )}
              style={{ animationDuration: '3s' }}
            >
              {/* Sparkles animado */}
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              
              {/* Icon */}
              <Calendar className="w-5 h-5 group-hover/cta:scale-125 transition-transform" />
              
              {/* Text */}
              <span className="relative">
                Agendar visita técnica
                {/* Underline animado */}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover/cta:w-full transition-all duration-300" />
              </span>
              
              {/* Glow interno */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/cta:opacity-100 blur-sm transition-opacity" />
            </a>
          </div>
          
          {/* Botón compacto MEJORADO (Mobile) */}
          <a
            href={cta.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'md:hidden',
              'inline-flex items-center gap-2',
              'px-6 py-3 rounded-xl',
              'text-sm font-black text-white',
              'bg-gradient-to-r from-teal-500 to-teal-400',
              'shadow-xl shadow-teal-500/50',
              'border-2 border-teal-400/50',
              'animate-pulse'
            )}
            style={{ animationDuration: '2s' }}
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar</span>
          </a>
        </div>
      </div>
    </header>
  );
}
