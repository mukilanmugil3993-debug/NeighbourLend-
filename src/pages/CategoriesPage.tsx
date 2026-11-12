import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Category } from '../types/index.ts';
import { ImageWithFallback } from '../components/common/ImageWithFallback.tsx';
import { ArrowRight, Tag, Wrench, Sparkles, Tent, Truck, Volume2, Shield } from 'lucide-react';

interface CategoriesPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Equipment Categories
        </h1>
        <p className="text-sm text-stone-500">
          Browse specialized gear and tools shared across our local neighborhoods.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-64 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div
              key={cat.categoryId}
              onClick={() => onNavigate('/explore', { categoryId: cat.categoryId })}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
                <ImageWithFallback
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent flex items-end p-4">
                  <span className="text-xs font-bold text-white bg-emerald-800/80 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {cat.itemCount || 0} listings active
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                  <span>Browse Category</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
