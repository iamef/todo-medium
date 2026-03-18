export function todosDateTimeParse(todoDateTimeStr){
  if(todoDateTimeStr == null){
    return null
  }
  var todosRegExp = /([01]{0,1}\d)\/([0123]{0,1}\d)\/(\d\d) ([01]{0,1}\d):([0-5]\d)([AP]M)/i
  var res = todosRegExp.exec(todoDateTimeStr)
  var month = parseInt(res[1]) - 1
  var day = parseInt(res[2])
  var year = parseInt(res[3]) + 2000
  var hour = parseInt(res[4]) + (res[6] === "AM" ? 0 : 12)
  var minute = parseInt(res[5])

  return new Date(year, month, day, hour, minute)
}

// later on add support for overshoots  based on priority
// Update to this https://blog.patricktriest.com/what-is-async-await-why-should-you-care/
export async function calculateBuffer(todos, calendars, hardDeadlineOnlyBuffer){
  var buffersById = {}
  
  // get calendars that are checked
  // console.log("unsortedtodos", todos)

  // console.log(calendars)
  if(calendars === undefined){
    for(var nocaltodo of todos){
      nocaltodo.bufferMS = "select calendars"
    }
    return todos;
  }

  // sort todos in order of dueDate
  // can later incoporate priority
  var sortedTodos = todos.slice().sort((item1, item2) => {
    if(item1.dueDate === '' && item2.dueDate === ''){
      return 0
    }else if(item1.dueDate === ''){
      return 1  // this means item1 - item2 is positive
    }else if(item2.dueDate === ''){
      return -1 // this means item1 - item2 is negative
    }
    
    return todosDateTimeParse(item1.dueDate) - todosDateTimeParse(item2.dueDate)
  });
  
  // console.log("SORTED", sortedTodos)
  
  var currBufferMS = 0;
  
  const nowDate = new Date()
  const threeWeeksDate = new Date()
  threeWeeksDate.setDate(nowDate.getDate() + 21)

  var prevTodoDueDate = nowDate
  var prevTodoName = "none, 1st todo"
  
  
  // calculate for all priorities
  for(var todo of sortedTodos){
    buffersById[todo.id] = {}
    
    if(todo.dueDate === null || todo.complete){
      // debugger;
      buffersById[todo.id]["bufferMS"] = "N/A"
      continue;
    }

    if(hardDeadlineOnlyBuffer && todo.deadlineType === "soft"){
      buffersById[todo.id]["bufferMS"] = "soft"
      continue;
    }

    
    var todoDueDate = todosDateTimeParse(todo.dueDate)
    

    if(todoDueDate > threeWeeksDate){
      buffersById[todo.id]["bufferMS"] = "3wk"
      continue;
    }
    
    var prevBufferMS = currBufferMS;
    var msBetweenTasks = Math.max(0, todoDueDate - prevTodoDueDate);
    var hoursBetweenTasks = msBetweenTasks / (60*60*1000);
    
    var msEventsBetweenTasks = 0;
    var hoursEventsBetweenTasks = 0

    var msToComplete = Number(todo.estTime) * 60*60*1000

    // console.log(prevBufferMS / (60*60*1000), hoursBetweenTasks, hoursEventsBetweenTasks)

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
        // console.log(events.result.items)
        eList = eList.concat(events.result.items)
      }

      // console.log('eList', eList)
      buffersById[todo.id]["events"] = []
      for(var event of eList){
        // TODO needs to work on this calculation
        // console.log(event.summary, event.start, event.end);
        // debugger;
        // console.log(event);
        
        var startTime = Math.max(prevTodoDueDate, new Date(event.start.dateTime))
        var endTime = Math.min(todoDueDate, new Date(event.end.dateTime))
        
        // console.log((endTime - startTime) / (60*60*1000))
        if(isNaN(startTime) || isNaN(endTime)){
          console.log(event.summary, event.creator, event.htmlLink)
        }else{
          buffersById[todo.id]["events"].push({
              summary: event.summary, 
              start: event.start.dateTime,
              end: event.end.dateTime,
              htmlLink: event.htmlLink
          })

          msEventsBetweenTasks += (endTime - startTime)
        }
      }

      buffersById[todo.id]["events"].sort((item1, item2) => {
        if(item1.start === '' && item2.start === ''){
          return 0
        }else if(item1.start === ''){
          return 1  // this means item1 - item2 is positive
        }else if(item2.start === ''){
          return -1 // this means item1 - item2 is negative
        }
        
        return Date.parse(item1.start) - Date.parse(item2.start)
      });

      hoursEventsBetweenTasks = msEventsBetweenTasks / (60*60*1000)
      
      prevTodoDueDate = todoDueDate
    }

    currBufferMS = prevBufferMS + msBetweenTasks - 
                            msEventsBetweenTasks - msToComplete
    // currBuffer -= Number(todo.estTime) * 60*60*1000  // convert to miliseconds
    // console.log(todo.id)
    
    buffersById[todo.id]["prevTodo"] = prevTodoName;
    buffersById[todo.id]["prevBuffer"] = prevBufferMS;
    buffersById[todo.id]["hoursBetweensTasks"] = hoursBetweenTasks;
    buffersById[todo.id]["hoursEventBetweensTasks"] = hoursEventsBetweenTasks;
    buffersById[todo.id]["hoursToComplete"] = Number(todo.estTime);
    
    
    buffersById[todo.id]["bufferMS"] = currBufferMS

    prevTodoName = todo.atitle
  }

  // TODO centralize this priority Levels stuff
  var priorityLevels = ["low", "tbd", "medium", "high"]
  

  // we skip low priority
  for(var i=1; i < priorityLevels.length; i++){
    var msLowerPriorityTasks = 0
    for(todo of sortedTodos){
      
      if(todosDateTimeParse(todo.dueDate) < threeWeeksDate){
        if(priorityLevels.indexOf(todo.priority) >= i){
          buffersById[todo.id]["bufferMS_" + priorityLevels[i]] = buffersById[todo.id]["bufferMS"] + msLowerPriorityTasks
        }else{
          msLowerPriorityTasks += Number(todo.estTime) * 60*60*1000
        }
      }
    }


  }

  return buffersById
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
  var dateFound = false;
  
  var dateNow = new Date();
  var day = null;
  var month = null;
  var year = null;

  // today, tod
  var todayRegExp = /tod(ay){0,1}\s/i
  var res = todayRegExp.exec(str)  // var res = todayRegExp.exec("todtodaytodayTODAY ")
  if(res !== null){
      console.log(res)
      dateFound = true

      day = dateNow.getDate()
      month = dateNow.getMonth()
      year = dateNow.getFullYear()
      console.log(month, day, year, res[0], res.index)
      return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]}
  }
  
  // tomorrow, tmr
  if(!dateFound){
      var tomorrowRegExp = /tom(morrow){0,1}\s/i
      res = tomorrowRegExp.exec(str)  // var res = todayRegExp.exec("todtodaytodayTODAY ")
      console.log(res)
      if(res !== null){
          dateFound = true

          var dateTomorrow = new Date()
          dateTomorrow.setDate(dateNow.getDate() + 1)

          day = dateTomorrow.getDate()
          month = dateTomorrow.getMonth()
          year = dateTomorrow.getFullYear()
          console.log(month, day, year, res[0], res.index)
          return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]}
      }
  }
  if(!dateFound){
      var tmrRegExp = /tmr{0,1}\s/i
      res = tmrRegExp.exec(str)  // var res = todayRegExp.exec("todtodaytodayTODAY ")
      console.log(res)
      if(res !== null){
          dateFound = true

          dateTomorrow = new Date()
          dateTomorrow.setDate(dateNow.getDate() + 1)

          day = dateTomorrow.getDate()
          month = dateTomorrow.getMonth()
          year = dateTomorrow.getFullYear()
          console.log(month, day, year, res[0], res.index)

          return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]}
      }
  }

  // TODO month/day strings

  // day month strs
  // TODO add on
  // TODO add day number checks for 31+ (ex: January 39th)
  if(!dateFound){
      // TODO think about enums
      var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
      for(var i=0; i < monthNames.length; i++){
          // console.log(monthStr)
          var monthStr = monthNames[i]

          var splitIndex = 3
          if(monthStr === "September"){
              splitIndex = 4
          }

          var monthREString = monthStr.substring(0, splitIndex) + "(" + monthStr.substring(splitIndex) + "){0,1}"
          var dayREString = "[123]{0,1}\\d(\\w\\w){0,1}"

          // TODO add European method
          var monthRegExp = RegExp(monthREString + "\\s" + dayREString, "i")
          // var res = monthRegExp.exec('"January 1", "February 5", "March 2nd", "April 5", "May 6", "June 21", "July 55", "August 24", "September 33", "October 44", "November 7", "December 39"')
          
          res = monthRegExp.exec(str)
          if(res !== null){
              dateFound = true
              
              day = parseInt(res[0].split(/\s/)[1])
              month = i
              year = dateNow.getFullYear()

              if(month < dateNow.getMonth()){
                  year += 1
              }
              
              console.log(month, day, year, monthRegExp, res)
              return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]}
          }
      }
  }
  
  // this day of the week
  // TODO add this as an option
  var daysOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if(!dateFound){
      for(i=0; i < daysOfWeekNames.length; i++){
          var dayStr = daysOfWeekNames[i]
          
          splitIndex = 3
          var thisDayRegExp = RegExp(dayStr.substring(0, splitIndex) + "(" + dayStr.substring(splitIndex) + "){0,1}\\s", "i")
          // res = thisDayRegExp.exec("'Sun day', 'Monday ', 'Tuesday ', 'Wed nesday', 'Thurs day', 'Fri day', 'Sat urday'")
          // console.log(res);
          res = thisDayRegExp.exec(str)

          if(dayStr === 'Tuesday'){
              if(res === null){
                  // Tues
                  var tuesRegExp = RegExp("Tues\\s", "i")
                  console.log(tuesRegExp.exec("tues tuesday"))
                  res = tuesRegExp.exec(str)
              }
          }else if(dayStr === 'Wednesday'){
              if(res === null){
                  var wedsRegExp = RegExp("Weds\\s", "i")
                  res = wedsRegExp.exec(str)
              }
          }else if(dayStr === 'Thursday'){
              if(res === null){
                  // Thur/Thurs
                  var thursRegExp = RegExp("Thur[s]{0,1}\\s", "i")
                  res = thursRegExp.exec(str)
              }
          }

          if(res !== null){
              dateFound = true
              
              var daysFromToday = i - dateNow.getDay()
              if(daysFromToday <= 0){
                  daysFromToday += 7
              }
              
              var dateWeekday = new Date()

              dateWeekday.setDate(dateNow.getDate() + daysFromToday)

              day = dateWeekday.getDate()
              month = dateWeekday.getMonth()
              year = dateWeekday.getFullYear()
              console.log(month, day, year, res[0], res.index)

              console.log(thisDayRegExp, res)
              return {"month": month, "day": day, "year": year, startIndex: res.index, endIndex: res.index + res[0].length, matchStr: res[0]}
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
  var timeFound = false
  
  // 7pm or 7 pm 7:30pm
  // TODO more sophisticated time parsing (99 is not valid)
  var timeAMRegExp = /[01]{0,1}\d(:\d\d){0,1}\s{0,1}am\s/i
  var res = timeAMRegExp.exec(str)
  if(res !== null){
      console.log(res)
      timeFound = true

      var hours = parseInt(res[0].match(/[01]{0,1}\d/)[0])
      var minutes = 0
      if(res[1] !== undefined){
          minutes = parseInt(res[1].substring(1))
      }

      console.log(hours, minutes, res[0], res.index)
      return { hours: hours, minutes: minutes, matchStr: res[0], startIndex: res.index, endIndex: res.index + res[0].length }

  }

  if(!timeFound){
      var timePMRegExp = /[01]{0,1}\d(:\d\d){0,1}\s{0,1}pm\s/i
      res = timePMRegExp.exec(str)
      if(res !== null){
          console.log(res)
          timeFound = true

          hours = parseInt(res[0].match(/[01]{0,1}\d/)[0])
          hours += 12

          minutes = 0
          if(res[1] !== undefined){
              minutes = parseInt(res[1].substring(1))
          }

          console.log(hours, minutes, res[0], res.index)
          return { hours: hours, minutes: minutes, matchStr: res[0], startIndex: res.index, endIndex: res.index + res[0].length }
      }
  }
  
  
  // 23:47
  if(!timeFound){
      var hhmmRegExp = /([012]{0,1}\d:\d\d)\s/i
      res = hhmmRegExp.exec(str);

      if(res !== null){
          [hours, minutes] = res[1].split(":")
          hours = parseInt(hours)
          minutes = parseInt(minutes)

          console.log(hours, minutes, res[0], res.index)
          return { hours: hours, minutes: minutes, matchStr: res[0], startIndex: res.index, endIndex: res.index + res[0].length }
      }
  }


  // TODO "at" parsing

  return false;
}
