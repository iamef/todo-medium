import React from "react";

import { fs } from "../firebase";

import { motion } from "framer-motion";

import { TableContainer, Table, TableRow, TableCell, TableBody, TableHead, Button, TableSortLabel } from "@mui/material";
import { calculateBuffer, compareForMultipleProperties, sortedArray } from "../utils/todosFunctions";
import { collection, doc, getDoc, onSnapshot} from "firebase/firestore";
import TodoItem from "./TodoItem";
import { eventBus } from "../utils/eventBus";

class TodoList extends React.Component{
    constructor(props){
        super(props);
        console.log("Todolist props", props);
        
        this.initializeTodolist = this.initializeTodolist.bind(this);
        this.recalculateBuffer = this.recalculateBuffer.bind(this);
        
        // need the todoList because 
        // this.state.todoList can be mappable
        // whereas this.state cannot be mappable
        // https://stackoverflow.com/questions/26253351/correct-modification-of-state-arrays-in-react-js
        
        // making todoList into a variable doesn't work
        // the todolist won't update when I click complete and stuff
        this.state = { todoList: false, hardDeadlineOnlyBuffer: false, filter: {} };

        this.orderBy = ["complete", "priority", "dueDate", "folder", "list"];
        
        // making this into a variable does seem to work
        // and this updates in the todolist app
        // hypothesis: this works because the todoList updates when happyDay update
        // the todoList update sort of carries the happyDay update
        // so todoList still needs to be a state for this to work
        this.todoFilePath = props.userFirebasePath +  "/Todos";
        
        this.unsubscribeFirebaseTodolist = () => {};

        this.headCells = [
            {
              firebaseKey: ["folder", "list"],
              id: "todoFolderList",
              numeric: false,
              disablePadding: true,
              label: "folder/list",
              align: "left"

            },
            {
              firebaseKey: "atitle",
              id: "todoTitle",
              numeric: false,
              disablePadding: true,
              label: "title",
              align: "left"
            },
            {
              firebaseKey: "dueDate",
              id: "todoDueDate",
              numeric: false,
              disablePadding: false,
              label: "dueDate",
              align: "right"
            },
            {
              firebaseKey: "deadlineType",
              id: "todoDeadlineType",
              numeric: true,
              disablePadding: false,
              label: "dType",
              align: "right"
            },
            {
              firebaseKey: "estTime",
              id: "todoEstimatedTime",
              numeric: true,
              disablePadding: false,
              label: "eT",
              align: "right"
            },
            {
              firebaseKey: "priority",
              id: "todoPriority",
              numeric: false,
              disablePadding: false,
              label: "priority",
              align: "right"
            },
            {
              firebaseKey: "bufferHrs",
              id: "todoBuffer",
              numeric: true,
              disablePadding: false,
              label: "buffer",
              align: "right"
            },
        ];
    }

    componentDidMount(){
        console.log("Todolist mount", this.props, this.state);
        
        if(this.props.firebaseSignedIn !== null){
            this.initializeTodolist();
        }else{
            console.log("Firebase login is null");
        }

        eventBus.on("filterFolder", (data) =>{
            // this.initializeTodolist(data);

            this.setState({filter: data});

            // this.setState({displayedTodoList: this.todoList.filter((elem) => elem.folder === data.folder)});
        });

        eventBus.on("filterList", (data) =>{
            // this.initializeTodolist(data);

            this.setState({filter: data});

            // this.setState({displayedTodoList: this.todoList.filter((elem) => (elem.folder === data.folder && elem.list === data.list))});
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        console.log("Todolist update", prevProps, this.props, prevState, this.state);
        
        this.todoFilePath = this.props.userFirebasePath +  "/Todos";
        
        // currently in iniitialize function
        // if(prevProps.firebaseSignedIn !== this.props.firebaseSignedIn){
        //     this.unsubscribeFirebaseTodolist();
        // }


        if(this.props.firebaseSignedIn !== null){
            // if you just signed into or out of FIREBASE
            if(prevProps.firebaseSignedIn !== this.props.firebaseSignedIn){
                this.initializeTodolist();
            // if you just signed into GCAL
            }else if(this.props.gapiSignedIn === true){
                if(prevProps.gapiSignedIn !== this.props.gapiSignedIn || prevState.hardDeadlineOnlyBuffer !== this.state.hardDeadlineOnlyBuffer){
                    if(Array.isArray(this.state.todoList)){
                        this.getTodoListWithBuffers(this.state.todoList, (todoListWithBuffers) => {
                            this.setState({todoList: todoListWithBuffers});
                        });
                    }
                }

                // TODO Take an action if you are logged out of gapi
            }
        }else{
            if(prevProps.firebaseSignedIn){
                alert("somehow firebase signin has become null");
                
                this.unsubscribeFirebaseTodolist();
                this.setState({todoList: false});
            }
        }
    }

    componentWillUnmount() {
        eventBus.remove("filterFolder");
        eventBus.remove("filterList");
    }    

    initializeTodolist(filter={}){
        this.unsubscribeFirebaseTodolist();
        
        const fsTodoRef = collection(fs, this.todoFilePath);
        // const fsTodoQuery;
        
        // if(filter.folder !== undefined){
        //     if(filter.list !== undefined){
        //         fsTodoQuery = query(fsTodoRef, where("folder", "==", filter.folder), where("list", "==", filter.list));
        //     }else{
        //         fsTodoQuery = query(fsTodoRef, where("folder", "==", filter.folder));
        //     }
        // }else{
        //     fsTodoQuery = query(fsTodoRef);
        // }
        
        // console.log(fsTodoQuery);

        //runs whenever the todolist on Firebase gets updated
        this.unsubscribeFirebaseTodolist = onSnapshot(fsTodoRef, { includeMetadataChanges: true }, (querySnapshot) => {
            let itemAdded = false;
            let updateItemModified = false;
            let itemRemoved = false;
            // check what kinds of changes were made to the firebase todolist
            
            console.log(querySnapshot.size, querySnapshot.docs.length, querySnapshot.docChanges().length);
            
            // log what kinds of changes happened
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    itemAdded = true;
                    // console.log("New firebase item: ", change.doc.data());
                }
                if (change.type === "modified") {
                    if(querySnapshot.docChanges().length === 1 && Array.isArray(this.state.todoList)){
                        const found = this.state.todoList.find((todo) => todo.id === change.doc.id);
                        const changedData = change.doc.data();
                        
                        if(found === undefined || changedData === undefined){
                            debugger;
                            alert("found or changedData is undefined");
                            console.log("found or changedData is undefined", found, changedData);
                        }else{
                            if(found.complete === changedData.complete && 
                                found.deadlineType === changedData.deadlineType &&
                                found.dueDate === changedData.dueDate &&
                                found.estTime === changedData.estTime &&
                                found.priority === changedData.priority &&
                                found.atitle === changedData.atitle){
                                    console.log("(no need to edit) Modified firebase item: ", change.doc.id, change.doc.data());
                            }else{
                                updateItemModified = true;
                            }
                        }
                    }
                    
                }
                if (change.type === "removed") {
                    itemRemoved = true;
                    // console.log("Removed firebase item: ", change.doc.data());
                }
            });

            // avoid infinite updates due to recalculating buffer time
            if(itemAdded || itemRemoved || updateItemModified){
                const fsTodoList = []; // when a list is empty you want it update the firestore to empty

                querySnapshot.forEach((qdoc) => {
                    // console.log(qdoc.id, " => ", qdoc.data());
                    fsTodoList.push({id: qdoc.id, ...qdoc.data()});
                });

                eventBus.dispatch("todoListUpdated", fsTodoList);

                // recalculate buffers
                if(this.props.gapiSignedIn === true){
                    this.getTodoListWithBuffers(fsTodoList, (todoListWithBuffers) => {
                        todoListWithBuffers.sort(compareForMultipleProperties(...this.orderBy));
                        this.setState({todoList: todoListWithBuffers});
                    });
                }else{
                    // TODO reset buffer if you aren't signed in
                    for(const todo of fsTodoList){
                        todo.bufferHrs = "Log Into GCAL";
                    }
                    fsTodoList.sort(compareForMultipleProperties(...this.orderBy));
                    this.setState({todoList: fsTodoList});
                }

            }

        });

    }

    // filteredTodos based on filter state and todo
    filteredTodos(){
        // tell sidebar that todolist has been updated
        // give sidebar the list of folders and lists
        // eventBus.dispatch("todoListUpdated", this.state.todoList);

        if(this.state.todoList !== false){
            if(this.state.filter.folder !== undefined){
                if(this.state.filter.list !== undefined){
                    return this.state.todoList.filter((elem) => (elem.folder === this.state.filter.folder && elem.list === this.state.filter.list));
                }
                return this.state.todoList.filter((elem) => (elem.folder === this.state.filter.folder));
            }
            return this.state.todoList;
        }
        return false;
    }

    recalculateBuffer(){
        this.getTodoListWithBuffers(this.state.todoList, (todoListWithBuffers) => {
            todoListWithBuffers.sort(compareForMultipleProperties(...this.orderBy));
            this.setState({todoList: todoListWithBuffers});
        });
    }

    getTodoListWithBuffers(todoList, callback){
        getDoc(doc(fs, this.props.userFirebasePath)).then((docSnap) => {
            // console.log(docSnap.data().calendars)

            const calendars = docSnap.data().calendars;
            console.log(calendars);

            if(calendars === undefined){
                for(const todo of todoList){
                  todo.bufferHrs = "select calendars";
                }
                callback(todoList);
            }else{
                calculateBuffer(todoList, calendars, this.state.hardDeadlineOnlyBuffer).then((buffers) => {
                    for(const todo of todoList){
                        let bufferMS = buffers[todo.id]["bufferMS"];
                        
                        // eslint-disable-next-line no-magic-numbers
                        const msPerHour = 60*60*1000;
                        
                        
                        if(typeof(bufferMS) === "number"){
                            todo.bufferHrs = Number(Math.round( (bufferMS/(msPerHour)) +"e+2") + "e-2");
                        }else{
                            todo.bufferHrs = bufferMS;
                        }
                        
                        for(const priority of ["tbd", "medium", "high"]){
                            // debugger;
                            
                            bufferMS = buffers[todo.id]["bufferMS_" + priority];
                            if(typeof(bufferMS) === "number"){
                                todo["bufferHrs_" + priority] = Number(Math.round( (bufferMS/(msPerHour)) +"e+2") + "e-2");
                            }else if(typeof(bufferMS) === "undefined"){
                                todo["bufferHrs_" + priority] = "--";
                            }else{
                                todo["bufferHrs_" + priority] = bufferMS;
                            }

                        }

                        // setDoc(doc(fs, this.todoFilePath + "/" + todo.id), {...todo, bufferData: buffers[todo.id]} );

                        // todo.bufferData = buffers[todo.id]
                    }
                    
                    callback(todoList);
                });
            }

        });
    }
    
    render(){
        return (
            <motion.div>
            <h2>TodoList</h2>
            
            {/* <SortTodos></SortTodos> */}

            { this.state.hardDeadlineOnlyBuffer ?
                <Button 
                    variant="contained"
                    onClick={() => this.setState({hardDeadlineOnlyBuffer: false})}
                >
                    Calculate Buffer for All Deadlines
                </Button>
                :
                <Button 
                    variant="outlined"
                    onClick={() => this.setState({hardDeadlineOnlyBuffer: true})}
                >
                    Calculate Buffer for HARD Deadlines Only
                </Button>
            }

            { this.props.gapiSignedIn ?
                <Button 
                    variant="contained"
                    onClick={this.recalculateBuffer}
                >
                    Recalculate buffer
                </Button>
                : null
            }
            
            <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="simple table" padding="none" >
                {/* // TODO add table based sorting! https://mui.com/components/tables/#sorting-amp-selecting */}
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        {this.headCells.map((cellJson) => 
                            <TableCell align={cellJson.align} key={cellJson.id}>
                                <TableSortLabel
                                    active={this.orderBy[1] === cellJson.firebaseKey}
                                    onClick={() => {
                                        this.orderBy.splice(1,0,cellJson.firebaseKey);
                                        this.orderBy = [...new Set(this.orderBy)];
                                        this.setState({todoList: sortedArray(this.state.todoList, ...this.orderBy)});
                                        console.log("clicked", cellJson.label, this.orderBy);
                                    }}
                                >{cellJson.label}</TableSortLabel>
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                {this.state.todoList ?
                    this.filteredTodos().map((todo) => 
                        <TodoItem todo={todo} headCells={this.headCells} todoFilePath={this.todoFilePath} key={todo.id}/>
                    )
                    :
                    null
                }
                </TableBody>
            </Table>
            </TableContainer>
            </motion.div>
        );
    }
}
export default TodoList;