import _ from 'underscore'
import formatDate from './format-date'
import trashBucketSvg from './trash-icon.js'
import { submitAuthForm, signOut, initFirebase, synchronization, writeUserData } from './synchronization'

class Note {
    constructor (text, id) {
        this.id = id;
        this.text = text;
        this.creationTime = new Date();
        this.checked = false;
        //this.getTime = getTime();
    }

    getTime () {
        return formatDate(this.creationTime)
    }
}

const renderNotesList = (state, activeNote) => {                                    //<======ГЕНЕРАЦИЯ МЕНЮ
    //if (state.activeNote === null) 
    let result = state.notes.reduce((acc, currentNote) => {
        const text = currentNote.text.slice(0, 16);
        const checkboxValue = currentNote.checked === true? 'checked' : ''
        if (currentNote === activeNote){
            return acc = `
            <li class="select-note note-href selected" id="${currentNote.id}">
                <strong><a href="#${currentNote.id}">${text}
                <input type="checkbox" class="checkbox" ${checkboxValue}>
                <p class="time">${currentNote.getTime}</p></a></strong>
            </li>
            ` + acc
        }
        return acc = `
        <li class="select-note note-href" id="${currentNote.id}">
            <strong><a href="#${currentNote.id}">${text}

            <input type="checkbox" class="checkbox" ${checkboxValue}>
            <p class="time">${currentNote.getTime}</p></a></strong>
        </li>` + acc
    }, '');

    return `<li class="add note-href"><strong><a href="#">
        <button class="add-button mui-btn mui-btn--fab mui-btn--primary">+</button>
        <button class="delete-button mui-btn mui-btn--fab mui-btn--primary">${trashBucketSvg}</button>
        <button class="check-all-button mui-btn mui-btn--fab mui-btn--primary">✓</button>
    </a></strong></li>` + result + `<button class="logout-button mui-btn mui-btn--flat mui-btn--primary">выйти из аккаунта</button>`;
}

const renderForm = (state, currentNote) => { //<= ГЕНЕРАЦИЯ ФОРМЫ

    const form = document.createElement('form');
    form.classList.add('mui-form');
    const div = document.createElement('div')
    div.classList.add('mui-textfield');
    const input = document.createElement('textarea');
    if (currentNote) {
        input.insertAdjacentHTML('afterbegin', currentNote.text);
    }
    input.classList.add('form-text-input');
    input.placeholder = 'Новая заметка';
    div.appendChild(input)
    form.appendChild(div);
    const submit = document.createElement('input');
    submit.classList.add('mui-btn')
    submit.type = 'submit';
    submit.value = 'Save';
    form.appendChild(submit);

    return form;
}

const renderNote = (state, currentNote) => { //<= ГЕНЕРАЦИЯ ТЕКСТА ЗАМЕТКИ 
    if (!currentNote) return `
    <br>
    <h1>Заметки</h1>
    <p>В этом веб-приложении можно создавать заметки, сохранять их, редактировать и удалять.</p>
    <p>Такой невообразимый функционал стал возможен благодаря использованию JS, библиотек MUI и Underscore. Аутентификация работает через Google Firebase.
    </p>
    <p>Для сохранения заметки можно просто убрать фокус с поля ввода. Для удаления заметки отметьте ее галочкой, и нажмите на соответствующую кнопку.
    </p>
    `
    return `<p class="editable-note">${currentNote.text}</p>
    <p class="time">${currentNote.getTime}</p>`
}

const renderLoginPage = (state) => {
    const modalEl = document.createElement('div');

    modalEl.style.width = '400px';
    modalEl.style.height = '300px';
    modalEl.style.margin = '100px auto';
    modalEl.style.padding = '20px';
    modalEl.style.backgroundColor = '#fff';
    
    const welcomePhrase = state.user.registered? `введите свои данные` : `зарегистрируйтесь`;
    const buttonPhrase = state.user.registered? `нет аккаунта` : `есть аккаунт`;
    // show modal
    modalEl.innerHTML = `
    <form class="mui-form">
        <legend class="">Пожалуйста, ${welcomePhrase}</legend>
        <div class="mui-textfield mui-textfield--float-label">
            <input type="email" id="email" class="email">
            <label>email</label>
        </div>
        <div class="mui-textfield mui-textfield--float-label">
            <input type="password" id="password" class="password">
            <label>пароль</label>
        </div>

        <button type="submit" class="register mui-btn mui-btn--raised">Вперед!</button>
        <button class="login mui-btn mui-btn--raised">У меня ${buttonPhrase}</button>
    </form>`
    //mui.overlay('on', modalEl);
    return modalEl;
}

const renderError = (error) => {
    const errorPanel = document.createElement('div');
    errorPanel.classList.add('mui-panel');
    errorPanel.style.backgroundColor = '#f17878';
    errorPanel.innerHTML = `${error}`

    return errorPanel;
}

const render = async (state, elem, components) => { //<= РЕНДЕР
    console.log('rendering:', state)
    components.noteContainer.innerHTML = '';
    let currentNote = state.activeNote;
    // let currentNote = null;
    // if(state.activeNote) {
    //     currentNote = _.find(state.notes, (note)=> note.id === state.activeNote.id);
    //     //state.activeNote = currentNote
    // }

    switch (state.page) {
        case 'editing':
            components.noteContainer.appendChild(renderForm(state, currentNote));
            initialize(state, components) 
            break;
        
        case 'reading':
            //let currentNote = _.find(state.notes, (note)=> note.id === state.activeNote.id);
            components.noteContainer.innerHTML = await renderNote(state, currentNote); 
            components.notesList.innerHTML = await renderNotesList(state, currentNote)
            initialize(state, components) 
            break;

        case 'login':
            components.noteContainer.appendChild(renderLoginPage(state));
            if (state.error) {
                components.noteContainer.appendChild(renderError(state.error))
            }
            
            //initialize(state, components) 
            break;

        default:
            break;
    }  
    
    
}


const initialize = async (state, components) => {
    console.log('initializing...')
    
    // ограничение доступа
    
    if (!state.user.isAuth) {
        state.page = 'login';
        await render(state, null, components);
        const submit = document.querySelector('.register');
        if (!submit) {
            
            //render(state, null, components);
        } else {
            const form = document.querySelector('form');
            form.addEventListener('submit', async (e)=>{
                e.preventDefault();
                await submitAuthForm(state, form, components, e);
                initialize(state, components)
                console.log('sub')
                //render(state, null, components);
                
            });
            document.querySelector('.login').addEventListener('click', ()=>{
                state.user.registered = !state.user.registered;
                synchronization(state, components);
                initialize(state, components)
                //render(state, null, components)
            });
        }
        return
    };

    
    console.log('initialized:',state)

    // создает новую заметку
    const addNoteButton = document.querySelector('.add-button')
    if (addNoteButton) {
        addNoteButton.addEventListener('click', async(e) => {
            e.preventDefault();
            const generateId = (x = 0) =>{
                let id = _.uniqueId(`note_${x}`);
                state.notes.forEach(note=>{
                    if(note.id === id) return id = generateId(x+1)
                }, id)
                return id;
            }
            const note = new Note('', generateId())
            state.notes.push(note);
            state.activeNote = note;
            state.page = 'editing';
            await synchronization(state, components)
            render(state, note, components);
        })
    }

    const allNotes = document.querySelectorAll('.select-note');  
    allNotes.forEach((elem)=>{                                         
        const checkbox = elem.querySelectorAll("input[type='checkbox']")[0];
        
        elem.addEventListener('click', (e)=> {      //<= выбор заметки для показа, добавляем в стейт актив
            e.preventDefault();
            state.activeNote = _.find(state.notes, (note) => elem.id === note.id); // вроде работает ????
            state.page = 'reading';
            render(state, state.activeNote, components);
            
        })
        if (checkbox) {
            checkbox.addEventListener('click', (e)=>{ 
                e.stopPropagation()
                checkNote(state, checkbox, elem); 
            })
        }
    })

    // удаляет выделенные заметки
    document.querySelector('.delete-button').addEventListener('click', async (e)=>{
        e.stopPropagation();
        state.notes = _.filter(state.notes, (note) => note.checked === false); 
        state.page = 'reading'
        closeForm(state, state.activeNote, '', components)
        await synchronization(state, components);
        // writeUserData(state.user.id, state, components);
        render(state, null, components)
    })

    // ввыделяет все заметки
    document.querySelector('.check-all-button').addEventListener('click', (e)=>{
        //e.stopPropagation();
        state.checkedAll = !state.checkedAll;
        state.checkedAll ? 
        state.notes.map((note) => note.checked = false) :
        state.notes.map((note) => note.checked = true);
        
        render(state, null, components)
    })

    //обработчик клика по тексту заметки
    const edit = components.noteContainer.querySelectorAll('.editable-note')[0];
    if (edit) {
        edit.addEventListener('click', ()=>{        //<= редактирование, при рендере сгенерирует форму
            state.page = 'editing';
            render(state, state.activeNote, components);
        })
    }
    // обработчики формы
    const form = document.querySelector('form');
    if (form) {
        const input = document.querySelectorAll('.form-text-input')[0];
        
        let currentNote = _.find(state.notes, (note) => note.id === state.activeNote.id);  //находит заметку в общем массиве по айди активной
        if (!currentNote) { 
            //===========
            //надо сделать так, чтобы если нет заметки, рендерилось чтото иное
            //===========
            state.page = 'reading';
            render(state, null, components);
            return


            //если заметка уже была удалена, то по клику на нее создается новая
            // currentNote = new Note('', _.uniqueId('note_'));
            // state.activeNote = currentNote;
            // state.notes.push(currentNote)
        }
        
        input.focus();
        input.addEventListener('keyup', (e) => {
            e.preventDefault();
            currentNote.text = input.value;

            //чтобы реализовать этот функционал, потребуется еще одно состояние. Пока не хочется.
            // if (input.value === '') {
            //     state.notes.splice(state.notes.indexOf(currentNote), 1);
                
            // }
            //render(state, currentNote, components) 
        })

        input.addEventListener('blur', (e) => {
            e.preventDefault();
            closeForm(state, currentNote, input.value, components)
            state.page = 'reading'
            //writeUserData(state.user.id, state, components) //ЭТО СТРОЧКА запускает цикл :/
            synchronization(state, components)
            render(state, currentNote, components)
        })
  
    }

    document.querySelector('.logout-button').addEventListener('click', ()=>signOut(state, components));
    //render(state, null, components)
}

// Эта функция удалит заметку, если она пустая, и закроет форму

const closeForm = (state, currentNote, value, components) => {
    state.page = 'reading';
    currentNote.text = value;
    
    if (value === '') {
        currentNote.text = 'Новая заметка...'
    }  
}


const app = async () => {

    const state = {
        user: {
            id: '',
            registered: false,
            isAuth: false,
        },
        notes: [],
        checkedAll: false,
        activeNote: null,
        page: 'login', //'editing', 'login', 'reading'
        error: null,
        //page: 'reading', //'editing', 'login', 'reading'
    }

    const components = {
        createNote: document.querySelector('.add'),
        notesList: document.querySelector('.notes-list'),
        noteContainer: document.querySelector('.note-container'),
    }
    
    await initFirebase(state, components);
    //state.activeNote = state.notes[state.notes.length-1]
    initialize(state, components);
}

// выбор заметок (чекбокс)

const checkNote = (state, checkbox, elem) => {
    _.find(state.notes, (note) => note.id === elem.id).checked =
    (checkbox.checked ? true : false);
}

export { app, render, initialize, Note, formatDate }