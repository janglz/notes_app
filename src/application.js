import _ from 'underscore'
import formatDate from './format-date'
import trashBucketSvg from './trash-icon.js'
import synchronization from './synchronization'

class Note {
    constructor (text, id) {
        this.id = id;
        this.text = text;
        this.creationTime = new Date();
        this.checked = false;
    }

    getTime () {
        return formatDate(this.creationTime)
    }
}

const renderNotesList = (state) => {                                    //<======ГЕНЕРАЦИЯ МЕНЮ
    let result = state.notes.reduce((acc, currentNote) => {
        const text = currentNote.text.slice(0, 16);
        const checkboxValue = currentNote.checked === true? 'checked' : ''
        if (currentNote.id === state.activeNote.id){
            return acc = `
            <li class="select-note note-href selected" id="${currentNote.id}">
                <strong><a href="#${currentNote.id}">${text}
                <input type="checkbox" class="checkbox" ${checkboxValue}>
                <p class="time">${currentNote.getTime()}</p></a></strong>
            </li>
            ` + acc
        }
        return acc = `
        <li class="select-note note-href" id="${currentNote.id}">
            <strong><a href="#${currentNote.id}">${text}

            <input type="checkbox" class="checkbox" ${checkboxValue}>
            <p class="time">${currentNote.getTime()}</p></a></strong>
        </li>` + acc
    }, '');

    return `<li class="add note-href"><strong><a href="#">
        <button class="add-button mui-btn mui-btn--fab mui-btn--primary">+</button>
        <button class="delete-button mui-btn mui-btn--fab mui-btn--primary">${trashBucketSvg}</button>
        <button class="check-all-button mui-btn mui-btn--fab mui-btn--primary">✓</button>
    </a></strong></li>` + result;
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

    console.log('form generated:', form)
    return form;
}

const renderNote = (state, currentNote) => { //<= ГЕНЕРАЦИЯ ТЕКСТА ЗАМЕТКИ 
    if (!currentNote) return ''
    return `<p class="editable-note">${currentNote.text}</p>
    <p class="time">${currentNote.getTime()}</p>`
}

const render = async (state, elem, components) => { //<= РЕНДЕР
    components.noteContainer.innerHTML = '';
    const currentNote = _.find(state.notes, (note)=> note.id === state.activeNote.id);

    console.log('rendering note', currentNote)
    console.log(state)

    switch (state.page) {
        case 'editing':
            components.noteContainer.appendChild(renderForm(state, currentNote));
            break;
        
        case 'reading':
            components.noteContainer.innerHTML = await renderNote(state, state.activeNote); 
            components.notesList.innerHTML = await renderNotesList(state)
            break;

        case 'login':
            components.noteContainer.innerHTML = await renderLoginPage();
            break;

        default:
            break;
    }  
    initialize(state, components) 
}


const initialize = (state, components) => {
    console.log('initializing...')
    // загрузка инфы с сервера и/или локал стоража
    synchronization(state);

    // создает новую заметку
    document.querySelector('.add').addEventListener('click', (e)=>{  
        e.preventDefault();
        console.log('click');
        const note = new Note('', _.uniqueId('note_'))
        state.notes.push(note);
        state.activeNote = note;
        state.page = 'editing';
        render(state, note, components);
    })

    const allNotes = document.querySelectorAll('.select-note');  
    allNotes.forEach((elem)=>{                                         
        const checkbox = elem.querySelectorAll("input[type='checkbox']")[0];
        
        elem.addEventListener('click', (e)=> {      //<= выбор заметки для показа, добавляем в стейт актив
            e.preventDefault();
            console.log('click on note')
            state.activeNote = _.find(state.notes, (note) => elem.id === note.id); // вроде работает ????
            state.page = 'reading';
            render(state, state.activeNote, components);
            
        })
        if (checkbox) {
            console.log(checkbox)
            checkbox.addEventListener('click', (e)=>{ 
                e.stopPropagation()
                checkNote(state, checkbox, elem); 
            })
        }
    })

    // удаляет выделенные заметки
    document.querySelector('.delete-button').addEventListener('click', (e)=>{
        e.stopPropagation();
        state.notes = _.filter(state.notes, (note) => note.checked === false); 
        state.page = 'reading'
        closeForm(e, state, state.activeNote, '', components)
        render(state, null, components)
    })

    // ввыделяет все заметки
    document.querySelector('.check-all-button').addEventListener('click', (e)=>{
        e.stopPropagation();
        state.checkedAll ? 
        state.notes.map((note) => note.checked = false) :
        state.notes.map((note) => note.checked = true);
        state.checkedAll = !state.checkedAll;
        render(state, null, components)
    })

    //обработчик клика по тексту заметки
    const edit = components.noteContainer.querySelectorAll('.editable-note')[0];
    if (edit) {
        edit.addEventListener('click', ()=>{        //<= редактирование, при рендере сгенерирует форму
            console.log('click')
            state.page = 'editing';
            render(state, state.activeNote, components);
        })
    }
    // обработчики формы
    const form = document.querySelector('form');
    if (form) {
        const input = document.querySelectorAll('.form-text-input')[0];
        input.focus();
        let currentNote = _.find(state.notes, (note) => note.id === state.activeNote.id);  //находит заметку в общем массиве по айди активной
        if (!currentNote) { //если заметка уже была удалена, то по клику на нее создается новая
            currentNote = new Note('', _.uniqueId('note_'));
            state.activeNote = currentNote;
            state.notes.push(currentNote)
        }
        
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
            render(state, currentNote, components)
        })
  
    }
}

// Эта функция удалит заметку, если она пустая, и закроет форму

const closeForm = (state, currentNote, value, components) => {
    console.log('focus lost, input value:', value)
    state.page = 'reading';
    currentNote.text = value;
    if (value === '') {
        state.activeNote = null;
        state.notes.splice(state.notes.indexOf(currentNote), 1);    
    }  
}


export default () => {

    const state = {
        notes: [],
        checkedAll: false,
        activeNote: null,
        page: 'reading', //'editing', 'login'
    }

    const components = {
        createNote: document.querySelector('.add'),
        notesList: document.querySelector('.notes-list'),
        noteContainer: document.querySelector('.note-container'),
    }
    initialize(state, components);
}

// выбор заметок (чекбокс)

const checkNote = (state, checkbox, elem) => {
    _.find(state.notes, (note) => note.id === elem.id).checked =
    (checkbox.checked ? true : false);
    console.log(state)
}