import { motion } from "framer-motion";
import Form from "./Form";
import TodoList from "./TodoList";

function TodoApp(props){
    return (
        <>
            <motion.div className="todoapp">
                <h1>Todo App</h1>
                <Form />
                <TodoList {...props}/>
            </motion.div>
        </>
    );
}

export default TodoApp;