import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Wrench,
  Bell,
  Heart,
  Bookmark,
  PlusCircle,
  LogOut,
  User,
  ShieldCheck,
  MessageSquare,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, unreadNotifications, logout, switchUser } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickSwitchOpen, setQuickSwitchOpen] = useState(false);

  const navLinks = [
    { label: 'Explore', path: '/explore' },
    { label: 'Categories', path: '/categories' },
    { label: 'Community', path: '/community' },
    { label: 'Safety Guidelines', path: '/safety' }
  ];

  const handleNav = (path: string, params?: any) => {
    onNavigate(path, params);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-2.5 text-left text-forest-900 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-lime-accent shadow-xs group-hover:bg-emerald-900 transition-colors">
                <Wrench className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight whitespace-nowrap text-stone-900">
                Neighbour<span className="text-emerald-700">Lend</span>
              </span>
            </button>
          </div>

          {/* Zone 2: 4 clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                    isActive
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                      : 'hover:text-stone-900'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action zone */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* List Equipment CTA */}
                <button
                  onClick={() => handleNav('/list-equipment')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  List Equipment
                </button>

                {/* Notifications Bell */}
                <button
                  onClick={() => handleNav('/notifications')}
                  title="Notifications"
                  className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Messages icon */}
                <button
                  onClick={() => handleNav('/messages')}
                  title="Messages"
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                {/* User avatar menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer border border-stone-200"
                  >
                    <span className="max-w-[100px] truncate hidden md:inline-block">
                      {user.fullName.split(' ')[0]}
                    </span>
                    <img
                      src={user.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=100&q=80'}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-700/30"
                      referrerPolicy="no-referrer"
                    />
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2 border-b border-stone-100">
                        <p className="font-semibold text-stone-900 truncate">{user.fullName}</p>
                        <p className="text-stone-500 truncate text-[11px]">{user.email}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                          <span className="capitalize">{user.role}</span>
                          <span>·</span>
                          <span className="capitalize">{user.verificationStatus}</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => handleNav('/dashboard')}
                          className="w-full text-left px-3.5 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-stone-500" />
                          Member Dashboard
                        </button>
                        <button
                          onClick={() => handleNav('/dashboard', { tab: 'listings' })}
                          className="w-full text-left px-3.5 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5 text-stone-500" />
                          My Equipment
                        </button>
                        <button
                          onClick={() => handleNav('/dashboard', { tab: 'wishlist' })}
                          className="w-full text-left px-3.5 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-stone-500" />
                          Wishlist & Alerts
                        </button>
                        <button
                          onClick={() => handleNav('/dashboard', { tab: 'favourites' })}
                          className="w-full text-left px-3.5 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 text-stone-500" />
                          Saved Favourites
                        </button>
                        <button
                          onClick={() => handleNav(`/members/${user.memberId}`)}
                          className="w-full text-left px-3.5 py-2 hover:bg-stone-50 text-stone-700 flex items-center gap-2.5 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-stone-500" />
                          My Public Profile
                        </button>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleNav('/admin')}
                            className="w-full text-left px-3.5 py-2 hover:bg-stone-50 text-emerald-800 font-semibold flex items-center gap-2.5 cursor-pointer border-t border-stone-100"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            Admin Console
                          </button>
                        )}
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          onClick={() => setQuickSwitchOpen(!quickSwitchOpen)}
                          className="w-full text-left px-3.5 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-50 flex items-center justify-between cursor-pointer text-[11px]"
                        >
                          <span>Switch Demo Role</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {quickSwitchOpen && (
                          <div className="bg-stone-50 py-1 px-2 space-y-1">
                            <button
                              onClick={() => { switchUser('admin@neighbourlend.org'); setUserMenuOpen(false); }}
                              className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-white text-stone-700"
                            >
                              Eleanor (Admin)
                            </button>
                            <button
                              onClick={() => { switchUser('marcus.chen@example.com'); setUserMenuOpen(false); }}
                              className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-white text-stone-700"
                            >
                              Marcus (Lender)
                            </button>
                            <button
                              onClick={() => { switchUser('sarah.jenkins@example.com'); setUserMenuOpen(false); }}
                              className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-white text-stone-700"
                            >
                              Sarah (Borrower)
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Demo quick login pills */}
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Join Community
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              {link.label}
            </button>
          ))}
          {user && (
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <button
                onClick={() => handleNav('/list-equipment')}
                className="block w-full text-left px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg"
              >
                + List Equipment
              </button>
              <button
                onClick={() => handleNav('/dashboard')}
                className="block w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
              >
                Member Dashboard
              </button>
              <button
                onClick={() => handleNav('/dashboard', { tab: 'wishlist' })}
                className="block w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg"
              >
                Wishlist & Alerts
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
