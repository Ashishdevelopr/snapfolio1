import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";

const AuthPage: React.FC = () => {
  const { user, login, register, googleLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [showGuestSaveModal, setShowGuestSaveModal] = useState(false);
  const [guestIndexDraft, setGuestIndexDraft] = useState<any>(null);
  const [guestSaveLoading, setGuestSaveLoading] = useState(false);
  const [guestSaveError, setGuestSaveError] = useState("");
  const [guestSaveSuccess, setGuestSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      // Check for guest index draft
      const draft = localStorage.getItem('guestIndexDraft');
      if (draft) {
        setGuestIndexDraft(JSON.parse(draft));
        setShowGuestSaveModal(true);
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);
  

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await googleLogin();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };
  
  const GoogleIcon = (props: any) => (
    <svg viewBox="0 0 48 48" {...props}><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.138,44,30.025,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
  );

  const handleSaveGuestIndex = async () => {
    if (!guestIndexDraft) return;
    setGuestSaveLoading(true);
    setGuestSaveError("");
    try {
      const response = await fetch("https://generatedassets1.onrender.com/api/generate-index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(guestIndexDraft),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save index");
      }
      setGuestSaveSuccess(true);
      localStorage.removeItem('guestIndexDraft');
      setTimeout(() => {
        setShowGuestSaveModal(false);
        setLocation("/dashboard");
      }, 1500);
    } catch (err: any) {
      setGuestSaveError(err.message || "Failed to save index");
    } finally {
      setGuestSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setLocation('/')}
        className="absolute top-4 left-4 text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>
      
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden">
        <div className="md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 text-center bg-black border-r border-gray-800">
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center space-x-2 bg-white p-2">
            <img src="/logo.png" alt="Logo" className="w-6 h-6" />

            {/* Text */}
            <div className="text-white text-2xl font-bold">Snapfolio</div>
          </div>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome to the Future of Investing</h2>
          <p className="text-gray-400 max-w-sm">
            Harness the power of AI to create, backtest, and manage your own custom stock indexes.
          </p>
        </div>
        <div className="md:w-1/2 bg-black p-8 md:p-12 border-l border-gray-800">
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gradient mb-2">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {mode === 'login' ? 'Sign in to access your dashboard' : 'Join now to start building your future'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required className="pl-9" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pl-9" />
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  {loading ? 'Processing...' : (mode === "login" ? "Log In" : "Sign Up")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-black border border-gray-700 text-white hover:bg-gray-900">
                <GoogleIcon className="mr-2 h-5 w-5" />
                Google
              </Button>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <Button variant="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-blue-400">
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      {showGuestSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white text-black rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">Unsaved Index Found</h2>
            <p className="mb-4">You have an unsaved index from your guest session. Would you like to save it to your account?</p>
            {guestSaveError && <p className="text-red-500 mb-2">{guestSaveError}</p>}
            {guestSaveSuccess ? (
              <p className="text-green-600 font-semibold mb-2">Index saved successfully!</p>
            ) : (
              <div className="flex gap-4">
                <Button onClick={handleSaveGuestIndex} disabled={guestSaveLoading} className="bg-blue-600 text-white px-4 py-2 rounded">
                  {guestSaveLoading ? 'Saving...' : 'Yes, Save Index'}
                </Button>
                <Button onClick={() => {
                  localStorage.removeItem('guestIndexDraft');
                  setShowGuestSaveModal(false);
                  setLocation("/dashboard");
                }} className="bg-gray-300 text-black px-4 py-2 rounded">
                  No, Discard
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage; 