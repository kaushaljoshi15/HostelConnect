// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅ Add this

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxCG9sUtilWw0R55J4Sv6S0-jvFgFoxHQ",
  authDomain: "hostelconnect-9b797.firebaseapp.com",
  databaseURL: "https://hostelconnect-9b797-default-rtdb.firebaseio.com",
  projectId: "hostelconnect-9b797",
  storageBucket: "hostelconnect-9b797.appspot.com", // ✅ Fixed here
  messagingSenderId: "20703075895",
  appId: "1:20703075895:web:99ff5ecf72a985ecd9a9b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app); // ✅ Add this

// Export all Firebase services
export { app, auth, db, rtdb, storage }; // ✅ Export storage
