import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Shield, Heart, MessageCircle } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import orbitLogo from '@/assets/orbit-logo.png';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Name is required').optional(),
});

const floatingIcons = [
  { Icon: Heart, delay: 0, x: '10%', y: '20%' },
  { Icon: Shield, delay: 0.5, x: '80%', y: '15%' },
  { Icon: MessageCircle, delay: 1, x: '15%', y: '70%' },
  { Icon: Sparkles, delay: 1.5, x: '85%', y: '75%' },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Always use Supabase directly with skipBrowserRedirect to avoid ERR_BLOCKED_BY_RESPONSE
      // This prevents iframe/popup blocking issues on both Lovable and custom domains
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast.error(`Google sign-in failed: ${error.message || 'Please try again.'}`);
        return;
      }

      // Validate and redirect to OAuth URL
      if (data?.url) {
        const oauthUrl = new URL(data.url);
        const allowedHosts = ['accounts.google.com', 'ltqmuqozsqncdzzhkxwj.supabase.co'];
        if (!allowedHosts.some((host) => oauthUrl.hostname === host)) {
          throw new Error('Invalid OAuth redirect URL');
        }
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Google OAuth exception:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      // Always use Supabase directly with skipBrowserRedirect to avoid ERR_BLOCKED_BY_RESPONSE
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('Apple OAuth error:', error);
        toast.error(`Apple sign-in failed: ${error.message || 'Please try again.'}`);
        return;
      }

      // Validate and redirect to OAuth URL
      if (data?.url) {
        const oauthUrl = new URL(data.url);
        const allowedHosts = ['appleid.apple.com', 'ltqmuqozsqncdzzhkxwj.supabase.co'];
        if (!allowedHosts.some((host) => oauthUrl.hostname === host)) {
          throw new Error('Invalid OAuth redirect URL');
        }
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Apple OAuth exception:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const validateForm = () => {
    try {
      if (isSignUp) {
        authSchema.parse({ email, password, displayName });
      } else {
        authSchema.omit({ displayName: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try signing in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome to ORBIT! Your journey begins now.');
        navigate('/chat');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back! Good to see you again.');
        navigate('/chat');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Left Panel - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sage via-primary to-calm-blue">
          <motion.div 
            className="absolute inset-0 opacity-30"
            animate={{ 
              background: [
                'radial-gradient(circle at 20% 80%, hsl(var(--lavender)) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 20%, hsl(var(--lavender)) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 80%, hsl(var(--lavender)) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating Icons */}
        {floatingIcons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
              y: [0, -20, 0],
            }}
            transition={{ 
              duration: 4,
              delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-white/70" />
            </div>
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center max-w-md"
          >
            {/* Logo */}
            <motion.div 
              className="mb-8 flex justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md p-3 shadow-2xl border border-white/20">
                <img src={orbitLogo} alt="ORBIT" className="w-full h-full object-contain" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold mb-4">
              Your Intelligent AI Assistant
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              ORBIT helps you answer questions, solve problems, write content, and tackle any challenge—instantly and intelligently.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {['Lightning Fast', 'Private & Secure', 'Always Available'].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium border border-white/20"
                >
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-background">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </div>
      </motion.div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Background Elements */}
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-5 w-24 h-24 bg-sage/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-20 right-5 w-32 h-32 bg-lavender/20 rounded-full blur-2xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex justify-center mb-8">
            <motion.div 
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage to-calm-blue p-2 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={orbitLogo} alt="ORBIT" className="w-full h-full object-contain" />
            </motion.div>
          </Link>

          {/* Glass Card */}
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? 'signup' : 'signin'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                  </h1>
                  <p className="text-muted-foreground">
                    {isSignUp
                      ? 'Start asking, creating, and solving today'
                      : 'Continue where you left off'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* Google Sign In - Primary Action */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-base font-medium relative overflow-hidden group border-2 hover:border-primary/50 hover:bg-accent/50 transition-all duration-300"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="relative flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Apple Sign In */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-base font-medium relative overflow-hidden group border-2 hover:border-primary/50 hover:bg-accent/50 transition-all duration-300"
                  onClick={handleAppleSignIn}
                  disabled={isAppleLoading}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  {isAppleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="relative flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-medium">or</span>
                </div>
              </div>

              {/* Name Field (Sign Up only) */}
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="displayName" className="text-foreground font-medium">
                      Your Name
                    </Label>
                    <div className="relative group">
                      <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === 'displayName' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="How should I call you?"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onFocus={() => setFocusedField('displayName')}
                        onBlur={() => setFocusedField(null)}
                        className="pl-12 h-12 text-base bg-muted/50 border-border/50 focus:border-primary focus:bg-background transition-all duration-200"
                      />
                    </div>
                    {errors.displayName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive flex items-center gap-1"
                      >
                        {errors.displayName}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-12 h-12 text-base bg-muted/50 border-border/50 focus:border-primary focus:bg-background transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs text-primary hover:underline underline-offset-2 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="pl-12 pr-12 h-12 text-base bg-muted/50 border-border/50 focus:border-primary focus:bg-background transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-sage to-primary hover:from-sage/90 hover:to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Footer */}
            <div className="px-8 pb-8">
              <div className="p-4 rounded-2xl bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary font-semibold hover:underline underline-offset-2"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 mt-6 text-muted-foreground"
          >
            <Shield className="w-4 h-4" />
            <p className="text-xs">Your data is encrypted and secure</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
