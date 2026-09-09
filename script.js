// To-Do List app and single-page navigation logic
const STORAGE_KEY = 'haririTodoApp';

let currentFilter = 'all';
let tasks = loadTasks();

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const filterButtons = document.querySelectorAll('.filter-btn');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);

  if (themeIcon) {
    themeIcon.textContent = isDark ? '☀️' : '🌙';
  }

  if (themeToggle) {
    themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('haririTheme') || 'light';
  applyTheme(savedTheme);
}

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    console.error('Gagal membaca data dari LocalStorage:', error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === 'completed') {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function updateStats() {
  const incompleteTasks = tasks.filter((task) => !task.completed).length;
  const completeTasks = tasks.filter((task) => task.completed).length;

  pendingCount.textContent = `${incompleteTasks} belum selesai`;
  completedCount.textContent = `${completeTasks} selesai`;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  todoList.innerHTML = '';

  if (filteredTasks.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  filteredTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `todo-item ${task.completed ? 'completed' : ''}`;
    item.dataset.id = task.id;

    const mainContent = document.createElement('div');
    mainContent.className = 'todo-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Tandai tugas ${task.text}`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = task.text;

    mainContent.appendChild(checkbox);
    mainContent.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'icon-btn edit-btn';
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-btn delete-btn';
    deleteButton.textContent = 'Hapus';

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    item.appendChild(mainContent);
    item.appendChild(actions);
    todoList.appendChild(item);
  });

  updateStats();
}

function addTask(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    todoInput.focus();
    return;
  }

  tasks.unshift({
    id: Date.now(),
    text: trimmedText,
    completed: false,
  });

  saveTasks();
  renderTasks();
  todoForm.reset();
  todoInput.focus();
}

function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

function editTask(id) {
  const targetTask = tasks.find((task) => task.id === id);

  if (!targetTask) {
    return;
  }

  const updatedText = window.prompt('Edit tugas:', targetTask.text);
  if (updatedText === null) {
    return;
  }

  const trimmedText = updatedText.trim();
  if (!trimmedText) {
    window.alert('Tugas tidak boleh kosong.');
    return;
  }

  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, text: trimmedText };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

// Form submit: menambah tugas baru
 todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(todoInput.value);
});

// Delegasi event untuk checkbox, tombol edit, dan hapus
 todoList.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) {
    return;
  }

  const taskId = Number(item.dataset.id);

  if (event.target.matches('input[type="checkbox"]')) {
    toggleTask(taskId);
    return;
  }

  if (event.target.matches('.edit-btn')) {
    editTask(taskId);
    return;
  }

  if (event.target.matches('.delete-btn')) {
    deleteTask(taskId);
  }
});

// Filter logic
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    renderTasks();
  });
});

// Navbar behavior untuk smooth scrolling dan active state
navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();

    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      history.pushState(null, '', targetId);
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    navLinks.forEach((item) => item.classList.toggle('active', item === link));

    if (window.innerWidth <= 720) {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
  localStorage.setItem('haririTheme', nextTheme);
  applyTheme(nextTheme);
});

const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
  const scrollPosition = window.scrollY + 120;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    const isVisible = scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight;
    const matchingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

    if (matchingLink) {
      navLinks.forEach((link) => link.classList.toggle('active', link === matchingLink));
    }
  });
}

window.addEventListener('scroll', updateActiveNav);

initializeTheme();
renderTasks();
updateActiveNav();
