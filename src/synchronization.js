import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { render, initialize } from "./application";
//import "lodash";

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
}


function authStateListener(state, components) {
    firebase.auth().onAuthStateChanged((user) => {
        state.error = null;
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            state.user.isAuth = true;
            state.user.id = user.uid;
            state.page = 'reading'
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
        }
        //console.log('local state changed:', state)
        render(state, state.activeNote, components)
    });
}

// логаут
function signOut(state, components) {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        state.user.isAuth = false;
        state.page = 'login';
        render(state, null, components)
    }).catch((error) => {
        state.error = error;
    });
}

//сохранение состояния в бд
const synchronization = (state, components) => {
    if (state.status != 'login') {
        try { 
            updateData(state.user.id, state)
        } catch (err) {
            console.log(err)
        }
    }
}

//ЗАГРУЗКА СТЕЙСТА В БазуДанных
function updateData(userId, state) {
    //const dbRef = firebase.database().ref('users/' + userId);
    firebase.database().ref('users/' + userId).update(state);
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
            state.user.id = user;
            state.user.isAuth = true;
            state.page = 'reading'
            stateChangeListener(user, state, components)
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

export { submitAuthForm, signOut, initFirebase, synchronization }