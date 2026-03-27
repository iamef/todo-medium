import React from "react";
import PropTypes from "prop-types";

import { Button, Checkbox, FormControlLabel, FormGroup } from "@mui/material";

import { fs } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

class CalendarSelection extends React.Component{
  constructor(props){
    super(props);

    this.state = {};
  }

  componentDidMount(){
    getDoc(doc(fs, this.props.userFirebasePath)).then((docSnap) => {
      const calendars = docSnap.data().calendars;

      if(calendars !== undefined){
        let formDataInitialJSON = calendars.map((calID) => {
          return "\"" + calID + "\": true";
        }).toString();
        formDataInitialJSON = JSON.parse("{" + formDataInitialJSON + "}");
        
        this.setState(formDataInitialJSON);
      
      }

    }, (reason) => console.error("Failed to load calendar selection:", reason));

  }

  handleCheckChange(event, calendarId){
    this.setState(JSON.parse("{\"" + calendarId + "\": " + event.target.checked + "}"));
  }

  getChecked(calendarId){
    if(this.state[calendarId] === undefined){
      return false;
    }
    return this.state[calendarId];
  }

  submitCheckedCalendars(){
    const calsToInclude = [];
    for(const key in this.state){
      if(this.state[key]) calsToInclude.push(key);
    }
    setDoc(doc(fs, this.props.userFirebasePath), {calendars: calsToInclude});
    
    // set(ref(db, "Calendars"), calsToInclude)
    // firebase.database().ref("Calendars").set(calsToInclude);
    this.setState({});
  }

  render() {
    if(this.props.calendars === undefined) return null;

    return (
      <div className="calendarChecklist">
      <FormGroup>
          { this.props.calendars.map((calendar) => 
              <FormControlLabel 
                  checked={ this.getChecked(calendar.id) }
                  control={<Checkbox/>}
                  label= {calendar.summary}
                  key= {calendar.id}
                  onChange={ (e) => this.handleCheckChange(e, calendar.id) }
                  // className="calendarChecklist"
              /> 
          ) }
      </FormGroup>
      <Button
        onClick={() => this.submitCheckedCalendars() }
      >
        Submit
      </Button>
      </div>
    );
  }
}

CalendarSelection.propTypes = {
  userFirebasePath: PropTypes.string,
  calendars: PropTypes.arrayOf(PropTypes.string)
};

export default CalendarSelection;