import React, { useState } from 'react';
import { Wrench } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  fallbackIcon?: React.ReactNode;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Equipment',
  className = '',
  fallbackText,
  fallbackIcon,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-stone-100 text-stone-400 border border-stone-200 select-none ${className}`}>
        {fallbackIcon || <Wrench className="w-8 h-8 text-emerald-700/50 mb-1" />}
        <span className="text-xs font-medium text-stone-500 px-2 text-center truncate max-w-full">
          {fallbackText || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      {...props}
    />
  );
};
