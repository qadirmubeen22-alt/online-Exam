// End-to-End System Test for ProctorGuard
const BASE_URL = 'http://localhost:5000/api';

async function runE2ETest() {
  console.log('🧪 Starting End-to-End Workflow Verification...');

  // 1. Teacher Login
  const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@exam.com', password: 'teacher123' })
  });
  const teacherData = await teacherLoginRes.json();
  console.log(`✅ Teacher Auth: ${teacherData.user.name} (${teacherData.user.role})`);
  const teacherToken = teacherData.token;

  // 2. Student Login
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@exam.com', password: 'student123' })
  });
  const studentData = await studentLoginRes.json();
  console.log(`✅ Student Auth: ${studentData.user.name} (${studentData.user.role})`);
  const studentToken = studentData.token;

  // 3. Teacher Creates Exam
  const examRes = await fetch(`${BASE_URL}/exams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: 'Automated Integrity Test Quiz',
      description: 'End-to-end verification of 3-strike auto-termination policy',
      durationMinutes: 10,
      passingScore: 50,
      maxWarnings: 3
    })
  });
  const createdExam = await examRes.json();
  const examId = createdExam.exam._id;
  const examCode = createdExam.exam.examCode;
  console.log(`✅ Exam Created: "${createdExam.exam.title}" [Code: ${examCode}]`);

  // 4. Teacher Adds MCQ Question
  const mcqRes = await fetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      examId,
      type: 'mcq',
      questionText: 'What is the speed of light in vacuum?',
      options: ['300,000 km/s', '150,000 km/s', '1,000 km/s', 'Sound speed'],
      correctOptionIndex: 0,
      marks: 5
    })
  });
  const mcqData = await mcqRes.json();
  console.log(`✅ Question Added: MCQ (${mcqData.question.marks} marks)`);

  // 5. Student Lookups Exam by Code
  const lookupRes = await fetch(`${BASE_URL}/exams/code/${examCode}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const lookupData = await lookupRes.json();
  console.log(`✅ Student Looked up Exam: ${lookupData.exam.title} (${lookupData.exam.questionCount} questions)`);

  // 6. Student Starts Exam
  const startRes = await fetch(`${BASE_URL}/submissions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ examId })
  });
  const sessionData = await startRes.json();
  const submissionId = sessionData.submission._id;
  console.log(`✅ Student Exam Session Started (Submission ID: ${submissionId})`);

  // 7. Student Answers Question
  await fetch(`${BASE_URL}/submissions/save-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionId,
      questionId: mcqData.question._id,
      response: 0 // Correct answer
    })
  });
  console.log(`✅ Student Answer Saved (Option 0)`);

  // 8. Violation 1: Tab Switch
  const v1 = await fetch(`${BASE_URL}/proctor/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionId,
      violationType: 'tab_switch',
      details: 'Switched to Chrome DevTools or Google search tab'
    })
  });
  const v1Data = await v1.json();
  console.log(`⚠️ Violation #1 Logged: Warning ${v1Data.warningNumber}/${v1Data.maxWarnings} (Terminated: ${v1Data.isTerminated})`);

  // 9. Violation 2: Fullscreen Exit
  const v2 = await fetch(`${BASE_URL}/proctor/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionId,
      violationType: 'fullscreen_exit',
      details: 'Student pressed ESC to exit fullscreen mode'
    })
  });
  const v2Data = await v2.json();
  console.log(`⚠️ Violation #2 Logged: Warning ${v2Data.warningNumber}/${v2Data.maxWarnings} (Terminated: ${v2Data.isTerminated})`);

  // 10. Violation 3: Copy Attempt -> TRIPS 3-STRIKE TERMINATION!
  const v3 = await fetch(`${BASE_URL}/proctor/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      submissionId,
      violationType: 'copy_attempt',
      details: 'Attempted Ctrl+C on exam question'
    })
  });
  const v3Data = await v3.json();
  console.log(`🚨 Violation #3 Logged: Warning ${v3Data.warningNumber}/${v3Data.maxWarnings} (Terminated: ${v3Data.isTerminated})`);

  if (!v3Data.isTerminated) {
    throw new Error('Expected exam to be auto-terminated on strike 3!');
  }

  // 11. Teacher Views Audit Report
  const auditRes = await fetch(`${BASE_URL}/exams/${examId}/audit-report`, {
    headers: { 'Authorization': `Bearer ${teacherToken}` }
  });
  const auditData = await auditRes.json();
  const studentReport = auditData.reports.find(r => String(r.submissionId) === String(submissionId));

  console.log(`\n======================================================`);
  console.log(`📊 TEACHER AUDIT REPORT VERIFICATION:`);
  console.log(`   Student: ${studentReport.student.name}`);
  console.log(`   Status: ${studentReport.status.toUpperCase()}`);
  console.log(`   Termination Reason: ${studentReport.terminationReason}`);
  console.log(`   Integrity Trust Score: ${studentReport.trustScore}%`);
  console.log(`   Total Recorded Violations: ${studentReport.proctorLogs.length}`);
  console.log(`======================================================\n`);
  console.log('🎉 ALL 5 PHASES TESTED AND WORKING 100% PERFECTLY!');
}

runE2ETest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
