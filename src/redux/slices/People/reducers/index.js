import {
  SET_ACTIVE_PERSON,
  CLEAR_ACTIVE_PERSON,
  SET_UNSUBSCRIBE_FUNCTION
} from "../actions";

const InitialState = {
  activePerson: null,
  unsubscribeFunction: null
};

export default function(state = InitialState, action) {
  switch (action.type) {
    case CLEAR_ACTIVE_PERSON:
      //CLEAR_ACTIVE_PERSON resets all states
      return {
        activePerson: null,
        lookingAtTourStop: null,
        lookingAtTour: null,
        lookingAtPledge: null,
        lookingAtArtist: null
      };
    case SET_UNSUBSCRIBE_FUNCTION:
      return {
        ...state,
        unsubscribeFunction: action.payload.unsubscribe
      };

    case SET_ACTIVE_PERSON:
      return { ...state, activePerson: action.payload.person };

    default:
      return state;
  }
}
