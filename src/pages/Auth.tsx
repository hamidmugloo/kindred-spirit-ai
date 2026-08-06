import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Shield, Heart, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { isNetworkError, NETWORK_ERROR_MESSAGE } from '@/lib/authErrors';
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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const nextParam = searchParams.get('next');
  const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

  useEffect(() => {
    if (user) {
      navigate(safeNext ?? '/chat');
    }
  }, [user, navigate, safeNext]);

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);


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
        err.issues.forEach((error) => {
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
          if (isNetworkError(error)) {
            toast.error(NETWORK_ERROR_MESSAGE);
          } else if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try signing in instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome to ORBIT! Let\'s personalize your experience.');
        navigate('/onboarding');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (isNetworkError(error)) {
            toast.error(NETWORK_ERROR_MESSAGE);
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back! Good to see you again.');
        navigate('/chat');
      }
    } catch (err) {
      toast.error(isNetworkError(err) ? NETWORK_ERROR_MESSAGE : 'Something went wrong. Please try again.');
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
