export type EnrollmentFormValues = {
  studentName: string;
  parentName: string;
  ageClass: string;
  whatsappNumber: string;
  emailAddress: string;
  selectedCourse: string;
  message: string;
};

export type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

export type EnrollmentRecord = EnrollmentFormValues & {
  id: string;
  createdAt: string;
  status: 'New' | 'Contacted' | 'Confirmed';
  verificationStatus?: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
};

export type ContactRecord = ContactFormValues & {
  id: string;
  createdAt: string;
};

export type StudentRecord = {
  id: string;
  fullName: string;
  parentName: string;
  email: string;
  phone: string;
  ageClass: string;
  assignedCourse: string;
  enrollmentId?: string;
  progress: number;
  status: 'Active' | 'Paused' | 'Completed';
  createdAt: string;
};

export type AdminCourseRecord = {
  id: string;
  title: string;
  level: string;
  duration: string;
  instructor: string;
  capacity: number;
  enrolledCount: number;
  status: 'Published' | 'Draft' | 'Archived';
  updatedAt: string;
};

export type ClassScheduleRecord = {
  id: string;
  courseId: string;
  courseTitle: string;
  batchName: string;
  day: string;
  startTime: string;
  endTime: string;
  instructor: string;
  mode: 'Online' | 'Hybrid';
};

export type ResourceRecord = {
  id: string;
  title: string;
  type: 'Worksheet' | 'Project Pack' | 'Recording' | 'Guide';
  courseTitle: string;
  visibility: 'Students' | 'Parents' | 'Internal';
  updatedAt: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  audience: 'All' | 'Students' | 'Parents' | 'Staff';
  channel: 'Email' | 'In-app' | 'WhatsApp';
  status: 'Draft' | 'Scheduled' | 'Sent';
  createdAt: string;
};

export type PlatformSettings = {
  allowPublicEnrollment: boolean;
  requireManualVerification: boolean;
  sendAutoConfirmation: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  updatedAt: string;
};

export type AdminRole = 'Admin' | 'Tutor';

export type AdminAccount = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  createdAt: string;
};

export type AdminSession = {
  isAuthed: boolean;
  name: string;
  email: string;
  role: AdminRole;
  authenticatedAt: string;
};

const ENROLLMENT_KEY = 'scratch-spark-enrollments';
const CONTACT_KEY = 'scratch-spark-contacts';
const ADMIN_KEY = 'scratch-spark-admin-session';
const STUDENTS_KEY = 'scratch-spark-students';
const ADMIN_COURSES_KEY = 'scratch-spark-admin-courses';
const SCHEDULES_KEY = 'scratch-spark-class-schedules';
const RESOURCES_KEY = 'scratch-spark-resources';
const NOTIFICATIONS_KEY = 'scratch-spark-notifications';
const SETTINGS_KEY = 'scratch-spark-platform-settings';

const ADMIN_ACCOUNTS_KEY = 'scratch-spark-admin-accounts';

const LEGACY_DEMO_ACCOUNTS = [
  { email: 'admin@scratchspark.local', password: 'Admin@12345' },
  { email: 'tutor@scratchspark.local', password: 'Tutor@12345' },
  { email: 'admin@scratchspark.com', password: 'scratch123' },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isLegacyDemoAccount(account: AdminAccount) {
  return LEGACY_DEMO_ACCOUNTS.some(
    (demo) => demo.email === normalizeEmail(account.email) && demo.password === account.password,
  );
}

function normalizeAdminAccounts(): AdminAccount[] {
  const existing = safeJsonParse<AdminAccount[]>(localStorage.getItem(ADMIN_ACCOUNTS_KEY), []);
  const usableAccounts = existing
    .filter((account) => account.email && account.password && !isLegacyDemoAccount(account))
    .map((account) => ({
      ...account,
      email: normalizeEmail(account.email),
      createdAt: account.createdAt ?? new Date().toISOString(),
    }));

  if (JSON.stringify(existing) !== JSON.stringify(usableAccounts)) {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(usableAccounts));
  }

  return usableAccounts;
}

export function getAdminAccounts(): AdminAccount[] {
  return normalizeAdminAccounts();
}

export function createAdminAccount(
  account: Omit<AdminAccount, 'createdAt'> & { createdAt?: string },
): { ok: true } | { ok: false; error: string } {
  const list = getAdminAccounts();
  const exists = list.find((a) => normalizeEmail(a.email) === normalizeEmail(account.email));
  if (exists) return { ok: false, error: 'An account with that email already exists.' };
  if (account.password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  const record = { ...account, email: normalizeEmail(account.email), createdAt: account.createdAt ?? new Date().toISOString() };
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify([record, ...list]));
  return { ok: true };
}

export function deleteAdminAccount(email: string): { ok: true } | { ok: false; error: string } {
  const list = getAdminAccounts();
  const remaining = list.filter((a) => normalizeEmail(a.email) !== normalizeEmail(email));
  if (remaining.length === list.length) return { ok: false, error: 'Account not found.' };
  if (remaining.filter((account) => account.role === 'Admin').length === 0) {
    return { ok: false, error: 'At least one Admin account is required.' };
  }
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(remaining));
  return { ok: true };
}

export function updateAdminAccount(account: AdminAccount): { ok: true } | { ok: false; error: string } {
  const list = getAdminAccounts();
  const idx = list.findIndex((a) => normalizeEmail(a.email) === normalizeEmail(account.email));
  if (idx === -1) return { ok: false, error: 'Account not found.' };
  list[idx] = { ...account, email: normalizeEmail(account.email) };
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(list));
  return { ok: true };
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getEnrollments(): EnrollmentRecord[] {
  return safeJsonParse<EnrollmentRecord[]>(localStorage.getItem(ENROLLMENT_KEY), []);
}

export function saveEnrollment(values: EnrollmentFormValues): EnrollmentRecord {
  const record: EnrollmentRecord = {
    ...values,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'New',
    verificationStatus: 'Pending',
    notes: '',
  };
  const items = getEnrollments();
  localStorage.setItem(ENROLLMENT_KEY, JSON.stringify([record, ...items]));
  return record;
}

export function updateEnrollmentStatus(id: string, status: EnrollmentRecord['status']): EnrollmentRecord[] {
  const updated = getEnrollments().map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(updated));
  return updated;
}

export function updateEnrollmentVerification(
  id: string,
  verificationStatus: NonNullable<EnrollmentRecord['verificationStatus']>,
  notes: string,
): EnrollmentRecord[] {
  const updated = getEnrollments().map((item) =>
    item.id === id ? { ...item, verificationStatus, notes } : item,
  );
  localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(updated));
  return updated;
}

export function addStudentFromEnrollment(enrollmentId: string): StudentRecord | null {
  const enrollment = getEnrollments().find((item) => item.id === enrollmentId);
  if (!enrollment) return null;

  const existing = getStudents().find((item) => item.enrollmentId === enrollmentId);
  if (existing) return existing;

  const student: StudentRecord = {
    id: crypto.randomUUID(),
    fullName: enrollment.studentName,
    parentName: enrollment.parentName,
    email: enrollment.emailAddress,
    phone: enrollment.whatsappNumber,
    ageClass: enrollment.ageClass,
    assignedCourse: enrollment.selectedCourse,
    enrollmentId,
    progress: 0,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  const students = getStudents();
  localStorage.setItem(STUDENTS_KEY, JSON.stringify([student, ...students]));
  return student;
}

export function getStudents(): StudentRecord[] {
  return safeJsonParse<StudentRecord[]>(localStorage.getItem(STUDENTS_KEY), []);
}

export function updateStudentStatus(id: string, status: StudentRecord['status']): StudentRecord[] {
  const updated = getStudents().map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
  return updated;
}

export function updateStudentProgress(id: string, progress: number): StudentRecord[] {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const updated = getStudents().map((item) => (item.id === id ? { ...item, progress: safeProgress } : item));
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
  return updated;
}

export function getContacts(): ContactRecord[] {
  return safeJsonParse<ContactRecord[]>(localStorage.getItem(CONTACT_KEY), []);
}

export function saveContact(values: ContactFormValues): ContactRecord {
  const record: ContactRecord = {
    ...values,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const items = getContacts();
  localStorage.setItem(CONTACT_KEY, JSON.stringify([record, ...items]));
  return record;
}

export function setAdminSession(session: AdminSession | { isAuthed: boolean } | boolean) {
  if (typeof session === 'boolean') {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ isAuthed: session }));
    return;
  }
  localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
}

export function isAdminAuthenticated(): boolean {
  const parsed = safeJsonParse<{ isAuthed?: boolean }>(localStorage.getItem(ADMIN_KEY), { isAuthed: false });
  return Boolean(parsed.isAuthed);
}

export function getAdminSession(): AdminSession | null {
  const parsed = safeJsonParse<Partial<AdminSession> | null>(localStorage.getItem(ADMIN_KEY), null);
  if (!parsed || !parsed.isAuthed || !parsed.role || !parsed.email || !parsed.name) {
    return null;
  }
  return {
    isAuthed: true,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    authenticatedAt: parsed.authenticatedAt ?? new Date().toISOString(),
  };
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_KEY);
}

function findAdminAccount(email: string, password: string): AdminAccount | null {
  const cleanEmail = normalizeEmail(email);
  const list = getAdminAccounts();
  return (
    list.find(
      (account) =>
        account.email.trim().toLowerCase() === cleanEmail &&
        account.password === password,
    ) ?? null
  );
}

export function authenticateAdminAccount(values: {
  email: string;
  password: string;
}): { ok: true; session: AdminSession } | { ok: false; error: string } {
  const account = findAdminAccount(values.email, values.password);

  if (!account) {
    return { ok: false, error: 'Email or password is incorrect.' };
  }

  const session: AdminSession = {
    isAuthed: true,
    name: account.name,
    email: account.email,
    role: account.role,
    authenticatedAt: new Date().toISOString(),
  };

  setAdminSession(session);
  return { ok: true, session };
}

const defaultAdminCourses: AdminCourseRecord[] = [
  {
    id: crypto.randomUUID(),
    title: 'Creative Coding for Kids',
    level: 'Beginner',
    duration: '8 weeks',
    instructor: 'Neha Sharma',
    capacity: 30,
    enrolledCount: 18,
    status: 'Published',
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'AI for Kidz',
    level: 'Beginner / Explorer',
    duration: '6 weeks',
    instructor: 'Rohan Gupta',
    capacity: 25,
    enrolledCount: 12,
    status: 'Published',
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Adaptive Learning in Modern Era',
    level: 'Intermediate',
    duration: '10 weeks',
    instructor: 'Sana Verma',
    capacity: 20,
    enrolledCount: 7,
    status: 'Draft',
    updatedAt: new Date().toISOString(),
  },
];

const defaultSchedules: ClassScheduleRecord[] = [
  {
    id: crypto.randomUUID(),
    courseId: 'scratch-creative',
    courseTitle: 'Creative Coding for Kids',
    batchName: 'Batch A',
    day: 'Saturday',
    startTime: '10:00',
    endTime: '11:00',
    instructor: 'Neha Sharma',
    mode: 'Online',
  },
  {
    id: crypto.randomUUID(),
    courseId: 'scratch-ai',
    courseTitle: 'AI for Kidz',
    batchName: 'Batch B',
    day: 'Sunday',
    startTime: '11:30',
    endTime: '12:30',
    instructor: 'Rohan Gupta',
    mode: 'Hybrid',
  },
];

const defaultResources: ResourceRecord[] = [
  {
    id: crypto.randomUUID(),
    title: 'Scratch Sprite Pack Vol.1',
    type: 'Project Pack',
    courseTitle: 'Creative Coding for Kids',
    visibility: 'Students',
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Parent Progress Checklist',
    type: 'Guide',
    courseTitle: 'All Courses',
    visibility: 'Parents',
    updatedAt: new Date().toISOString(),
  },
];

const defaultNotifications: NotificationRecord[] = [
  {
    id: crypto.randomUUID(),
    title: 'New Batch Starts Next Monday',
    audience: 'Parents',
    channel: 'Email',
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Monthly Project Showcase',
    audience: 'All',
    channel: 'In-app',
    status: 'Draft',
    createdAt: new Date().toISOString(),
  },
];

const defaultSettings: PlatformSettings = {
  allowPublicEnrollment: true,
  requireManualVerification: true,
  sendAutoConfirmation: true,
  maintenanceMode: false,
  supportEmail: 'support@scratchspark.com',
  supportPhone: '+91 90000 00000',
  timezone: 'Asia/Kolkata',
  updatedAt: new Date().toISOString(),
};

export function getAdminCourses(): AdminCourseRecord[] {
  const stored = safeJsonParse<AdminCourseRecord[]>(localStorage.getItem(ADMIN_COURSES_KEY), []);
  if (stored.length > 0) return stored;
  localStorage.setItem(ADMIN_COURSES_KEY, JSON.stringify(defaultAdminCourses));
  return defaultAdminCourses;
}

export function updateAdminCourseStatus(id: string, status: AdminCourseRecord['status']): AdminCourseRecord[] {
  const updated = getAdminCourses().map((item) =>
    item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item,
  );
  localStorage.setItem(ADMIN_COURSES_KEY, JSON.stringify(updated));
  return updated;
}

export function getClassSchedules(): ClassScheduleRecord[] {
  const stored = safeJsonParse<ClassScheduleRecord[]>(localStorage.getItem(SCHEDULES_KEY), []);
  if (stored.length > 0) return stored;
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(defaultSchedules));
  return defaultSchedules;
}

export function saveClassSchedule(
  record: Omit<ClassScheduleRecord, 'id'> & { id?: string },
): ClassScheduleRecord[] {
  const schedules = getClassSchedules();
  if (record.id) {
    const updated = schedules.map((item) => (item.id === record.id ? { ...item, ...record } : item));
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(updated));
    return updated;
  }
  const newRecord: ClassScheduleRecord = { ...record, id: crypto.randomUUID() };
  const updated = [newRecord, ...schedules];
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(updated));
  return updated;
}

export function getResources(): ResourceRecord[] {
  const stored = safeJsonParse<ResourceRecord[]>(localStorage.getItem(RESOURCES_KEY), []);
  if (stored.length > 0) return stored;
  localStorage.setItem(RESOURCES_KEY, JSON.stringify(defaultResources));
  return defaultResources;
}

export function getNotifications(): NotificationRecord[] {
  const stored = safeJsonParse<NotificationRecord[]>(localStorage.getItem(NOTIFICATIONS_KEY), []);
  if (stored.length > 0) return stored;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaultNotifications));
  return defaultNotifications;
}

export function updateNotificationStatus(id: string, status: NotificationRecord['status']): NotificationRecord[] {
  const updated = getNotifications().map((item) => (item.id === id ? { ...item, status } : item));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
}

export function getPlatformSettings(): PlatformSettings {
  const stored = safeJsonParse<PlatformSettings | null>(localStorage.getItem(SETTINGS_KEY), null);
  if (stored) return stored;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
}

export function savePlatformSettings(settings: PlatformSettings): PlatformSettings {
  const updated = { ...settings, updatedAt: new Date().toISOString() };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
