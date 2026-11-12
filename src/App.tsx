import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { EquipmentDetailsPage } from './pages/EquipmentDetailsPage.tsx';
import { CategoriesPage } from './pages/CategoriesPage.tsx';
import { ListEquipmentPage } from './pages/ListEquipmentPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { MemberDashboardPage } from './pages/MemberDashboardPage.tsx';
import { MessagesPage } from './pages/MessagesPage.tsx';
import { MemberProfilePage } from './pages/MemberProfilePage.tsx';
import { EditProfilePage } from './pages/EditProfilePage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { CommunityPage } from './pages/CommunityPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import {
  AboutPage,
  ContactPage,
  FAQPage,
  SafetyGuidelinesPage,
  TermsPage,
  PrivacyPolicyPage
} from './pages/InformationPages.tsx';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [routeParams, setRouteParams] = useState<Record<string, any>>({});

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string, params: Record<string, any> = {}) => {
    setRouteParams(params);
    setCurrentPath(path);
    try {
      window.history.pushState({}, '', path);
    } catch {
      // In restricted iframe environments fallback gracefully
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching
  const renderRoute = () => {
    // Dynamic equipment route: /equipment/:id
    if (currentPath.startsWith('/equipment/')) {
      const id = currentPath.replace('/equipment/', '');
      return <EquipmentDetailsPage equipmentId={id} onNavigate={handleNavigate} />;
    }

    // Dynamic member profile route: /members/:id
    if (currentPath.startsWith('/members/')) {
      const id = currentPath.replace('/members/', '');
      return <MemberProfilePage memberId={id} onNavigate={handleNavigate} />;
    }

    switch (currentPath) {
      case '/':
      case '/home':
        return <HomePage onNavigate={handleNavigate} />;

      case '/explore':
        return <ExplorePage initialFilters={routeParams} onNavigate={handleNavigate} />;

      case '/categories':
        return <CategoriesPage onNavigate={handleNavigate} />;

      case '/list-equipment':
        return <ListEquipmentPage onNavigate={handleNavigate} />;

      case '/login':
        return <LoginPage onNavigate={handleNavigate} />;

      case '/register':
        return <RegisterPage onNavigate={handleNavigate} />;

      case '/dashboard':
        return <MemberDashboardPage initialTab={routeParams.tab || 'overview'} onNavigate={handleNavigate} />;

      case '/messages':
        return <MessagesPage initialConversationId={routeParams.conversationId} onNavigate={handleNavigate} />;

      case '/profile/edit':
        return <EditProfilePage onNavigate={handleNavigate} />;

      case '/notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;

      case '/community':
        return <CommunityPage onNavigate={handleNavigate} />;

      case '/admin':
        return <AdminDashboardPage onNavigate={handleNavigate} />;

      case '/about':
        return <AboutPage onNavigate={handleNavigate} />;

      case '/contact':
        return <ContactPage onNavigate={handleNavigate} />;

      case '/faq':
        return <FAQPage onNavigate={handleNavigate} />;

      case '/safety':
        return <SafetyGuidelinesPage onNavigate={handleNavigate} />;

      case '/terms':
        return <TermsPage onNavigate={handleNavigate} />;

      case '/privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} />;

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbfbf9] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} />
      <main className="flex-1">
        {renderRoute()}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
