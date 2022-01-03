// This function is probably unnecessary because we already get the todos from another place
// export function getTodos(){
//   firebase.database().ref("Todo").get().then((value) => {
//       console.log(value.val())

//     }, (reason) => console.log(reason))
// }

// later on add support for overshoots  based on priority
// Update to this https://blog.patricktriest.com/what-is-async-await-why-should-you-care/
export async function calculateBuffer(todos, calendars){
  var buffersById = {}
  
  // get calendars that are checked
  console.log("unsortedtodos", todos)

  console.log(calendars)

  // sort todos in order of dueDate
  // can later incoporate priority
  todos.sort((item1, item2) => {
    if(item1.dueDate === '' && item2.dueDate === ''){
      return 0
    }else if(item1.dueDate === ''){
      return 1  // this means item1 - item2 is positive
    }else if(item2.dueDate === ''){
      return -1 // this means item1 - item2 is negative
    }
    
    return Date.parse(item1.dueDate) - Date.parse(item2.dueDate)
  });
  
  console.log("SORTED", todos)

  var currBuffer = 0;
  var prevTodoDueDate = new Date()

  for(var todo of todos){
    // var calIter = calendars.values(); // returns iterator so I can call next
    
    // var eList = await returnEventsRecursion(calIter, prevTodoEndString, '2022-01-25T07:36:53.880Z');
    
    var todoDueDate = new Date(todo.dueDate)

    if(prevTodoDueDate < todoDueDate){
      var eList = []

      for(var calId of calendars){
        
        var events = await window.gapi.client.calendar.events.list({
          'calendarId': calId,
          'timeMin': prevTodoDueDate.toISOString(), // note this is end time
          'timeMax': todoDueDate.toISOString(), 
          'showDeleted': false,
          'singleEvents': true,
          'orderBy': 'startTime'
        });
        eList.concat(events.result.items)
      }

      debugger
      console.log('eList', eList)

      for(var event of eList){
        // TODO needs to work on this calculation
        console.log(event);
      }
      
      prevTodoDueDate = todoDueDate
    }

    currBuffer -= Number(todo.estTime) * 60*60*1000  // convert to miliseconds

    buffersById[todo.id] = currBuffer

    
  }

  return buffersById
}

const eventsDispatcher = {

}

async function returnEventsRecursion(calIter, minTime, maxTime){
  if(window.gapi.client.calendar === undefined){
    console.log("gapi calendar undefined")
    return;
  }
  
  var calNext = calIter.next();
  // debugger
  return new Promise((resolve, reject) => {
    // when it is done, 
    // calNext.value is undefined
    // calNext.done is true
    if(calNext.done){  
      resolve([]);
    }else{
      window.gapi.client.calendar.events.list({
          'calendarId': calNext.value,
          'timeMin': minTime, // note this is end time
          'timeMax': maxTime, 
          'showDeleted': false,
          'singleEvents': true,
          'orderBy': 'startTime'
      }).then((response) => {
        // console.log("resp0", response.result.items, response)
        returnEventsRecursion(calIter, minTime, maxTime).
        then((recResponse) => {
          // var events = response.result.items;
          // console.log("resp", response, events)
          // console.log("recResp", recResponse)
          // // should return all the calendar events
          // // by recursively concatenating them
          resolve(response.result.items.concat(recResponse))
        }).catch((error) => {
          console.log(error);
          debugger
        })
      },
      (error) => {
        console.log(error);
      });
    }
    
    // reject("Something went wrong...");

  });
}

// /** Loads google calendar api
//  * @param {string} apiKey api key for google's calendar api
//  * @return {Promise} resolves when api is successfully loaded and rejects when an error occurs
//  */
// export function loadCalendarAPI(apiKey) {
//   return new Promise((resolve, reject) => {
//     const script = document.createElement("script");
//     script.src = "https://apis.google.com/js/api.js";
//     document.body.appendChild(script);
//     script.onload = () => {
//       gapi.load("client", () => {
//         gapi.client.init({ apiKey: apiKey })
//           .then(() => {
//             gapi.client
//               .load(
//                 "https://content.googleapis.com/discovery/v1/apis/calendar/v3/rest"
//               )
//               .then(
//                 () => resolve("GAPI client successfully loaded for API"),
//                 (err) => reject(err)
//               );
//           });
//       });
//     }
//   })
// }

// /** query calendar API for events
//  * @param {string} calendarId id of the calendar, looks like s9ajkhr604dfrmvm7185lesou0@group.calendar.google.com
//  * @param {number} [maxResults=1000] maximum number of events returned, can be up to 2500, currently doesn't support more events
//  * @returns {Object} see https://developers.google.com/calendar/v3/reference/events/list for shape of response object
//  */
// export function getEventsList(calendarId, maxResults = 1000) {
//   return gapi.client.calendar.events.list({
//     calendarId: calendarId,
//     maxResults: maxResults,
//   });
// }