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
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
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

// try {
//   debugger;
//   console.log(auth.currentUser)
//   if(auth.currentUser)
//     console.log(auth.currentUser.uid)

//   addDoc(collection(fs, "users/" + auth.currentUser.uid + "/not labeled"), {
//     first: "Ada",
//     last: "Lovelace",
//     born: 1815
//   }).then((result) => {
//     console.log("Document written with ID: ", result);
//   })
// } catch (e) {
//   console.error("Ada Lovelace, Error adding document: ", e);
// }


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