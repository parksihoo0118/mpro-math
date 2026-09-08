// -----------------------------------------------------------------
// 설정 및 데이터 초기화 (localStorage 기반)
// -----------------------------------------------------------------
const INQUIRY_CONTACT = "학원 데스크(010-1234-5678 또는 mpro@math.com)";

const defaultData = {
  users: [
    { id: "student1", pw: "1234", name: "김학생", phone: "010-1111-2222", role: "student" },
    { id: "teacher1", pw: "1234", name: "박선생", phone: "010-3333-4444", role: "teacher" }
  ],
  classes: [
    { id: "c1", name: "고3 미적분 심화반", studentIds: ["student1"] }
  ],
  exams: [
    {
      id: "e1",
      classId: "c1",
      type: "review",
      title: "1회차 복습테스트",
      questions: [
        { num: 1, type: "mc", points: 20, answer: "1" },
        { num: 2, type: "mc", points: 20, answer: "3" },
        { num: 3, type: "mc", points: 20, answer: "2" },
        { num: 4, type: "mc", points: 20, answer: "4" },
        { num: 5, type: "sa", points: 20, answer: "5" }
      ]
    },
    {
      id: "e2",
      classId: "c1",
      type: "mock",
      title: "9월 평가원 모의고사",
      questions: [
        { num: 1, type: "mc", points: 20, answer: "3" },
        { num: 2, type: "mc", points: 20, answer: "1" },
        { num: 3, type: "mc", points: 20, answer: "4" },
        { num: 4, type: "mc", points: 20, answer: "2" },
        { num: 5, type: "sa", points: 20, answer: "25" }
      ]
    }
  ],
  scores: [
    { studentId: "student1", examId: "e1", score: 80, answers: ["1", "3", "2", "4", "1"], date: "2026-09-01" },
    { studentId: "student1", examId: "e2", score: 100, answers: ["3", "1", "4", "2", "25"], date: "2026-09-05" }
  ],
  memos: [
    { studentId: "student1", date: "2026-09-02", content: "삼각함수 미분법 추가 과제 부여함." }
  ],
  supplements: [
    { studentId: "student1", datetime: "2026-09-12T14:00" }
  ]
};

function getData() {
  const data = localStorage.getItem("mpro_academy_data");
  return data ? JSON.parse(data) : defaultData;
}

function saveData(data) {
  localStorage.setItem("mpro_academy_data", JSON.stringify(data));
}

let currentUser = JSON.parse(localStorage.getItem("mpro_current_user")) || null;
let selectedRole = "student";
let selectedTeacherClassId = null;
let selectedTeacherStudentId = null;

// -----------------------------------------------------------------
// 초기화
// -----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("mpro_academy_data")) {
    saveData(defaultData);
  }

  if (currentUser) {
    showMainApp();
  } else {
    showAuthScreen();
  }
});

// -----------------------------------------------------------------
// 인증 & 로그인
// -----------------------------------------------------------------
function showAuthScreen() {
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
  backToRoleSelect();
}

function showLoginForm(role) {
  selectedRole = role;
  document.getElementById("role-select-view").classList.add("hidden");
  document.getElementById("login-form-view").classList.remove("hidden");
  document.getElementById("login-role-title").innerText = role === "student" ? "학생 로그인" : "선생님 로그인";
}

function backToRoleSelect() {
  document.getElementById("role-select-view").classList.remove("hidden");
  document.getElementById("login-form-view").classList.add("hidden");
  document.getElementById("login-id").value = "";
  document.getElementById("login-pw").value = "";
}

function forgotPasswordInfo() {
  alert(`(${INQUIRY_CONTACT})으로 문의바랍니다.`);
}

function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById("login-id").value.trim();
  const pw = document.getElementById("login-pw").value.trim();

  const data = getData();
  const user = data.users.find(u => u.id === id && u.pw === pw && u.role === selectedRole);

  if (user) {
    currentUser = user;
    localStorage.setItem("mpro_current_user", JSON.stringify(currentUser));
    showMainApp();
  } else {
    alert("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("mpro_current_user");
  showAuthScreen();
}

// -----------------------------------------------------------------
// 메인 앱 제어
// -----------------------------------------------------------------
function showMainApp() {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");

  setupNavbar();

  if (currentUser.role === "student") {
    document.getElementById("student-view").classList.remove("hidden");
    document.getElementById("teacher-view").classList.add("hidden");
    initStudentView();
  } else {
    document.getElementById("teacher-view").classList.remove("hidden");
    document.getElementById("student-view").classList.add("hidden");
    initTeacherView();
  }
}

function setupNavbar() {
  const navMenu = document.getElementById("nav-menu");
  navMenu.innerHTML = "";

  const items = currentUser.role === "student"
    ? [ { id: "class", text: "수업" }, { id: "omr", text: "OMR채점하기" }, { id: "mypage", text: "마이페이지" } ]
    : [ { id: "class", text: "수업" }, { id: "exam-setup", text: "시험지 설정" }, { id: "student", text: "학생" }, { id: "accounts", text: "계정관리" }, { id: "mypage", text: "마이페이지" } ];

  items.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = `nav-item ${idx === 0 ? "active" : ""}`;
    el.innerText = item.text;
    el.onclick = () => switchTab(currentUser.role, item.id, el);
    navMenu.appendChild(el);
  });
}

function switchTab(role, tabId, navEl) {
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  if (navEl) navEl.classList.add("active");

  const viewId = role === "student" ? "student-view" : "teacher-view";
  document.querySelectorAll(`#${viewId} .tab-content`).forEach(tab => tab.classList.add("hidden"));
  document.getElementById(`${role}-tab-${tabId}`).classList.remove("hidden");

  if (tabId === "mypage") loadMyPage();
  if (tabId === "exam-setup") renderExamSetupView();
}

// -----------------------------------------------------------------
// [학생 페이지]
// -----------------------------------------------------------------
function initStudentView() {
  const data = getData();
  const myClasses = data.classes.filter(c => c.studentIds.includes(currentUser.id));
  const selectEl = document.getElementById("student-class-select");
  selectEl.innerHTML = "";

  if (myClasses.length === 0) {
    selectEl.innerHTML = "<option>등록된 반이 없습니다.</option>";
  } else {
    myClasses.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.innerText = c.name;
      selectEl.appendChild(opt);
    });
  }

  renderStudentClassData();
  setupStudentOmrExams();
}

function renderStudentClassData() {
  const data = getData();
  const classId = document.getElementById("student-class-select").value;

  const reviewContainer = document.getElementById("student-review-results");
  const mockContainer = document.getElementById("student-mock-results");
  reviewContainer.innerHTML = "";
  mockContainer.innerHTML = "";

  const classExams = data.exams.filter(e => e.classId === classId);

  classExams.forEach(exam => {
    const scoreRecord = data.scores.find(s => s.studentId === currentUser.id && s.examId === exam.id);
    const scoreText = scoreRecord ? `${scoreRecord.score}점` : "미응시";

    const item = document.createElement("div");
    item.className = "list-item";

    if (exam.type === "review") {
      item.innerHTML = `<span>${exam.title}</span> <strong>${scoreText}</strong>`;
      reviewContainer.appendChild(item);
    } else {
      item.innerHTML = `<span class="${scoreRecord ? 'clickable' : ''}" onclick="${scoreRecord ? `openScoreReport('${exam.id}')` : ''}">${exam.title}</span> <strong>${scoreText}</strong>`;
      mockContainer.appendChild(item);
    }
  });

  if (reviewContainer.innerHTML === "") reviewContainer.innerHTML = "<p class='subtitle'>결과가 없습니다.</p>";
  if (mockContainer.innerHTML === "") mockContainer.innerHTML = "<p class='subtitle'>결과가 없습니다.</p>";

  const suppInfo = document.getElementById("student-supplement-info");
  const supp = data.supplements.find(s => s.studentId === currentUser.id);
  if (supp && supp.datetime) {
    const dt = new Date(supp.datetime);
    suppInfo.innerHTML = `<p><strong>보강 일시:</strong> ${dt.toLocaleString('ko-KR')}</p>`;
  } else {
    suppInfo.innerHTML = "<p>보강이 없습니다.</p>";
  }

  const memoContainer = document.getElementById("student-memos");
  memoContainer.innerHTML = "";
  const myMemos = data.memos.filter(m => m.studentId === currentUser.id);
  if (myMemos.length === 0) {
    memoContainer.innerHTML = "<p class='subtitle'>메모가 없습니다.</p>";
  } else {
    myMemos.forEach(m => {
      const el = document.createElement("div");
      el.className = "list-item";
      el.innerHTML = `<span>${m.content}</span><small style='color:#888;'>${m.date}</small>`;
      memoContainer.appendChild(el);
    });
  }
}

function openSupplementModal() {
  const content = `
    <h3>📅 보강 일정 추가 요청</h3>
    <p style="margin-bottom:10px; font-size:14px; color:#666;">희망하는 날짜와 시간을 선택하세요.</p>
    <input type="datetime-local" id="req-supp-datetime" style="width:100%; padding:8px; margin-bottom:10px;" />
    <button class="btn btn-sm btn-block" onclick="submitSupplementRequest()">요청 제출</button>
  `;
  showModal(content);
}

function submitSupplementRequest() {
  const dt = document.getElementById("req-supp-datetime").value;
  if (!dt) return alert("날짜와 시간을 선택해 주세요.");

  const data = getData();
  const idx = data.supplements.findIndex(s => s.studentId === currentUser.id);
  if (idx > -1) {
    data.supplements[idx].datetime = dt;
  } else {
    data.supplements.push({ studentId: currentUser.id, datetime: dt });
  }
  saveData(data);
  closeModal();
  renderStudentClassData();
  alert("보강 일정이 추가되었습니다.");
}

function openScoreReport(examId) {
  const data = getData();
  const exam = data.exams.find(e => e.id === examId);
  const scoreRecord = data.scores.find(s => s.studentId === currentUser.id && s.examId === examId);

  if (!scoreRecord) return;

  let totalMaxScore = 0;
  let tableRows = exam.questions.map((q, i) => {
    totalMaxScore += (q.points || 0);
    const userAns = scoreRecord.answers[i] || "-";
    const isCorrect = userAns.toString().trim() === q.answer.toString().trim();
    return `
      <tr>
        <td>${i + 1}번 (${q.type === 'mc' ? '객관식' : '단답형'})</td>
        <td>${q.points || 0}점</td>
        <td>${userAns}</td>
        <td>${q.answer}</td>
        <td class="${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'O' : 'X'}</td>
      </tr>
    `;
  }).join("");

  const content = `
    <h2>📄 성적표</h2>
    <p><strong>시험명:</strong> ${exam.title}</p>
    <p><strong>응시 날짜:</strong> ${scoreRecord.date}</p>
    <p><strong>취득 점수:</strong> ${scoreRecord.score}점 / ${totalMaxScore}점</p>
    <div class="table-responsive">
      <table>
        <thead>
          <tr><th>문항</th><th>배점</th><th>제출 답안</th><th>정답</th><th>정오</th></tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
  showModal(content);
}

function setupStudentOmrExams() {
  const data = getData();
  const selectEl = document.getElementById("omr-exam-select");
  selectEl.innerHTML = '<option value="">-- 시험을 선택하세요 --</option>';

  const myClasses = data.classes.filter(c => c.studentIds.includes(currentUser.id)).map(c => c.id);
  const availableExams = data.exams.filter(e => myClasses.includes(e.classId));

  availableExams.forEach(exam => {
    const opt = document.createElement("option");
    opt.value = exam.id;
    opt.innerText = `[${exam.type === 'review' ? '복습' : '모의'}] ${exam.title}`;
    selectEl.appendChild(opt);
  });
}

function loadOmrForm() {
  const examId = document.getElementById("omr-exam-select").value;
  const container = document.getElementById("omr-inputs-container");
  container.innerHTML = "";

  if (!examId) return;

  const data = getData();
  const exam = data.exams.find(e => e.id === examId);

  let html = "<h3 style='margin:15px 0 10px 0;'>답안 작성</h3>";

  exam.questions.forEach((q, idx) => {
    if (q.type === 'mc') {
      html += `
        <div class="omr-question-card">
          <div><strong>${idx + 1}번 (객관식 - ${q.points}점)</strong></div>
          <div class="omr-radio-group">
            ${[1, 2, 3, 4, 5].map(num => `
              <label>
                <input type="radio" name="omr_q_${idx}" value="${num}" />
                <span class="omr-radio-option">${num}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="omr-question-card">
          <div><strong>${idx + 1}번 (단답형 - ${q.points}점)</strong></div>
          <div style="margin-top:8px;">
            <input type="text" class="omr-sa-input" data-idx="${idx}" placeholder="정답 입력" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" />
          </div>
        </div>
      `;
    }
  });

  html += `<button class="btn btn-block" style="margin-top:15px;" onclick="submitOmr('${examId}')">채점하기</button>`;
  container.innerHTML = html;
}

function submitOmr(examId) {
  const data = getData();
  const exam = data.exams.find(e => e.id === examId);

  let userAnswers = [];
  let calculatedScore = 0;

  exam.questions.forEach((q, idx) => {
    let ansVal = "";
    if (q.type === 'mc') {
      const checked = document.querySelector(`input[name="omr_q_${idx}"]:checked`);
      if (checked) ansVal = checked.value;
    } else {
      const saInput = document.querySelector(`.omr-sa-input[data-idx="${idx}"]`);
      if (saInput) ansVal = saInput.value.trim();
    }

    userAnswers.push(ansVal);
    if (ansVal.toString().trim() === q.answer.toString().trim()) {
      calculatedScore += parseInt(q.points || 0);
    }
  });

  const today = new Date().toISOString().split("T")[0];
  const existingIdx = data.scores.findIndex(s => s.studentId === currentUser.id && s.examId === examId);
  const scoreObj = { studentId: currentUser.id, examId, score: calculatedScore, answers: userAnswers, date: today };

  if (existingIdx > -1) {
    data.scores[existingIdx] = scoreObj;
  } else {
    data.scores.push(scoreObj);
  }

  saveData(data);
  renderStudentClassData();
  openScoreReport(examId);
}

// -----------------------------------------------------------------
// [선생님 페이지]
// -----------------------------------------------------------------
function initTeacherView() {
  renderTeacherClassList();
  renderTeacherStudentList();
  renderAccountList();
  renderExamSetupView();
}

// 수업 관리
function renderTeacherClassList() {
  const data = getData();
  const filter = document.getElementById("class-search-input").value.toLowerCase();
  const container = document.getElementById("teacher-class-list");
  container.innerHTML = "";

  data.classes.filter(c => c.name.toLowerCase().includes(filter)).forEach(c => {
    const tag = document.createElement("span");
    tag.className = `tag ${selectedTeacherClassId === c.id ? "active" : ""}`;
    tag.innerText = c.name;
    tag.onclick = () => selectTeacherClass(c.id);
    container.appendChild(tag);
  });
}

function addClass() {
  const name = document.getElementById("new-class-name").value.trim();
  if (!name) return alert("수업 이름을 입력하세요.");

  const data = getData();
  const newClass = { id: "c_" + Date.now(), name, studentIds: [] };
  data.classes.push(newClass);
  saveData(data);

  document.getElementById("new-class-name").value = "";
  renderTeacherClassList();
  renderExamSetupView();
}

function selectTeacherClass(classId) {
  selectedTeacherClassId = classId;
  renderTeacherClassList();

  const data = getData();
  const cls = data.classes.find(c => c.id === classId);
  const detailBox = document.getElementById("teacher-class-detail");
  detailBox.classList.remove("hidden");
  document.getElementById("selected-class-title").innerText = `수업 관리: ${cls.name}`;

  const studentSelect = document.getElementById("add-student-to-class-select");
  studentSelect.innerHTML = "";
  data.users.filter(u => u.role === "student").forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.innerText = `${s.name} (${s.id})`;
    studentSelect.appendChild(opt);
  });

  const chipsContainer = document.getElementById("class-students-list");
  chipsContainer.innerHTML = "";
  cls.studentIds.forEach(sId => {
    const student = data.users.find(u => u.id === sId);
    if (student) {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.innerText = `${student.name} 👤`;
      chip.onclick = () => openStudentDetailFromTeacher(student.id);
      chipsContainer.appendChild(chip);
    }
  });
}

function deleteSelectedClass() {
  if (!confirm("정말 이 수업을 삭제하시겠습니까?")) return;
  const data = getData();
  data.classes = data.classes.filter(c => c.id !== selectedTeacherClassId);
  saveData(data);
  selectedTeacherClassId = null;
  document.getElementById("teacher-class-detail").classList.add("hidden");
  renderTeacherClassList();
  renderExamSetupView();
}

function addStudentToClass() {
  const studentId = document.getElementById("add-student-to-class-select").value;
  if (!studentId || !selectedTeacherClassId) return;

  const data = getData();
  const cls = data.classes.find(c => c.id === selectedTeacherClassId);
  if (!cls.studentIds.includes(studentId)) {
    cls.studentIds.push(studentId);
    saveData(data);
    selectTeacherClass(selectedTeacherClassId);
  }
}

// -----------------------------------------------------------------
// [선생님 - 시험지 설정 (신설 메뉴)]
// -----------------------------------------------------------------
function renderExamSetupView() {
  const data = getData();

  // 1. 수업 선택 옵션 업데이트
  const classSelect = document.getElementById("exam-class-select");
  if (classSelect) {
    classSelect.innerHTML = "";
    data.classes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.innerText = c.name;
      classSelect.appendChild(opt);
    });
  }

  // 2. 등록된 시험지 목록 표출 및 삭제
  const listTable = document.getElementById("exam-list-table");
  if (!listTable) return;

  let html = `
    <table>
      <thead>
        <tr>
          <th>유형</th>
          <th>시험지 이름</th>
          <th>수업</th>
          <th>문항 수</th>
          <th>총점</th>
          <th>관리</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (data.exams.length === 0) {
    html += `<tr><td colspan="6">등록된 시험지가 없습니다.</td></tr>`;
  } else {
    data.exams.forEach(exam => {
      const cls = data.classes.find(c => c.id === exam.classId);
      const totalPoints = exam.questions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);
      html += `
        <tr>
          <td>${exam.type === 'review' ? '복습' : '모의'}</td>
          <td><strong>${exam.title}</strong></td>
          <td>${cls ? cls.name : '미지정'}</td>
          <td>${exam.questions.length}문항</td>
          <td>${totalPoints}점</td>
          <td><button class="btn btn-danger btn-sm" onclick="deleteExam('${exam.id}')">삭제</button></td>
        </tr>
      `;
    });
  }

  html += `</tbody></table>`;
  listTable.innerHTML = html;
}

function deleteExam(examId) {
  if (!confirm("정말 이 시험지를 삭제하시겠습니까? 관련 성적 데이터도 함께 삭제됩니다.")) return;

  const data = getData();
  data.exams = data.exams.filter(e => e.id !== examId);
  data.scores = data.scores.filter(s => s.examId !== examId);

  saveData(data);
  renderExamSetupView();
  alert("시험지가 삭제되었습니다.");
}

function generateQuestionSetupForm() {
  const mcCount = parseInt(document.getElementById("exam-mc-count").value) || 0;
  const saCount = parseInt(document.getElementById("exam-sa-count").value) || 0;
  const container = document.getElementById("question-setup-container");

  if (mcCount + saCount <= 0) return alert("문항 수를 입력해 주세요.");

  let html = "<h4>문항별 세부 설정 (배점 및 정답)</h4><div style='margin:10px 0;'>";

  let qNum = 1;
  // 객관식 문항 생성
  for (let i = 0; i < mcCount; i++) {
    html += `
      <div class="omr-question-card" style="margin-bottom:8px;">
        <div class="form-inline">
          <strong>${qNum}번 (객관식)</strong>
          <label style="font-size:12px;">배점:</label>
          <input type="number" class="q-points" data-qnum="${qNum}" data-type="mc" value="20" style="width:60px;" />
          <label style="font-size:12px;">정답(1~5):</label>
          <input type="number" class="q-answer" data-qnum="${qNum}" min="1" max="5" value="1" style="width:60px;" />
        </div>
      </div>
    `;
    qNum++;
  }

  // 단답형 문항 생성
  for (let i = 0; i < saCount; i++) {
    html += `
      <div class="omr-question-card" style="margin-bottom:8px;">
        <div class="form-inline">
          <strong>${qNum}번 (단답형)</strong>
          <label style="font-size:12px;">배점:</label>
          <input type="number" class="q-points" data-qnum="${qNum}" data-type="sa" value="20" style="width:60px;" />
          <label style="font-size:12px;">정답:</label>
          <input type="text" class="q-answer" data-qnum="${qNum}" placeholder="정답" style="width:100px;" />
        </div>
      </div>
    `;
    qNum++;
  }

  html += "</div><button class='btn btn-block' onclick='saveExamTemplate()'>시험지 저장하기</button>";
  container.innerHTML = html;
}

function saveExamTemplate() {
  const title = document.getElementById("exam-title-input").value.trim();
  const type = document.getElementById("exam-type-select").value;
  const classId = document.getElementById("exam-class-select").value;

  if (!title) return alert("시험 이름을 입력하세요.");
  if (!classId) return alert("수업을 선택하세요.");

  const pointInputs = document.querySelectorAll(".q-points");
  const answerInputs = document.querySelectorAll(".q-answer");

  let questions = [];
  pointInputs.forEach((pInput, idx) => {
    const qNum = pInput.getAttribute("data-qnum");
    const qType = pInput.getAttribute("data-type");
    const points = parseInt(pInput.value) || 0;
    const answer = answerInputs[idx].value.trim();

    questions.push({ num: parseInt(qNum), type: qType, points, answer });
  });

  const data = getData();
  const newExam = {
    id: "e_" + Date.now(),
    classId,
    type,
    title,
    questions
  };

  data.exams.push(newExam);
  saveData(data);

  alert("시험지 양식이 성공적으로 저장되었습니다!");
  document.getElementById("exam-title-input").value = "";
  document.getElementById("question-setup-container").innerHTML = "";
  renderExamSetupView();
  setupStudentOmrExams();
}

// 학생 개별 성적 관리
function renderTeacherStudentList() {
  const data = getData();
  const filter = document.getElementById("student-search-input").value.toLowerCase();
  const container = document.getElementById("teacher-student-list");
  container.innerHTML = "";

  data.users.filter(u => u.role === "student" && u.name.toLowerCase().includes(filter)).forEach(s => {
    const card = document.createElement("div");
    card.className = "student-card";
    card.innerHTML = `<strong>${s.name}</strong><br/><small>${s.phone}</small>`;
    card.onclick = () => openStudentDetailFromTeacher(s.id);
    container.appendChild(card);
  });
}

function openStudentDetailFromTeacher(studentId) {
  selectedTeacherStudentId = studentId;
  const data = getData();
  const student = data.users.find(u => u.id === studentId);

  document.getElementById("teacher-student-detail").classList.remove("hidden");
  document.getElementById("selected-student-title").innerText = `학생 정보: ${student.name} (${student.id})`;

  const scoresContainer = document.getElementById("teacher-student-scores");
  scoresContainer.innerHTML = "";

  data.exams.forEach(exam => {
    const scoreRecord = data.scores.find(s => s.studentId === studentId && s.examId === exam.id);
    const scoreVal = scoreRecord ? scoreRecord.score : "";

    const div = document.createElement("div");
    div.className = "form-inline";
    div.style.marginBottom = "8px";
    div.innerHTML = `
      <span style='width:140px; font-size:13px;'>[${exam.type === 'review' ? '복습' : '모의'}] ${exam.title}:</span>
      <input type="number" id="score-input-${exam.id}" value="${scoreVal}" placeholder="점수" style="width:70px;" />
      <button class="btn btn-sm" onclick="saveTeacherStudentScore('${exam.id}')">저장</button>
    `;
    scoresContainer.appendChild(div);
  });

  const supp = data.supplements.find(s => s.studentId === studentId);
  document.getElementById("teacher-supplement-datetime").value = supp ? supp.datetime : "";
  document.getElementById("current-supplement-display").innerText = supp ? `현재 보강: ${new Date(supp.datetime).toLocaleString('ko-KR')}` : "보강 없음";

  renderTeacherStudentMemos();
}

function closeStudentDetail() {
  document.getElementById("teacher-student-detail").classList.add("hidden");
}

function saveTeacherStudentScore(examId) {
  const scoreVal = document.getElementById(`score-input-${examId}`).value;
  if (scoreVal === "") return;

  const data = getData();
  const idx = data.scores.findIndex(s => s.studentId === selectedTeacherStudentId && s.examId === examId);
  const scoreObj = {
    studentId: selectedTeacherStudentId,
    examId,
    score: parseInt(scoreVal),
    answers: [],
    date: new Date().toISOString().split("T")[0]
  };

  if (idx > -1) {
    data.scores[idx].score = parseInt(scoreVal);
  } else {
    data.scores.push(scoreObj);
  }

  saveData(data);
  alert("성적이 저장되었습니다.");
}

function saveSupplementTime() {
  const dt = document.getElementById("teacher-supplement-datetime").value;
  const data = getData();

  const idx = data.supplements.findIndex(s => s.studentId === selectedTeacherStudentId);
  if (idx > -1) {
    data.supplements[idx].datetime = dt;
  } else {
    data.supplements.push({ studentId: selectedTeacherStudentId, datetime: dt });
  }

  saveData(data);
  alert("보강 시간이 설정되었습니다.");
  openStudentDetailFromTeacher(selectedTeacherStudentId);
}

function addTeacherMemo() {
  const content = document.getElementById("teacher-memo-input").value.trim();
  if (!content) return;

  const data = getData();
  const today = new Date().toISOString().split("T")[0];
  data.memos.push({ studentId: selectedTeacherStudentId, date: today, content });

  saveData(data);
  document.getElementById("teacher-memo-input").value = "";
  renderTeacherStudentMemos();
}

function renderTeacherStudentMemos() {
  const data = getData();
  const container = document.getElementById("teacher-student-memos");
  container.innerHTML = "";

  const memos = data.memos.filter(m => m.studentId === selectedTeacherStudentId);
  memos.forEach(m => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<span>${m.content}</span> <small style='color:#888;'>${m.date}</small>`;
    container.appendChild(div);
  });
}

// 계정 관리
function renderAccountList() {
  const data = getData();
  const container = document.getElementById("account-list-table");

  let html = `<table><thead><tr><th>구분</th><th>아이디</th><th>이름</th><th>전화번호</th><th>관리</th></tr></thead><tbody>`;
  data.users.forEach(u => {
    html += `
      <tr>
        <td>${u.role === 'student' ? '학생' : '선생님'}</td>
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.phone}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteAccount('${u.id}')">삭제</button></td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function handleCreateAccount(e) {
  e.preventDefault();
  const role = document.getElementById("acc-role").value;
  const id = document.getElementById("acc-id").value.trim();
  const pw = document.getElementById("acc-pw").value.trim();
  const name = document.getElementById("acc-name").value.trim();
  const phone = document.getElementById("acc-phone").value.trim();

  const data = getData();
  if (data.users.some(u => u.id === id)) {
    return alert("이미 존재하는 아이디입니다.");
  }

  data.users.push({ id, pw, name, phone, role });
  saveData(data);
  renderAccountList();
  alert("계정이 추가되었습니다.");
  e.target.reset();
}

function deleteAccount(userId) {
  if (userId === currentUser.id) return alert("현재 로그인 중인 계정은 삭제할 수 없습니다.");
  if (!confirm("계정을 삭제하시겠습니까?")) return;

  const data = getData();
  data.users = data.users.filter(u => u.id !== userId);
  saveData(data);
  renderAccountList();
}

// -----------------------------------------------------------------
// 마이페이지
// -----------------------------------------------------------------
function loadMyPage() {
  if (currentUser.role === "student") {
    document.getElementById("mypage-name").value = currentUser.name;
    document.getElementById("mypage-phone").value = currentUser.phone;
    document.getElementById("mypage-pw").value = currentUser.pw;
  } else {
    document.getElementById("teacher-mypage-name").value = currentUser.name;
    document.getElementById("teacher-mypage-phone").value = currentUser.phone;
    document.getElementById("teacher-mypage-pw").value = currentUser.pw;
  }
}

function updateMyPage(e) {
  e.preventDefault();
  const isStudent = currentUser.role === "student";

  const name = document.getElementById(isStudent ? "mypage-name" : "teacher-mypage-name").value.trim();
  const phone = document.getElementById(isStudent ? "mypage-phone" : "teacher-mypage-phone").value.trim();
  const pw = document.getElementById(isStudent ? "mypage-pw" : "teacher-mypage-pw").value.trim();

  const data = getData();
  const userIdx = data.users.findIndex(u => u.id === currentUser.id);

  if (userIdx > -1) {
    data.users[userIdx].name = name;
    data.users[userIdx].phone = phone;
    data.users[userIdx].pw = pw;

    currentUser = data.users[userIdx];
    saveData(data);
    localStorage.setItem("mpro_current_user", JSON.stringify(currentUser));
    alert("내 정보가 수정되었습니다.");
  }
}

// 유틸리티
function showModal(htmlContent) {
  document.getElementById("modal-content").innerHTML = htmlContent;
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.add("hidden");
}
