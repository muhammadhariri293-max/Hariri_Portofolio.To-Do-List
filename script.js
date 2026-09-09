// To-Do List app and single-page navigation logic
const STORAGE_KEY = 'haririTodoApp';

let currentFilter = 'all';
let searchQuery = '';
let tasks = loadTasks();

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoPriority = document.getElementById('todoPriority');
const todoDeadline = document.getElementById('todoDeadline');
const todoSearch = document.getElementById('todoSearch');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const totalCount = document.getElementById('totalCount');
const progressCompletedCount = document.getElementById('progressCompletedCount');
const progressPendingCount = document.getElementById('progressPendingCount');
const progressPercent = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const progressSummary = document.getElementById('progressSummary');
const progressTrack = document.querySelector('.progress-track');
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
    if (!Array.isArray(savedTasks)) {
      return [];
    }

    return savedTasks
      .filter((task) => task && typeof task.text === 'string' && task.text.trim())
      .map((task, index) => ({
        id: task.id ?? Date.now() + index,
        text: task.text.trim(),
        completed: Boolean(task.completed),
        priority: normalizePriority(task.priority),
        deadline: normalizeDeadline(task.deadline),
      }));
  } catch (error) {
    console.error('Gagal membaca data dari LocalStorage:', error);
    return [];
  }
}

function normalizePriority(priority) {
  return ['high', 'medium', 'low'].includes(priority) ? priority : 'medium';
}

function normalizeDeadline(deadline) {
  if (typeof deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return '';
  }

  const [year, month, day] = deadline.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? deadline
    : '';
}

function getPriorityLabel(priority) {
  const labels = {
    high: '🔴 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
  };

  return labels[normalizePriority(priority)];
}

function getDeadlineStatus(deadline) {
  const normalizedDeadline = normalizeDeadline(deadline);

  if (!normalizedDeadline) {
    return null;
  }

  const [year, month, day] = normalizedDeadline.split('-').map(Number);
  const deadlineDate = new Date(year, month - 1, day);
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDifference = Math.round((deadlineDate - todayDate) / 86400000);

  if (dayDifference < 0) {
    return { className: 'deadline-overdue', label: '⚠️ Terlambat' };
  }

  if (dayDifference === 0) {
    return { className: 'deadline-today', label: '🔴 Deadline hari ini' };
  }

  if (dayDifference <= 3) {
    return { className: 'deadline-soon', label: '🟡 Deadline dekat' };
  }

  return { className: 'deadline-safe', label: '🟢 Masih aman' };
}

function formatDeadline(deadline) {
  const normalizedDeadline = normalizeDeadline(deadline);

  if (!normalizedDeadline) {
    return '';
  }

  const [year, month, day] = normalizedDeadline.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  let filteredTasks = tasks;

  if (currentFilter === 'active') {
    filteredTasks = filteredTasks.filter((task) => !task.completed);
  }

  if (currentFilter === 'completed') {
    filteredTasks = filteredTasks.filter((task) => task.completed);
  }

  if (normalizedQuery) {
    filteredTasks = filteredTasks.filter((task) => task.text.toLowerCase().includes(normalizedQuery));
  }

  return filteredTasks;
}

function updateStats() {
  const incompleteTasks = tasks.filter((task) => !task.completed).length;
  const completeTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completeTasks / totalTasks) * 100);

  pendingCount.textContent = `${incompleteTasks} belum selesai`;
  completedCount.textContent = `${completeTasks} selesai`;
  totalCount.textContent = totalTasks;
  progressCompletedCount.textContent = completeTasks;
  progressPendingCount.textContent = incompleteTasks;
  progressPercent.textContent = `${completionPercentage}%`;
  progressBar.style.width = `${completionPercentage}%`;
  progressSummary.textContent = `${completeTasks} dari ${totalTasks} tugas selesai`;
  progressTrack.setAttribute('aria-valuenow', String(completionPercentage));
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  todoList.innerHTML = '';

  if (filteredTasks.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent = searchQuery.trim() ? 'Tugas tidak ditemukan.' : 'Belum ada tugas. Tambahkan tugas pertamamu hari ini.';
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
    checkbox.className = 'todo-checkbox';
    checkbox.setAttribute('aria-label', `Tandai tugas ${task.text}`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = task.text;

    const priority = document.createElement('span');
    priority.className = `todo-priority priority-${task.priority}`;
    priority.textContent = getPriorityLabel(task.priority);
    priority.setAttribute('aria-label', `Priority ${task.priority}`);

    const deadlineStatus = getDeadlineStatus(task.deadline);
    let deadline = null;
    if (deadlineStatus) {
      deadline = document.createElement('span');
      deadline.className = `todo-deadline ${deadlineStatus.className}`;
      deadline.textContent = `${formatDeadline(task.deadline)} · ${deadlineStatus.label}`;
      deadline.setAttribute('aria-label', `Deadline ${formatDeadline(task.deadline)}, ${deadlineStatus.label}`);
    }

    mainContent.appendChild(checkbox);
    mainContent.appendChild(text);
    mainContent.appendChild(priority);
    if (deadline) {
      mainContent.appendChild(deadline);
    }

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'icon-btn edit-btn';
    editButton.setAttribute('aria-label', `Edit tugas ${task.text}`);
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-btn delete-btn';
    deleteButton.setAttribute('aria-label', `Hapus tugas ${task.text}`);
    deleteButton.textContent = 'Hapus';

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    item.appendChild(mainContent);
    item.appendChild(actions);
    todoList.appendChild(item);
  });

  updateStats();
}

function updateFilterState() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

todoSearch.addEventListener('input', () => {
  searchQuery = todoSearch.value;
  renderTasks();
});

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
    priority: normalizePriority(todoPriority.value),
    deadline: normalizeDeadline(todoDeadline.value),
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

  const updatedPriority = window.prompt(
    'Priority tugas (High, Medium, Low):',
    getPriorityLabel(targetTask.priority).replace(/^[^ ]+ /, ''),
  );

  if (updatedPriority === null) {
    return;
  }

  const normalizedPriority = normalizePriority(updatedPriority.trim().toLowerCase());
  const updatedDeadline = window.prompt(
    'Deadline tugas (YYYY-MM-DD). Kosongkan untuk menghapus deadline:',
    normalizeDeadline(targetTask.deadline),
  );

  if (updatedDeadline === null) {
    return;
  }

  const normalizedDeadline = normalizeDeadline(updatedDeadline.trim());

  tasks = tasks.map((task) => {
    if (task.id === id) {
      return {
        ...task,
        text: trimmedText,
        priority: normalizedPriority,
        deadline: normalizedDeadline,
      };
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

    updateFilterState();
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
updateFilterState();
renderTasks();
updateActiveNav();
