export function todosDateTimeParse(todoDateTimeStr){
  if(todoDateTimeStr == null){
    return null;
  }
  const todosRegExp = /([01]{0,1}\d)\/([0123]{0,1}\d)\/(\d\d) ([01]{0,1}\d):([0-5]\d)([AP]M)/i;
  const res = todosRegExp.exec(todoDateTimeStr);
  const month = parseInt(res[1]) - 1;
  const day = parseInt(res[2]);
  // eslint-disable-next-line no-magic-numbers
  const year = parseInt(res[3]) + 2000;
  // eslint-disable-next-line no-magic-numbers
  const hour = parseInt(res[4]) + (res[6] === "AM" ? 0 : 12);
  const minute = parseInt(res[5]);

  return new Date(year, month, day, hour, minute);
}

// later on add support for overshoots  based on priority
// Update to this https://blog.patricktriest.com/what-is-async-await-why-should-you-care/
export async function calculateBuffer(todos, calendars, hardDeadlineOnlyBuffer){
  const buffersById = {};
  
  // get calendars that are checked
  if(calendars === undefined){
    for(const nocaltodo of todos){
      nocaltodo.bufferMS = "select calendars";
    }
    return todos;
  }

  // sort todos in order of dueDate
  // can later incoporate priority
  const sortedTodos = todos.slice().sort((item1, item2) => {
    if(item1.dueDate === "" && item2.dueDate === ""){
      return 0;
    }else if(item1.dueDate === ""){
      return 1; // this means item1 - item2 is positive
    }else if(item2.dueDate === ""){
      return -1; // this means item1 - item2 is negative
    }
    
    return todosDateTimeParse(item1.dueDate) - todosDateTimeParse(item2.dueDate);
  });
  
  // get events 3 weeks from now
  const nowDate = new Date();
  
  const numDaysIn3Weeks = 21;
  const threeWeeksDate = new Date();
  threeWeeksDate.setDate(nowDate.getDate() + numDaysIn3Weeks);
  const events = await getEvents();
  
  async function getEvents(by="end"){
    const retEvents = [];

    for(const calId of calendars){
      const events = await window.gapi.client.calendar.events.list({
        "calendarId": calId,
        "timeMin": nowDate.toISOString(), // note this is end time
        "timeMax": threeWeeksDate.toISOString(), 
        "showDeleted": false,
        "singleEvents": true,
        "orderBy": "startTime"
      });
      // console.log(events.result.items)
      retEvents.push(...events.result.items);
    }
    // retSortedEvents.sort((item1, item2) => {
    //   if(item1[by] === "" && item2[by] === ""){
    //     return 0;
    //   }else if(item1[by] === ""){
    //     return 1;  // this means item1 - item2 is positive
    //   }else if(item2[by] === ""){
    //     return -1; // this means item1 - item2 is negative
    //   }
    //   return Date.parse(item1[by]) - Date.parse(item2[by]);
    // });

    return retEvents;
  }
  
  let currBufferMS = 0;

  let prevTodoDueDate = nowDate;
  let prevTodoName = "none, 1st todo";
  
  // eslint-disable-next-line no-magic-numbers
  const msPerHour = 60*60*1000;


  // calculate for all priorities
  for(const todo of sortedTodos){
    buffersById[todo.id] = {};
    
    if(todo.dueDate === null || todo.complete){
      // debugger;
      buffersById[todo.id]["bufferMS"] = "N/A";
      continue;
    }

    if(hardDeadlineOnlyBuffer && todo.deadlineType === "soft"){
      buffersById[todo.id]["bufferMS"] = "soft";
      continue;
    }
    
    const todoDueDate = todosDateTimeParse(todo.dueDate);
    
    if(todoDueDate > threeWeeksDate){
      buffersById[todo.id]["bufferMS"] = "3wk";
      continue;
    }
    
    const prevBufferMS = currBufferMS;
    const msBetweenTasks = Math.max(0, todoDueDate - prevTodoDueDate);
    const hoursBetweenTasks = msBetweenTasks / (msPerHour);
    
    let msEventsBetweenTasks = 0;
    let hoursEventsBetweenTasks = 0;

    const msToComplete = Number(todo.estTime) * msPerHour;

    if(prevTodoDueDate < todoDueDate){
      // const eList = [];

      // for(const calId of calendars){
        
      //   const events = await window.gapi.client.calendar.events.list({
      //     "calendarId": calId,
      //     "timeMin": prevTodoDueDate.toISOString(), // note this is end time
      //     "timeMax": todoDueDate.toISOString(), 
      //     "showDeleted": false,
      //     "singleEvents": true,
      //     "orderBy": "startTime"
      //   });
      //   // console.log(events.result.items)
      //   eList = eList.concat(events.result.items);
      // }

      // // console.log("eList", eList)
      buffersById[todo.id]["events"] = [];
      // for(const event of eList){
      //   // TODO needs to work on this calculation
      //   // console.log(event.summary, event.start, event.end);
      //   // debugger;
      //   // console.log(event);
        
      //   const startTime = Math.max(prevTodoDueDate, new Date(event.start.dateTime));
      //   const endTime = Math.min(todoDueDate, new Date(event.end.dateTime));
        
      //   // console.log((endTime - startTime) / (msPerHour))
      //   if(isNaN(startTime) || isNaN(endTime)){
      //     console.log(event.summary, event.creator, event.htmlLink);
      //   }else{
      //     buffersById[todo.id]["events"].push({
      //         summary: event.summary, 
      //         start: event.start.dateTime,
      //         end: event.end.dateTime,
      //         htmlLink: event.htmlLink
      //     });

      //     msEventsBetweenTasks += (endTime - startTime);
      //   }
      // }

      // buffersById[todo.id]["events"].sort((item1, item2) => {
      //   if(item1.start === "" && item2.start === ""){
      //     return 0;
      //   }else if(item1.start === ""){
      //     return 1;  // this means item1 - item2 is positive
      //   }else if(item2.start === ""){
      //     return -1; // this means item1 - item2 is negative
      //   }
        
      //   return Date.parse(item1.start) - Date.parse(item2.start);
      // });

      // for(const [indexOffset,event] of sortedEventsByEnd.slice(sortedEventsIndex).entries()){
      
      // debugger;
      for(const event of events){        
        const eventStartTime = new Date(event.start.dateTime);
        const eventEndTime = new Date(event.end.dateTime);

        const eventWithinTimeframe = eventStartTime <= todoDueDate && prevTodoDueDate <= eventEndTime;
        const amOrganizer = event.organizer.self === true;
        
        // assume that if you are an organizer, it seems like you can't decline the event?
        const meAsAttendee = event.attendees ? event.attendees.filter((a) => (a.self))[0] : undefined;
        const acceptedInvite = (meAsAttendee !== undefined && meAsAttendee.responseStatus === "accepted");

        if(eventWithinTimeframe && (amOrganizer || acceptedInvite)){
          //event.attendees[0].self
          // event.attendees.filter((a) => (a.self)); or event.organizer.self === true
          // const apple = [
          //   {
          //       "email": "emilyfan@mit.edu",
          //       "self": true,
          //       "responseStatus": "needsAction"
          //   }
          // ];

          const startTime = Math.max(prevTodoDueDate, eventStartTime);
          const endTime = Math.min(todoDueDate, eventEndTime);
          
          // console.log((endTime - startTime) / (msPerHour))
          if(isNaN(startTime) || isNaN(endTime)){
            console.log(event.summary, event.creator, event.htmlLink);
          }else{
            buffersById[todo.id]["events"].push({
                summary: event.summary, 
                start: event.start.dateTime,
                end: event.end.dateTime,
                htmlLink: event.htmlLink
            });

            msEventsBetweenTasks += (endTime - startTime);
          }
        }
        
        
      }



      hoursEventsBetweenTasks = msEventsBetweenTasks / (msPerHour);
      
      prevTodoDueDate = todoDueDate;
    }

    currBufferMS = prevBufferMS + msBetweenTasks - 
                            msEventsBetweenTasks - msToComplete;
    // currBuffer -= Number(todo.estTime) * msPerHour  // convert to miliseconds
    // console.log(todo.id)
    
    buffersById[todo.id]["prevTodo"] = prevTodoName;
    buffersById[todo.id]["prevBuffer"] = prevBufferMS;
    buffersById[todo.id]["hoursBetweensTasks"] = hoursBetweenTasks;
    buffersById[todo.id]["hoursEventBetweensTasks"] = hoursEventsBetweenTasks;
    buffersById[todo.id]["hoursToComplete"] = Number(todo.estTime);
    
    
    buffersById[todo.id]["bufferMS"] = currBufferMS;

    prevTodoName = todo.atitle;
  }

  // TODO centralize this priority Levels stuff
  const priorityLevels = ["low", "tbd", "medium", "high"];
  

  // we skip low priority
  for(let i=1; i < priorityLevels.length; i++){
    let msLowerPriorityTasks = 0;
    for(const todo of sortedTodos){
      
      if(todosDateTimeParse(todo.dueDate) < threeWeeksDate){
        if(priorityLevels.indexOf(todo.priority) >= i){
          buffersById[todo.id]["bufferMS_" + priorityLevels[i]] = buffersById[todo.id]["bufferMS"] + msLowerPriorityTasks;
        }else{
          msLowerPriorityTasks += Number(todo.estTime) * msPerHour;
        }
      }
    }


  }

  return buffersById;
}

// argsTuple in the form (whatever to sort by, isAscending)
// javascript technically doesn't have tuples...
// returns a comparable function given the arguments
// creds: https://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields
// TODO move this to TodoLIst functions at some point
// TODO what if I just had a stable sorting function. Bruh...
// actually according to mozilla.org, it is stable. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
export function compareForMultipleProperties(...sortOrder){
    
  function singlePropertyCompare(item1, item2, type, ascending=true){
      if(type === "dueDate"){
          let ret;

          if(item1 === "" && item2 === ""){
              ret = 0;
          }else if(item1 === ""){
              ret = 1;  // this means item1 - item2 is positive
          }else if(item2 === ""){
              ret = -1; // this means item1 - item2 is negative
          }
          ret = todosDateTimeParse(item1) - todosDateTimeParse(item2);

          return (ascending ? ret : -1*ret);
      }else if(type === "priority"){
          const priorityLevels = ["low", "tbd", "medium", "high"];
          
          // higher priorities should appear first
          return -1* (priorityLevels.indexOf(item1) - priorityLevels.indexOf(item2));
      }

      if (item1 === item2) return 0;
      return item1 < item2 ? -1 : 1;
  }
  
  return function(item1, item2){
      
      // console.log(argsTuple)

      for(const arg of sortOrder){
          // console.log(arg)
          
          let type, sortAscending;
          if(Array.isArray(arg)){
              type = arg[0];
              sortAscending = arg[1];
          }else{
              type = arg;
              sortAscending = true;
          }

          const res = singlePropertyCompare(item1[type], item2[type], type, sortAscending);
          
          // console.log(item1[type], item2[type], type, sortAscending, res)

          if(res !== 0) return res;
      }
      
      return 0;
  };
}

export function sortedArray(arr, ...sortOrder){
  // debugger;
  console.log(sortOrder);
  const result = [...arr];
  sortOrder = sortOrder.flat();
  // debugger;
  result.sort(compareForMultipleProperties(...sortOrder));
  return result;
}

/** returns JSON in format
// {
//     "month": month number 0 index, 
//     "day": day, 
//     "year": year, 
//     startIndex: 
//     endIndex: 
//     matchStr
// }
  */
export function parseDate(str){
  let dateFound = false;
  
  const dateNow = new Date();
  let day = null;
  let month = null;
  let year = null;

  // today, tod
  const todayRegExp = /tod(ay){0,1}\s/i;
  let res = todayRegExp.exec(str);  // let res = todayRegExp.exec("todtodaytodayTODAY ")
  if(res !== null){
      console.log(res);
      dateFound = true;

      day = dateNow.getDate();
      month = dateNow.getMonth();
      year = dateNow.getFullYear();
      console.log(month, day, year, res[0], res.index);
      return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]};
  }
  
  // tomorrow, tmr
  const dateTomorrow = new Date();
  dateTomorrow.setDate(dateNow.getDate() + 1);

  if(!dateFound){
      const tomorrowRegExp = /tom(morrow){0,1}\s/i;
      res = tomorrowRegExp.exec(str);  // let res = todayRegExp.exec("todtodaytodayTODAY ")
      console.log(res);
      if(res !== null){
          dateFound = true;

          day = dateTomorrow.getDate();
          month = dateTomorrow.getMonth();
          year = dateTomorrow.getFullYear();
          console.log(month, day, year, res[0], res.index);
          return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]};
      }
  }
  if(!dateFound){
      const tmrRegExp = /tmr{0,1}\s/i;
      res = tmrRegExp.exec(str); // let res = todayRegExp.exec("todtodaytodayTODAY ")
      console.log(res);
      if(res !== null){
          dateFound = true;

          // dateTomorrow = new Date();
          // dateTomorrow.setDate(dateNow.getDate() + 1);

          day = dateTomorrow.getDate();
          month = dateTomorrow.getMonth();
          year = dateTomorrow.getFullYear();
          console.log(month, day, year, res[0], res.index);

          return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]};
      }
  }

  // TODO month/day strings

  // day month strs
  // TODO add on
  // TODO add day number checks for 31+ (ex: January 39th)
  if(!dateFound){
      // TODO think about enums
      const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
      for(let i=0; i < monthNames.length; i++){
          // console.log(monthStr)
          const monthStr = monthNames[i];

          // eslint-disable-next-line no-magic-numbers
          const splitIndex = (monthStr === "September"? 4 : 3);
          // if(monthStr === "September"){
          //     splitIndex = 4;
          // }

          const monthREString = monthStr.substring(0, splitIndex) + "(" + monthStr.substring(splitIndex) + "){0,1}";
          const dayREString = "[123]{0,1}\\d(\\w\\w){0,1}";

          // TODO add European method
          const monthRegExp = RegExp(monthREString + "\\s" + dayREString, "i");
          // let res = monthRegExp.exec('"January 1", "February 5", "March 2nd", "April 5", "May 6", "June 21", "July 55", "August 24", "September 33", "October 44", "November 7", "December 39"')
          
          res = monthRegExp.exec(str);
          if(res !== null){
              dateFound = true;
              
              day = parseInt(res[0].split(/\s/)[1]);
              month = i;
              year = dateNow.getFullYear();

              if(month < dateNow.getMonth()){
                  year += 1;
              }
              
              console.log(month, day, year, monthRegExp, res);
              return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]};
          }
      }
  }
  
  // this day of the week
  // TODO add this as an option
  const daysOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if(!dateFound){
      for(let i=0; i < daysOfWeekNames.length; i++){
          const dayStr = daysOfWeekNames[i];
          
          const splitIndex = 3;
          const thisDayRegExp = RegExp(dayStr.substring(0, splitIndex) + "(" + dayStr.substring(splitIndex) + "){0,1}\\s", "i");
          // res = thisDayRegExp.exec("'Sun day', 'Monday ', 'Tuesday ', 'Wed nesday', 'Thurs day', 'Fri day', 'Sat urday'")
          // console.log(res);
          res = thisDayRegExp.exec(str);

          if(dayStr === "Tuesday"){
              if(res === null){
                  // Tues
                  const tuesRegExp = RegExp("Tues\\s", "i");
                  console.log(tuesRegExp.exec("tues tuesday"));
                  res = tuesRegExp.exec(str);
              }
          }else if(dayStr === "Wednesday"){
              if(res === null){
                  const wedsRegExp = RegExp("Weds\\s", "i");
                  res = wedsRegExp.exec(str);
              }
          }else if(dayStr === "Thursday"){
              if(res === null){
                  // Thur/Thurs
                  const thursRegExp = RegExp("Thur[s]{0,1}\\s", "i");
                  res = thursRegExp.exec(str);
              }
          }

          if(res !== null){
              dateFound = true;
              
              let daysFromToday = i - dateNow.getDay();
              if(daysFromToday <= 0){
                  // eslint-disable-next-line no-magic-numbers
                  daysFromToday += 7;
              }
              
              const dateWeekday = new Date();

              dateWeekday.setDate(dateNow.getDate() + daysFromToday);

              day = dateWeekday.getDate();
              month = dateWeekday.getMonth();
              year = dateWeekday.getFullYear();
              console.log(month, day, year, res[0], res.index);

              console.log(thisDayRegExp, res);
              return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]};
          }
      }
  }

  // TODO next day of the week
  if(!dateFound){
  }

  return false;
}

/** 
 * returns JSON
 * {
 *  hours (as integer)
 *  minutes (as integer)
 *  matchStr
 *  startIndex
 *  endIndex
 * }
 */
export function parseTime(str){
  let timeFound = false;
  
  // 7pm or 7 pm 7:30pm
  // TODO more sophisticated time parsing (99 is not valid)
  const timeAMRegExp = /[01]{0,1}\d(:\d\d){0,1}\s{0,1}am\s/i;
  let res = timeAMRegExp.exec(str);
  let hours, minutes;

  if(res !== null){
      console.log(res);
      timeFound = true;

      hours = parseInt(res[0].match(/[01]{0,1}\d/)[0]);
      let minutes = 0;
      if(res[1] !== undefined){
          minutes = parseInt(res[1].substring(1));
      }

      console.log(hours, minutes, res[0], res.index);
      return { hours: hours, minutes: minutes, matchStr: res[0], startIndex: res.index, endIndex: res.index + res[0].length };

  }

  if(!timeFound){
      const timePMRegExp = /[01]{0,1}\d(:\d\d){0,1}\s{0,1}pm\s/i;
      res = timePMRegExp.exec(str);
      if(res !== null){
          console.log(res);
          timeFound = true;

          hours = parseInt(res[0].match(/[01]{0,1}\d/)[0]);
          // eslint-disable-next-line no-magic-numbers
          hours += 12;

          minutes = 0;
          if(res[1] !== undefined){
              minutes = parseInt(res[1].substring(1));
          }

          console.log(hours, minutes, res[0], res.index);
          return { hours: hours, minutes: minutes, matchStr: res[0], startIndex: res.index, endIndex: res.index + res[0].length };
      }
  }
  
  
  // 23:47
  if(!timeFound){
      const hhmmRegExp = /([012]{0,1}\d:\d\d)\s/i;
      res = hhmmRegExp.exec(str);

      if(res !== null){
          [hours, minutes] = res[1].split(":");
          hours = parseInt(hours);
          minutes = parseInt(minutes);

          console.log(hours, minutes, res[0], res.index);
          return { hours: hours, minutes: minutes, matchStr: res[0], startIndex: res.index, endIndex: res.index + res[0].length };
      }
  }


  // TODO "at" parsing

  return false;
}
