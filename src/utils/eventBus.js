// thank you internet: https://www.pluralsight.com/guides/how-to-communicate-between-independent-components-in-reactjs

// Maps (event, callback) → wrapper so removeEventListener receives the
// same function reference that addEventListener registered.
const listenerMap = new Map();

function getKey(event, callback) {
    // Each (event, callback) pair gets its own Map entry.
    // We use a nested Map: event → Map<callback, wrapper>.
    if (!listenerMap.has(event)) {
        listenerMap.set(event, new Map());
    }
    return listenerMap.get(event);
}

export const eventBus = {
    on(event, callback){
        const wrapper = (e) => callback(e.detail);
        const callbackMap = getKey(event, callback);
        callbackMap.set(callback, wrapper);
        document.addEventListener(event, wrapper);
    },
    dispatch(event, data){
        // fires an event
        document.dispatchEvent(new CustomEvent(event, {detail: data}));
    },
    remove(event, callback){
        const callbackMap = listenerMap.get(event);
        if (callbackMap) {
            const wrapper = callbackMap.get(callback);
            if (wrapper) {
                document.removeEventListener(event, wrapper);
                callbackMap.delete(callback);
            }
        }
    }
};