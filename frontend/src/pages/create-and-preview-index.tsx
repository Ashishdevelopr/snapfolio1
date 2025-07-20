import React, { useState, useEffect, useRef } from "react";
import { CreateIndexModal } from "@/components/CreateIndexModal";
import { PerformanceChart } from "@/components/PerformanceChart";
import { StockTable } from "@/components/StockTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Globe, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { authService } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { usePrompt } from "@/hooks/PromptContext";

interface IndexData {
  _id: string;
  id?: number;
  name: string;
  description?: string;
  prompt?: string;
  isPublic: boolean;
  totalValue: number;
  performance1d: number;
  performance1y?: number;
  benchmarkSp500?: number;
  benchmarkNasdaq?: number;
  createdAt: string | Date;
  stocks: any[];
  backtesting?: boolean;
  chartData?: any;
}

const SIDEBAR_WIDTH = 340;

// Utility function to check for valid MongoDB ObjectId
function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

const CreateAndPreviewIndex: React.FC = () => {
  const [createdIndexId, setCreatedIndexId] = useState<string | null>(null);
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [location, setLocation] = useLocation();
  const { prompt, setPrompt } = usePrompt();
  const [navPrompt, setNavPrompt] = useState<string | null>(null);
  const lastPromptRef = useRef<string | null>(null);

  const user = authService.getUser();

  // On mount, check navigation state for prompt
  useEffect(() => {
    // @ts-ignore
    const navState = location && location.state;
    if (navState && navState.prompt) {
      setPrompt(navState.prompt);
      setNavPrompt(navState.prompt);
      lastPromptRef.current = navState.prompt;
      setModalKey((k) => k + 1); // Remount modal for new prompt
    }
  }, []);

  // If prompt changes (from context or nav), remount modal
  useEffect(() => {
    const effectivePrompt = navPrompt || prompt;
    if (effectivePrompt && lastPromptRef.current !== effectivePrompt) {
      setModalKey((k) => k + 1);
      lastPromptRef.current = effectivePrompt;
    }
  }, [navPrompt, prompt]);

  // After index is created, fetch full details
  useEffect(() => {
    if (createdIndexId && user && isValidObjectId(createdIndexId)) {
      setLoading(true);
      setError(null);
      authService.apiRequest(`https://generatedassets1.onrender.com/api/index/${createdIndexId}`)
        .then(async (response: any) => {
          if (!response.ok) throw new Error("Failed to fetch index");
          const data = await response.json();
          setIndexData(data);
        })
        .catch((err) => setError(err.message || "Failed to fetch index"))
        .finally(() => setLoading(false));
    } else if (!user) {
      // For guests, indexData is set directly in handleIndexCreated
      setLoading(false);
    } else {
      setIndexData(null);
    }
  }, [createdIndexId, user]);

  // Custom handler to intercept index creation and update preview
  const handleIndexCreated = (data: any) => {
    if (data && data._id) {
      if (user && isValidObjectId(data._id)) {
        setCreatedIndexId(data._id);
      } else {
        setIndexData(data); // For guests or invalid IDs, set directly
      }
    }
  };

  // Handler to start a new chat/index
  const handleNewIndex = () => {
    setCreatedIndexId(null);
    setModalKey((k) => k + 1);
  };

  // Format helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(typeof date === 'string' ? new Date(date) : date);
  };

  const isPositive = indexData?.performance1d && indexData.performance1d >= 0;

  console.log("createindex", indexData, navPrompt, prompt, );

  const load= indexData == null ? true : false;
  
console.log("load",load);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/90 border-b border-gray-900">
        <div className="max-w-7xl px-2 flex items-center h-16">
          <div className="flex items-center space-x-2 p-2 flex-grow">
                        <a href="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="w-12 h-12" />
            <div className="text-white text-2xl font-bold">Snapfolio</div></a>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#" className="text-white hover:text-gray-300 transition-colors">About</a>
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Top list</a>
            {!user ? (
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full px-6 py-2 ml-2 shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => {
                if (indexData) {
                  localStorage.setItem('guestIndexDraft', JSON.stringify(indexData));
                }
                window.location.href = '/auth';
              }}>
                Save Index
              </Button>
            ) : (
              <Button asChild className="bg-black hover:bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 ml-2">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      {/* Main Flex Layout */}
      <div className="flex h-[calc(100vh-4rem)] text-white mt-16 bg-black">
        {/* Sidebar toggle button */}
        <button
          className={`absolute top-6 left-2 z-20 bg-gray-900 border border-gray-700 rounded-full p-2 shadow-md transition-transform ${sidebarOpen ? "-translate-x-1/2" : "-translate-x-1/2"}`}
          style={{ left: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Left: Fixed-width sidebar, collapsible */}
        <div
          className={`h-screen flex flex-col bg-black border-r border-gray-800 transition-all duration-300 ease-in-out ${sidebarOpen ? "" : "overflow-hidden"}`}
          style={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0, minWidth: sidebarOpen ? 300 : 0, maxWidth: sidebarOpen ? 400 : 0 }}
        >
          {sidebarOpen && (
            <div className="flex flex-col h-full max-h-screen p-4 md:p-8">
              <div className="flex items-center justify-between mb-6">
                {/* <h2 className="text-2xl font-bold break-words">Create Index</h2> */}
                <img src="/logo.png" alt="Logo" className="w-12 h-12" />
                <Button
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800"
                  onClick={handleNewIndex}
                >
                  Create New Index
                </Button>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <CreateIndexModal 
                  setIsLoadings={load}
                  key={modalKey}
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(true)}
                  initialPrompt={navPrompt || prompt}
                  onIndexCreated={handleIndexCreated}
                  disableRedirect={true}
                  variant="panel"
                  onAiThinkingChange={setAiThinking}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Flexible main content */}
        <div className="flex-1 h-screen flex flex-col bg-black p-4 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out">
          {loading || indexData === null ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <img src="/logo.png" alt="Snapfolio Logo" className="w-16 h-16 mb-2 animate-pulse" />
              <div className="mt-1 text-gray-300 text-center text-sm font-semibold">Waiting for index to be created...</div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-lg text-red-400">{error}</div>
          ) : (
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-1 break-words">{indexData.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>Created {formatDate(indexData.createdAt)}</span></div>
                    <div className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /><span>{indexData.stocks?.length || 0} stocks</span></div>
                    <div className="flex items-center gap-1">{indexData.isPublic ? (<><Globe className="h-4 w-4" /><span>Public</span></>) : (<><Lock className="h-4 w-4" /><span>Private</span></>)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Draft</Badge>
                </div>
              </div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(indexData.totalValue)}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      {isPositive ? (<TrendingUp className="h-4 w-4 text-green-500" />) : (<TrendingDown className="h-4 w-4 text-red-500" />)}
                      <span className="text-sm text-gray-600 dark:text-gray-400">1D Performance</span>
                    </div>
                    <div className={`text-2xl font-bold ${isPositive ? 'performance-positive' : 'performance-negative'}`}>{isPositive ? '+' : ''}{indexData.performance1d?.toFixed(2) || '0.00'}%</div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">vs S&P 500</span>
                    </div>
                    {(() => {
                      const sp500Diff = (indexData.performance1d || 0) - 0.8;
                      const isPositiveSp500 = sp500Diff >= 0;
                      return (
                        <div className={`text-2xl font-bold ${isPositiveSp500 ? 'performance-positive text-green-500' : 'performance-negative text-red-500'}`}>{isPositiveSp500 ? '+' : ''}{sp500Diff.toFixed(2)}%</div>
                      );
                    })()}
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">vs NASDAQ</span>
                    </div>
                    {(() => {
                      const nasdaqDiff = (indexData.performance1d || 0) + 0.3;
                      const isPositiveNasdaq = nasdaqDiff >= 0;
                      return (
                        <div className={`text-2xl font-bold ${isPositiveNasdaq ? 'performance-positive text-green-500' : 'performance-negative text-red-500'}`}>{isPositiveNasdaq ? '+' : ''}{nasdaqDiff.toFixed(2)}%</div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
              {/* Description Card */}
              {indexData.description && (
                <Card className="glass-card hover-lift mb-4">
                  <CardHeader>
                    <CardTitle className="text-gradient">Investment Thesis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{indexData.description}</p>
                    <div className="mt-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Generated from: "{indexData.prompt}"</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Performance Chart */}
              {user ? (
                <Card className="glass-card hover-lift mb-4">
                  <CardHeader>
                    <CardTitle className="text-gradient">Backtest: Returns vs drawdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PerformanceChart indexId={indexData._id} />
                  </CardContent>
                </Card>
              ) : (
                <div className="mb-4">
                  <PerformanceChart 
                    indexId={indexData._id} 
                    guestBacktesting={{
                      ...indexData,
                      performance: (indexData.backtesting && typeof indexData.backtesting === 'object') ? indexData.backtesting : {},
                      chartData: Array.isArray(indexData.chartData) ? indexData.chartData : [],
                    }}
                  />
                  {/* <div className="text-xs text-gray-400 text-center mt-2">Please log in to see the full chart.</div> */}
                </div>
              )}
              {/* Stock Table */}
              <Card className="glass-card hover-lift mb-4">
                <CardHeader>
                  <CardTitle className="text-gradient">Constituent Stocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockTable stocks={indexData.stocks} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>  
    </div>  
  );
};

export default CreateAndPreviewIndex; 