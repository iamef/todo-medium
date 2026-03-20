import React from "react";
import PropTypes from "prop-types";

import { Button, Checkbox, FormControlLabel, FormGroup } from "@mui/material";

import { fs } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

class CalendarSelection extends React.Component{
  constructor(props){
    console.log("CalSelection", props);
    super(props);

    this.state = {};

    // let formDataInitialJSON = this.props.calendars.map((calendar) => {
    //     return "\"" + calendar.id + "\"" + ": false"
    // }).toString()
    // formDataInitialJSON = JSON.parse("{" + formDataInitialJSON + "}")
    // this.setState(formDataInitialJSON);

    // this.state = [];


    
    // this.componentDidUpdate = this.componentDidUpdate.bind(this)
  }

  componentDidMount(){
    console.log("cal selection mount");
    console.log(this.props.userFirebasePath);

    getDoc(doc(fs, this.props.userFirebasePath)).then((docSnap) => {
      const calendars = docSnap.data().calendars;

      if(calendars !== undefined){
        let formDataInitialJSON = calendars.map((calID) => {
          return "\"" + calID + "\": true";
        }).toString();
        formDataInitialJSON = JSON.parse("{" + formDataInitialJSON + "}");
        
        // console.log(formDataInitialJSON)

        this.setState(formDataInitialJSON);
      
      }

    }, (reason) => console.log(reason));

  }

  // static getDerivedStateFromProps(props, state){
  //   console.log(props, this.props, state)
  //   if(props === this.props) return;

  //   // let formDataInitialJSON = ""
    
  //   if(!(this.props.calendars === undefined)){
  //     console.log("this cal is not undefined")
  //     let formDataInitialJSON = this.props.calendars.map((calendar) => {
  //         return "\"" + calendar.id + "\": false"
  //     }).toString()
  //     formDataInitialJSON = JSON.parse("{" + formDataInitialJSON + "}")
  //     this.setState(formDataInitialJSON);
  //     console.log(formDataInitialJSON)
  //   }
  // }

  // updatedJSON(){
    
  // }

  handleCheckChange(event, calendarId){
    console.log(event, {...this.state});
    this.setState(JSON.parse("{\"" + calendarId + "\": " + event.target.checked + "}"));
  }

  getChecked(calendarId){
    // console.log(this.state)
    // return false;
    // return this.state.includes(calendarId);
    if(this.state[calendarId] === undefined){
    //   // firebase.database().ref("Calendars").get().then((value) => console.log(value), (reason) => console.log(reason))
      return false;
    }
    return this.state[calendarId];
  }

  submitCheckedCalendars(){
    const calsToInclude = [];
    console.log(this.state);
    for(const key in this.state){
      if(this.state[key]) calsToInclude.push(key);
    }
    console.log(calsToInclude);
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