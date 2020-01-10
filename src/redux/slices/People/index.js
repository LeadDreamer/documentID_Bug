import Reducer from "./reducers";
import store from "../../configureStore";
import { InitAuthListener } from "./actions";
export * from "./actions";

store.injectReducer("People", Reducer);
//initialize the Auth system
InitAuthListener(store.dispatch, store.getState);
