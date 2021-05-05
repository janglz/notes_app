import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { render, initialize, Note, formatDate } from "./application";
import "lodash";

//let database;
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
const initFirebase = (state, components) => {
    firebase.initializeApp(firebaseConfig);
    authStateListener(state, components);
    //initialize(state, components)
}


function authStateListener(state, components) {
    firebase.auth().onAuthStateChanged((user) => {
        state.error = null;
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            state.user.isAuth = true;
            state.user.id = user.uid;
            state.page = 'editing'
            //createUserData(user.uid, state, components);  //======================?????? Она вообще нужна?
            stateChangeListener(user.uid, state, components)
            initialize(state, components)
        } else {
            // User is signed out
            state.user.isAuth = false;
            state.page = 'login'
            initialize(state, components)
        }
    });
}

//СЛУШАТЕЛЬ ИЗМЕНЕНИЯ СОСТОЯНИЯ НА СЕРВЕРЕ
function stateChangeListener(userId, state, components) {
    var stateRef = firebase.database().ref('users/' + userId);
    stateRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data.notes) {
            state.notes = JSON.parse( JSON.stringify(data.notes));
            state.notes.map(note=>{
                return note.getTime = getTime(JSON.parse( JSON.stringify(note)))
            })
        state.activeNote = data.activeNote;
        }
        console.log('local state changed:', state)
        //initialize(state, state.activeNote, components)
    });
}

// логаут
function signOut(state, components) {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        state.user.isAuth = false;
        // state.user.registered = false;
        state.page = 'login';
        //initialize(state, components)
        render(state, null, components)
    }).catch((error) => {
        state.error = error;
    });
}

//сохранение состояния в бд
const synchronization = (state, components) => {
    if (state.status != 'login') {
        try { 
            updateData(state.user.id, state, components)
            //initialize(state, components);
        } catch (err) {
            console.log(err)
        }
    }
}

function getUserData(userId, state, components) {
    const dbRef = firebase.database().ref('users/' + userId)
    dbRef.get().then((snapshot) => {
        const data = snapshot.val();
        console.log('getUserData:', data)
        if (data) {
            // ЭТО ХУЙНЯ НЕ РОБИТ .
            //state.activeNote = data.activeNote;
            //state.notes = _.unionBy(state.notes, data, 'id')
            console.log('state get',state);
            //render(state, null, components)
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}


//ЗАГРУЗКА СТЕЙСТА В БазуДанных
function updateData(userId, state, components) {
    //const dbRef = firebase.database().ref('users/' + userId);
    console.log('local state sending', state)
      
    firebase.database().ref('users/' + userId).update(state);
}


// //ЗАПИСЬ ПОЛЬЗОВАТЕЛЯ В БД
// function createUserData(userId, state, components) {
//     firebase.database().ref('users/' + userId).get().then((data)=>{
//         firebase.database().ref().set({

//             state: data.val()//.state

//         }); // достаем данные если они уже есть
//         console.log('get & set:', data.val())
//     });
    
//     console.log('create user:', userId);
//     initialize(state, components)
//     //render(state, null, components)
// }



// вход в аккаунт или рега
const submitAuthForm = (state, form, components, event) => {
    state.user.email = form.querySelector('.email').value;
    const pass = form.querySelector('.password').value;
    if (state.user.registered === true) {
        signInWithEmailPassword(state, pass, components);
    } else {
        signUpWithEmailPassword(state, pass, components);
    }
    //initialize(state, components)
}

// вход
function signInWithEmailPassword(state, password, components) {
    const email = state.user.email;
    firebase.auth().signInWithEmailAndPassword(String(email), String(password))
        .then((userCredential) => {
            // Signed in
            let user = userCredential;
            //createUserData(user, state, components)
            // state.user.registered = true;
            state.user.id = user;
            state.user.isAuth = true;
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
        .then((user) => {
            //createUserData(user, state, components)
            // Signed in 
            state.user.id = user;
            state.user.isAuth = true;
            state.page = 'reading'
        })
        .catch((error) => {
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