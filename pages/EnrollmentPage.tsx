import { FormEvent, useMemo, useState } from 'react';
import { courses } from '../data';
import { saveEnrollment, type EnrollmentFormValues } from '../lib/storage';

const initialValues: EnrollmentFormValues = {
  studentName: '',
  parentName: '',
  ageClass: '',
  whatsappNumber: '',
  emailAddress: '',
  selectedCourse: courses[0].title,
  message: '',
};

function EnrollmentPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof EnrollmentFormValues, string>>>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const ageOptions = useMemo(() => ['7-8 years', '9-10 years', '11-12 years', '13+ years'], []);

  const validate = () => {
    const nextErrors: Partial<Record<keyof EnrollmentFormValues, string>> = {};
    if (!values.studentName.trim()) nextErrors.studentName = 'Student name is required.';
    if (!values.parentName.trim()) nextErrors.parentName = 'Parent name is required.';
    if (!values.ageClass.trim()) nextErrors.ageClass = 'Select an age/class range.';
    if (!/^\+?[0-9\s-]{8,}$/.test(values.whatsappNumber)) nextErrors.whatsappNumber = 'Enter a valid WhatsApp number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.emailAddress)) nextErrors.emailAddress = 'Enter a valid email address.';
    if (!values.selectedCourse) nextErrors.selectedCourse = 'Choose a course.';
    return nextErrors;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error');
      return;
    }

    saveEnrollment(values);
    setStatus('success');
    setValues(initialValues);
  };

  return (
    <div className="page enrollment-page">
      <section className="section auth-split enrollment-split">
        <div className="auth-visual">
          <img src="/logo.svg" alt="CodeKidzz logo" className="dashboard-logo-large" />
          <div className="welcome-text">
            <span className="role-pill">ENROLL</span>
            <h2>Welcome to CodeKidzz</h2>
            <p>Register your child to start a guided Scratch learning journey.</p>
          </div>
          <ul className="enrollment-benefits">
            <li>Friendly live classes</li>
            <li>Project-based learning</li>
            <li>Progress badges and certificates</li>
          </ul>
        </div>

        <form className="form-card registration-card" onSubmit={submit} noValidate>
          <span className="eyebrow">ENROLLMENT</span>
          <h1 className="sign-heading">Sign up</h1>
          <p className="form-caption">Fill in the details below and we’ll contact you shortly.</p>

          <div className="form-grid">
            <label>
              Student Name
              <input value={values.studentName} onChange={(e) => setValues({ ...values, studentName: e.target.value })} />
              {errors.studentName && <span className="field-error">{errors.studentName}</span>}
            </label>
            <label>
              Parent Name
              <input value={values.parentName} onChange={(e) => setValues({ ...values, parentName: e.target.value })} />
              {errors.parentName && <span className="field-error">{errors.parentName}</span>}
            </label>
            <label>
              Age/Class
              <select value={values.ageClass} onChange={(e) => setValues({ ...values, ageClass: e.target.value })}>
                <option value="">Select age range</option>
                {ageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.ageClass && <span className="field-error">{errors.ageClass}</span>}
            </label>
            <label>
              WhatsApp Number
              <input
                value={values.whatsappNumber}
                onChange={(e) => setValues({ ...values, whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
              />
              {errors.whatsappNumber && <span className="field-error">{errors.whatsappNumber}</span>}
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={values.emailAddress}
                onChange={(e) => setValues({ ...values, emailAddress: e.target.value })}
                placeholder="parent@example.com"
              />
              {errors.emailAddress && <span className="field-error">{errors.emailAddress}</span>}
            </label>
            <label>
              Selected Course
              <select value={values.selectedCourse} onChange={(e) => setValues({ ...values, selectedCourse: e.target.value })}>
                {courses.map((course) => (
                  <option key={course.title} value={course.title}>
                    {course.title}
                  </option>
                ))}
              </select>
              {errors.selectedCourse && <span className="field-error">{errors.selectedCourse}</span>}
            </label>
          </div>

          <div className="form-actions enrollment-actions">
            <button className="primary-btn" type="submit">Submit Enrollment</button>
          </div>

          <p className={`status-message ${status}`}>{status === 'success' ? 'Enrollment saved successfully.' : status === 'error' ? 'Please review the highlighted fields.' : 'Your enrollment will appear in the admin dashboard.'}</p>
        </form>
      </section>
    </div>
  );
}

export default EnrollmentPage;
