import { FormEvent, useState } from 'react';
import { saveContact, type ContactFormValues } from '../lib/storage';

const initialValues: ContactFormValues = {
  name: '',
  email: '',
  message: '',
};

function ContactPage() {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!values.name || !values.email || !values.message) return;
    saveContact(values);
    setSubmitted(true);
    setValues(initialValues);
  };

  return (
    <div className="page">
      <section className="section page-intro">
        <span className="eyebrow">Contact</span>
        <h1>Talk to the academy team</h1>
        <p>Use the form below, WhatsApp, email, or the map section to reach the team quickly.</p>
      </section>

      <section className="section contact-layout">
        <form className="form-card" onSubmit={submit}>
          <label>
            Contact Name
            <input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
          </label>
          <label>
            Message
            <textarea rows={6} value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} />
          </label>
          <button className="primary-btn" type="submit">Send Message</button>
          {submitted && <p className="status-message success">Message sent successfully.</p>}
        </form>

        <aside className="sidebar-card">
          <h2>Reach us directly</h2>
          <p><strong>WhatsApp:</strong> <a href="https://wa.me/910000000000">Chat on WhatsApp</a></p>
          <p><strong>Email:</strong> hello@scratchsparkacademy.example</p>
          <p><strong>Social:</strong> Instagram, YouTube, and Facebook links are available in the footer.</p>
          <div className="map-frame" aria-label="Google map section">
            <iframe
              title="Google Maps"
              src="https://www.google.com/maps?q=Scratch%20Academy&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

export default ContactPage;
