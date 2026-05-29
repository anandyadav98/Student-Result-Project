/*
 * Student Result Management System
 * XML-Based Result Display with Roll Number Lookup
 * Student & Admin Login
 */

const API_BASE = '/api';

// Default subjects for new students
const DEFAULT_SUBJECTS = [
  'Data Structures',
  'Database Management',
  'Web Technologies',
  'Operating Systems',
  'Mathematics',
];

// Auth state: null | { type: 'student', rollNumber, name } | { type: 'admin' }
function getAuth() {
  try {
    const s = sessionStorage.getItem('srm_auth');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function setAuth(auth) {
  if (auth) sessionStorage.setItem('srm_auth', JSON.stringify(auth));
  else sessionStorage.removeItem('srm_auth');
}

function isAdmin() {
  const a = getAuth();
  return a && a.type === 'admin';
}

function isStudent() {
  const a = getAuth();
  return a && a.type === 'student';
}

// DOM refs
const loginGate = document.getElementById('login-gate');
const appMain = document.getElementById('app-main');
const navUser = document.getElementById('navUser');
const logoutBtn = document.getElementById('logoutBtn');
const rollInput = document.getElementById('rollNumber');

function showApp(auth) {
  if (!auth) {
    loginGate?.classList.remove('hidden');
    appMain?.classList.add('hidden');
    return;
  }
  loginGate?.classList.add('hidden');
  appMain?.classList.remove('hidden');
  updateNavForAuth(auth);
  if (rollInput) {
    rollInput.readOnly = auth.type === 'student';
  }
}

function updateNavForAuth(auth) {
  const adminEls = document.querySelectorAll('.nav-admin');
  adminEls.forEach((el) => {
    el.style.display = auth?.type === 'admin' ? '' : 'none';
  });
  if (auth?.type === 'student') {
    navUser.textContent = `👤 ${auth.name || auth.rollNumber}`;
  } else if (auth?.type === 'admin') {
    navUser.textContent = '🔐 Admin';
  } else {
    navUser.textContent = '';
  }
}

// Login tabs
document.querySelectorAll('.login-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.login-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach((f) => f.classList.remove('active'));
    tab.classList.add('active');
    const form = document.getElementById(tab.dataset.tab + 'LoginForm');
    if (form) form.classList.add('active');
    document.getElementById('studentLoginError')?.classList.add('hidden');
    document.getElementById('adminLoginError')?.classList.add('hidden');
  });
});

// Student login
document.getElementById('studentLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const roll = document.getElementById('studentRoll')?.value?.trim();
  const pass = document.getElementById('studentPassword')?.value?.trim();
  const errEl = document.getElementById('studentLoginError');
  if (!roll || !pass) {
    errEl.textContent = 'Please enter your roll number and password.';
    errEl.classList.remove('hidden');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber: roll, password: pass }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errEl.textContent = data.error || 'Invalid roll number.';
      errEl.classList.remove('hidden');
      return;
    }
    setAuth({ type: 'student', rollNumber: roll, name: data.name });
    showApp(getAuth());
    rollInput.value = roll;
    showPage('search');
    handleSearch();
  } catch (err) {
    errEl.textContent = 'Connection error. Please try again.';
    errEl.classList.remove('hidden');
  }
});

// Admin login
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('adminUser')?.value?.trim();
  const pass = document.getElementById('adminPass')?.value || '';
  const errEl = document.getElementById('adminLoginError');
  if (!user || !pass) {
    errEl.textContent = 'Please enter username and password.';
    errEl.classList.remove('hidden');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errEl.textContent = data.error || 'Invalid credentials.';
      errEl.classList.remove('hidden');
      return;
    }
    setAuth({ type: 'admin' });
    showApp(getAuth());
    showPage('dashboard');
    loadDashboardStats();
  } catch (err) {
    errEl.textContent = 'Connection error. Please try again.';
    errEl.classList.remove('hidden');
  }
});

// Logout
logoutBtn?.addEventListener('click', () => {
  setAuth(null);
  showApp(null);
});

// Check server connection on load
(async function checkServer() {
  try {
    const r = await fetch('/api/students', { method: 'GET' });
    if (!r.ok) throw new Error('Server error');
  } catch {
    const w = document.getElementById('serverWarning');
    if (w) w.classList.remove('hidden');
  }
})();

// Init: show login or app
(function init() {
  const auth = getAuth();
  if (auth) {
    showApp(auth);
    if (auth.type === 'student') {
      rollInput.value = auth.rollNumber;
      showPage('search');
      handleSearch();
    } else {
      loadDashboardStats();
    }
  } else {
    showApp(null);
  }
})();

// Navigation & Pages
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');

function showPage(pageId) {
  if (pageId === 'students' && !isAdmin()) return;
  if (pageId === 'add' && !isAdmin()) return;
  pages.forEach((p) => {
    p.classList.remove('active');
    if (p.classList.contains('nav-admin') && !isAdmin()) p.style.display = 'none';
    else p.style.display = '';
  });
  navLinks.forEach((l) => {
    l.classList.toggle('active', l.dataset.page === pageId);
    if (l.dataset.page === 'students' || l.dataset.page === 'add') {
      if (!isAdmin()) l.style.display = 'none';
    }
  });
  const page = document.getElementById(`page-${pageId}`);
  if (page) {
    page.classList.add('active');
    page.style.display = 'block';
  }
  if (pageId === 'students') loadStudents();
}

document.querySelectorAll('[data-page]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const page = el.dataset.page;
    if (page) showPage(page);
  });
});

// API helpers
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = res.ok ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const err = data?.error || `Request failed (${res.status})`;
    throw new Error(err);
  }
  return data;
}

// Helpers
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getGrade(percentage) {
  if (percentage >= 90) return 'A+ (Distinction)';
  if (percentage >= 80) return 'A (First Class)';
  if (percentage >= 70) return 'B+ (Second Class)';
  if (percentage >= 60) return 'B (Pass)';
  if (percentage >= 50) return 'C (Pass)';
  return 'F (Fail)';
}

function ensureSubjects(student) {
  const subs = student.subjects;
  if (!Array.isArray(subs)) return [];
  return subs.map((s) => ({
    name: s.name || '',
    marks: parseInt(s.marks ?? 0, 10),
    maxMarks: parseInt(s.maxMarks ?? 100, 10),
  }));
}

// ========== Search Page ==========
const searchBtn = document.getElementById('searchBtn');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');

const studentNameEl = document.getElementById('studentName');
const displayRollEl = document.getElementById('displayRoll');
const courseEl = document.getElementById('course');
const semesterEl = document.getElementById('semester');
const marksBodyEl = document.getElementById('marksBody');
const totalMarksEl = document.getElementById('totalMarks');
const maxTotalEl = document.getElementById('maxTotal');
const percentageEl = document.getElementById('percentage');
const gradeEl = document.getElementById('grade');
const errorMessageEl = document.getElementById('errorMessage');

let currentStudent = null;

function displayResult(student) {
  currentStudent = student;
  const subjects = ensureSubjects(student);
  const totalMarks = subjects.reduce((sum, s) => sum + s.marks, 0);
  const maxTotal = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = maxTotal > 0 ? ((totalMarks / maxTotal) * 100).toFixed(1) : 0;

  studentNameEl.textContent = student.name;
  displayRollEl.textContent = student.rollNumber;
  courseEl.textContent = student.course;
  semesterEl.textContent = student.semester;

  marksBodyEl.innerHTML = subjects
    .map((s) => {
      const pct = s.maxMarks > 0 ? ((s.marks / s.maxMarks) * 100).toFixed(1) : 0;
      return `<tr><td>${escapeHtml(s.name)}</td><td>${s.marks}</td><td>${s.maxMarks}</td><td>${pct}%</td></tr>`;
    })
    .join('');

  totalMarksEl.textContent = totalMarks;
  maxTotalEl.textContent = maxTotal;
  percentageEl.textContent = `${percentage}%`;
  gradeEl.textContent = `Grade: ${getGrade(parseFloat(percentage))}`;

  resultSection.classList.remove('hidden');
  errorSection.classList.add('hidden');
}

function displaySearchError(message) {
  errorMessageEl.textContent = message;
  errorSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  currentStudent = null;
}

async function handleSearch() {
  const roll = rollInput.value.trim();
  if (!roll) {
    displaySearchError('Please enter a roll number.');
    return;
  }
  if (isStudent() && getAuth()?.rollNumber !== roll) {
    displaySearchError('You can only view your own results.');
    return;
  }
  try {
    const student = await api(`/students/${encodeURIComponent(roll)}`);
    displayResult(student);
  } catch (err) {
    displaySearchError(err.message || 'Student not found. Please check the roll number.');
  }
}

searchBtn?.addEventListener('click', handleSearch);
rollInput?.addEventListener('keydown', (e) => e.key === 'Enter' && handleSearch());

// Edit/Delete from result
document.getElementById('editResultBtn')?.addEventListener('click', () => {
  if (currentStudent && isAdmin()) {
    showPage('add');
    openEditForm(currentStudent);
  }
});

document.getElementById('deleteResultBtn')?.addEventListener('click', () => {
  if (currentStudent && isAdmin()) openDeleteModal(currentStudent);
});

// ========== Dashboard ==========
const dashboardSearch = document.getElementById('dashboardSearch');
const dashboardSearchBtn = document.getElementById('dashboardSearchBtn');
const dashboardStats = document.getElementById('dashboardStats');

dashboardSearchBtn?.addEventListener('click', () => {
  const roll = dashboardSearch?.value?.trim();
  if (roll) {
    rollInput.value = roll;
    showPage('search');
    handleSearch();
  }
});

dashboardSearch?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') dashboardSearchBtn?.click();
});

async function loadDashboardStats() {
  try {
    const students = await api('/students');
    const sample = students.slice(0, 5).map((s) => s.rollNumber).join(', ');
    dashboardStats.textContent = `${students.length} student(s) enrolled. Try roll numbers: ${sample}`;
  } catch {
    dashboardStats.textContent = 'Start the server with: npm start';
  }
}

// ========== All Students Page ==========
const studentsLoading = document.getElementById('studentsLoading');
const studentsList = document.getElementById('studentsList');

async function loadStudents() {
  if (!isAdmin()) return;
  studentsLoading?.classList.remove('hidden');
  studentsList?.classList.add('hidden');
  try {
    const students = await api('/students');
    studentsLoading?.classList.add('hidden');
    studentsList?.classList.remove('hidden');
    studentsList.innerHTML = students
      .map((s) => {
        const subs = ensureSubjects(s);
        const total = subs.reduce((sum, x) => sum + x.marks, 0);
        const max = subs.reduce((sum, x) => sum + x.maxMarks, 0);
        const pct = max > 0 ? ((total / max) * 100).toFixed(1) : 0;
        return `
          <div class="student-row">
            <div class="student-row-info">
              <strong>${escapeHtml(s.name)}</strong>
              <span class="muted">Roll: ${escapeHtml(s.rollNumber)} • ${escapeHtml(s.course)} • Sem ${escapeHtml(s.semester)}</span>
            </div>
            <div class="student-row-marks">${pct}%</div>
            <div class="student-row-actions">
              <button type="button" class="btn btn-small" data-action="view" data-roll="${escapeHtml(s.rollNumber)}">View</button>
              <button type="button" class="btn btn-small" data-action="edit" data-roll="${escapeHtml(s.rollNumber)}">Edit</button>
              <button type="button" class="btn btn-small btn-danger" data-action="delete" data-roll="${escapeHtml(s.rollNumber)}" data-name="${escapeHtml(s.name)}">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');

    studentsList.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const roll = btn.dataset.roll;
        const name = btn.dataset.name;
        if (action === 'view') {
          rollInput.value = roll;
          showPage('search');
          handleSearch();
        } else if (action === 'edit') {
          const student = await api(`/students/${encodeURIComponent(roll)}`);
          showPage('add');
          openEditForm(student);
        } else if (action === 'delete') {
          openDeleteModal({ rollNumber: roll, name });
        }
      });
    });
  } catch (err) {
    studentsLoading?.classList.add('hidden');
    studentsList?.classList.remove('hidden');
    studentsList.innerHTML = `<div class="error-card"><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// ========== Add/Edit Student Form ==========
const addEditTitle = document.getElementById('addEditTitle');
const addEditSubtitle = document.getElementById('addEditSubtitle');
const studentForm = document.getElementById('studentForm');
const formRoll = document.getElementById('formRoll');
const formName = document.getElementById('formName');
const formCourse = document.getElementById('formCourse');
const formSemester = document.getElementById('formSemester');
const subjectsContainer = document.getElementById('subjectsContainer');
const formCancelBtn = document.getElementById('formCancelBtn');

let editRoll = null;

function renderSubjectsInputs(subjects = []) {
  const list = subjects.length ? subjects : DEFAULT_SUBJECTS.map((name) => ({ name, marks: 0, maxMarks: 100 }));
  subjectsContainer.innerHTML = list
    .map(
      (s, i) => `
    <div class="subject-row">
      <input type="text" class="subject-name" value="${escapeHtml(s.name)}" placeholder="Subject name">
      <input type="number" class="subject-marks" value="${s.marks}" min="0" max="100" placeholder="Marks">
      <input type="number" class="subject-max" value="${s.maxMarks}" min="1" placeholder="Max">
    </div>
  `
    )
    .join('');
}

function getFormData() {
  const rows = subjectsContainer.querySelectorAll('.subject-row');
  const subjects = Array.from(rows)
    .map((row) => {
      const name = row.querySelector('.subject-name')?.value?.trim();
      const marks = parseInt(row.querySelector('.subject-marks')?.value || '0', 10);
      const maxMarks = parseInt(row.querySelector('.subject-max')?.value || '100', 10);
      return name ? { name, marks, maxMarks } : null;
    })
    .filter(Boolean);
  return {
    rollNumber: formRoll.value.trim(),
    name: formName.value.trim(),
    course: formCourse.value.trim(),
    semester: formSemester.value.trim(),
    subjects,
  };
}

function openEditForm(student) {
  editRoll = student.rollNumber;
  addEditTitle.textContent = 'Edit Student';
  addEditSubtitle.textContent = 'Update student details and marks';
  formRoll.value = student.rollNumber;
  formRoll.readOnly = true;
  formName.value = student.name;
  formCourse.value = student.course;
  formSemester.value = student.semester;
  renderSubjectsInputs(ensureSubjects(student));
}

function resetForm() {
  editRoll = null;
  addEditTitle.textContent = 'Add Student';
  addEditSubtitle.textContent = 'Register a new student with subject-wise marks';
  studentForm.reset();
  formRoll.readOnly = false;
  renderSubjectsInputs();
}

formCancelBtn?.addEventListener('click', () => {
  resetForm();
  showPage('dashboard');
});

studentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isAdmin()) return;
  const data = getFormData();
  if (data.subjects.length === 0) {
    alert('Please add at least one subject with marks.');
    return;
  }
  try {
    if (editRoll) {
      await api(`/students/${encodeURIComponent(editRoll)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      alert('Student updated successfully.');
    } else {
      await api('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      alert('Student added successfully.');
    }
    resetForm();
    showPage('dashboard');
    loadDashboardStats();
  } catch (err) {
    alert(err.message || 'Failed to save student.');
  }
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (link.dataset.page === 'add') resetForm();
  });
});

renderSubjectsInputs();

// ========== Delete Modal ==========
const deleteModal = document.getElementById('deleteModal');
const deleteStudentName = document.getElementById('deleteStudentName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let deleteTarget = null;

function openDeleteModal(student) {
  deleteTarget = student;
  deleteStudentName.textContent = student.name || student.rollNumber;
  deleteModal?.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteTarget = null;
  deleteModal?.classList.add('hidden');
}

cancelDeleteBtn?.addEventListener('click', closeDeleteModal);

confirmDeleteBtn?.addEventListener('click', async () => {
  if (!deleteTarget || !isAdmin()) return;
  try {
    await api(`/students/${encodeURIComponent(deleteTarget.rollNumber)}`, { method: 'DELETE' });
    closeDeleteModal();
    if (currentStudent?.rollNumber === deleteTarget.rollNumber) {
      displaySearchError('Student has been deleted.');
    }
    showPage('dashboard');
    loadDashboardStats();
  } catch (err) {
    alert(err.message || 'Failed to delete student.');
  }
});