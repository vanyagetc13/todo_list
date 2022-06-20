// =================================================================================
// Время и дата
// =================================================================================
const time_show = document.querySelector('#time_now_show');
const date_show = document.querySelector('#date_now_show');

const monthes = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря'
];

function TimeUpdate(){
    let timer = new Date();
    const utc_time = timer.toTimeString();
    time_show.innerHTML = utc_time.slice(0,8);
};

function DateUpdate(){
    let dater = new Date();
    const day = dater.getDate();
    const month = dater.getMonth();
    const year = dater.getFullYear();
    date_show.innerHTML = `${day} ${monthes[month]} ${year}`;
};

TimeUpdate();
DateUpdate();
setInterval(()=>{
    TimeUpdate();
    DateUpdate();
}, 1000)

// График
const UseSmallMobile = (width) => {
	return width <= 375 ? true : false;
}
const aspectGraph = !UseSmallMobile(window.innerWidth);

const ctx = document.getElementById('graphic').getContext('2d');
const labels = [
	'пн',
	'вт',
	'ср',
	'чт',
	'пт',
	'сб',
	'вс'
];
const data = {
labels: labels,
datasets: [{
		label: 'Задач создано',
		data: [],
		borderColor: 'rgba(41,161,156,0.4)',
		borderWidth: 3,
		backgroundColor: 'rgba(41,161,156,0.6)',
		fill: false,
		radius: 4,
		tension: 0.4
	},
	{
		label: 'Задач выполнено',
		data: [],
		borderColor: '#29A19C',
		borderWidth: 3,
		backgroundColor: '#29A19C',
		fill: false,
		radius: 5,
		tension: 0.35
	}
]
};
const config = {
	type: 'line',
	data: data,
	options: {
		responsive: true,
		maintainAspectRatio: aspectGraph,
		plugins: {
			title: {
				display: false
			},
			legend: {
				position: 'bottom',
				onClick: ''
			}
		},
		interaction: {
			intersect: false
		},
		scales: {
			x: {
				display: true,
				grid: {
					color: 'rgb(220, 220, 220)'
				}
			},
			y: {
				display: true,
				beginAtZero: true,
				grid: {
					color: 'rgb(200, 200, 200)'
				},
				max: 15,
				ticks: {
					maxTicksLimit: 5,
				}
			}				
		}
	}
};

const graph = new Chart(ctx, config);

function UpdateTheChart (chart) {
	chart.data.datasets[0].data = [];
	chart.data.datasets[1].data = [];
	const temp_tasks = tasks;
	const week = 1000*60*60*24*7;
	const weekdays = {
		created: {
			0: 0,
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0
		},
		completed: {
			0: 0,
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0
		}
	}
	const now = Date.now();
	temp_tasks.forEach((task) =>{
		const dofc = Date.parse(task.date_of_creation);
		const dofcomp = Date.parse(task.date_of_completion);
		if((now-dofc) < week) weekdays.created[new Date(dofc).getDay()]++
		if(now-dofcomp < week) weekdays.completed[(new Date(dofcomp)).getDay()]++
	})
	const dataSets = chart.data.datasets;
	for(let i = 1;i<7;i++){
		dataSets[0].data.push(weekdays.created[i])
		dataSets[1].data.push(weekdays.completed[i])
	}
	dataSets[0].data.push(weekdays.created[0])
	dataSets[1].data.push(weekdays.completed[0])
	let max1 = 14;
	let max2 = 14;
	for(let i = 0; i < 7; i++){
		if (dataSets[0].data[i] > max1) max1 = dataSets[0].data[i];
		if (dataSets[1].data[i] > max2) max2 = dataSets[1].data[i];
	}
	const maxCount = max1 > max2 ? max1 : max2;
	chart.options.scales.y.max = 	maxCount >= 15 ?
									maxCount + 10 - maxCount % 10 :
									15;
	chart.update();
}
// =================================================================================
// ДРОПДАУНЫ
// =================================================================================
// Полифилл для метода forEach для NodeList
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function (callback, thisArg) {
		thisArg = thisArg || window;
		for (let i = 0; i < this.length; i++) {
			callback.call(thisArg, this[i], i, this);
		}
	};
}

const task_template = (task, index) =>{
	return `
		<div class="${task.completed ? 'completed_task' : 'task'}">
			<label class="description">
				<input onchange="inputChangeHandler(${index})" type="checkbox" class="task_checkbox" ${task.completed ? 'checked' : ''}>
				<span class="custom__checkbox none"></span>
				${task.description}
			</label>
			${task.completed ? "" : `
			<div class="none">
				<i onclick="editTaskHandler(${index})" class="fa-solid fa-pen-to-square"></i>
				<i onclick="deleteTaskHandler(${index})" class="fa-regular fa-trash-can red"></i>
			</div>`}
		</div>
	`
}

const ClientHasNoTasksYet = (bool) => {
	return `
		<p class="no_tasks">
			${bool ?
			'У Вас нет активных задач, <a onclick="add_task_btn_event_handler()" href="#" class="add_tasker">создайте</a> одну.':
			'Вы еще не завершили ни одной задачи.'}
		</p>
	`
}

function dropdown__reset() {
	document.querySelectorAll('.dropdown').forEach(function (dropDownWrapper) {
		const dropDownBtn = dropDownWrapper.querySelector('.dropdown__button');
		const dropDownInput = dropDownWrapper.querySelector('.dropdown__input-hidden');
		const dropDownList = dropDownWrapper.querySelector('.dropdown__list');
		default_btn_value = dropDownList.firstElementChild.innerText;
		dropDownInput.value="choose";
		dropDownBtn.innerText = default_btn_value;
	});
	document.querySelector("#date_input").value ="";
	const desc_input = document.querySelector("#description_input")
	desc_input.value = "Опишите задачу";
	desc_input.classList.remove('task_descr-focused');
}

function collect_data_task_edit(index) {
	const pop_up_task = document.querySelector("#pop_up_task_edit");
	const input_list = pop_up_task.querySelectorAll("input[name=dropdown_task_edit]");
	const f = tasks[index];
	input_list.forEach((input)=>{
		switch (input.id){
			case "description_edit":
				f.description = input.value;
				break
			case "category_edit":
				f.category = input.value;
				break
			case "date_edit":
				f.date_temp = input.value;
				break
			case "priority_edit":
				f.priority = input.value;
				break
		}
	})
}

function TaskCreation() {
	const pop_up_task = document.querySelector("#pop_up_task_create");
	const input_list = pop_up_task.querySelectorAll("input[name=dropdown_task_creation]");
	let task_temp = {
		description: "",
		completed: false,
		category: "",
		date_temp: "",
		priority: ""
	};
	input_list.forEach((input)=>{
		switch (input.id){
			case "description_input":
				task_temp.description = input.value;
				break
			case "category_input":
				task_temp.category = input.value;
				break
			case "date_input":
				task_temp.date_temp = input.value;
				break
			case "priority_input":
				task_temp.priority = input.value;
				break
		}
	})
	task_temp.completed = false;
	tasks.push(new Task(task_temp));
}

document.querySelectorAll('.dropdown').forEach(function (dropDownWrapper) {
	const dropDownBtn = dropDownWrapper.querySelector('.dropdown__button');
	const dropDownList = dropDownWrapper.querySelector('.dropdown__list');
	const dropDownListItems = dropDownList.querySelectorAll('.dropdown__list-item');
	const dropDownInput = dropDownWrapper.querySelector('.dropdown__input-hidden');
	
	// Клик по кнопке. Открыть/Закрыть select
	dropDownBtn.addEventListener('click', function (e) {
		dropDownList.classList.toggle('dropdown__list--visible');
        this.classList.add('dropdown__button--active');
	});

	// Выбор элемента списка. Запомнить выбранное значение. Закрыть дропдаун
	dropDownListItems.forEach(function (listItem) {
		listItem.addEventListener('click', function (e) {
			e.stopPropagation();
			dropDownBtn.innerText = this.innerText;
			dropDownBtn.focus();
			dropDownInput.value = this.dataset.value;
			dropDownList.classList.remove('dropdown__list--visible');
		});
	});

	// Клик снаружи дропдауна. Закрыть дропдаун
	document.addEventListener('click', function (e) {
		if (e.target !== dropDownBtn) {
			dropDownBtn.classList.remove('dropdown__button--active');
			dropDownList.classList.remove('dropdown__list--visible');
		}
	});

	// Нажатие на Tab или Escape. Закрыть дропдаун
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Tab' || e.key === 'Escape') {
			dropDownBtn.classList.remove('dropdown__button--active');
			dropDownList.classList.remove('dropdown__list--visible');
		}
	});
});

// ==
// Кнопочки
// ==
const add_task_btn = document.querySelector('#add_task_btn');
const cancel_task_create = document.querySelector('#pop_up_create_task_cancel_btn');
const cancel_task_edit = document.querySelector('#edit_cancel_btn');
const edit_submit_btn = document.querySelector('#edit_submit_btn');

const pop_up_task = document.querySelector('#pop_up_task_create');
const pop_up_task_edit = document.querySelector('#pop_up_task_edit');

const add_task_btn_event_handler = () => {
    pop_up_task.classList.add('active');
}
add_task_btn.addEventListener('click', add_task_btn_event_handler);

cancel_task_create.addEventListener('click', (e)=>{
    e.preventDefault();
    pop_up_task.classList.remove('active');
	dropdown__reset();
})

cancel_task_edit.addEventListener('click', (e) => {
	e.preventDefault();
	pop_up_task_edit.classList.remove('active');
})

edit_submit_btn.addEventListener('click', (e) => {
	const pop_up_task_edit_main = document.querySelector('#pop_up_task_edit_main');
	e.preventDefault();
	const index = parseInt(pop_up_task_edit_main.firstElementChild.value);

	collect_data_task_edit(index);
	updateLocal();
	pop_up_task_edit.classList.remove('active');
	fillTaskHTML();
})
///

const task_description = document.querySelector(".pop_up_task_create_description");
task_description.addEventListener("focus", () => {
	task_description.classList.add('task_descr-focused');
	if(task_description.value === "Опишите задачу") task_description.value = "";
})

task_description.addEventListener("blur", ()=>{
	if(task_description.value === ""){
		task_description.classList.remove('task_descr-focused');
		task_description.value = "Опишите задачу";
	}
})

///

// =================================================================================
// Таски
// =================================================================================
const tasks_main = document.querySelector("#current_tasks_main");
const completed_tasks_main = document.querySelector("#completed_tasks_main");

const achiv_created = document.querySelector('#achiv_created');
const achiv_completed = document.querySelector('#achiv_completed');
const achiv_deleted = document.querySelector('#achiv_deleted');

let tasks = [];
let achivs = {};

!localStorage.tasks ? tasks = [] : tasks = JSON.parse(localStorage.getItem('tasks'));
!localStorage.achivs ? achivs = {
	created: 0,
	completed: 0,
	deleted: 0
} : achivs = JSON.parse(localStorage.getItem('achivs'));

function Task(task) {
	this.description = task.description;
	this.completed = task.completed;
	this.category = task.category;
	this.date_temp = task.date_temp;
	this.priority = task.priority;
	this.date_of_creation = new Date;
	this.date_of_completion = '';
}

const updateLocal = () => {
	localStorage.setItem('tasks', JSON.stringify(tasks));
	localStorage.setItem('achivs', JSON.stringify(achivs));
}

const NumberOfAchivCheck = (achiv) => {
	const lastNumber = achiv % 10;
	if(lastNumber == 1) return "задача";
	if(lastNumber > 1 && lastNumber < 5) return "задачи";

	return "задач"
}

const fillTaskHTML = () => {
	tasks_main.innerHTML = "";
	completed_tasks_main.innerHTML = "";

	achiv_completed.innerText = achivs.completed;
	achiv_created.innerText = achivs.created;
	achiv_deleted.innerText = achivs.deleted;

	achiv_completed.parentElement.lastElementChild.innerText = NumberOfAchivCheck(achivs.completed);
	achiv_created.parentElement.lastElementChild.innerText = NumberOfAchivCheck(achivs.created);
	achiv_deleted.parentElement.lastElementChild.innerText = NumberOfAchivCheck(achivs.deleted);

	if (tasks.length > 0){
		tasks.forEach((item, index) => {
			if(item.completed){
				completed_tasks_main.innerHTML += task_template(item, index);
			} else {
				tasks_main.innerHTML += task_template(item, index);
			}
			/*
			<div class="task">
				<label class="description">
					<input type="checkbox" class="current_task_checkbox" ${task.completed ? 'checked' : ''}>
					<span class="custom__checkbox none"></span>
					${task.description}
				</label>
			</div>
			*/
		});
		// [Hovers]
		const cur_task = Array.from(tasks_main.children);
		const cur_compl_task = Array.from(completed_tasks_main.children);
		cur_task.forEach((ft) => {
			ft.addEventListener('mouseover', () => {
				ft.firstElementChild.classList.add('d_p_l');
				ft.firstElementChild.lastElementChild.classList.remove('none');
				ft.lastElementChild.classList.remove('none');
			});
			ft.addEventListener('mouseout', () => {
				ft.firstElementChild.classList.remove('d_p_l');
				ft.firstElementChild.lastElementChild.classList.add('none');
				ft.lastElementChild.classList.add('none');
			});
		})
		cur_compl_task.forEach((ft) => {
			ft.addEventListener('mouseover', () => {
				ft.firstElementChild.classList.add('d_p_l');
				ft.firstElementChild.lastElementChild.classList.remove('none');
			});
			ft.addEventListener('mouseout', () => {
				ft.firstElementChild.classList.remove('d_p_l');
				ft.firstElementChild.lastElementChild.classList.add('none');
			});
		})
	}
	if(completed_tasks_main.innerHTML == "") completed_tasks_main.innerHTML = ClientHasNoTasksYet(false);
	if(tasks_main.innerHTML == "") tasks_main.innerHTML = ClientHasNoTasksYet(true);
	UpdateTheChart(graph);
}
fillTaskHTML();

const create_task_btn = document.querySelector('#pop_up_create_task_add_btn');

const close_pop_up = () => {
	pop_up_task.classList.remove('active');
}

create_task_btn.addEventListener("click", (e)=> {
	e.preventDefault();
	TaskCreation();
	achivs.created++;
	updateLocal();
	fillTaskHTML();
	dropdown__reset();
	close_pop_up();
})

const inputChangeHandler = (index) => {
	tasks[index].completed = !tasks[index].completed;
	if (tasks[index].completed === false){
		achivs.completed--;
		tasks[index].date_of_completion = '';
	}
	else {
		achivs.completed++;
		tasks[index].date_of_completion = new Date();
	}
	updateLocal();
	fillTaskHTML();
}

const deleteTaskHandler = (index) => {
	tasks.splice(index, 1);
	achivs.deleted ++;
	updateLocal();
	fillTaskHTML();
}

// EDIT таски
function paramsValues (type, index) {
	const f = tasks[index];
	if (type == "priority"){
		switch (f.priority){
			case "choose":
				return "Выбрать"
			case "red":
				return "Очень важно"
			case "orange":
				return "Важно"
			case "blue":
				return "Не очень важно";
			case "grey":
				return "Не важно"
		}
	}

	if (type == "category"){
		switch(f.category){
			case "choose":
				return "Выбрать"
			case "home":
				return "Дом"
			case "family":
				return "Семья"
			case "work":
				return "Работа";
			case "sport":
				return "sport"
		}
	}
}

const fill_edit_HTML = (index) => {
	const f = tasks[index];
	return `
		<input type="text" name="indexholder" value="${index}" class="none">
		<div class="pop_up_task_description">
			<p class="pop_up_task_description_p">Что нужно сделать?</p>
			<input type="text" name="dropdown_task_edit" class="pop_up_task_create_description ${f.description == "" ? "" : "task_descr-focused"}" value="${f.description}" id="description_edit">
		</div>
		<div class="pop_up_task_params_wrapper">
			<div>
				<p class="pop_up_task_description_p">Категория</p>
				<div class="dropdown">
					<button id="" class="dropdown__button">${paramsValues("category", index)}</button>
					<ul class="dropdown__list">
						<li class="dropdown__list-item" data-value="choose">Выбрать</li>
						<li class="dropdown__list-item" data-value="home">Дом</li>
						<li class="dropdown__list-item" data-value="family">Семья</li>
						<li class="dropdown__list-item" data-value="work">Работа</li>
						<li class="dropdown__list-item" data-value="sport">Спорт</li>
					</ul>
					<input type="text" name="dropdown_task_edit" value="${f.category}" class="dropdown__input-hidden" id="category_edit">
				</div>
			</div>
			<div>
				<p class="pop_up_task_description_p">Когда?</p>
				<input type="date" name="dropdown_task_edit" class="pop_up_create_task_date" id="date_edit" value ="${f.date_temp}">
			</div>
			<div>
				<p class="pop_up_task_description_p">Приоритет задачи</p>
				<div class="dropdown">
					<button id="" class="dropdown__button">${paramsValues("priority", index)}</button>
					<ul class="dropdown__list">
						<li class="dropdown__list-item" data-value="choose">Выбрать</li>
						<li class="dropdown__list-item" data-value="red">Очень важно</li>
						<li class="dropdown__list-item" data-value="orange">Важно</li>
						<li class="dropdown__list-item" data-value="blue">Не очень важно</li>
						<li class="dropdown__list-item" data-value="grey">Не важно</li>
					</ul>
					<input type="text" name="dropdown_task_edit" value="${f.priority}" class="dropdown__input-hidden" id="priority_edit">
				</div>
			</div>
		</div>
	`
}

const editTaskHandler = (index) => {
	const pop_up_task_edit_main = document.querySelector('#pop_up_task_edit_main');
	pop_up_task_edit_main.innerHTML = fill_edit_HTML(index);
	pop_up_task_edit.classList.add('active');
	pop_up_task_edit.querySelectorAll('.dropdown').forEach(function (dropDownWrapper) {
		const dropDownBtn = dropDownWrapper.querySelector('.dropdown__button');
		const dropDownList = dropDownWrapper.querySelector('.dropdown__list');
		const dropDownListItems = dropDownList.querySelectorAll('.dropdown__list-item');
		const dropDownInput = dropDownWrapper.querySelector('.dropdown__input-hidden');
		dropDownBtn.addEventListener('click', function (e) {
			dropDownList.classList.toggle('dropdown__list--visible');
			this.classList.add('dropdown__button--active');
		});
		dropDownListItems.forEach(function (listItem) {
			listItem.addEventListener('click', function (e) {
				e.stopPropagation();
				dropDownBtn.innerText = this.innerText;
				dropDownBtn.focus();
				dropDownInput.value = this.dataset.value;
				dropDownList.classList.remove('dropdown__list--visible');
			});
		});
		document.addEventListener('click', function (e) {
			if (e.target !== dropDownBtn) {
				dropDownBtn.classList.remove('dropdown__button--active');
				dropDownList.classList.remove('dropdown__list--visible');
			}
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Tab' || e.key === 'Escape') {
				dropDownBtn.classList.remove('dropdown__button--active');
				dropDownList.classList.remove('dropdown__list--visible');
			}
		});
	})
}


// ТЕМЫ
const head = document.head;

let current_theme;
const theme_switcher = document.querySelector('#theme_change');
const tm_theme = document.querySelector('#theme_change__tm');

const fillThemes = () => {
	current_theme = JSON.parse(localStorage.getItem('theme'));
	const body = document.querySelector('body');
	if (current_theme == "dark"){
		theme_switcher.classList.remove('fa-moon');
		theme_switcher.classList.add('fa-sun');
		theme_switcher.classList.add('white');
		body.classList.add('dark')
		body.classList.remove('light')

		tm_theme.firstElementChild.classList.remove('fa-moon');
		tm_theme.firstElementChild.classList.add('fa-sun');
		tm_theme.firstElementChild.classList.add('white');
		tm_theme.lastElementChild.innerText = "Светлая тема"
	}
	else if(current_theme == "light"){
		theme_switcher.classList.remove('fa-sun');
		theme_switcher.classList.add('fa-moon');
		theme_switcher.classList.remove('white');
		body.classList.remove('dark')
		body.classList.add('light')

		tm_theme.firstElementChild.classList.remove('fa-sun')
		tm_theme.firstElementChild.classList.add('fa-moon');
		tm_theme.firstElementChild.classList.remove('white');
		tm_theme.lastElementChild.innerText = "Темная тема"
	};
}

const fillDefaultThemes = () =>{
	window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? current_theme = "light" : current_theme = "dark";
	localStorage.setItem('theme', JSON.stringify(current_theme));
	fillThemes();
}

!localStorage.theme? fillDefaultThemes() : fillThemes();

const ThemeHandler = (e) => {
	e.preventDefault();
	if (current_theme == "dark") {
		current_theme = "light";
	}
	else if (current_theme == "light") current_theme = "dark";
	localStorage.setItem('theme', JSON.stringify(current_theme));
	fillThemes();
}

theme_switcher.addEventListener('click', ThemeHandler)

tm_theme.addEventListener('click', ThemeHandler)

// Toggle Menu
const toggle_menu = document.querySelector('#toggle_menu');
const opened = 't-m__opened';
const toggleMenu = () => {
	toggle_menu.classList.contains(opened) ?
		toggle_menu.classList.remove(opened) : toggle_menu.classList.add(opened);
}

const toggle_menu_btn = document.querySelector('#toggle_menu_btn');
toggle_menu_btn.addEventListener('click', e => {
	e.stopPropagation();
	toggleMenu();

	Array.from(toggle_menu.firstElementChild.childNodes).forEach((link, counter)=> {
		if(counter % 2 == 1) {
			link.addEventListener('mouseover',() => {
				link.firstElementChild.classList.add('fa-rotate-by')
			})
			link.addEventListener('mouseout', () => {
				link.firstElementChild.classList.remove('fa-rotate-by')
			})
		}
	})

	// Закрытие нажатием вне toggle-menu
	document.addEventListener('click', e => {
		const target = e.target;
		const its_menu = target == toggle_menu || toggle_menu.contains(target);
		const its_hamburger = target == toggle_menu_btn || toggle_menu_btn.contains(target);
		if(!its_hamburger && !its_menu && toggle_menu.classList.contains(opened)) {
			toggleMenu()
		}
	})
});

// =====

// TODO(me): реализовать функционал категорий
// TODO(me): добавление категорий в меню, через 'Добавить'

// TODO(me): реализовать функционал Наблюдение с отслеживанием дня недели создания задачи
// TODO(me): реализовать Факт Дня

// TODO(me): РЕАЛИЗОВАТЬ СИСТЕМУ АККАУНТА

// =====