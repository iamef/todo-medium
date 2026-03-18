import React from "react";

import { fs } from '../firebase';
import { collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import { TableRow, TableCell } from '@mui/material';

function deleteTodo(todo, todoFilePath){
    var todoDoc = doc(collection(fs, todoFilePath), todo.id)
    console.log(todoDoc.id, todoDoc)
    deleteDoc(todoDoc)
}

function completeTodo(todo, todoFilePath){
    // TODO COMPLETE SEEMS TO BE BUGGY!!!
    var todoDoc = doc(collection(fs, todoFilePath), todo.id)
    console.log("completeTodo", todoDoc.id, todoDoc, "from " + todo.complete + " to " + !todo.complete)
    updateDoc(todoDoc, {complete: !todo.complete})
    
    // // https://stackoverflow.com/questions/29537299/react-how-to-update-state-item1-in-state-using-setstate
    // var foundIndex = this.state.todoList.find((todo) => todo.id === todo.id)
    
    // var todoListCopy = [...this.state.todoList]
    // todo.complete = !todo.complete // update todo item
    // todoListCopy[foundIndex] = todo
    // this.setState({todoList: todoListCopy})
}

function editTodo(todo, item, todoFilePath){
    var todoDoc = doc(collection(fs, todoFilePath), todo.id)
    console.log(todoDoc.id, todoDoc)

    var updatedData = prompt("Please update " + item, todo[item])

    if(updatedData !== null)
        updateDoc(todoDoc, {[item]: updatedData}) 
}



function TodoItem(props) {
    return (
        <TableRow
            key={props.todo.id}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            className={props.todo.complete ? "complete" : "pending"}
        >
            {/* complete buttons */}
            <TableCell className={props.todo.complete ? "complete" : "pending"}>
                {props.todo.complete ?
                    <CheckCircleIcon
                        className='icon'
                        onClick={() => completeTodo(props.todo, props.todoFilePath)}
                        fontSize='large'
                    /> :
                    <CheckCircleOutlineIcon
                        className='icon'
                        onClick={() => completeTodo(props.todo, props.todoFilePath)}
                        fontSize='large'
                    />
                }
                {/* <motion.div> */}
                <HighlightOffIcon
                    className='icon'
                    onClick={() => deleteTodo(props.todo, props.todoFilePath)}
                    fontSize='large'
                />
                {/* </motion.div> */}
            </TableCell>

            {/* folder / list */}
            <TableCell component="th" scope="row" className={props.todo.complete ? "complete" : "pending"}>
                {props.todo.folder + "/" + props.todo.list}
            </TableCell>

            {/* title, dueDate, deadlineType, estTime, priority */}
            {props.headCells.slice(1, -1).map((cellJson) =>
                cellJson.firebaseKey === undefined ?
                    null :
                    <TableCell
                        align={cellJson.align}
                        className={props.todo.complete ? "complete" : "pending"}
                        onDoubleClick={() => editTodo(props.todo, cellJson.firebaseKey, props.todoFilePath)}
                    >
                        {props.todo[cellJson.firebaseKey]}
                    </TableCell>
            )}

            {/* buffer */}
            {['bufferHrs', 'bufferHrs_tbd', 'bufferHrs_medium', "bufferHrs_high"].map((bufferType) =>
                <TableCell
                    align="right"
                    className={props.todo.complete ? "complete" : "pending"}
                >
                    {props.todo[bufferType] ? props.todo[bufferType] : "loading"}
                </TableCell>
            )}
        </TableRow>
    )
}

export default TodoItem;