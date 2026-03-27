// how to add new users
// https://support.google.com/cloud/answer/10311615#publishing-status-testing&zippy=%2Ctesting

// https://github.com/QuodAI/tutorial-react-google-api-login/blob/main/src/lib/GoogleLogin.js
export function loadGoogleScript(onLoadFunc){
  const id = "google-js";
  const src = "https://apis.google.com/js/api.js"; // Quad used platform.js

  const firstJs = document.getElementsByTagName("script")[0]; // because react

  if(document.getElementById(id)) {
    if (window.gapi && onLoadFunc) {
      onLoadFunc();
    } else if (onLoadFunc) {
      document.getElementById(id).addEventListener('load', onLoadFunc);
    }
    return;
  }
  if(!firstJs) return; // handle test environment where no scripts exist

  const js = document.createElement("script");
  js.id = id;
  js.src = src;
  js.onload = onLoadFunc; // fascinating
  firstJs.parentNode.insertBefore(js, firstJs);
}

// copied from https://developers.google.com/calendar/api/quickstart/js


const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_API_KEY;

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";


/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
export function handleClientLoad(updateSigninCallback){
  if(window.gapi === undefined) return Promise.resolve(null);

  return new Promise((resolve) => {
    window.gapi.load("client:auth2", () => {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      }).then(function () {
        // Listen for sign-in state changes.
        const listener = window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninCallback);

        // Handle the initial sign-in state.
        updateSigninCallback(window.gapi.auth2.getAuthInstance().isSignedIn.get());

        resolve(listener);
      }, function(error) {
        console.error(JSON.stringify(error, null, 2));
        resolve(null);
      });
    });
  });
}

/**
       *  Sign in the user upon button click.
       */
export function gapiSignin(event) {
  return window.gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
export function gapiSignout(event) {
  window.gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
export function getCalendarList(calListCallback) {
  // https://stackoverflow.com/questions/29974011/try-to-display-calendar-list-from-google-api-using-java-script
  const request = window.gapi.client.calendar.calendarList.list();
  request.execute(function(resp){
    const calendars = resp.items;
    calListCallback(calendars);
  });
  
  // window.gapi.client.calendar.events.list({
  //   "calendarId": "primary",
  //   "timeMin": (new Date()).toISOString(),
  //   "showDeleted": false,
  //   "singleEvents": true,
  //   "maxResults": 10,
  //   "orderBy": "startTime"
  // }).then(function(response) {
  //   let events = response.result.items;
  //   appendPre("Upcoming events:");

  //   if (events.length > 0) {
  //     for (let i = 0; i < events.length; i++) {
  //       let event = events[i];
  //       let when = event.start.dateTime;
  //       if (!when) {
  //         when = event.start.date;
  //       }
  //       appendPre(event.summary + " (" + when + ")")
  //     }
  //   } else {
  //     appendPre("No upcoming events found.");
  //   }
  // });
}