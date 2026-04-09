// need to add the compat in import for v9
//https://stackoverflow.com/questions/68946446/how-do-i-fix-a-firebase-9-0-import-error-attempted-import-error-firebase-app

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";

// import { getAnalytics } from "firebase/analytics"; // somehow doesn't work
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const fs = getFirestore();

enableIndexedDbPersistence(fs)
  .catch((err) => {
      if (err.code === "failed-precondition") {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a a time.
          // ...
      } else if (err.code === "unimplemented") {
          // The current browser does not support all of the
          // features required to enable persistence
          // ...
      }
  });
// Subsequent queries will use persistence, if it was enabled successfully


const provider = new GoogleAuthProvider();  // for signing in
// provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

const auth = getAuth();

async function firebaseSignInWithGoogle(){
  return signInWithPopup(auth, provider)
    .catch((error) => {
      console.error("Error signing in with Google:", error);
      throw error;
    });
}

async function firebaseSignOut(){
  return signOut(auth)
    .catch((error) => {
      console.error("Error signing out:", error);
      throw error;
    });
}




export { auth, db, fs, firebaseSignInWithGoogle , firebaseSignOut };