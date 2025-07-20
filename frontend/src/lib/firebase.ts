import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

// Firebase configuration with actual credentials
const firebaseConfig = {
  apiKey: "AIzaSyAPk5ochf21i6PkfyeiJa4TlsJX6WzOTzc",
  authDomain: "stockserchai.firebaseapp.com",
  projectId: "stockserchai",
  storageBucket: "stockserchai.appspot.com",
  messagingSenderId: "508294468685",
  appId: "1:508294468685:web:4f9fe22c29e2f59141b804",
};

// Initialize Firebase
let app;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  console.log("Firebase initialized successfully");
  console.log("App:", app);
  console.log("Auth:", auth);

  // Test Google provider creation
  try {
    const provider = new GoogleAuthProvider();
    console.log("Google provider created successfully");
  } catch (providerError) {
    console.error("Google provider creation failed:", providerError);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Create a mock auth object for fallback
  auth = {} as Auth;
}

export { auth };
export default app;
