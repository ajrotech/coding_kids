import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { faqs, navItems, socialLinks } from './data';
import { clearAdminSession, isAdminAuthenticated } from './lib/storage';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import ProjectsPage from './pages/ProjectsPage';
import EnrollmentPage from './pages/EnrollmentPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminAuth = isAdminAuthenticated();
  const activeNav = useMemo(() => navItems, []);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <header className="site-header">
        <div className="brand" onClick={() => navigate('/')} role="button" tabIndex={0}>
          <img src="/logo.svg" alt="CodeKidzz logo" className="brand-logo" />
          <div>
            <strong>CodeKidzz</strong>
            <p>Build - Create - Innovate</p>
          </div>
        </div>

        <nav className={`nav ${mobileOpen ? 'open' : ''}`} aria-label="Primary navigation">
          {activeNav.map((item) => (
            <button
              key={item.label}
              className={location.pathname === item.href ? 'nav-link active' : 'nav-link'}
              onClick={() => {
                navigate(item.href);
                setMobileOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button className="primary-btn header-cta" onClick={() => navigate('/enroll')} aria-label="Enroll Now">Enroll Now</button>
          <button
            className="ghost-btn mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="primary-navigation"
            aria-label="Open menu"
          >
            ☰ Menu
          </button>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/enroll" element={<EnrollmentPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage isAuthed={adminAuth} onLogout={clearAdminSession} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.svg" alt="CodeKidzz logo" className="footer-logo" />
          <div>
            <h3>CodeKidzz</h3>
            <p>Creative coding learning for curious kids and confident parents.</p>
          </div>
        </div>
        <div className="footer-links">
          {socialLinks.map((item) => (
            <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              {item.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
