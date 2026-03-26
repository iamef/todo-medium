import React, { useState } from "react";

import { auth, fs } from "../firebase";

import { RadioGroup, TextField, FormControlLabel, FormLabel, Radio, FormGroup, Checkbox } from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { addDoc, collection } from "firebase/firestore";
import { parseDate, parseTime } from "../utils/todosFunctions";

// import * as chrono from "chrono-node";

// Added more fields usinig this!
// https://dev.to/jleewebdev/using-the-usestate-hook-and-working-with-forms-in-react-js-m6b
const Form = () => {
    const intialFormState = {
        atitle: "",
        dueDate: null,
        deadlineType: "noDeadline",
        estTime: "",
        priority: "tbd",
        recurring: false,
        endRecurring: null,
        folder: "",
        list: ""
    };

    const [formData, setFormData] = useState(intialFormState);

    const [quickAdd, setQuickAdd] = useState({text: "", formModified: false});
    
    function addOneTodoToFirebase(todo){
        if(todo.dueDate !== null){ // || todo.dueDate !== "" || (todo.dueDate instanceof Date && isNaN(todo.dueDate))){
            // todo.dueDate = todo.dueDate.toLocaleString()
            const d = todo.dueDate;
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const year = d.getFullYear() % 100;
            const hours = d.getHours();
            const minutes = d.getMinutes();
            const ampm = hours < 12 ? "AM" : "PM";
            const displayHours = hours % 12 || 12;
            todo.dueDate = `${month}/${day}/${year < 10 ? "0" + year : year} ${displayHours}:${minutes < 10 ? "0" + minutes : minutes}${ampm}`;
        }
        
        const todoFilePath = "users/" + (auth.currentUser ? auth.currentUser.uid : null) + "/Todos";
        // todoFilePath +=  formData.folder + "/" + formData.list;

        addDoc(collection(fs, todoFilePath), todo);
    }
    
    const createTodo = () => {
        
        const todo = {
            ...formData,
            complete: false,
        };
        
        addOneTodoToFirebase(todo);
        
        if(formData.recurring){
            if(formData.endRecurring !== null){
                // also what if the endDate < startDate
                // should be fine lol
                const endDate = formData.recurring ? formData.endRecurring: formData.dueDate;
                
                const numDaysInWeek = 7;
                const currDueDate = formData.dueDate;
                currDueDate.setDate(currDueDate.getDate() + numDaysInWeek);
                while(currDueDate <= endDate){
                    todo.dueDate = currDueDate;
                    addOneTodoToFirebase(todo);
                    currDueDate.setDate(currDueDate.getDate() + numDaysInWeek);
                }
            }else{
                // TODO improve this statement
                alert("endRecurring is null, unexpected behavior");
            }
        }
        
        setFormData({
            ...formData,
            atitle: "",
            deadlineType: "noDeadline",
            recurring: false,
            endRecurring: null,
        });

        setQuickAdd({text: "", formModified: false});
    };

    function parseQuickAdd(e){
        const currQAStr = e.target.value;
        
        setQuickAdd({...quickAdd, text: currQAStr});

        // TODO split into many diff functions
        // FIND DATE
        const dateParseData = parseDate(currQAStr);

        // FIND TIME
        const timeParseData = parseTime(currQAStr);

        // rest of string is title
        let title = currQAStr;
        
        let dueDate;
        if(dateParseData !== false){
            if(timeParseData !== false){
                dueDate = new Date(dateParseData.year, dateParseData.month, dateParseData.day, 
                                        timeParseData.hours, timeParseData.minutes);
                
                title = currQAStr.substring(0, Math.min(dateParseData.startIndex, timeParseData.startIndex)) + 
                        currQAStr.substring(Math.min(dateParseData.endIndex, timeParseData.endIndex), Math.max(dateParseData.startIndex, timeParseData.startIndex)) + 
                        currQAStr.substring(Math.max(dateParseData.endIndex, timeParseData.endIndex));

            }else{
                // eslint-disable-next-line no-magic-numbers
                dueDate = new Date(dateParseData.year, dateParseData.month, dateParseData.day, 23, 59);
                setFormData({...formData, dueDate: dueDate});

                title = currQAStr.substring(0, dateParseData.startIndex) + 
                        currQAStr.substring(dateParseData.endIndex);
            }
            if(formData.deadlineType === "noDeadline")
                setFormData({...formData, dueDate: dueDate, atitle: title, deadlineType: "hard"});
            else
                setFormData({...formData, dueDate: dueDate, atitle: title});
            
        }else{
            if(timeParseData !== false){
                
                const dateNow = new Date();
                
                if(dateNow.getHours() > timeParseData.hours){
                    dateNow.setDate(dateNow.getDate() + 1);
                }else if(dateNow.getHours() === timeParseData.hours){
                    if(dateNow.getMinutes() > timeParseData.minutes){
                        dateNow.setDate(dateNow.getDate() + 1);
                    }
                }
                
                dueDate = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate(), 
                                        timeParseData.hours, timeParseData.minutes);
                
                title = currQAStr.substring(0, timeParseData.startIndex) + 
                    currQAStr.substring(timeParseData.endIndex);

                if(formData.deadlineType === "noDeadline")
                    setFormData({...formData, dueDate: dueDate, atitle: title, deadlineType: "hard"});
                else
                    setFormData({...formData, dueDate: dueDate, atitle: title});
            }else{
                setFormData({...formData, atitle: title, dueDate: null});
            }
            
        }

        // common terms
        
        // find item name
    }

    return (
        <>
            <TextField
                    required
                    variant="standard"
                    label="Quick Add Todo"
                    type="text"
                    value={quickAdd.text}
                    onChange={(e) => parseQuickAdd(e)}
                    disabled={quickAdd.formModified}
                    className="textfield"
                    size="medium"
                />

            <div className="form">
                <TextField
                    required
                    variant="standard"
                    label="Add Todo"
                    type="text"
                    value={formData.atitle}
                    onChange={(e) => {setFormData({...formData, atitle: e.target.value}); setQuickAdd({...quickAdd, formModified: true});}}
                    className="textfield"
                    size="medium"
                />
                <br/>
                <br/>
                
                <FormGroup row>
                    {/* attempts to change color https://github.com/mui-org/material-ui-pickers/issues/393 */}
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                            // required={formData.deadlineType !== "noDeadline"}
                            value={formData.dueDate}
                            label="Due Date"
                            onChange={(e) => {
                                if(formData.deadlineType === "noDeadline")
                                    setFormData({...formData, dueDate: e, deadlineType: "hard"});
                                else
                                    setFormData({...formData, dueDate: e});

                                setQuickAdd({...quickAdd, formModified: true});
                            }}
                            slotProps={{
                                textField: {
                                    className: "textfield",
                                    size: "medium"
                                }
                            }}
                        />
                    </LocalizationProvider>

                    <RadioGroup row>
                        <FormControlLabel 
                            checked={formData.deadlineType === "hard"}
                            control={<Radio />} 
                            onChange={(e) => setFormData({...formData, deadlineType: "hard"})}
                            label="Hard Deadline" />
                        <FormControlLabel 
                            checked={formData.deadlineType === "soft"}
                            control={<Radio />} 
                            onChange={(e) => setFormData({...formData, deadlineType: "soft"})}
                            label="Soft Deadline" />
                        <FormControlLabel 
                            checked={formData.deadlineType === "noDeadline"}
                            control={<Radio />} 
                            onChange={(e) => setFormData({...formData, deadlineType: "noDeadline", dueDate: null})}
                            label="No Deadline" />
                    </RadioGroup>
                </FormGroup>
                
                <TextField
                    variant="standard"
                    label="Estimated Hours"
                    helperText="How Long Will the Task Take You?"
                    type="number"
                    value={formData.estTime}
                    onChange={(e) => setFormData({...formData, estTime: e.target.value})}
                    className="textfield"
                    size="medium"
                />
                
                
                <br/>
                <br/>
                
                <FormLabel component="legend">Priority</FormLabel>  
                <RadioGroup row>
                    <FormControlLabel 
                        checked={formData.priority === "tbd"}
                        control={<Radio />} 
                        onChange={(e) => setFormData({...formData, priority: "tbd"})}
                        label="To Be Determined" />
                    {/* <FormControlLabel 
                        checked={formData.priority === "vlow"}
                        control={<Radio />} 
                        onChange={(e) => setFormData({...formData, priority: "vlow"})}
                        label="Very Low" /> */}
                    <FormControlLabel 
                        checked={formData.priority === "low"}
                        control={<Radio />} 
                        onChange={(e) => setFormData({...formData, priority: "low"})}
                        label="Low" />
                    <FormControlLabel 
                        checked={formData.priority === "medium"}
                        control={<Radio />} 
                        onChange={(e) => setFormData({...formData, priority: "medium"})}
                        label="Medium" />
                    <FormControlLabel 
                        checked={formData.priority === "high"}
                        control={<Radio />} 
                        onChange={(e) => setFormData({...formData, priority: "high"})}
                        label="High" />
                    {/* <FormControlLabel 
                        checked={formData.priority === "vHIGH"}
                        control={<Radio />} 
                        onChange={(e) => setFormData({...formData, priority: "vHIGH"})}
                        label="Very high" /> */}
                </RadioGroup>
                
                <br/>
                
                {/* TODO add more options to recurring */}
                <FormControlLabel
                    control={<Checkbox checked={formData.recurring} onChange={(e) => setFormData({...formData, recurring: e.target.checked})}/>}
                    label="Recurring weekly"
                    labelPlacement="start"
                />

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                        // required={formData.deadlineType !== "noDeadline"}
                        value={formData.endRecurring}
                        label="End Recurring"
                        onChange={(e) => {
                            setFormData({...formData, endRecurring: e});
                        }}
                        slotProps={{
                            textField: {
                                className: "textfield",
                                size: "medium"
                            }
                        }}
                    />
                    </LocalizationProvider>
                
                <br/>
                
                <TextField 
                    required
                    variant="standard"
                    label="folder"
                    value={formData.folder}
                    onChange={(e) => setFormData({...formData, folder: e.target.value})}
                    type="text"
                />

                <TextField 
                    required
                    variant="standard"
                    label="list name"
                    value={formData.list}
                    onChange={(e) => setFormData({...formData, list: e.target.value})}
                    type="text"
                />

                <div className="add">
                    {
                        formData.atitle === "" ?
                            <AddCircleOutlineIcon
                                fontSize="large"
                                className="icon"
                            />
                            :
                            <AddCircleIcon
                                onClick={createTodo}
                                fontSize="large"
                                className="icon"
                            />
                    }
                </div>
            </div>
        </>
    );
};
export default Form;