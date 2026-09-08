// -----------------------------------------------------------------
// 설정 및 데이터 초기화 (localStorage 기반)
// -----------------------------------------------------------------
const INQUIRY_CONTACT = "학원 데스크(010-1234-5678 또는 mpro@math.com)";

// 기본 시드 데이터
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
      type: "review", // review 또는 mock
      title: "1회차 복습테스트",
      answers: ["1", "3", "2", "4", "5"]
    },
    {
      id: "e2",
      classId: "c1",
      type: "mock",
      title: "9월 평가원 모의고사",
      answers: ["3", "1", "4", "2", "25"]
    }
  ],
  scores: [
    // { studentId, examId, score, answers, date }
    { studentId: "student1", examId: "e1", score: 80, answers: ["1", "3", "2", "4", "1"], date: "2026-09-01" },
    { studentId: "student1", examId: "e2", score: 100, answers: ["3", "1", "4", "2", "25"], date: "2026-09-05" }
  ],
  memos: [
    // { studentId, date, content }
    { studentId: "student1", date: "2026-09-02", content: "삼각함수 미분법 추가 과제 부여함." }
  ],
  supplements: [
    // { studentId, datetime }
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

// 로그인 세션 상태 유지
let currentUser = JSON.parse(localStorage.getItem("mpro_current_user")) || null;
let selectedRole = "student";
let selectedTeacherClassId = null;
let selectedTeacherStudentId = null;

// -----------------------------------------------------------------
// 초기화 실행
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
// 인증 & 로그인 관동
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
// 메인 앱 화면 제어
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
    : [ { id: "class", text: "수업" }, { id: "student", text: "학생" }, { id: "accounts", text: "계정관리" }, { id: "mypage", text: "마이페이지" } ];

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
}

// -----------------------------------------------------------------
// [학생 페이지] 기능 구현
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

  // 1. 복습테스트 & 모의고사
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

  // 2. 보강 일정
  const suppInfo = document.getElementById("student-supplement-info");
  const supp = data.supplements.find(s => s.studentId === currentUser.id);
  if (supp && supp.datetime) {
    const dt = new Date(supp.datetime);
    suppInfo.innerHTML = `<p><strong>보강 일시:</strong> ${dt.toLocaleString('ko-KR')}</p>`;
  } else {
    suppInfo.innerHTML = "<p>보강이 없습니다.</p>";
  }

  // 3. 기타 사항 (선생님 메모)
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
  alert("보강 일정이 추가/요청되었습니다.");
}

function openScoreReport(examId) {
  const data = getData();
  const exam = data.exams.find(e => e.id === examId);
  const scoreRecord = data.scores.find(s => s.studentId === currentUser.id && s.examId === examId);

  if (!scoreRecord) return;

  let tableRows = exam.answers.map((ans, i) => {
    const userAns = scoreRecord.answers[i] || "-";
    const isCorrect = userAns.toString().trim() === ans.toString().trim();
    return `
      <tr>
        <td>${i + 1}번</td>
        <td>${userAns}</td>
        <td>${ans}</td>
        <td class="${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'O' : 'X'}</td>
      </tr>
    `;
  }).join("");

  const content = `
    <h2>📄 성적표</h2>
    <p><strong>시험명:</strong> ${exam.title}</p>
    <p><strong>응시 날짜:</strong> ${scoreRecord.date}</p>
    <p><strong>총점:</strong> ${scoreRecord.score}점</p>
    <table>
      <thead>
        <tr><th>문항</th><th>제출 답안</th><th>정답</th><th>정오</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
  showModal(content);
}

// OMR 채점
function setupStudentOmrExams() {
  const data = getData();
  const selectEl = document.getElementById("omr-exam-select");
  selectEl.innerHTML = '<option value="">-- 시험을 선택하세요 --</option>';

  data.exams.forEach(exam => {
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

  let inputsHtml = "<h3>정답 입력</h3><div style='display:grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap:10px; margin: 15px 0;'>";

  exam.answers.forEach((_, idx) => {
    inputsHtml += `
      <div>
        <label>${idx + 1}번:</label>
        <input type="text" class="omr-ans-input" data-idx="${idx}" style="width:100%; padding:5px;" />
      </div>
    `;
  });
  inputsHtml += "</div><button class='btn btn-block' onclick='submitOmr(\"" + examId + "\")'>채점하기</button>";
  container.innerHTML = inputsHtml;
}

function submitOmr(examId) {
  const data = getData();
  const exam = data.exams.find(e => e.id === examId);
  const inputs = document.querySelectorAll(".omr-ans-input");
  
  let userAnswers = [];
  let correctCount = 0;

  inputs.forEach((input, idx) => {
    const val = input.value.trim();
    userAnswers.push(val);
    if (val === exam.answers[idx].trim()) {
      correctCount++;
    }
  });

  const calculatedScore = Math.round((correctCount / exam.answers.length) * 100);
  const today = new Date().toISOString().split("T")[0];

  // 기존 점수 업데이트 또는 신규 저장
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
// [선생님 페이지] 기능 구현
// -----------------------------------------------------------------
function initTeacherView() {
  renderTeacherClassList();
  renderTeacherStudentList();
  renderAccountList();
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
}

function selectTeacherClass(classId) {
  selectedTeacherClassId = classId;
  renderTeacherClassList();

  const data = getData();
  const cls = data.classes.find(c => c.id === classId);
  const detailBox = document.getElementById("teacher-class-detail");
  detailBox.classList.remove("hidden");
  document.getElementById("selected-class-title").innerText = `수업 관리: ${cls.name}`;

  // 학생 추가 드롭다운
  const studentSelect = document.getElementById("add-student-to-class-select");
  studentSelect.innerHTML = "";
  data.users.filter(u => u.role === "student").forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.innerText = `${s.name} (${s.id})`;
    studentSelect.appendChild(opt);
  });

  // 등록된 학생 목록
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

function generateAnswerKeyInputs() {
  const objCount = parseInt(document.getElementById("exam-obj-count").value) || 0;
  const subjCount = parseInt(document.getElementById("exam-subj-count").value) || 0;
  const container = document.getElementById("answer-key-setup-container");

  let html = "<h4>정답 세팅</h4><div style='display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:8px; margin: 10px 0;'>";
  
  let total = objCount + subjCount;
  for (let i = 1; i <= total; i++) {
    const typeLabel = i <= objCount ? "객관식" : "단답형";
    html += `
      <div>
        <label style='font-size:12px;'>${i}번(${typeLabel}):</label>
        <input type="text" class="teacher-ans-key" style="width:100%; padding:4px;" />
      </div>
    `;
  }
  html += "</div><button class='btn btn-sm' onclick='saveExamKey()'>시험 및 정답 저장</button>";
  container.innerHTML = html;
}

function saveExamKey() {
  const title = document.getElementById("exam-title-input").value.trim();
  const type = document.getElementById("exam-type-select").value;
  if (!title) return alert("시험 이름을 입력해 주세요.");
  if (!selectedTeacherClassId) return alert("수업을 먼저 선택해 주세요.");

  const keyInputs = document.querySelectorAll(".teacher-ans-key");
  let answers = [];
  keyInputs.forEach(input => answers.push(input.value.trim()));

  const data = getData();
  const newExam = {
    id: "e_" + Date.now(),
    classId: selectedTeacherClassId,
    type,
    title,
    answers
  };

  data.exams.push(newExam);
  saveData(data);
  alert("시험이 저장되었습니다.");
  document.getElementById("answer-key-setup-container").innerHTML = "";
  document.getElementById("exam-title-input").value = "";
  setupStudentOmrExams();
}

// 학생 개별 관리
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

  // 탭 전환 효과 (선생님 화면 상의 학생 개별페이지)
  document.getElementById("teacher-student-detail").classList.remove("hidden");
  document.getElementById("selected-student-title").innerText = `학생 정보: ${student.name} (${student.id})`;

  // 성적 표출 및 개별 수정 기능
  const scoresContainer = document.getElementById("teacher-student-scores");
  scoresContainer.innerHTML = "";

  data.exams.forEach(exam => {
    const scoreRecord = data.scores.find(s => s.studentId === studentId && s.examId === exam.id);
    const scoreVal = scoreRecord ? scoreRecord.score : "";

    const div = document.createElement("div");
    div.className = "form-inline";
    div.style.marginBottom = "8px";
    div.innerHTML = `
      <span style='width:150px;'>[${exam.type === 'review' ? '복습' : '모의'}] ${exam.title}:</span>
      <input type="number" id="score-input-${exam.id}" value="${scoreVal}" placeholder="점수" style="width:80px;" />
      <button class="btn btn-sm" onclick="saveTeacherStudentScore('${exam.id}')">저장</button>
    `;
    scoresContainer.appendChild(div);
  });

  // 보강 시간
  const supp = data.supplements.find(s => s.studentId === studentId);
  document.getElementById("teacher-supplement-datetime").value = supp ? supp.datetime : "";
  document.getElementById("current-supplement-display").innerText = supp ? `현재 보강: ${new Date(supp.datetime).toLocaleString('ko-KR')}` : "보강 없음";

  // 메모 목록
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
    div.innerHTML = `<span>${m.content}</span> <small>${m.date}</small>`;
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
// 마이페이지 공통
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
    alert("내 정보가 성공적으로 수정되었습니다.");
  }
}

// -----------------------------------------------------------------
// 유틸리티 (모달)
// -----------------------------------------------------------------
function showModal(htmlContent) {
  document.getElementById("modal-content").innerHTML = htmlContent;
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.add("hidden");
}