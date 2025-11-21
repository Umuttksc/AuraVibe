import { Home, Search, MessageCircle, User, Menu, Plus, Bell, Sparkles, Heart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import { useState } from "react";
import NotificationsPanel from "@/components/ui/notifications-panel.tsx";
import LanguageSwitcher from "@/components/ui/language-switcher.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useTranslation } from "react-i18next";

interface MainLayoutProps {
  children: React.ReactNode;
  onCreatePost?: () => void;
}

// Icon wrapper components to prevent DataCloneError
function HomeIcon({ className }: { className?: string }) {
  return <Home className={className} />;
}

function MessageCircleIcon({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}

function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}

function UserIcon({ className }: { className?: string }) {
  return <User className={className} />;
}

function PlusIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return <Plus className={className} strokeWidth={strokeWidth} />;
}

function SearchIcon({ className }: { className?: string }) {
  return <Search className={className} />;
}

function BellIcon({ className }: { className?: string }) {
  return <Bell className={className} />;
}

function HeartIcon({ className }: { className?: string }) {
  return <Heart className={className} />;
}

function MenuIcon({ className }: { className?: string }) {
  return <Menu className={className} />;
}

export default function MainLayout({ children, onCreatePost }: MainLayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Extract language from URL path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const lng = pathParts[0] || 'tr';
  const basePath = `/${lng}`;
  
  const navItems = [
    { icon: "home" as const, label: t("nav.home"), path: `${basePath}/home` },
    { icon: "message" as const, label: t("nav.messages"), path: `${basePath}/messages` },
    { icon: "sparkles" as const, label: t("nav.wellness"), path: `${basePath}/wellness` },
    { icon: "user" as const, label: t("nav.profile"), path: `${basePath}/profile` },
  ];

  const isActive = (path: string) => location.pathname === path;
  
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const homePath = `${basePath}/home`;
    if (location.pathname === homePath) {
      // Already on home page - just scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home
      navigate(homePath);
    }
  };
  
  const getIcon = (iconName: string, className?: string) => {
    switch (iconName) {
      case "home":
        return <HomeIcon className={className} />;
      case "message":
        return <MessageCircleIcon className={className} />;
      case "sparkles":
        return <SparklesIcon className={className} />;
      case "user":
        return <UserIcon className={className} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm">
        <div className="flex h-14 items-center justify-between px-4 max-w-full">
          <div className="flex items-center gap-3">
            <a 
              href={`${basePath}/home`} 
              onClick={handleHomeClick}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                AuraVibe ✨
              </span>
            </a>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted/50 rounded-full transition-all" asChild>
              <Link to={`${basePath}/search`}>
                <SearchIcon className="h-6 w-6" />
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10 hover:bg-muted/50 rounded-full transition-all"
              onClick={() => setNotificationsOpen(true)}
            >
              <HeartIcon className={`h-6 w-6 ${unreadCount && unreadCount > 0 ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
            </Button>

            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted/50 rounded-full transition-all">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t("nav.menu")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  <div className="sm:hidden mb-4">
                    <LanguageSwitcher />
                  </div>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${basePath}/achievements`}>🏆 {t("nav.achievements")}</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${basePath}/chatbot`}>{t("nav.aiAssistant")}</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${basePath}/saved`}>{t("nav.savedPosts")}</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${basePath}/polls`}>{t("nav.polls")}</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${basePath}/blocked-users`}>{t("nav.blockedUsers")}</Link>
                  </Button>
                  {(currentUser?.role === "admin" || currentUser?.isSuperAdmin) && (
                    <>
                      <div className="border-t my-2" />
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to={`${basePath}/admin`}>{t("nav.admin")}</Link>
                      </Button>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to={`${basePath}/admin/setup`}>{t("nav.adminSetup")}</Link>
                      </Button>
                    </>
                  )}
                  <div className="border-t my-2" />
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to={`${basePath}/settings`}>{t("nav.settings")}</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start text-muted-foreground text-sm" asChild>
                    <Link to={`${basePath}/privacy`}>🔒 Gizlilik Politikası</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 md:ml-64">{children}</main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex items-center h-14 px-2 relative">
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.path);
            const isHomeItem = item.icon === "home";
            
            if (isHomeItem) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={handleHomeClick}
                  className={`flex items-center justify-center flex-1 h-full transition-all cursor-pointer ${
                    active
                      ? "text-purple-600 scale-105"
                      : "text-muted-foreground hover:text-purple-500"
                  }`}
                >
                  {getIcon(item.icon, `h-6 w-6 ${active ? "fill-current stroke-[1.5]" : "stroke-[1.5]"}`)}
                </a>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center flex-1 h-full transition-all ${
                  active
                    ? "text-blue-600 scale-105"
                    : "text-muted-foreground hover:text-blue-500"
                }`}
              >
                {getIcon(item.icon, `h-6 w-6 ${active ? "fill-current stroke-[1.5]" : "stroke-[1.5]"}`)}
              </Link>
            );
          })}
          
          {/* Spacer for + button alignment */}
          <div className="flex-1" />
          
          {/* Create Post Button - Floating above navigation */}
          {onCreatePost && (
            <button
              onClick={onCreatePost}
              className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center justify-center"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg shadow-purple-500/30 border-4 border-background">
                <PlusIcon className="h-7 w-7 stroke-[3] text-white" />
              </div>
            </button>
          )}
          
          {navItems.slice(2).map((item) => {
            const active = isActive(item.path);
            const isWellnessItem = item.icon === "sparkles";
            const isProfileItem = item.icon === "user";
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center flex-1 h-full transition-all ${
                  active
                    ? isWellnessItem 
                      ? "text-pink-600 scale-105" 
                      : isProfileItem
                      ? "text-orange-600 scale-105"
                      : "text-foreground scale-105"
                    : "text-muted-foreground " + (isWellnessItem ? "hover:text-pink-500" : isProfileItem ? "hover:text-orange-500" : "")
                }`}
              >
                {getIcon(item.icon, `h-6 w-6 ${active ? "fill-current stroke-[1.5]" : "stroke-[1.5]"}`)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:block fixed left-0 top-14 bottom-0 w-64 border-r bg-background p-4">
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const isHomeItem = item.icon === "home";
            
            if (isHomeItem) {
              return (
                <Button
                  key={item.path}
                  variant={active ? "secondary" : "ghost"}
                  className="justify-start"
                  asChild
                >
                  <a href={item.path} onClick={handleHomeClick}>
                    {getIcon(item.icon, "mr-2 h-5 w-5")}
                    {item.label}
                  </a>
                </Button>
              );
            }
            
            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                className="justify-start"
                asChild
              >
                <Link to={item.path}>
                  {getIcon(item.icon, "mr-2 h-5 w-5")}
                  {item.label}
                </Link>
              </Button>
            );
          })}
          
          {onCreatePost && (
            <Button
              onClick={onCreatePost}
              className="justify-start mt-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white border-0 shadow-lg"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Yeni Gönderi
            </Button>
          )}
        </div>
      </aside>

      <NotificationsPanel 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
    </div>
  );
}
