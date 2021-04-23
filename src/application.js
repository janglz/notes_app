import _ from 'underscore'
import formatDate from './format-date'

class Note {
    constructor (text, id) {
        this.id = id;
        this.text = text;
        this.creationTime = new Date();
    }

    getTime () {
        return formatDate(this.creationTime)
    }
}

const renderNotesList = (state) => {                                    //<======ГЕНЕРАЦИЯ МЕНЮ
    let result = state.notes.reduce((acc, currentNote) => {
        if (currentNote.id === state.activeNote.id){
            return acc = `
            <li class="select-note note-href selected" id="${currentNote.id}">
                <strong><a href="#${currentNote.id}">${currentNote.text.slice(0, 16)}</a></strong>
                <p class="time">${currentNote.getTime()}</p>
            </li >` + acc
        }
        return acc = `
        <li class="select-note note-href" id="${currentNote.id}">
            <strong><a href="#${currentNote.id}">${currentNote.text.slice(0, 16)}</a></strong>
            <p class="time">${currentNote.getTime()}</p>
        </li >` + acc
    }, '');

    return `<li class="add note-href">
    <strong><a href="#">Новая заметка</a></strong>
</li>` + result;
}

const renderForm = (state, currentNote) => {                        //<=======ГЕНЕРАЦИЯ ФОРМЫ

    const form = document.createElement('form');
    form.classList.add('mui-form--inline');
    const div = document.createElement('div')
    div.classList.add('mui-textfield')
    const input = document.createElement('input');
    input.type = 'text';
    if (currentNote) {
        input.setAttribute('value', currentNote.text);
    }
    input.classList.add('form-text-input');
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

const renderNote = (state, currentNote) => {                                //<+++++ГЕНЕРАЦИЯ ТЕКСТА ЗАМЕТКИ 
    return `<p class="editable-note">${currentNote.text}</p>
    <p class="time">${currentNote.getTime()}</p>`
}

const render = async (state, elem, components) => {                     //<+++++  РЕНДЕР
    components.noteContainer.innerHTML = '';
    // if (!elem) {
    //     components.noteContainer.appendChild(renderForm(state, null));
    //     initialize(state, components);
    //     return;
    // }
    //const id = elem.id;
    const currentNote = _.find(state.notes, (note)=> note.id === state.activeNote.id);

    console.log('rendering note', currentNote)

    switch (state.page) {
        case 'editing':
            components.noteContainer.appendChild(renderForm(state, currentNote));
            break;
        
        case 'reading':
            components.noteContainer.innerHTML = renderNote(state, state.activeNote);
            break;

        case 'login':
            components.noteContainer.innerHTML = renderLoginPage();
            break;

        default:
            break;
    }
    
    components.notesList.innerHTML = await renderNotesList(state)

    initialize(state, components) 
}

const initialize = (state, components) => {
    console.log('initializing...')
    document.querySelector('.add').addEventListener('click', (e)=>{  // <= создать новую заметку
        e.preventDefault();
        console.log('click');
        const note = new Note('новая заметка', _.uniqueId('note_'))
        state.notes.push(note);
        state.activeNote = note;
        state.page = 'editing';
        render(state, note, components);
    })

    const allNotes = document.querySelectorAll('.select-note');    //<= все заметки
    allNotes.forEach((elem)=>{                                         
        // const checkbox = elem.querySelector('checkbox');
        // checkbox.addEventListener('click', ()=>{     //<= выбор чекбоксов 
        //     editNotesToRemoveList(state, checkbox, elem);
        // })
        
        elem.addEventListener('click', (e)=> {      //<= выбор заметки для показа, добавляем в стейт актив
            e.preventDefault();
            console.log('click on note')
            state.activeNote = _.find(state.notes, (note) => elem.id === note.id); // ПРОВЕРИТЬ ????
            console.log(state)
            state.page = 'reading';
            render(state, state.activeNote, components);
        })
    })

    const edit = components.noteContainer.querySelectorAll('.editable-note')[0];
    if (edit) {
        edit.addEventListener('click', ()=>{        //<= редактирование, в стейт.актив пихаем редактируемую заметку
            console.log('click')
            //state.activeNote = _.find(state.notes, (note) => note.id === edit.id);
            state.page = 'editing';
            render(state, state.activeNote, components);
        })
    }
    // обработчики формы
    const form = document.querySelector('form');
    if (form) {
        const input = document.querySelectorAll('.form-text-input')[0];
        const currentNote = _.find(state.notes, (note) => note.id === state.activeNote.id);  //находит заметку в общем массиве по айди активной
        //state.activeNote = currentNote;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            console.log('click', input.value)
            console.log(state)

            currentNote.text = input.value;
            state.page = 'reading';
            render(state, currentNote, components)
        })
    }
}

export default () => {

    //а тут должно грузиться с стоража
    const state = {
        notes: [],
        //active: null,
        notesToRemove: [],
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


// Редактирование заметок

const editNotesToRemoveList = (state, checkbox, elem) => {
    checkbox.checked ? 
        state.notesToRemove.push(elem.id) :
        state.notesToRemove.splice(indexOf(elem.id), 1);
}