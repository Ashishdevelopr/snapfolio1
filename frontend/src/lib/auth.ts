import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profilePhoto?: string;
  token: string;
  bio?: string;
  location?: string;
  website?: string;
  timezone?: string;
  currency?: string;
}

class AuthService {
  private token: string | null = localStorage.getItem("authToken");
  private user: AuthUser | null = null;
  private firebaseAvailable: boolean = true;

  constructor() {
    // Initialize user from stored token
    if (this.token) {
      this.getCurrentUser();
    }

    // Check if Firebase is available after a short delay to ensure it's loaded
    setTimeout(() => {
      this.checkFirebaseAvailability();
    }, 100);
  }

  private checkFirebaseAvailability() {
    try {
      console.log("Checking Firebase availability...");
      console.log("Auth object:", auth);
      console.log("Auth type:", typeof auth);

      // Check if Firebase auth is properly initialized
      if (auth) {
        console.log("Firebase auth object is available");

        // Test if we can create a Google provider (this tests the full Firebase setup)
        try {
          const provider = new GoogleAuthProvider();
          this.firebaseAvailable = true;
          console.log("Firebase authentication is fully available");
        } catch (providerError) {
          this.firebaseAvailable = false;
          console.warn(
            "Firebase Google provider creation failed:",
            providerError
          );
        }
      } else {
        this.firebaseAvailable = false;
        console.warn("Firebase auth object is null or undefined");
      }
    } catch (error) {
      this.firebaseAvailable = false;
      console.warn("Firebase availability check failed:", error);
    }
  }

  // Manual authentication (MongoDB)
  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data = await response.json();
    this.setAuthData(data.token, data.user);
    return data.user;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    this.setAuthData(data.token, data.user);
    return data.user;
  }

  // Firebase authentication
  async firebaseLogin(email: string, password: string): Promise<AuthUser> {
    if (!this.firebaseAvailable) {
      throw new Error("Firebase not available");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send Firebase user data to backend
      const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend");
      }

      const data = await response.json();
      this.setAuthData(data.token, data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async firebaseRegister(email: string, password: string): Promise<AuthUser> {
    if (!this.firebaseAvailable) {
      throw new Error("Firebase not available");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send Firebase user data to backend
      const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend");
      }

      const data = await response.json();
      this.setAuthData(data.token, data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async googleLogin(): Promise<AuthUser> {
    if (!this.firebaseAvailable) {
      throw new Error("Firebase not available");
    }

    try {
      // Ensure Firebase is properly initialized
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }

      const provider = new GoogleAuthProvider();

      // Add additional scopes if needed
      provider.addScope("email");
      provider.addScope("profile");

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      if (!user) {
        throw new Error("Google login failed - no user returned");
      }

      // Send Firebase user data to backend
      const response = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to authenticate with backend"
        );
      }

      const data = await response.json();
      this.setAuthData(data.token, data.user);
      return data.user;
    } catch (error: any) {
      console.error("Google login error:", error);

      // Handle specific Firebase errors
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Login cancelled by user");
      } else if (error.code === "auth/popup-blocked") {
        throw new Error(
          "Popup blocked by browser. Please allow popups and try again."
        );
      } else if (error.code === "auth/unauthorized-domain") {
        throw new Error(
          "This domain is not authorized for Google login. Please contact support."
        );
      } else if (error.message?.includes("create")) {
        throw new Error(
          "Firebase initialization error. Please refresh the page and try again."
        );
      }

      throw new Error(error.message || "Google login failed");
    }
  }

  async logout(): Promise<void> {
    if (this.firebaseAvailable) {
      try {
        await signOut(auth);
      } catch (error) {
        // Firebase logout failed, continue with manual logout
        console.warn("Firebase logout failed:", error);
      }
    }

    this.clearAuthData();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearAuthData();
        return null;
      }

      const data = await response.json();
      this.user = data.user;
      return data.user;
    } catch (error) {
      this.clearAuthData();
      return null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  isFirebaseAvailable(): boolean {
    return this.firebaseAvailable;
  }

  refreshFirebaseAvailability(): void {
    this.checkFirebaseAvailability();
  }

  private setAuthData(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(user));
  }

  private clearAuthData(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  }

  // API request helper with authentication
  async apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Profile management methods
  async updateProfile(updates: {
    email?: string;
    name?: string;
    profilePhoto?: string;
  }): Promise<AuthUser> {
    const response = await this.apiRequest(`${API_BASE_URL}/auth/profile`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update profile");
    }

    const data = await response.json();
    this.user = data.user;
    localStorage.setItem("authUser", JSON.stringify(data.user));
    return data.user;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await this.apiRequest(
      `${API_BASE_URL}/auth/change-password`,
      {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to change password");
    }
  }
}

export const authService = new AuthService();
