import React from 'react';
import { Wrench, Shield, HeartHandshake, Leaf, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Neighbour<span className="text-lime-accent">Lend</span>
              </span>
            </div>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              Share More. Spend Less. Build a Stronger Community. Enabling neighbours to borrow, lend, and share useful tools and outdoor gear locally.
            </p>
            <div className="flex items-center gap-4 text-xs text-stone-400 pt-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Neighbors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-lime-400" />
                <span>Zero-Waste Sharing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deposit Escrow</span>
              </div>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('/explore')} className="hover:text-white transition-colors cursor-pointer">
                  Explore Equipment
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/categories')} className="hover:text-white transition-colors cursor-pointer">
                  All Categories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/explore', { isFree: 'true' })} className="hover:text-white transition-colors cursor-pointer">
                  Free Community Sharing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/list-equipment')} className="hover:text-white transition-colors cursor-pointer">
                  List Your Equipment
                </button>
              </li>
            </ul>
          </div>

          {/* Member & Dashboard */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-4">Member Portal</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('/dashboard')} className="hover:text-white transition-colors cursor-pointer">
                  Member Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dashboard', { tab: 'borrows' })} className="hover:text-white transition-colors cursor-pointer">
                  My Borrow Requests
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dashboard', { tab: 'lends' })} className="hover:text-white transition-colors cursor-pointer">
                  My Lending Requests
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dashboard', { tab: 'wishlist' })} className="hover:text-white transition-colors cursor-pointer">
                  Wishlist & Alerts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/messages')} className="hover:text-white transition-colors cursor-pointer">
                  Neighbour Messages
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-4">Trust & Info</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('/safety')} className="hover:text-white transition-colors cursor-pointer">
                  Safety Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/faq')} className="hover:text-white transition-colors cursor-pointer">
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin')} className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer text-xs">
                  Admin Dashboard
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Serving Oakridge Green, Maplewood, Cedar Heights & Riverbend communities</span>
          </div>
          <p>© {new Date().getFullYear()} NeighbourLend Inc. Community equipment sharing network.</p>
        </div>
      </div>
    </footer>
  );
};
