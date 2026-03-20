import React, { useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";

import "./App.css";
import TodoApp from "./components/TodoApp";
import CalendarIntegration from "./components/CalendarIntegration";
import { loadGoogleScript, handleClientLoad } from "./utils/gapiFunctions";
import { auth } from "./firebase";
import FirebaseSignin from "./components/FirebaseSignin";
import Sidebar from "./components/Sidebar";
// import { getTodos } from "./utils/calculateOvershoot";

function App() {
  
  // have separate gapi and firebase 
  // because when I call setState
  // the previous setState hasn't finished yet
  // so it'd update to an outdated
  const [gapiState, setGapiState] = useState({
    gapiLoaded: false,
    gapiSignedIn: null,
  });  

  // example:
  // when II update the firebase state
  // it would often update the gapiLoaded to be false
  // because the gapiLoaded setState hasn't completed
  // setting gapiLoaded to be true
  const [firebaseState, setFirebaseState] = useState({  
    firebaseSignedIn: null,
    userFilePath: "users/" + null
  });

  // useEffect is called after React updates the DOM
  // effect to load gapi
  useEffect(() => {
    console.log("gapi useEffect");
    if(!gapiState.gapiLoaded){
      loadGoogleScript(() => {
        setGapiState({...gapiState, gapiLoaded: true});    
        handleClientLoad((isSignedIn) => {
          setGapiState({...gapiState, gapiLoaded: true, gapiSignedIn: isSignedIn});
        });
        // console.log("updating gapi State")
      });
    }
  }, 
  // [] necessary because this would run after every render (bad)
  // having a functional update setGapiState(g => ...)
  // doesn't seem to work 
  // since setGapiState is called twice in the useEffect
  // eslint-disable-next-line
  []); 

  // effect for firebase login state changes
  useEffect(() => {
    console.log("firebase useEffect");
    onAuthStateChanged(auth, (user) => {
      console.log(user);
      if(firebaseState.firebaseSignedIn !== (user !== null)){
        // TODO check if firebase is even online at all
        console.log("fsignin status actually changed", firebaseState.userFilePath);
        
        // TODO TEST IF THIS ACTUALLY WORKS
        console.log(firebaseState);
        console.log({...firebaseState, firebaseSignedIn: (user !== null), userFilePath: "users/" + (user ? user.uid : null)});
        setFirebaseState({...firebaseState, firebaseSignedIn: (user !== null), userFilePath: "users/" + (user ? user.uid : null)});
      }
    });

  }, 
  // [] necessary because this would run after every render (bad)
  // having a functional update setFirebaseState(f => ...)
  // doesn't seem to work 
  // because the props for firebaseState seem to show up as undefined
  // for some reason
  // eslint-disable-next-line
  []); 

  return (
    <>
      <div className="app">
        <Sidebar/>
        
        <FirebaseSignin
          firebaseSignedIn={firebaseState.firebaseSignedIn}
          className="topRight" 
        />
        <CalendarIntegration 
          gapiLoaded={gapiState.gapiLoaded} 
          gapiSignedIn={gapiState.gapiSignedIn}
          userFirebasePath={firebaseState.userFilePath}
          className="topRight" 
        />

        <TodoApp 
          gapiLoaded={gapiState.gapiLoaded} 
          gapiSignedIn={gapiState.gapiSignedIn}
          firebaseSignedIn={firebaseState.firebaseSignedIn}
          userFirebasePath={firebaseState.userFilePath}
        />

        
        
      </div>
      {/* <script async defer src="https://apis.google.com/js/api.js"
      onload="this.onload=function(){};handleClientLoad()"
      onreadystatechange="if (this.readyState === "complete") this.onload()">
    </script> */}
    </>
  );
}
export default App;