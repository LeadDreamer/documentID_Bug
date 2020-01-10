import firebase from "@firebase/app";
import "@firebase/auth";
import "@firebase/firestore";
import "@firebase/storage";
import * as firebaseui from "firebaseui";
import { config } from "../constants";

//////////////////////////////////////////////////////////////////////
// see airtable.com for API information
// note schema is custom and local

firebase.initializeApp(config);
firebase.firestore().enablePersistence({ synchorizeTabs: true });

/* Firebase APIs */

//////////////////////////////////////////////////////////////////////
// note schema is custom and local

export const writeRecord = (
  tablePath,
  data,
  ref = null,
  Transaction = null
) => {
  const db = ref ? ref : firebase.firestore();
  const cleanData = { ...data };
  delete cleanData.Id;
  delete cleanData.ref;

  return Promise.resolve()
    .then(() => {
      return data.Id
        ? Promise.resolve(db.collection(tablePath).doc("/" + data.Id))
        : Promise.resolve(db.collection(tablePath).doc()); //Nevcer used
    })
    .then(thisRef => {
      if (Transaction) {
        //if passed a transaction object, use it
        if (data.Id) {
          Transaction.set(thisRef, cleanData, { merge: true });
          return Promise.resolve(thisRef);
        } else {
          return Promise.reject("Transaction can't create document");
        }
      } else if (data.Id) {
        //not a transaction, but data.Id is set
        thisRef.set(cleanData, { merge: true });
        return Promise.resolve(thisRef);
        //returns the created DocumentReference
      } else {
        //not a transaction, but no data.Id is provided
        return db.collection(tablePath).add(cleanData);
        //returns a DocumentReference
      }
    })
    .then(thisRef => {
      return Promise.resolve({
        ...data,
        Id: thisRef.id,
        ref: thisRef
      });
    })
    .catch(err => {
      return Promise.reject(err);
    });
};

export const writeBack = (data, Transaction = null) => {
  const cleanData = { ...data };
  delete cleanData.Id;
  delete cleanData.ref;

  return Promise.resolve()
    .then(() => {
      if (Transaction) {
        //if passed a transaction object, use it
        Transaction.set(data.ref, cleanData, { merge: true });
        return Promise.resolve(data);
      } else {
        data.ref.set(cleanData, { merge: true });
        return Promise.resolve(data);
      }
    })
    .catch(err => {
      return Promise.reject(err);
    });
};

export const collectRecords = (tablePath, ref = null) => {
  const db = ref ? ref : firebase.firestore();

  return db
    .collection(tablePath) //Dangerously assumes collection exists
    .get()
    .then(querySnapshot => {
      // returns a promise
      if (!querySnapshot.empty)
        return Promise.resolve(
          querySnapshot.docs.map(doc => {
            return {
              // returns promise even though synchronous
              ...doc.data(),
              Id: doc.id,
              ref: doc.ref
            };
          })
        );
      else return Promise.reject("noDocuments:collectRecords:" + tablePath);
    })
    .catch(err => {
      return Promise.reject(err + ":collectRecords:" + tablePath);
    });
};

export const collectRecordsInGroup = tableName => {
  const db = firebase.firestore();

  return db
    .collectionGroup(tableName) //Dangerously assumes collection exists
    .get()
    .then(querySnapshot => {
      // returns a promise
      if (!querySnapshot.empty)
        return Promise.resolve(
          querySnapshot.docs.map(doc => {
            return {
              // returns promise even though synchronous
              ...doc.data(),
              Id: doc.id,
              ref: doc.ref
            };
          })
        );
      else
        return Promise.reject("noDocuments:collectRecordsInGroup:" + tableName);
    })
    .catch(err => {
      return Promise.reject(err + ":collectRecordsInGroup:" + tableName);
    });
};

export const fetchRecord = (tablePath, Id, ref = null, transaction = null) => {
  const db = ref ? ref : firebase.firestore();

  const docRef = db.collection(tablePath).doc(Id);

  return Promise.resolve()
    .then(() => {
      if (transaction) return transaction.get(docRef);
      else return docRef.get();
    })
    .then(docSnapshot => {
      if (docSnapshot.exists) {
        return Promise.resolve({
          ...docSnapshot.data(),
          Id: docSnapshot.id,
          ref: docSnapshot.ref
        });
      } else {
        return Promise.reject(null);
      }
    });
};

export const fetchFromGroup = (groupName, docID) => {
  const db = firebase.firestore();
  console.log("fetchFromGroup", groupName, docID);
  let thisQuery;

  try {
    thisQuery = db
      .collectionGroup(groupName)
      .where(firebase.firestore.FieldPath.documentId(), "==", docID);
  } catch (err) {
    console.log(err);
    return Promise.resolve(err);
  }

  console.log("thisQuery", thisQuery);

  return thisQuery // <== note use of FieldPath.documentId
    .get() //get the resulting filtered query results
    .then(querySnapshot => {
      console.log("querySnapshot", querySnapshot);
      return querySnapshot.empty
        ? null
        : querySnapshot.docs.map(doc => {
            return {
              ...doc.data(),
              Id: doc.id,
              ref: doc.ref
            };
          });
    })
    .then(docArray => {
      console.log("docArray", docArray);
      return Promise.resolve(docArray ? docArray[0] : null);
    })
    .catch(err => {
      console.log("err", err);
      return Promise.reject(err + ":fetchFromGroup");
    });
};

export const deleteRecord = (table, record, ref = null, transaction = null) => {
  const db = ref ? ref : firebase.firestore();

  const docRef = db.collection(table).doc(record.Id); //Dangerously assumes collection exists

  if (transaction) return transaction.delete(docRef);
  else return docRef.delete();
};

//////////////////////////////////////////////////////////////////////
//Listener Support

export const ListenRecord = (
  tablePath,
  Id,
  ref = null,
  dataCallback,
  errCallback
) => {
  const db = ref ? ref : firebase.firestore();

  const docRef = db.collection(tablePath).doc(Id);

  //returns an unsubscribe function
  return docRef.onSnapshot(
    docSnapshot => {
      if (docSnapshot.exists)
        dataCallback({
          ...docSnapshot.data(),
          Id: docSnapshot.id,
          ref: docSnapshot.ref
        });
      else errCallback("No Document Exists to Listen");
    },
    err => {
      errCallback(err + " No Document Exists to Listen");
    }
  );
};

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// *** Auth API ***
// Configure FirebaseUI.
export const FirebaseAuth = firebase.auth();

export const FirebaseAuthSignInOptions = [
  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  firebase.auth.FacebookAuthProvider.PROVIDER_ID,
  firebase.auth.EmailAuthProvider.PROVIDER_ID,
  firebase.auth.TwitterAuthProvider.PROVIDER_ID
];

export const FirebaseCredentialHelper = firebaseui.auth.CredentialHelper.NONE;

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// *** native UI support ***

export const doSignOut = () => {
  return FirebaseAuth.signOut();
};

// *** Merge Auth and DB User API *** //
export const createAnonymousUser = () => {
  return FirebaseAuth.signInAnonymously();
};

export const attachAuthUserListener = (next, fallback) => {
  return FirebaseAuth.onAuthStateChanged(next, fallback);
};
