// thank you internet: https://www.pluralsight.com/guides/how-to-communicate-between-independent-components-in-reactjs

// event → Map<callback, wrapper>
// Keeps track of wrappers so removeEventListener receives the same
// function reference that addEventListener registered.
const listeners = new Map();

export const eventBus = {
    on(event, callback) {
        const wrapper = (e) => callback(e.detail);
        if (!listeners.has(event)) listeners.set(event, new Map());
        listeners.get(event).set(callback, wrapper);
        document.addEventListener(event, wrapper);
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event, callback) {
        const wrapper = listeners.get(event)?.get(callback);
        if (wrapper) {
            document.removeEventListener(event, wrapper);
            listeners.get(event).delete(callback);
        }
    }
};