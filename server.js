/**
 * Student Result Management - Express Backend
 * Serves static files and provides REST API for XML-based student data
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'students.xml');

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.static(path.join(__dirname)));

// XML parser/builder config
const parser = new XMLParser({ ignoreAttributes: false });
const builder = new XMLBuilder({ format: true, ignoreAttributes: false });

/**
 * Read and parse XML file
 */
function readXML() {
  const xml = fs.readFileSync(DATA_PATH, 'utf-8');
  return parser.parse(xml);
}

/**
 * Write data back to XML file
 */
function writeXML(data) {
  const xml = builder.build(data);
  fs.writeFileSync(DATA_PATH, '<?xml version="1.0" encoding="UTF-8"?>\n' + xml, 'utf-8');
}

/**
 * Normalize student array (handles single vs multiple students)
 */
function getStudentsArray(data) {
  const students = data?.results?.student;
  if (!students) return [];
  return Array.isArray(students) ? students : [students];
}

/**
 * Normalize student object (handles XML parser casing and subject structure)
 */
function getRoll(s) {
  const raw = s.rollNumber ?? s.rollnumber ?? s.RollNumber ?? '';
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object' && raw['#text']) return String(raw['#text']).trim();
  return String(raw).trim();
}

function normalizeStudent(s) {
  const roll = getRoll(s);
  const subs = s.subjects?.subject;
  let subjectList = [];
  if (Array.isArray(subs)) subjectList = subs;
  else if (subs && typeof subs === 'object') subjectList = [subs];
  const subjects = subjectList.map((sub) => ({
    name: sub.name || '',
    marks: parseInt(sub.marks || '0', 10),
    maxMarks: parseInt(sub.maxMarks || sub.maxmarks || '100', 10),
  }));
  return {
    rollNumber: roll,
    name: s.name || '',
    course: s.course || '',
    semester: s.semester || '',
    password: s.password || '',   
    subjects,
  };
}

/**
 * Convert JSON student to XML structure
 */
function toXMLStudent(student, keepSubjectsIfEmpty = false) {
  const subjects = student.subjects || [];
  const result = {
    rollNumber: student.rollNumber ?? '',
    name: student.name ?? '',
    course: student.course ?? '',
    semester: student.semester ?? '',
  };
  if (subjects.length > 0 || !keepSubjectsIfEmpty) {
    result.subjects = {
      subject: subjects.map((s) => ({
        name: s.name || '',
        marks: s.marks ?? 0,
        maxMarks: s.maxMarks ?? 100,
      })),
    };
  }
  return result;
}

/**
 * Ensure results has student array
 */
function ensureStructure(data) {
  if (!data.results) data.results = {};
  if (!data.results.student) data.results.student = [];
  if (!Array.isArray(data.results.student)) {
    data.results.student = [data.results.student];
  }
  return data;
}

// Admin credentials (in production, use env vars + hashed passwords)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const STUDENT_PASS = 'student123';

// POST /api/auth/student - Student login (roll number + common password)
app.post('/api/auth/student', (req, res) => {
  try {
    const { rollNumber, password } = req.body || {};
    const roll = String(rollNumber || '').trim();
    const pass = String(password || '').trim();

    if (!roll || !pass) {
      return res.status(400).json({ error: 'Roll number and password required' });
    }

    const data = readXML();
    const students = getStudentsArray(data);

    const student = students.find((s) => getRoll(s) === roll);
    if (!student) {
      return res.status(401).json({ error: 'Invalid roll number' });
    }

    if (pass !== STUDENT_PASS) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
      success: true,
      rollNumber: roll,
      name: student.name || '',
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/admin - Admin login
app.post('/api/auth/admin', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/students - Get all students
app.get('/api/students', (req, res) => {
  try {
    const data = readXML();
    const students = getStudentsArray(data).map(normalizeStudent);
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read student data' });
  }
});

// GET /api/students/:roll - Get student by roll number
app.get('/api/students/:roll', (req, res) => {
  try {
    const data = readXML();
    const students = getStudentsArray(data);
    const roll = req.params.roll;
    const student = students.find((s) => getRoll(s) === String(roll).trim());
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(normalizeStudent(student));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read student data' });
  }
});

// POST /api/students - Add new student
app.post('/api/students', (req, res) => {
  try {
    const data = readXML();
    ensureStructure(data);
    const newStudent = toXMLStudent(req.body);

    const students = getStudentsArray(data);
    const exists = students.some(
      (s) => getRoll(s) === String(newStudent.rollNumber).trim()
    );
    if (exists) {
      return res.status(400).json({ error: 'Roll number already exists' });
    }

    data.results.student.push(newStudent);
    writeXML(data);
    res.status(201).json(normalizeStudent(newStudent));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// PUT /api/students/:roll - Update student
app.put('/api/students/:roll', (req, res) => {
  try {
    const data = readXML();
    ensureStructure(data);
    const roll = req.params.roll;
    const updated = req.body;

    const idx = data.results.student.findIndex(
      (s) => getRoll(s) === String(roll).trim()
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const existing = data.results.student[idx];
    const updatedData = toXMLStudent(updated, true);
    const merged = {
      ...existing,
      ...updatedData,
      subjects: updatedData.subjects || existing.subjects,
    };
    data.results.student[idx] = merged;
    writeXML(data);
    res.json(normalizeStudent(merged));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:roll - Delete student
app.delete('/api/students/:roll', (req, res) => {
  try {
    const data = readXML();
    ensureStructure(data);
    const roll = req.params.roll;

    const idx = data.results.student.findIndex(
      (s) => getRoll(s) === String(roll).trim()
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const removed = data.results.student.splice(idx, 1)[0];
    writeXML(data);
    res.json(removed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

app.listen(PORT, () => {
  console.log(`Student Result Management server running at http://localhost:${PORT}`);
});