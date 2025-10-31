// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Importa Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAV-tzHQx20lHqS47OHgG0M4rjdT0Qo_U",
  authDomain: "zentrix-99a65.firebaseapp.com",
  projectId: "zentrix-99a65",
  storageBucket: "zentrix-99a65.firebasestorage.app",
  messagingSenderId: "232754206933",
  appId: "1:232754206933:web:74e9d5965bd04ff664aa5c",
  measurementId: "G-J8MLJ8TPTF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exporta las instancias correctas
export const auth = getAuth(app);
export const db = getFirestore(app); 
