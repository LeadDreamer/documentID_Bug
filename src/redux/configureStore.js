import _ from "lodash";
import { applyMiddleware, compose, createStore, combineReducers } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";

import monitorReducersEnhancer from "./enhancers/monitorReducers";
import loggerMiddleware from "./middleware/logger";
import rootReducer from "./rootReducers";

import "./firestore";

function configureStore(preloadedState) {
  const middlewares = [loggerMiddleware, thunk];
  const middlewareEnhancer = applyMiddleware(...middlewares);

  const enhancers = [middlewareEnhancer, monitorReducersEnhancer];
  const composedEnhancers = composeWithDevTools(...enhancers);

  const store = createStore(createReducer(), preloadedState, composedEnhancers);

  // Add a dictionary to keep track of the registered async reducers
  store.asyncReducers = {};

  // Create an inject reducer function
  // This function adds the async reducer, and creates a new combined reducer
  store.injectReducer = (key, asyncReducer) => {
    store.asyncReducers[key] = asyncReducer;
    store.replaceReducer(createReducer(store.asyncReducers));
  };

  // Add a dictionary to keep track of registered defered inits
  store.listeners = {};

  store.injectListener = (key, listener) => {
    store.listeners[key] = {
      listener: listener,
      unsub: null
    };
    return Promise.resolve(key);
  };

  store.runListener = key => {
    store.listeners[key].unsub = store.listeners[key].listener();
    return Promise.resolve(store.listeners[key].unsub);
  };

  store.deferred = () => {
    Object.keys(store.listeners).forEach(key => {
      if (!store.listeners[key].unsub)
        //run if unsub NOT set
        store.listeners[key].unsub = store.listeners[key].listener();
    });
  };

  store.unsubscribeListeners = () => {
    return Promise.all(
      Object.keys(store.listeners).map(key => {
        return (store.listeners[key].unsub
          ? Promise.resolve(store.listeners[key].unsub())
          : Promise.resolve()
        ).then(() => {
          return {
            ...store.listeners[key],
            unsub: null
          };
        });
      })
    ).then(newList => {
      store.listeners = newList;
    });
  };

  store.unsubscribeListener = key => {
    return (store.listeners[key].unsub
      ? Promise.resolve(store.listeners[key].unsub())
      : Promise.resolve()
    ).then(() => {
      store.listeners = {
        ...store.listeners,
        [key]: {
          ...store.listeners[key],
          unsub: null
        }
      };
      return Promise.resolve(key);
    });
  };

  return store;
}

function createReducer(asyncReducers) {
  return combineReducers({
    rootReducer,
    ...asyncReducers
  });
}

const store = configureStore();

export * from "./firestore";
export default store;
