import _ from "lodash";
import store from "../../../configureStore";
import { ListenRecord, writeBack } from "../../../firestore";
import {
  writeRecord,
  createAnonymousUser,
  attachAuthUserListener,
  FirebaseAuthSignInOptions,
  FirebaseCredentialHelper
} from "../../../configureStore";

import { Forms } from "../../../formModule";

//////////////////////////////////////////////////////////////////////
// Constants
const PeopleDefault = {
  Id: null,
  first_name: null,
  last_name: null,
  imageURL: null,
  region: null,
  social_links: [],
  website: null
};

const PeopleDataDefault = {
  tel: null,
  email: null,
  mailing_address: null,
  billing_address: null,
  payment_gateway: null,
  tax_ID: null
};

const PeopleDefaultForm = {
  first_name: "text",
  last_name: "text",
  region: "lookup:Regions"
};

export const PeopleAccountForm = {
  first_name: "text",
  last_name: "text",
  imageURL: "uploadImage",
  region: "lookup:Regions",
  social_links: "array:text",
  website: "url",
  private_data: "subcollection:PeopleData",
  create_artist_account: "checkbox"
};

export const PeopleDataDefaultForm = {
  tel: "tel",
  email: "email",
  mailing_address: "object:Addresses",
  billing_address: "object:Addresses",
  tax_ID: "EIN"
};

export const accessControl = {
  role: null,
  name: null,
  email: null,
  uid: null
};

export const accessControlForm = {
  role: "lookup:Roles",
  name: "text",
  email: "email"
};

Forms.Base["People"] = PeopleDefault;
Forms.Base["PeopleData"] = PeopleDataDefault;
Forms.BaseForm["People"] = PeopleDefaultForm;
Forms.BaseForm["PeopleData"] = PeopleDataDefaultForm;
Forms.AccountForm["People"] = PeopleAccountForm;
Forms.AccountForm["PeopleData"] = PeopleDataDefaultForm;

//////////////////////////////////////////////////////////////////////
// Action Types
export const SET_UNSUBSCRIBE_FUNCTION = "SET_UNSUBSCRIBE_FUNCTION";
export const SET_ACTIVE_PERSON = "SET_ACTIVE_PERSON";
export const CLEAR_ACTIVE_PERSON = "CLEAR_ACTIVE_PERSON";

//////////////////////////////////////////////////////////////////////
// Action Creators and Actions - actions do NOT use 'state'
export const setUnsubscribeFunction = unsubscribe => {
  CreateAnonymousFan();
  return {
    type: SET_UNSUBSCRIBE_FUNCTION,
    payload: { unsubscribe }
  };
};

export const setActivePerson = person => ({
  type: SET_ACTIVE_PERSON,
  payload: { person }
});

export const clearActivePerson = () => {
  return {
    type: CLEAR_ACTIVE_PERSON,
    payload: {}
  };
};

export const createPerson = person => {
  //need a "no duplicate" function - whatever that means in this context
  return writeRecord("People", person);
};

export const savePerson = person => {
  return writeBack(person);
};

export const savePersonData = (personData, person) => {
  return writeRecord("PeopleData", personData, person.ref);
};

//////////////////////////////////////////////////////////////////////
// fetches
//////////////////////////////////////////////////////////////////////
// listeners

//returns the unsubscribe function
//will be called AT LEAST ONCE with initial document
export const ListenPerson = uid => {
  return ListenRecord(
    "People",
    uid,
    null,
    person => {
      store.dispatch(setActivePerson(person));
    },
    err => {
      console.log(err + " ListenPersons err");
    }
  );
};

//////////////////////////////////////////////////////////////////////
// utilities
//////////////////////////////////////////////////////////////////////
//Selectors - selectors USE 'state'
export const getActivePerson = state => {
  //returns a *copy*
  return state.People.activePerson ? { ...state.People.activePerson } : null;
};

//////////////////////////////////////////////////////////////////////
// Auth Support

export const CreateAnonymousFan = () => {
  // calls authentication service.  Listener (below) responds to status change
  return createAnonymousUser().then(userCredential => {
    let anonUser = userCredential.user;
    let newFan = _.cloneDeep(Forms.Base["People"]);
    let newData = _.cloneDeep(Forms.Base["PeopleData"]);
    if (anonUser.isAnonymous) {
      //signin anonymous worked
      newFan = {
        ...newFan,
        Id: anonUser.uid,
        isAnonymous: true,
        first_name: "Anonymous",
        last_name: "User",
        region: "Los Angeles"
      };
    } else {
      let nameArray = anonUser.displayName.split(" ");
      let last_name = nameArray.pop();
      newFan = {
        ...newFan,
        Id: anonUser.uid,
        isAnonymous: false,
        first_name: nameArray.join(" "),
        last_name: last_name,
        imageURL: anonUser.photoURL,
        region: "Los Angeles"
      };
      newData = {
        ...newData,
        Id: anonUser.uid,
        email: anonUser.email,
        tel: anonUser.phoneNumber
      };
    }
    createPerson(newFan).then(person => {
      savePersonData(newData, person);
    });
  });
  //We catch the promise to *create* the user, but *not* the auth state change.
};

export const InitAuthListener = (dispatch, getState) => {
  let unsubscriber = attachAuthUserListener(user => {
    //this is a defered function to attach listener- user yet unknown
    //the return of the function is an Unsubscribe to clean up React state
    //attachAuthUserListener
    if (user) {
      console.log("InitAuthListener user", user);
      //user was already logged in - have to error-check if already
      //in People database
      if (true) {
        store.injectListener("ActivePerson", () => {
          return ListenPerson(user.uid);
        });
        store.runListener("ActivePerson").then(() => {
          store.deferred();
        });
      }
    } else {
      console.log("no user"); //or user logout
      //When User Logs Out:
      //==> clear all store listeners, including user
      //==> then clear the active listener
      store.unsubscribeListeners();
      dispatch(clearActivePerson());
    }
  });
  dispatch(setUnsubscribeFunction(unsubscriber));
};

export const signInSuccessWithAuthResult = (authResult, redirectURL) => {
  let user = authResult.user;
  let credential = authResult.credential;
  let additionalUserInfo = authResult.additionalUserInfo;
  let isNewUser = authResult.additionalUserInfo.isNewUser;
  let providerId = authResult.additionalUserInfo.providerId;
  let operationType = authResult.operationType;
  // Do something with the returned AuthResult.
  // Return type determines whether we continue the redirect automatically
  // or whether we leave that to developer to handle.
  if (isNewUser) {
    let newFan = _.cloneDeep(Forms.Base["People"]);
    let newData = _.cloneDeep(Forms.Base["PeopleData"]);
    if (user.isAnonymous) {
      //signin anonymous worked
      newFan = {
        ...newFan,
        Id: user.uid,
        isAnonymous: true,
        first_name: "Anonymous",
        last_name: "User",
        region: "Los Angeles"
      };
    } else {
      let nameArray = user.displayName.split(" ");
      let last_name = nameArray.pop();
      newFan = {
        ...newFan,
        Id: user.uid,
        isAnonymous: false,
        first_name: nameArray.join(" "),
        last_name: last_name,
        imageURL: user.photoURL,
        region: "Los Angeles"
      };
      newData = {
        ...newData,
        Id: user.uid,
        email: user.email,
        tel: user.phoneNumber
      };
    }
    createPerson(newFan).then(person => {
      savePersonData(newData, person);
    });
  }

  return false; // no redirect - React-Redux will handle
};

export const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: "popup",
  // We will display Google and Facebook as auth providers.
  signInOptions: FirebaseAuthSignInOptions,
  credentialHelper: FirebaseCredentialHelper,
  callbacks: {
    signInSuccessWithAuthResult: signInSuccessWithAuthResult
  }
};
