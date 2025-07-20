import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">
              Unlock Your AI-Powered Portfolio
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a free account to continue and unlock all features.
            </DialogDescription>
          </DialogHeader>

          <div className="text-left space-y-3 my-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">
                Create and save unlimited custom indexes.
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">
                Track real-time performance against benchmarks.
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-sm">
                Refine your strategy with AI-driven analysis.
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 p-6 bg-gray-50 dark:bg-gray-900/50 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
          <Button asChild className="w-full group">
            <Link href="/auth">
              Continue{" "}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 