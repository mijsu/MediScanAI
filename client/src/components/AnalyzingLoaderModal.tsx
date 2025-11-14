import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Activity, FileText, Brain, BarChart3, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyzingLoaderModalProps {
  open: boolean;
}

const analyzeSteps = [
  { icon: FileText, label: "Extracting lab values from image", duration: 2000 },
  { icon: Brain, label: "Processing with ML models", duration: 2500 },
  { icon: BarChart3, label: "Calculating risk assessment", duration: 2000 },
  { icon: Activity, label: "Generating comprehensive analysis", duration: 2500 },
  { icon: CheckCircle2, label: "Finalizing your health report", duration: 1500 },
];

export function AnalyzingLoaderModal({ open }: AnalyzingLoaderModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analyzeSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-2xl border-2 border-primary/20 [&>button]:hidden" 
        data-testid="modal-analyzing-loader"
      >
        <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-3 sm:px-6">
          {/* Animated pulse icon with particles */}
          <div className="relative mb-4 sm:mb-8 animate-float">
            {/* Outer glow rings */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full blur-2xl opacity-40 animate-glow" />
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full blur-xl opacity-30 animate-pulse" />
            
            {/* Rotating particles */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-400 rounded-full -translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-400 rounded-full -translate-x-1/2" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
              <div className="absolute left-0 top-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-300 rounded-full -translate-y-1/2" />
              <div className="absolute right-0 top-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-300 rounded-full -translate-y-1/2" />
            </div>
            
            {/* Main icon container */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 rounded-full p-4 sm:p-6 shadow-2xl shadow-primary-500/50">
              <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-pulse" />
            </div>
          </div>

          {/* Main title */}
          <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 sm:mb-3">
            Analyzing Your Results
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground text-center mb-6 sm:mb-12 px-2">
            Our AI-powered system is reading and interpreting your lab results
          </p>

          {/* Progress steps */}
          <div className="w-full space-y-2 sm:space-y-4">
            {analyzeSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-500 ${
                    isActive
                      ? "bg-primary/10 border-2 border-primary/30 scale-105"
                      : isCompleted
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-card/50 border border-border/50 opacity-50"
                  }`}
                  data-testid={`analyzing-step-${index}`}
                >
                  <div
                    className={`p-2 sm:p-3 rounded-md sm:rounded-lg transition-all duration-500 flex-shrink-0 ${
                      isActive
                        ? "bg-gradient-to-r from-primary-600 to-primary-500"
                        : isCompleted
                        ? "bg-green-500"
                        : "bg-muted"
                    }`}
                  >
                    <StepIcon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isActive || isCompleted ? "text-white" : "text-muted-foreground"
                      } ${isActive ? "animate-pulse" : ""}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-base font-medium transition-all duration-500 ${
                        isActive
                          ? "text-primary"
                          : isCompleted
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                  {isActive && (
                    <div className="flex gap-1 flex-shrink-0">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full mt-4 sm:mt-8">
            <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-primary-500/20 animate-pulse" />
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-500 ease-out relative"
                style={{
                  width: `${currentStep === analyzeSteps.length - 1 ? 95 : ((currentStep + 1) / analyzeSteps.length) * 100}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2">
              {currentStep === analyzeSteps.length - 1 ? 95 : Math.round(((currentStep + 1) / analyzeSteps.length) * 100)}% Complete
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
