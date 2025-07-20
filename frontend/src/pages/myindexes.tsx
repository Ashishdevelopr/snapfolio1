import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { IndexCard } from "@/components/IndexCard";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LogOut, User, Settings, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface IndexData {
  _id: string;
  name: string;
  stocks?: any[];
  performance7d?: number;
  performance1d?: number;
  createdAt: string;
  tags?: string[];
  creator?: string;
  description?: string;
  prompt?: string;
  userId?: string;
  isPublic?: boolean;
  totalValue?: number;
  performance30d?: number;
  performance1y?: number;
  benchmarkSp500?: number;
  benchmarkNasdaq?: number;
}

export default function MyIndexesPage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/auth");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch all indexes
  const { data: indexes = [], isLoading: indexesLoading } = useQuery({
    queryKey: ["indexes"],
    queryFn: async (): Promise<IndexData[]> => {
      const response = await authService.apiRequest(
        "https://generatedassets1.onrender.com/api/indexes"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch indexes");
      }
      return response.json();
    },
  });

  // Filter indexes
  const myIndexes = indexes.filter(
    (idx: IndexData) => idx.userId === user?.id
  );
  const publicIndexes = indexes.filter(
    (idx: IndexData) => idx.isPublic === true
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/90 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-2 flex items-center h-16">
          <div className="flex items-center space-x-2 p-2 flex-grow">
                        <a href="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="w-12 h-12" />
            <div className="text-white text-2xl font-bold">Snapfolio</div></a>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-white hover:text-gray-300 pb-4 transition-colors">Dashboard</Link>
            <Link href="/indexes" className="text-white font-medium border-b-2 border-blue-600 pb-4 transition-colors">My Indexes</Link>
            <Button variant="ghost" size="sm" className="hover:bg-gray-800">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="relative group">
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-800">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-medium">{user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-white">{user?.name || (user?.email ? user.email.split('@')[0] : 'User')}</span>
              </Button>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || (user?.email ? user.email.split('@')[0] : 'User')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <div className="py-1">
                  <div
                    onClick={() => setLocation('/profile')}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </div>
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <div
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-black text-white">
        {/* My Indexes Section */}
        <Card className="glass-card hover-lift mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gradient">
              My Indexes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {indexesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : myIndexes.length > 0 ? (
              <div className="space-y-0">
                {myIndexes.map((index: IndexData) => (
                  <IndexCard
                    key={index._id}
                    index={{
                      ...index,
                      creatorName: user?.name,
                    }}
                    currentUserId={user?.id}
                    onPublicToggle={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["indexes"],
                      })
                    }
                    onClick={() => setLocation(`/index/${index._id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No indexes created yet</p>
                <p className="text-sm">
                  Use the dashboard to create your first index
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public Indexes Section */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gradient">
              Public Indexes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {indexesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : publicIndexes.length > 0 ? (
              <div className="space-y-0">
                {publicIndexes.map((index: IndexData) => (
                  <IndexCard
                    key={index._id}
                    index={index}
                    currentUserId={user?.id}
                    onPublicToggle={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["indexes"],
                      })
                    }
                    onClick={() => setLocation(`/index/${index._id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No public indexes available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 