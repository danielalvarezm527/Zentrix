// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA285NdJzKqZpSXP2uYegM7de965X7T-io",
  authDomain: "zentrix-da648.firebaseapp.com",
  projectId: "zentrix-da648",
  storageBucket: "zentrix-da648.firebasestorage.app",
  messagingSenderId: "805794020151",
  appId: "1:805794020151:web:e1dad140c766853e12b8b2",
  measurementId: "G-W0GB34E4YZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
