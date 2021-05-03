import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { render, initialize, Note, formatDate } from "./application";
import "lodash";
import { object } from "underscore";
// import functions from "../node_modules/firebase/firebase-functions";
// import database from "../node_modules/firebase/firebase-database";

let database;
function getTime (note) {
    return formatDate(note.creationTime)
}

const firebaseConfig = {
    apiKey: "AIzaSyDTY5pQZNg__dgA-Kh_xZhFvqvgZ-hYoog",
    authDomain: "notes-app-6a955.firebaseapp.com",
    databaseURL: "https://notes-app-6a955-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "notes-app-6a955",
    storageBucket: "notes-app-6a955.appspot.com",
    messagingSenderId: "1052288609593",
    appId: "1:1052288609593:web:6a680242619f1038ab8ce8"
  };


// инициализация бд
const initFirebase = async (state, components) => {
    // database = firebase.database();
    firebase.initializeApp(firebaseConfig);
    //loadUserData(state.user.id, state, components)
    getUserData(state.user.id,state, components)
    authStateListener(state, components);
    //synchronization(state, components);
}


function authStateListener(state, components) {
    firebase.auth().onAuthStateChanged((user) => {
        state.error = null;
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            
            //
            
            state.user.isAuth = true;
            state.user.registered = true;
            state.user.id = user.uid;
            state.page = 'editing'
            //synchronization(state, components)
            createUserData(user.uid, state, components);  //======================?????? мб перенести в регистрацию
            stateChangeListener(user.uid, state, components)
            initialize(state, components)
            //render(state, null, components)
        } else {
            // User is signed out
            state.user.isAuth = false;
            state.user.registered = false;
            state.page = 'login'
            initialize(state, components)
            //render(state, null, components)
        }
    });
}


// логаут
function signOut(state, components) {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        state.user.isAuth = false;
        // state.user.registered = false;
        state.page = 'login';
        render(state, null, components)
    }).catch((error) => {
        state.error = error;
    });
}

//сохранение состояния в бд
const synchronization = (state, components) => {
    //if (state.status != 'login') {
        try { 
            updateData(state.user.id, state, components)
            //stateChangeListener(state.user.id, state, components)
            //initialize(state, components);
        } catch (err) {
            console.log(err)
        }
    //}
}

function getUserData(userId, state, components) {
    const dbRef = firebase.database().ref('users/' + userId)
    dbRef.get().then((snapshot) => {
        const data = snapshot.val();
        console.log('qq', data)
        if (data) {
            
            //data.map(note=>note.getTime = getTime);
            
            
            // data.map(note=>{
            //     //console.log(note)
            //     return note.getTime = getTime(JSON.parse( JSON.stringify(note)))
            // })

            // ЭТО ХУЙНЯ НЕ РОБИТ .
            state.activeNote = data.activeNote;
            state.notes = _.unionBy(state.notes, data, 'id')
            console.log('state get',state);
            render(state, null, components)
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}


//const dbRef = firebase.database().ref('users/' + userId);
//ЗАГРУЗКА СТЕЙСТА В БазуДанных
function updateData(userId, state, components) {
    const dbRef = firebase.database().ref('users/' + userId);
    //const result = _.unionWith(dbRef, state, _.cloneDeep)
    const result = _.assign(dbRef, state)
    console.log('result of merge data', result)
    console.log('local state sending', state)
      
    firebase.database().ref('users/' + userId).update(state);

    
}


//ЗАПИСЬ ПОЛЬЗОВАТЕЛЯ В БД
function createUserData(userId, state, components) {
    // firebase.database().ref('users/' + userId).get().then((data)=>{
    //     firebase.database().ref('users/' + userId).set({

    //         state: data.val()//.state

    //     }); // достаем данные если они уже есть
    //     console.log('get & set:', data.val())
    // });
    
    //console.log('create user:', userId);
    //initialize(state, components)
    //render(state, null, components)
}


//СЛУШАТЕЛЬ ИЗМЕНЕНИЯ СОСТОЯНИЯ НА СЕРВЕРЕ
function stateChangeListener(userId, state, components) {
    var stateRef = firebase.database().ref('users/' + userId);
    stateRef.on('value', (snapshot) => {
        const data = snapshot.val();
        //const newState = JSON.parse(data)
        console.log(typeof data,'get state', data);
        //dataFromBD.state.notes.forEach((note)=>{
        if (data.notes) {
        //state.notes = _.unionBy(state.notes, data.notes, 'id')
        // state.notes = _.unionWith(state.notes, data.notes, (localNote, BDNote)=>{
        //     if (localNote.id === BDNote.id){

        //     }
        // })
        // _.map(data.notes, (note)=>{
        //     return new Note(note.text, note.id)
        // })
        //data.collection.doc(state.notes).set(JSON.parse( JSON.stringify(state)));
            //state.notes = _.unionBy(state.notes, data, 'id')
            state.notes = JSON.parse( JSON.stringify(data.notes));
       
            state.notes.map(note=>{
            //console.log(note)
            //return Object.create(JSON.parse( JSON.stringify(note)), Note)
            return note.getTime = getTime(JSON.parse( JSON.stringify(note)))
            })
        //state.activeNote = data.activeNote;
        }
        
        
        // state.notes = _.unionWith(state.notes, data.notes, _.cloneDeep)
        //initialize(state, components)
        console.log('local state:', state)
        
    });

}









// вход в аккаунт или рега
const submitAuthForm = (state, form, components, event) => {
    state.user.email = form.querySelector('.email').value;
    const pass = form.querySelector('.password').value;
    if (state.user.registered === true) {
        signInWithEmailPassword(state, pass, components);
    } else {
        signUpWithEmailPassword(state, pass, components);
    }
}

// вход
function signInWithEmailPassword(state, password, components) {
    const email = state.user.email;
    firebase.auth().signInWithEmailAndPassword(String(email), String(password))
        .then((userCredential) => {
            // Signed in
            let user = userCredential;
            // console.log(user)

            //createUserData(user, state, components)
            // state.user.registered = true;
            state.user.id = user;
            //state.user.isAuth = true;
            state.page = 'reading'
            stateChangeListener(user, state, components)
            //console.log(userCredential)
        })
        .catch((error) => {
            state.error = error;
            initialize(state, components)
        });
}

// рега
function signUpWithEmailPassword(state, password, components) {
    const email = String (state.user.email);
    firebase.auth().createUserWithEmailAndPassword(email, String (password))
        .then((userCredential) => {
            createUserData(user, state, components)
            // Signed in 
            // state.user.registered = true;
            state.user.id = user;
            //state.user.isAuth = true;
            state.page = 'reading'

            //const user = userCredential
            
            // ...
        })
        .catch((error) => {
            // const errorCode = error.code;
            // const errorMessage = error.message;
            state.error = error;
            initialize(state, components)
            // ..
        });
}

// пока не задействовано
function sendEmailVerification() {
    firebase.auth().currentUser.sendEmailVerification()
        .then(() => {
        // Email verification sent!
        // ...
        });
}


// dbRef.child("users").child(userId).get().then((snapshot) => {
//     if (snapshot.exists()) {
//       console.log(snapshot.val());
//     } else {
//       console.log("No data available");
//     }
//   }).catch((error) => {
//     console.error(error);
//   });
  


// const saveToLocal = (state) => {
//     const local = JSON.parse(localStorage.getItem('state'));
//     fetch('https://notes-app-6a955-default-rtdb.europe-west1.firebasedatabase.app/user-state.json', {
//         method: 'GET',

//         headers: {
//             'Content-Type': 'application/json'
//         },
//     })
//         .then((data) => {
//             const response = data.json();
//             return { ...state, ...response }
//         })

// }


export { submitAuthForm, signOut, initFirebase, synchronization }