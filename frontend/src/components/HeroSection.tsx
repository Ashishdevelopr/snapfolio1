import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, TrendingUp, Play } from 'lucide-react';
import { authService } from '@/lib/auth';

const examplePrompts = [
  "AI in healthcare",
  "CEOs under 40", 
  "Sustainable energy",
  "Robotics & automation",
  "Cybersecurity leaders",
  "ESG dividend stocks"
];

interface HeroSectionProps {
  onCreateIndex?: () => void;
}

export function HeroSection({ onCreateIndex }: HeroSectionProps) {
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch global statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => {
      const response = await fetch(
        "https://generatedassets1.onrender.com/api/stats"
      );
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      try {
        const response = await authService.apiRequest(
          "https://generatedassets1.onrender.com/api/generate-index",
          {
            method: "POST",
            body: JSON.stringify({ prompt }),
          }
        );
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to generate index');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Generation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Index Generated Successfully!",
        description: `Successfully created "${data.name}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['indexes'] });
      queryClient.invalidateQueries({ queryKey: ['globalStats'] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate index",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter an investment theme to generate an index",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(prompt);
  };

  const useExample = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8 bg-black px-4 py-10 md:py-14">
      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Main heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
          Transform Your Investment Ideas Into
          <span className="block text-yellow-400">Intelligent Portfolios</span>
        </h1>
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
          Use AI to create, backtest, and manage custom stock indexes. Turn any investment thesis into a diversified portfolio in seconds.
        </p>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-full px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 animate-glow"
            onClick={onCreateIndex}
          >
            <Sparkles className="h-5 w-5 mr-2 animate-spin-slow" />
            Create Your First Index
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-gray-700 text-white hover:bg-gray-900 px-6 py-2 text-base font-semibold"
          >
            <Play className="h-5 w-5 mr-2" />
            Watch Demo
          </Button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">
              {statsLoading ? '...' : (stats?.totalIndexes || 0).toLocaleString()}+
            </div>
            <div className="text-gray-400 text-xs">Indexes Created</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">
              {statsLoading ? '...' : (stats?.totalUsers || 0).toLocaleString()}+
            </div>
            <div className="text-gray-400 text-xs">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">
              {statsLoading ? '...' : (stats?.totalStocks || 0).toLocaleString()}+
            </div>
            <div className="text-gray-400 text-xs">Stocks Tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
}
