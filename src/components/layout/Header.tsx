import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, LogOut, User, Menu, X, Plus, History, Wind, Smile, Target, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onNewChat?: () => void;
  onOpenHistory?: () => void;
  onOpenBreathing?: () => void;
  onOpenMood?: () => void;
  onOpenGrounding?: () => void;
  onOpenMeditation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNewChat, 
  onOpenHistory, 
  onOpenBreathing,
  onOpenMood,
  onOpenGrounding,
  onOpenMeditation,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sage to-calm-blue flex items-center justify-center group-hover:shadow-glow transition-shadow duration-300">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            MindfulAI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {onOpenHistory && (
                <Button variant="ghost" size="icon" onClick={onOpenHistory} title="Conversation History">
                  <History className="w-5 h-5" />
                </Button>
              )}
              {onOpenBreathing && (
                <Button variant="ghost" size="icon" onClick={onOpenBreathing} title="Breathing Exercise">
                  <Wind className="w-5 h-5" />
                </Button>
              )}
              {onOpenMood && (
                <Button variant="ghost" size="icon" onClick={onOpenMood} title="Track Mood">
                  <Smile className="w-5 h-5" />
                </Button>
              )}
              {onOpenGrounding && (
                <Button variant="ghost" size="icon" onClick={onOpenGrounding} title="Grounding Exercise">
                  <Target className="w-5 h-5" />
                </Button>
              )}
              {onOpenMeditation && (
                <Button variant="ghost" size="icon" onClick={onOpenMeditation} title="Meditation Timer">
                  <Timer className="w-5 h-5" />
                </Button>
              )}
              <ThemeToggle />
              {onNewChat && (
                <Button variant="calm" size="sm" onClick={onNewChat}>
                  <Plus className="w-4 h-4 mr-1" />
                  New Chat
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border bg-background"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {user ? (
              <>
                {onOpenHistory && (
                  <Button variant="ghost" onClick={() => { onOpenHistory(); setMobileMenuOpen(false); }}>
                    <History className="w-4 h-4 mr-2" />
                    Conversation History
                  </Button>
                )}
                {onOpenBreathing && (
                  <Button variant="ghost" onClick={() => { onOpenBreathing(); setMobileMenuOpen(false); }}>
                    <Wind className="w-4 h-4 mr-2" />
                    Breathing Exercise
                  </Button>
                )}
                {onOpenMood && (
                  <Button variant="ghost" onClick={() => { onOpenMood(); setMobileMenuOpen(false); }}>
                    <Smile className="w-4 h-4 mr-2" />
                    Track Mood
                  </Button>
                )}
                {onOpenGrounding && (
                  <Button variant="ghost" onClick={() => { onOpenGrounding(); setMobileMenuOpen(false); }}>
                    <Target className="w-4 h-4 mr-2" />
                    Grounding Exercise
                  </Button>
                )}
                {onOpenMeditation && (
                  <Button variant="ghost" onClick={() => { onOpenMeditation(); setMobileMenuOpen(false); }}>
                    <Timer className="w-4 h-4 mr-2" />
                    Meditation Timer
                  </Button>
                )}
                {onNewChat && (
                  <Button variant="calm" onClick={() => { onNewChat(); setMobileMenuOpen(false); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                )}
                <Button variant="ghost" asChild>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="text-destructive justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};
