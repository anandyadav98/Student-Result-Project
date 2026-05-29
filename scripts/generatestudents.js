/**
 * Generate 250 students with names alphabetically.
 * Rolls: 2401330130001 to 2401330130250
 * Roll 2401330130141 (index 140) must be "Keshav Krishan"
 *
 * All students share the same password: student123
 */

const fs = require('fs');
const path = require('path');

const TOTAL_STUDENTS = 250;
const START_ROLL = 2401330130001;
const COMMON_STUDENT_PASSWORD = 'student123';
const KESHAV_ROLL = 2401330130141;
const KESHAV_INDEX = 140; // START_ROLL is index 0, so 0141 is 140

// Alphabetical name lists around Keshav (we only need stable alphabetical-ish order
// and to guarantee Keshav at the required index).
const NAMES_BEFORE_KESHAV = [
  'Aadi Verma', 'Aarav Sharma', 'Aaradhya Warrier', 'Aarushi Unni', 'Abhay Singh', 'Abhishek Kumar',
  'Abhinav Varma', 'Aditi Patel', 'Aditya Nair', 'Advik Varier', 'Akanksha Lakshmi', 'Akshay Reddy',
  'Alisha Sreekumar', 'Amrita Desai', 'Amitabh Prabhu', 'Ananya Iyer', 'Anchal Raman', 'Anil Joshi',
  'Anirudh Chopra', 'Anjali Gupta', 'Ankit Malhotra', 'Anuradha Nambiar', 'Anuja Krishnan', 'Anvi Patel',
  'Aravind Suresh', 'Archana Menon', 'Arjun Mehta', 'Arun Pillai', 'Arunima Iyer', 'Aryan Unni',
  'Ashish Joshi', 'Ashwin Rao', 'Atharva Gupta', 'Avani Rao', 'Ayaan Varma', 'Ayush Patel',
  'Bharat Shah', 'Bhaskar Trivedi', 'Bhavna Reddy', 'Bhavya Venkat', 'Bhumika Krishnan', 'Biju Gupta',
  'Chaitanya Desai', 'Charul Reddy', 'Chetan Desai', 'Chitra Sundaram', 'Daksh Malhotra', 'Darshana Malhotra',
  'Deepa Menon', 'Deepak Chopra', 'Deepthi Rangan', 'Devika Nambiar', 'Dia Venkat', 'Dinesh Balakrishnan',
  'Divya Gopal', 'Drishti Raman', 'Eesha Trivedi', 'Esha Trivedi', 'Eva Chopra', 'Falguni Sundaram',
  'Farhan Sundaram', 'Ganesh Suresh', 'Garv Gopal', 'Gautam Gopal', 'Gayatri Murali', 'Geeta Lakshmi',
  'Hansika Rangan', 'Harish Prabhu', 'Harsh Nambiar', 'Harshita Rangan', 'Hemant Balakrishnan', 'Hridaan Balakrishnan',
  'Indira Raman', 'Inaya Murali', 'Ishaan Murali', 'Ishana Suresh', 'Ishita Sreekumar', 'Ivaan Subramaniam',
  'Jagdish Varier', 'Jahanvi Subramaniam', 'Jai Menon', 'Janani Subramaniam', 'Jatin Warrier', 'Jayanth Unni',
  'Jiya Warrier', 'Jyoti Varma', 'Kabir Varier', 'Kalyani Warrier', 'Kanika Sreekumar', 'Karan Unni',
  'Karthik Menon', 'Kavitha Nair', 'Kavya Krishnan', 'Kairav Varier', 'Kiara Sreekumar', 'Kriti Varma',
];

const NAMES_AFTER_KESHAV = [
  'Kiran Patel', 'Komal Shah', 'Krishna Iyer', 'Kunal Lakshmi', 'Kush Unni', 'Lakshmi Rao',
  'Laksh Joshi', 'Laisha Varma', 'Laveena Prabhu', 'Madhav Joshi', 'Maanav Lakshmi', 'Mahima Reddy',
  'Manish Kumar', 'Meera Nambiar', 'Mihika Rao', 'Mihir Raman', 'Mira Chopra', 'Mohan Gupta',
  'Myra Prabhu', 'Naina Nambiar', 'Nakul Raman', 'Nalini Suresh', 'Nandini Pillai', 'Navin Suresh',
  'Neha Desai', 'Neil Patel', 'Nikhil Trivedi', 'Nisha Venkat', 'Nishtha Chopra', 'Nitish Malhotra',
  'Ojas Menon', 'Om Nambiar', 'Oorja Krishnan', 'Padma Sundaram', 'Palak Iyer', 'Pari Suresh',
  'Parth Joshi', 'Pooja Gopal', 'Prakash Rangan', 'Pranav Menon', 'Pranay Gupta', 'Prashant Balakrishnan',
  'Preeti Murali', 'Priya Subramaniam', 'Qasim Rao', 'Qiara Iyer', 'Ragini Patel', 'Rahul Krishnan',
  'Rahul Warrier', 'Rajesh Varier', 'Rakhi Sreekumar', 'Ramesh Unni', 'Reema Varma', 'Reyansh Joshi',
  'Rhea Lakshmi', 'Riddhi Gupta', 'Rishika Rao', 'Riya Reddy', 'Rohan Prabhu', 'Roshni Raman',
  'Rudra Desai', 'Rudransh Patel', 'Saanvi Krishnan', 'Sahaj Gupta', 'Sahil Malhotra', 'Saloni Venkat',
  'Samarth Trivedi', 'Samaira Reddy', 'Sanjana Sundaram', 'Sanjay Chopra', 'Sapna Nambiar', 'Sarita Suresh',
  'Sanya Malhotra', 'Shaurya Desai', 'Shalini Menon', 'Shankar Iyer', 'Shivam Gopal', 'Shreya Joshi',
  'Shruti Rangan', 'Siddharth Rao', 'Siddhi Balakrishnan', 'Simran Patel', 'Siya Malhotra', 'Sneha Krishnan',
  'Snehal Murali', 'Soham Venkat', 'Sonal Gupta', 'Sparsh Subramaniam', 'Suresh Reddy', 'Swati Desai',
  'Tanuja Malhotra', 'Tanish Venkat', 'Tanisha Warrier', 'Tarun Venkat', 'Tejas Varier', 'Tisha Trivedi',
  'Uday Trivedi', 'Ujjwal Sundaram', 'Uma Sundaram', 'Uma Trivedi', 'Urvi Sreekumar', 'Vaibhav Unni',
  'Vandana Varma', 'Vansh Gopal', 'Varun Gopal', 'Varun Lakshmi', 'Ved Sundaram', 'Vedika Prabhu',
  'Vidya Rangan', 'Vihaan Rangan', 'Vikram Balakrishnan', 'Vinod Murali', 'Vishal Subramaniam', 'Vivek Raman',
  'Vrinda Chopra', 'Vridhi Balakrishnan', 'Yamini Warrier', 'Yash Varier', 'Yashvi Murali', 'Yuvika Gopal',
  'Yuvraj Nambiar', 'Zain Suresh', 'Zara Sreekumar', 'Zara Subramaniam', 'Zayn Rangan',
];

const KESHAV_NAME = 'Keshav Krishan';

const beforeNeed = KESHAV_INDEX;
const afterNeed = TOTAL_STUDENTS - (KESHAV_INDEX + 1);

function padToLength(list, targetLen, makeName) {
  const out = list.slice();
  while (out.length < targetLen) out.push(makeName(out.length));
  return out;
}

const beforeNames = padToLength(NAMES_BEFORE_KESHAV, beforeNeed, (i) => `Keshav Prepad ${i + 1}`);
const afterNames = padToLength(NAMES_AFTER_KESHAV, afterNeed, (i) => `Lila Postpad ${i + 1}`);

const names = [...beforeNames.slice(0, beforeNeed), KESHAV_NAME, ...afterNames.slice(0, afterNeed)];

if (names.length !== TOTAL_STUDENTS) {
  console.error(`Error: expected ${TOTAL_STUDENTS} names, got ${names.length}`);
  process.exit(1);
}
if (names[KESHAV_INDEX] !== KESHAV_NAME) {
  console.error(`Error: expected index ${KESHAV_INDEX} to be "${KESHAV_NAME}", got "${names[KESHAV_INDEX]}"`);
  process.exit(1);
}

const SUBJECTS = [
  'Data Structures',
  'Database Management',
  'Web Technologies',
  'Operating Systems',
  'Mathematics',
];

function randMarks() {
  // 55 - 89
  return Math.floor(Math.random() * 35) + 55;
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toXML(students) {
  const studentToXml = (st) => {
    const subjectsXml = st.subjects
      .map(
        (s) => `      <subject>
        <name>${escapeXml(s.name)}</name>
        <marks>${s.marks}</marks>
        <maxMarks>${s.maxMarks}</maxMarks>
      </subject>`
      )
      .join('\n');

    return `  <student>
    <rollNumber>${st.rollNumber}</rollNumber>
    <name>${escapeXml(st.name)}</name>
    <password>${st.password}</password>
    <course>${escapeXml(st.course)}</course>
    <semester>${st.semester}</semester>
    <subjects>
${subjectsXml}
    </subjects>
  </student>`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<results>
${students.map(studentToXml).join('\n')}
</results>
`;
}

const students = [];
for (let i = 0; i < TOTAL_STUDENTS; i++) {
  const rollNumber = String(START_ROLL + i).padStart(13, '0');

  const subjects = SUBJECTS.map((name) => ({
    name,
    marks: randMarks(),
    maxMarks: 100,
  }));

  students.push({
    rollNumber,
    name: names[i],
    password: COMMON_STUDENT_PASSWORD,
    course: 'B.Tech Computer Science',
    semester: '3',
    subjects,
  });
}

const keshavStudent = students[KESHAV_INDEX];
if (keshavStudent.rollNumber !== String(KESHAV_ROLL) || keshavStudent.name !== KESHAV_NAME) {
  console.error('Error: Keshav Krishan mapping is incorrect:', keshavStudent);
  process.exit(1);
}

const xml = toXML(students);
const outPath = path.join(__dirname, '..', 'data', 'students.xml');
fs.writeFileSync(outPath, xml, 'utf-8');

console.log(`Generated ${students.length} students. Keshav Krishan at roll 2401330130141 ✓`);
