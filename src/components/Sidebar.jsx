import React, { useEffect, useState } from "react";
import { eventBus } from "../utils/eventBus";

function Sidebar(){
    
    const [sidebarElems, setSidebarElems] = useState(new Map());

    function createFilterFolderEvent(folderName){
        eventBus.dispatch("filterFolder", {folder: folderName});
    }

    function createFilterListEvent(folderName, listName){
        eventBus.dispatch("filterList", {folder: folderName, list: listName});
    }
    
    useEffect(() => {
        eventBus.on("todoListUpdated", (todoList) => {
            debugger;

            const initialFolderMap = new Map();
            for(const todo of todoList){
                if(initialFolderMap.get(todo.folder) === undefined){
                    initialFolderMap.set(todo.folder, new Set());
                }
                initialFolderMap.get(todo.folder).add(todo.list);
            }

            const sortedFolderMap = new Map();

            for(const folder of [...initialFolderMap.keys()].sort()){
                debugger;
                sortedFolderMap.set(folder, new Set());
                for(const list of [...initialFolderMap.get(folder)].sort()){
                    debugger;
                    sortedFolderMap.get(folder).add(list);
                }
            }

            setSidebarElems(sortedFolderMap);
            
        });

        // clean up
        return () => eventBus.remove("todoListUpdated");
    }, []);
    
    

    return (
    <div className="sidebar">
        <ul className="sidebarList">
            <li key="allfolders" className="row folder">
                <div 
                    key="title"
                    onClick={() => eventBus.dispatch("filterFolder", {})}
                >
                All Tasks
            </div>
            </li>
            
            {[...sidebarElems.keys()].map((folderName) => 
                <li key={folderName} className="row folder">
                    {/* <div>{folderval.icon}</div> */}
                    <div 
                        key="title"
                        onClick={() => createFilterFolderEvent(folderName)}
                    >
                        {folderName}
                    </div>

                    <ul className="folderList" key="listInFolder">
                        {[...sidebarElems.get(folderName)].map((listName) => 
                            <li 
                                key={listName} 
                                className="row list"
                                onClick={() => createFilterListEvent(folderName, listName)}
                                >
                                {listName}
                            </li>
                        )}
                    </ul>
                </li>

            )}
        </ul>
    </div>
    );
}

export default Sidebar;