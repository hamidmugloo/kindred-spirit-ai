import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Ear, Hand, Wind, Heart, ChevronRight, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface GroundingExerciseProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUNDING_STEPS = [
  {
    number: 5,
    sense: 'See',
    icon: Eye,
    prompt: 'Name 5 things you can SEE around you',
    placeholder: 'A lamp, my phone, a plant, a window, my coffee mug...',
    color: 'from-blue-500 to-cyan-500',
    emoji: '👀',
  },
  {
    number: 4,
    sense: 'Touch',
    icon: Hand,
    prompt: 'Name 4 things you can TOUCH or FEEL',
    placeholder: 'The chair I\'m sitting on, my soft sweater, cool air...',
    color: 'from-green-500 to-emerald-500',
    emoji: '✋',
  },
  {
    number: 3,
    sense: 'Hear',
    icon: Ear,
    prompt: 'Name 3 things you can HEAR',
    placeholder: 'Birds chirping, traffic outside, my breathing...',
    color: 'from-purple-500 to-violet-500',
    emoji: '👂',
  },
  {
    number: 2,
    sense: 'Smell',
    icon: Wind,
    prompt: 'Name 2 things you can SMELL',
    placeholder: 'Fresh coffee, clean laundry...',
    color: 'from-orange-500 to-amber-500',
    emoji: '👃',
  },
  {
    number: 1,
    sense: 'Taste',
    icon: Heart,
    prompt: 'Name 1 thing you can TASTE',
    placeholder: 'The mint from my toothpaste...',
    color: 'from-pink-500 to-rose-500',
    emoji: '👅',
  },
];

export const GroundingExercise: React.FC<GroundingExerciseProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<string[]>(Array(5).fill(''));
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = () => {
    if (currentStep < GROUNDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResponses(Array(5).fill(''));
    setIsComplete(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const updateResponse = (value: string) => {
    const newResponses = [...responses];
    newResponses[currentStep] = value;
    setResponses(newResponses);
  };

  const currentStepData = GROUNDING_STEPS[currentStep];
  const Icon = currentStepData?.icon;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-card rounded-2xl shadow-medium border border-border z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">5-4-3-2-1 Grounding</h2>
                <p className="text-xs text-muted-foreground">Bring yourself to the present moment</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6">
              {!isComplete ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Progress */}
                    <div className="flex gap-1.5">
                      {GROUNDING_STEPS.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            idx <= currentStep ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Step indicator */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${currentStepData.color} flex items-center justify-center mb-4 shadow-lg`}
                      >
                        <span className="text-4xl">{currentStepData.emoji}</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <span className="text-4xl font-bold text-foreground">
                          {currentStepData.number}
                        </span>
                        <p className="text-lg font-medium text-foreground mt-1">
                          {currentStepData.prompt}
                        </p>
                      </motion.div>
                    </div>

                    {/* Input */}
                    <Textarea
                      value={responses[currentStep]}
                      onChange={(e) => updateResponse(e.target.value)}
                      placeholder={currentStepData.placeholder}
                      className="resize-none"
                      rows={3}
                    />

                    {/* Navigation */}
                    <div className="flex gap-3">
                      {currentStep > 0 && (
                        <Button variant="outline" onClick={handleBack} className="flex-1">
                          Back
                        </Button>
                      )}
                      <Button
                        variant="hero"
                        onClick={handleNext}
                        className="flex-1"
                      >
                        {currentStep === GROUNDING_STEPS.length - 1 ? (
                          <>
                            Complete
                            <Check className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-sage flex items-center justify-center"
                  >
                    <Check className="w-12 h-12 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Well done! 🌟
                    </h3>
                    <p className="text-muted-foreground">
                      You've completed the grounding exercise. Take a moment to notice how you feel.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Try Again
                    </Button>
                    <Button variant="hero" onClick={handleClose} className="flex-1">
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
