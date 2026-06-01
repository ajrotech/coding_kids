import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addStudentFromEnrollment,
  AdminRole,
  clearAdminSession,
  authenticateAdminAccount,
  deleteAdminAccount,
  getAdminCourses,
  getAdminAccounts,
  getAdminSession,
  getClassSchedules,
  getContacts,
  getEnrollments,
  getNotifications,
  getPlatformSettings,
  getResources,
  getStudents,
  saveClassSchedule,
  savePlatformSettings,
  createAdminAccount,
  updateAdminCourseStatus,
  updateEnrollmentStatus,
  updateEnrollmentVerification,
  updateNotificationStatus,
  updateStudentProgress,
  updateStudentStatus,
} from '../lib/storage';

type EnrollmentStatus = 'New' | 'Contacted' | 'Confirmed';
type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';
type DashboardTab =
  | 'overview'
  | 'enrollments'
  | 'students'
  | 'courses'
  | 'schedule'
  | 'resources'
  | 'notifications'
  | 'analytics'
  | 'settings';

type AdminAuthState = {
  failedAttempts: number;
  lockUntil: number | null;
};

const AUTH_STATE_KEY = 'scratch-spark-admin-auth-state';

const roleTabPermissions: Record<AdminRole, DashboardTab[]> = {
  Admin: ['overview', 'enrollments', 'students', 'courses', 'schedule', 'resources', 'notifications', 'analytics', 'settings'],
  Tutor: ['overview', 'students', 'analytics'],
};

function getAuthState(): AdminAuthState {
  try {
    const raw = localStorage.getItem(AUTH_STATE_KEY);
    if (!raw) return { failedAttempts: 0, lockUntil: null };
    const parsed = JSON.parse(raw) as AdminAuthState;
    if (parsed.lockUntil !== null && parsed.lockUntil <= Date.now()) {
      const resetState = { failedAttempts: 0, lockUntil: null };
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(resetState));
      return resetState;
    }
    return parsed;
  } catch {
    return { failedAttempts: 0, lockUntil: null };
  }
}

function saveAuthState(state: AdminAuthState) {
  localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [accounts, setAccounts] = useState(getAdminAccounts());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const noAccounts = accounts.length === 0;
  const authState = getAuthState();
  const now = Date.now();
  const isLocked = authState.lockUntil !== null && authState.lockUntil > now;
  const lockMinutes = isLocked && authState.lockUntil ? Math.ceil((authState.lockUntil - now) / 60000) : 0;

  const registerFailedAttempt = (message: string) => {
    const failedAttempts = authState.failedAttempts + 1;
    const nextState: AdminAuthState = {
      failedAttempts,
      lockUntil: failedAttempts >= 5 ? Date.now() + 10 * 60 * 1000 : null,
    };
    saveAuthState(nextState);
    setError(
      failedAttempts >= 5
        ? 'Too many failed attempts. Dashboard is locked for 10 minutes.'
        : `${message} Attempt ${failedAttempts}/5.`,
    );
  };

  const resetAuthAttempts = () => {
    saveAuthState({ failedAttempts: 0, lockUntil: null });
  };

  const unlockForTesting = () => {
    resetAuthAttempts();
    setError('');
    setInfo('Lock cleared. You can try logging in again.');
  };

  const createFirstAdmin = () => {
    setError('');
    setInfo('');
    const accountName = name.trim() || email.trim().split('@')[0] || 'Admin';
    if (!accountName || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required to create the first Admin.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const res = createAdminAccount({ name: accountName, email: email.trim().toLowerCase(), password, role: 'Admin' });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    resetAuthAttempts();
    setAccounts(getAdminAccounts());
    setInfo('Admin account created. You can sign in now.');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (noAccounts) {
      createFirstAdmin();
      return;
    }

    if (isLocked) {
      setError(`Account temporarily locked. Try again in about ${lockMinutes} minute(s).`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required to log in.');
      return;
    }

    const auth = authenticateAdminAccount({ email, password });
    if (!auth.ok) {
      registerFailedAttempt(auth.error);
      return;
    }

    resetAuthAttempts();
    setInfo(`Login successful as ${auth.session.role}.`);
    onLogin();
  };

  return (
    <section className="section auth-split admin-login-wrap">
      <div className="auth-visual">
        <img src="/logo.svg" alt="CodeKidzz logo" className="dashboard-logo-large" />
        <div className="welcome-text">
          <span className="role-pill">EMAIL-BASED STAFF ACCESS</span>
          <h2>Scratch Platform Control Center</h2>
          <p>Sign in directly with your email and password. Admin and Tutor accounts use the same login flow.</p>
        </div>
      </div>

      <form className="form-card" onSubmit={submit}>
        <span className="eyebrow">STAFF LOGIN</span>
        <h1 className="sign-heading">{noAccounts ? 'Create your Admin account' : 'Secure email sign-in'}</h1>
        {noAccounts && (
          <label>
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
        )}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>

        {error && <p className="field-error">{error}</p>}
        {info && <p className="note">{info}</p>}
        {isLocked && (
          <button type="button" className="ghost-btn" onClick={unlockForTesting} style={{ marginBottom: 8 }}>
            Unlock now (for testing)
          </button>
        )}

        <button className="primary-btn" type={noAccounts ? 'button' : 'submit'} disabled={isLocked} onClick={noAccounts ? createFirstAdmin : undefined}>
          {noAccounts ? 'Create Admin Account' : 'Login'}
        </button>

        {!noAccounts && (
          <p className="note" style={{ marginTop: 12 }}>
            Tutor accounts are created by an Admin from Platform Config.
          </p>
        )}

      </form>
    </section>
  );
}

function AdminPage({ isAuthed, onLogout }: { isAuthed: boolean; onLogout: () => void }) {
  const [session, setSession] = useState(getAdminSession());
  const [ready, setReady] = useState(Boolean(isAuthed && getAdminSession()));
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [verificationNote, setVerificationNote] = useState('');

  const [scheduleForm, setScheduleForm] = useState({
    courseTitle: 'Creative Coding for Kids',
    batchName: '',
    day: 'Saturday',
    startTime: '10:00',
    endTime: '11:00',
    instructor: 'Neha Sharma',
    mode: 'Online' as 'Online' | 'Hybrid',
  });

  const [settingsDraft, setSettingsDraft] = useState(getPlatformSettings());
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Tutor' as AdminRole,
  });

  const enrollments = useMemo(() => getEnrollments(), [refreshFlag]);
  const contacts = useMemo(() => getContacts(), [refreshFlag]);
  const students = useMemo(() => getStudents(), [refreshFlag]);
  const adminCourses = useMemo(() => getAdminCourses(), [refreshFlag]);
  const schedules = useMemo(() => getClassSchedules(), [refreshFlag]);
  const resources = useMemo(() => getResources(), [refreshFlag]);
  const notifications = useMemo(() => getNotifications(), [refreshFlag]);
  const adminAccounts = useMemo(() => getAdminAccounts(), [refreshFlag]);

  const selectedEnrollment =
    enrollments.find((item) => item.id === selectedEnrollmentId) ?? enrollments[0] ?? null;
  const selectedStudent = students.find((item) => item.id === selectedStudentId) ?? students[0] ?? null;

  const verificationCounts = useMemo(() => {
    const pending = enrollments.filter((item) => item.verificationStatus !== 'Approved').length;
    const approved = enrollments.filter((item) => item.verificationStatus === 'Approved').length;
    return { pending, approved };
  }, [enrollments]);

  const analytics = useMemo(() => {
    const totalLeads = enrollments.length;
    const confirmed = enrollments.filter((item) => item.status === 'Confirmed').length;
    const conversionRate = totalLeads > 0 ? Math.round((confirmed / totalLeads) * 100) : 0;
    const avgProgress =
      students.length > 0
        ? Math.round(students.reduce((total, student) => total + student.progress, 0) / students.length)
        : 0;
    const activeStudents = students.filter((item) => item.status === 'Active').length;
    return { totalLeads, confirmed, conversionRate, avgProgress, activeStudents };
  }, [enrollments, students]);

  const dashboardStats = [
    { label: 'Enrollments', value: enrollments.length },
    { label: 'Pending Verification', value: verificationCounts.pending },
    { label: 'Students', value: students.length },
    { label: 'Courses', value: adminCourses.length },
    { label: 'Schedules', value: schedules.length },
    { label: 'Notifications', value: notifications.length },
  ];

  const triggerRefresh = () => setRefreshFlag((value) => value + 1);

  const setMessage = (message: string) => {
    setSystemMessage(message);
    window.setTimeout(() => setSystemMessage(''), 2200);
  };

  const handleEnrollmentStatus = (status: EnrollmentStatus) => {
    if (!selectedEnrollment) return;
    updateEnrollmentStatus(selectedEnrollment.id, status);
    setMessage(`Enrollment for ${selectedEnrollment.studentName} updated to ${status}.`);
    triggerRefresh();
  };

  const handleVerification = (verificationStatus: VerificationStatus) => {
    if (!selectedEnrollment) return;
    updateEnrollmentVerification(selectedEnrollment.id, verificationStatus, verificationNote);
    setMessage(`Verification set to ${verificationStatus}.`);
    triggerRefresh();
  };

  const handleCreateStudent = () => {
    if (!selectedEnrollment) return;
    const student = addStudentFromEnrollment(selectedEnrollment.id);
    if (!student) {
      setMessage('No enrollment selected to onboard.');
      return;
    }
    setSelectedStudentId(student.id);
    setMessage(`Student profile created for ${student.fullName}.`);
    triggerRefresh();
  };

  const handleStudentStatus = (status: 'Active' | 'Paused' | 'Completed') => {
    if (!selectedStudent) return;
    updateStudentStatus(selectedStudent.id, status);
    setMessage(`${selectedStudent.fullName} marked as ${status}.`);
    triggerRefresh();
  };

  const handleStudentProgress = (delta: number) => {
    if (!selectedStudent) return;
    updateStudentProgress(selectedStudent.id, selectedStudent.progress + delta);
    triggerRefresh();
  };

  const handleCourseStatus = (id: string, status: 'Published' | 'Draft' | 'Archived') => {
    updateAdminCourseStatus(id, status);
    setMessage(`Course updated to ${status}.`);
    triggerRefresh();
  };

  const submitSchedule = (event: FormEvent) => {
    event.preventDefault();
    if (!scheduleForm.batchName.trim()) {
      setMessage('Batch name is required.');
      return;
    }

    saveClassSchedule({
      courseId: `course-${scheduleForm.courseTitle.toLowerCase().replace(/\s+/g, '-')}`,
      courseTitle: scheduleForm.courseTitle,
      batchName: scheduleForm.batchName,
      day: scheduleForm.day,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      instructor: scheduleForm.instructor,
      mode: scheduleForm.mode,
    });

    setScheduleForm((state) => ({ ...state, batchName: '' }));
    setMessage('Class schedule saved.');
    triggerRefresh();
  };

  const handleNotificationStatus = (id: string, status: 'Draft' | 'Scheduled' | 'Sent') => {
    updateNotificationStatus(id, status);
    setMessage(`Notification moved to ${status}.`);
    triggerRefresh();
  };

  const saveSettings = () => {
    const saved = savePlatformSettings(settingsDraft);
    setSettingsDraft(saved);
    setMessage('Platform settings updated.');
  };

  const createStaffAccount = (event: FormEvent) => {
    event.preventDefault();
    if (!session || session.role !== 'Admin') return;
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password.trim()) {
      setMessage('Name, email, and password are required.');
      return;
    }

    const result = createAdminAccount({
      name: staffForm.name.trim(),
      email: staffForm.email.trim().toLowerCase(),
      password: staffForm.password,
      role: staffForm.role,
    });

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setStaffForm({ name: '', email: '', password: '', role: 'Tutor' });
    setMessage(`${staffForm.role} account created.`);
    triggerRefresh();
  };

  const removeStaffAccount = (email: string) => {
    if (!session || session.role !== 'Admin') return;
    if (email === session.email) {
      setMessage('You cannot delete the account you are currently using.');
      return;
    }
    const result = deleteAdminAccount(email);
    setMessage(result.ok ? 'Staff account deleted.' : result.error);
    triggerRefresh();
  };

  useEffect(() => {
    if (ready && !session) {
      setReady(false);
    }
  }, [ready, session]);

  const allTabs: { key: DashboardTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'enrollments', label: 'Enrollment Verification' },
    { key: 'students', label: 'Student Management' },
    { key: 'courses', label: 'Course Admin' },
    { key: 'schedule', label: 'Class Schedule' },
    { key: 'resources', label: 'Resources' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'settings', label: 'Platform Config' },
  ];

  const allowedTabs: DashboardTab[] = session ? roleTabPermissions[session.role] : ['overview'];

  useEffect(() => {
    if (!allowedTabs.includes(tab)) {
      setTab('overview');
    }
  }, [allowedTabs, tab]);

  const visibleTabs = allTabs.filter((item) => allowedTabs.includes(item.key));

  if (!ready) {
    return (
      <AdminLogin
        onLogin={() => {
          setSession(getAdminSession());
          setReady(true);
        }}
      />
    );
  }

  if (!session) {
    return (
      <AdminLogin
        onLogin={() => {
          setSession(getAdminSession());
          setReady(true);
        }}
      />
    );
  }

  return (
    <div className="page">
      <section className="section page-intro admin-intro enterprise-admin-hero">
        <div className="dashboard-brand">
          <img src="/logo.svg" alt="CodeKidzz logo" className="dashboard-logo" />
        </div>
        <span className="eyebrow">Enterprise Admin Dashboard</span>
        <h1>Scratch Learning Platform Control Center</h1>
        <p className="note">Securely monitor operations, verify admissions, manage learning delivery, and configure platform governance.</p>
        <p className="note">
          Signed in as <strong>{session.name}</strong> ({session.email})
          <span className="role-chip">{session.role}</span>
        </p>
        <div className="admin-actions">
          <button
            className="ghost-btn"
            onClick={() => {
              clearAdminSession();
              onLogout();
              setSession(null);
              setReady(false);
            }}
          >
            Log out
          </button>
        </div>
        {systemMessage && <p className="note">{systemMessage}</p>}
      </section>

      <section className="section stats-grid dashboard-stats enterprise-stats">
        {dashboardStats.map((metric) => (
          <article className="stat-card" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </section>

      <section className="section admin-tabs-wrap">
        <div className="admin-tabs" role="tablist" aria-label="Admin dashboard modules">
          {visibleTabs.map((item) => (
            <button
              key={item.key}
              className={`admin-tab ${tab === item.key ? 'active' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === 'overview' && (
        <section className="section admin-grid enterprise-grid">
          <article className="dashboard-card">
            <h2>Operational Snapshot</h2>
            <ul>
              <li>Total leads: {analytics.totalLeads}</li>
              <li>Confirmed enrollments: {analytics.confirmed}</li>
              <li>Active students: {analytics.activeStudents}</li>
              <li>Avg progress: {analytics.avgProgress}%</li>
            </ul>
          </article>
          <article className="dashboard-card">
            <h2>Access Scope</h2>
            <p><strong>Role:</strong> {session.role}</p>
            <p>Allowed modules: {visibleTabs.map((item) => item.label).join(', ')}</p>
          </article>
          <article className="dashboard-card wide">
            <h2>Recent Contacts</h2>
            <div className="message-list">
              {contacts.slice(0, 4).map((message) => (
                <div key={message.id} className="message-card">
                  <strong>{message.name}</strong>
                  <p>{message.message}</p>
                  <span>{message.email}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === 'enrollments' && (
        <section className="section admin-grid enterprise-grid">
          <article className="dashboard-card">
            <h2>Enrollment Applications</h2>
            <div className="enrollment-review-list">
              {enrollments.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`review-item ${selectedEnrollment?.id === entry.id ? 'active' : ''}`}
                  onClick={() => setSelectedEnrollmentId(entry.id)}
                >
                  <strong>{entry.studentName}</strong>
                  <span>{entry.selectedCourse}</span>
                  <em>{entry.verificationStatus ?? 'Pending'}</em>
                </button>
              ))}
            </div>
          </article>
          <article className="dashboard-card wide">
            <h2>Verification Workbench</h2>
            {selectedEnrollment ? (
              <div className="review-panel">
                <p><strong>Student:</strong> {selectedEnrollment.studentName}</p>
                <p><strong>Parent:</strong> {selectedEnrollment.parentName}</p>
                <p><strong>Course:</strong> {selectedEnrollment.selectedCourse}</p>
                <p><strong>Contact:</strong> {selectedEnrollment.whatsappNumber}</p>
                <p><strong>Email:</strong> {selectedEnrollment.emailAddress}</p>
                <p><strong>Status:</strong> {selectedEnrollment.status}</p>
                <p><strong>Verification:</strong> {selectedEnrollment.verificationStatus ?? 'Pending'}</p>

                <label>
                  Verification notes
                  <textarea
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder="Add verification notes for audit trail"
                    rows={3}
                  />
                </label>

                <div className="review-actions">
                  <button className="ghost-btn" type="button" onClick={() => handleEnrollmentStatus('New')}>Mark New</button>
                  <button className="ghost-btn" type="button" onClick={() => handleEnrollmentStatus('Contacted')}>Mark Contacted</button>
                  <button className="primary-btn" type="button" onClick={() => handleEnrollmentStatus('Confirmed')}>Confirm</button>
                </div>

                <div className="review-actions">
                  <button className="ghost-btn" type="button" onClick={() => handleVerification('Pending')}>Set Pending</button>
                  <button className="primary-btn" type="button" onClick={() => handleVerification('Approved')}>Approve</button>
                  <button className="ghost-btn" type="button" onClick={() => handleVerification('Rejected')}>Reject</button>
                </div>

                <button className="secondary-btn" type="button" onClick={handleCreateStudent}>Create Student Profile</button>
              </div>
            ) : (
              <p className="note">No enrollment applications available.</p>
            )}
          </article>
        </section>
      )}

      {tab === 'students' && (
        <section className="section admin-grid enterprise-grid">
          <article className="dashboard-card">
            <h2>Student Registry</h2>
            <div className="enrollment-review-list">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className={`review-item ${selectedStudent?.id === student.id ? 'active' : ''}`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <strong>{student.fullName}</strong>
                  <span>{student.assignedCourse}</span>
                  <em>{student.status}</em>
                </button>
              ))}
            </div>
          </article>
          <article className="dashboard-card wide">
            <h2>Student Management Console</h2>
            {selectedStudent ? (
              <div className="review-panel">
                <p><strong>Name:</strong> {selectedStudent.fullName}</p>
                <p><strong>Parent:</strong> {selectedStudent.parentName}</p>
                <p><strong>Course:</strong> {selectedStudent.assignedCourse}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Phone:</strong> {selectedStudent.phone}</p>
                <p><strong>Progress:</strong> {selectedStudent.progress}%</p>

                <div className="review-actions">
                  <button className="ghost-btn" type="button" onClick={() => handleStudentProgress(-10)}>-10%</button>
                  <button className="ghost-btn" type="button" onClick={() => handleStudentProgress(10)}>+10%</button>
                  <button className="primary-btn" type="button" onClick={() => handleStudentProgress(25)}>+25%</button>
                </div>

                <div className="review-actions">
                  <button className="ghost-btn" type="button" onClick={() => handleStudentStatus('Active')}>Set Active</button>
                  <button className="ghost-btn" type="button" onClick={() => handleStudentStatus('Paused')}>Set Paused</button>
                  <button className="primary-btn" type="button" onClick={() => handleStudentStatus('Completed')}>Mark Completed</button>
                </div>
              </div>
            ) : (
              <p className="note">No students found. Approve enrollments and create profiles.</p>
            )}
          </article>
        </section>
      )}

      {tab === 'courses' && (
        <section className="section admin-grid enterprise-grid">
          {adminCourses.map((course) => (
            <article className="dashboard-card" key={course.id}>
              <h2>{course.title}</h2>
              <p><strong>Level:</strong> {course.level}</p>
              <p><strong>Duration:</strong> {course.duration}</p>
              <p><strong>Instructor:</strong> {course.instructor}</p>
              <p><strong>Capacity:</strong> {course.enrolledCount} / {course.capacity}</p>
              <p><strong>Status:</strong> {course.status}</p>
              <div className="review-actions">
                <button className="ghost-btn" type="button" onClick={() => handleCourseStatus(course.id, 'Draft')}>Draft</button>
                <button className="primary-btn" type="button" onClick={() => handleCourseStatus(course.id, 'Published')}>Publish</button>
                <button className="ghost-btn" type="button" onClick={() => handleCourseStatus(course.id, 'Archived')}>Archive</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'schedule' && (
        <section className="section admin-grid enterprise-grid">
          <article className="dashboard-card">
            <h2>Create / Update Class Schedule</h2>
            <form className="form-stack" onSubmit={submitSchedule}>
              <label>
                Course
                <input
                  value={scheduleForm.courseTitle}
                  onChange={(e) => setScheduleForm((state) => ({ ...state, courseTitle: e.target.value }))}
                />
              </label>
              <label>
                Batch name
                <input
                  value={scheduleForm.batchName}
                  onChange={(e) => setScheduleForm((state) => ({ ...state, batchName: e.target.value }))}
                  placeholder="Batch C"
                />
              </label>
              <div className="split-layout">
                <label>
                  Day
                  <input
                    value={scheduleForm.day}
                    onChange={(e) => setScheduleForm((state) => ({ ...state, day: e.target.value }))}
                  />
                </label>
                <label>
                  Instructor
                  <input
                    value={scheduleForm.instructor}
                    onChange={(e) => setScheduleForm((state) => ({ ...state, instructor: e.target.value }))}
                  />
                </label>
              </div>
              <div className="split-layout">
                <label>
                  Start time
                  <input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm((state) => ({ ...state, startTime: e.target.value }))}
                  />
                </label>
                <label>
                  End time
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm((state) => ({ ...state, endTime: e.target.value }))}
                  />
                </label>
              </div>
              <label>
                Mode
                <select
                  value={scheduleForm.mode}
                  onChange={(e) =>
                    setScheduleForm((state) => ({ ...state, mode: e.target.value as 'Online' | 'Hybrid' }))
                  }
                >
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </label>
              <button className="primary-btn" type="submit">Save Schedule</button>
            </form>
          </article>
          <article className="dashboard-card wide">
            <h2>Class Timetable</h2>
            <div className="message-list">
              {schedules.map((item) => (
                <div className="message-card" key={item.id}>
                  <strong>{item.courseTitle} — {item.batchName}</strong>
                  <p>{item.day}, {item.startTime} - {item.endTime}</p>
                  <span>{item.instructor} • {item.mode}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === 'resources' && (
        <section className="section admin-grid enterprise-grid">
          {resources.map((item) => (
            <article className="dashboard-card" key={item.id}>
              <h2>{item.title}</h2>
              <p><strong>Type:</strong> {item.type}</p>
              <p><strong>Course:</strong> {item.courseTitle}</p>
              <p><strong>Visibility:</strong> {item.visibility}</p>
              <p className="note">Last updated: {new Date(item.updatedAt).toLocaleString()}</p>
            </article>
          ))}
        </section>
      )}

      {tab === 'notifications' && (
        <section className="section admin-grid enterprise-grid">
          {notifications.map((item) => (
            <article className="dashboard-card" key={item.id}>
              <h2>{item.title}</h2>
              <p><strong>Audience:</strong> {item.audience}</p>
              <p><strong>Channel:</strong> {item.channel}</p>
              <p><strong>Status:</strong> {item.status}</p>
              <div className="review-actions">
                <button className="ghost-btn" type="button" onClick={() => handleNotificationStatus(item.id, 'Draft')}>Draft</button>
                <button className="ghost-btn" type="button" onClick={() => handleNotificationStatus(item.id, 'Scheduled')}>Schedule</button>
                <button className="primary-btn" type="button" onClick={() => handleNotificationStatus(item.id, 'Sent')}>Send</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'analytics' && (
        <section className="section admin-grid enterprise-grid">
          <article className="dashboard-card">
            <h2>Enrollment Funnel</h2>
            <ul>
              <li>Total leads: {analytics.totalLeads}</li>
              <li>Confirmed: {analytics.confirmed}</li>
              <li>Conversion rate: {analytics.conversionRate}%</li>
            </ul>
          </article>
          <article className="dashboard-card">
            <h2>Learner Progress</h2>
            <ul>
              <li>Average progress: {analytics.avgProgress}%</li>
              <li>Active learners: {analytics.activeStudents}</li>
              <li>Completed learners: {students.filter((item) => item.status === 'Completed').length}</li>
            </ul>
          </article>
          <article className="dashboard-card wide">
            <h2>Operational Alerts</h2>
            <ul>
              <li>{verificationCounts.pending} enrollment(s) pending verification</li>
              <li>{notifications.filter((item) => item.status === 'Draft').length} draft notification(s) pending review</li>
              <li>{adminCourses.filter((item) => item.status === 'Draft').length} draft course(s) not published</li>
            </ul>
          </article>
        </section>
      )}

      {tab === 'settings' && (
        <section className="section admin-grid enterprise-grid">
          {session.role === 'Admin' && (
            <article className="dashboard-card wide">
              <h2>Staff Accounts</h2>
              <form className="form-stack" onSubmit={createStaffAccount}>
                <div className="split-layout">
                  <label>
                    Full name
                    <input
                      value={staffForm.name}
                      onChange={(e) => setStaffForm((state) => ({ ...state, name: e.target.value }))}
                      placeholder="Staff name"
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm((state) => ({ ...state, role: e.target.value as AdminRole }))}
                    >
                      <option value="Tutor">Tutor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </label>
                </div>
                <div className="split-layout">
                  <label>
                    Email
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm((state) => ({ ...state, email: e.target.value }))}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label>
                    Temporary password
                    <input
                      type="password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm((state) => ({ ...state, password: e.target.value }))}
                      placeholder="At least 8 characters"
                    />
                  </label>
                </div>
                <button className="primary-btn" type="submit">Create Staff Account</button>
              </form>

              <div className="staff-list">
                {adminAccounts.map((account) => (
                  <div className="staff-row" key={account.email}>
                    <div>
                      <strong>{account.name}</strong>
                      <span>{account.email}</span>
                    </div>
                    <em>{account.role}</em>
                    <button
                      className="ghost-btn"
                      type="button"
                      disabled={account.email === session.email}
                      onClick={() => removeStaffAccount(account.email)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}

          <article className="dashboard-card wide">
            <h2>Platform Configuration</h2>
            <div className="form-stack">
              <label className="switch-line">
                <input
                  type="checkbox"
                  checked={settingsDraft.allowPublicEnrollment}
                  onChange={(e) =>
                    setSettingsDraft((state) => ({ ...state, allowPublicEnrollment: e.target.checked }))
                  }
                />
                <span>Allow public enrollment</span>
              </label>
              <label className="switch-line">
                <input
                  type="checkbox"
                  checked={settingsDraft.requireManualVerification}
                  onChange={(e) =>
                    setSettingsDraft((state) => ({ ...state, requireManualVerification: e.target.checked }))
                  }
                />
                <span>Require manual verification</span>
              </label>
              <label className="switch-line">
                <input
                  type="checkbox"
                  checked={settingsDraft.sendAutoConfirmation}
                  onChange={(e) =>
                    setSettingsDraft((state) => ({ ...state, sendAutoConfirmation: e.target.checked }))
                  }
                />
                <span>Send automated confirmations</span>
              </label>
              <label className="switch-line">
                <input
                  type="checkbox"
                  checked={settingsDraft.maintenanceMode}
                  onChange={(e) =>
                    setSettingsDraft((state) => ({ ...state, maintenanceMode: e.target.checked }))
                  }
                />
                <span>Maintenance mode</span>
              </label>

              <label>
                Support email
                <input
                  value={settingsDraft.supportEmail}
                  onChange={(e) => setSettingsDraft((state) => ({ ...state, supportEmail: e.target.value }))}
                />
              </label>
              <label>
                Support phone
                <input
                  value={settingsDraft.supportPhone}
                  onChange={(e) => setSettingsDraft((state) => ({ ...state, supportPhone: e.target.value }))}
                />
              </label>
              <label>
                Timezone
                <input
                  value={settingsDraft.timezone}
                  onChange={(e) => setSettingsDraft((state) => ({ ...state, timezone: e.target.value }))}
                />
              </label>
              <button className="primary-btn" type="button" onClick={saveSettings}>Save Configuration</button>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export default AdminPage;
