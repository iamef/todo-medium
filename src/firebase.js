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
  apiKey: "AIzaSyDVsbM8eWn_6opVMb86eIvyNiKpwyFmJ1w", // can be found on console.cloud.google.com
  authDomain: "todo-medium.firebaseapp.com",
  databaseURL: "https://todo-medium-default-rtdb.firebaseio.com",
  projectId: "todo-medium",
  storageBucket: "todo-medium.appspot.com",
  messagingSenderId: "715936135028",
  appId: "1:715936135028:web:ca4f3f9b7354f36c769e21",
  measurementId: "G-XX97Q3VCNM"
};

// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_API_KEY, // can be found on console.cloud.google.com
//   authDomain: "todo-medium.firebaseapp.com",
//   // databaseURL: "https://todo-medium-default-rtdb.firebaseio.com",
//   projectId: "todo-medium",
//   storageBucket: "todo-medium.appspot.com",
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_APP_ID,
//   measurementId: process.env.REACT_APP_MEASUREMENT_ID
// };

// console.log(process.env)
// console.log(process.env.REACT_APP_API_KEY)


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
  return new Promise((resolve, reject) => {
    signInWithPopup(auth, provider).then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;
      // // The signed-in user info.
      // const user = result.user;
      // ...
      resolve(result);

    });
  });
}

async function firebaseSignOut(){
  return new Promise((resolve, reject) => {
    signOut(auth).then(() => {
      resolve(true);
    });
  });
}




export { auth, db, fs, firebaseSignInWithGoogle , firebaseSignOut };