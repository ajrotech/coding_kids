import { benefits, courses, faqs, projects, stats, testimonials } from '../data';
import { useEffect, useRef, useState } from 'react';

function HomePage() {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => {
    const node = document.getElementById('stats-animated');
    if (!node) return;

    const animate = () => {
      const els = Array.from(node.querySelectorAll<HTMLElement>('.stat-value'));
      els.forEach((el) => {
        const raw = el.dataset.target ?? el.textContent ?? '';
        const match = raw.match(/^(\d+)([^\d]*)$/);
        const targetNum = match ? parseInt(match[1], 10) : parseInt(raw.replace(/\D/g, ''), 10) || 0;
        const suffix = match ? match[2] : raw.replace(/\d/g, '') || '';
        const duration = 1200;
        const start = performance.now();

        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const value = Math.floor(t * targetNum);
          el.textContent = `${value}${suffix}`;
          if (t < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      });
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          setStatsAnimated(true);
          animate();
        }
      });
    }, { threshold: 0.25 });

    io.observe(node);
    return () => io.disconnect();
  }, [statsAnimated]);

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Kids Coding Academy</span>
          <h1>Learn, Create, and Play with <span className="accent">Code</span></h1>
          <p>
            CodeKidzz helps children explore coding, design, and AI through playful lessons and guided projects.
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="/enroll">Enroll Now</a>
            <a className="secondary-btn" href="/projects">See Projects</a>
          </div>
          <div className="stats-grid" ref={null}>
            {stats.map((item, idx) => (
              <article className="stat-card" key={item.label} data-target={item.value}>
                <strong className="stat-value">{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="floating-tag tag-1">Build games</div>
          <div className="floating-tag tag-2">Try AI for Kidz</div>
          <div className="floating-tag tag-3">Design & animate</div>

          <div className="logo-box" role="img" aria-label="CodeKidzz logo">
            <div className="logo-orbit">
              <div className="logo-core">
                <img src="/logo.svg" alt="CodeKidzz" />
              </div>
              <span className="orbit-dot dot-1" aria-hidden></span>
              <span className="orbit-dot dot-2" aria-hidden></span>
              <span className="orbit-dot dot-3" aria-hidden></span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Why families choose us</span>
          <h2>Fun learning with a professional experience</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((item) => (
            <article className="info-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Our Impact</span>
          <h2>Numbers that show progress</h2>
        </div>
        <div className="stats-grid stats-animated" id="stats-animated">
          {stats.map((item) => (
            <article className="stat-card" key={item.label} aria-hidden="false">
              <strong className="stat-value" data-target={item.value}>0</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section split-layout">
        <div>
          <div className="section-heading">
            <span className="eyebrow">Featured courses</span>
            <h2>Structured classes for every level</h2>
          </div>
          <div className="course-list compact">
            {courses.slice(0, 2).map((course) => (
              <article className="course-card" key={course.title}>
                <div className="course-meta">
                  <span>{course.level}</span>
                  <span>{course.duration}</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading">
            <span className="eyebrow">Student projects</span>
            <h2>Playful ideas built by learners</h2>
          </div>
          <div className="project-stack">
            {projects.slice(0, 3).map((project) => (
              <article className="project-mini" key={project.title}>
                <strong>{project.title}</strong>
                <p>{project.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">Testimonials</span>
          <h2>What parents and students say</h2>
        </div>
        <div className="testimonial-slider" role="list">
          {testimonials.map((item) => (
            <blockquote className="quote-card" key={item.name} role="listitem">
              <div className="testimonial-top">
                <div className="testimonial-avatar" aria-hidden>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#fff" />
                    <circle cx="12" cy="9" r="3.2" fill="var(--brand-purple)" />
                    <path d="M6 19c1.5-3 7.5-3 12 0" stroke="var(--brand-dark)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <div className="stars" aria-hidden>
                    <svg width="92" height="16" viewBox="0 0 92 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g fill="var(--brand-yellow)">
                        <path d="M6 0l1.9 4.1L12 5l-3 2.6L10 12 6 9.8 2 12l1-4.4L0 5l4.1-0.9L6 0z" />
                        <path d="M26 0l1.9 4.1L32 5l-3 2.6L30 12 26 9.8 22 12l1-4.4L20 5l4.1-0.9L26 0z" transform="translate(10 0)" />
                        <path d="M46 0l1.9 4.1L52 5l-3 2.6L50 12 46 9.8 42 12l1-4.4L40 5l4.1-0.9L46 0z" transform="translate(20 0)" />
                        <path d="M66 0l1.9 4.1L72 5l-3 2.6L70 12 66 9.8 62 12l1-4.4L60 5l4.1-0.9L66 0z" transform="translate(30 0)" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              <p>“{item.quote}”</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="section pricing-section">
        <div className="section-heading">
          <span className="eyebrow">Pricing</span>
          <h2>Plans for every learner</h2>
        </div>
        <div className="pricing-grid">
          <article className="course-card">
            <div className="plan-head">
              <h3>Starter</h3>
              <span className="course-badge">Best for beginners</span>
            </div>
            <p className="price">$49 / month</p>
            <ul>
              <li>8-week course</li>
              <li>Weekly live classes</li>
              <li>Project feedback</li>
            </ul>
            <a className="primary-btn" href="/enroll">Enroll</a>
          </article>

          <article className="course-card popular">
            <div className="plan-head">
              <h3>Popular</h3>
              <span className="course-badge" style={{ background: 'linear-gradient(90deg, var(--brand-yellow), var(--brand-purple))' }}>Most Popular</span>
            </div>
            <p className="price">$79 / month</p>
            <ul>
              <li>All Starter features</li>
              <li>Additional projects</li>
              <li>Certificate on completion</li>
            </ul>
            <a className="primary-btn" href="/enroll">Get Started</a>
          </article>

          <article className="course-card">
            <div className="plan-head">
              <h3>Pro</h3>
              <span className="course-badge">For clubs</span>
            </div>
            <p className="price">$129 / month</p>
            <ul>
              <li>All Popular features</li>
              <li>1:1 mentoring</li>
              <li>Advanced projects</li>
            </ul>
            <a className="primary-btn" href="/enroll">Enroll Pro</a>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to spark creativity?</h2>
          <p>Book a free trial class and see your child's confidence grow through creative coding.</p>
          <div className="hero-actions">
            <a className="primary-btn large" href="/enroll">Book Free Class</a>
            <a className="secondary-btn large" href="/contact">Talk to us</a>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-heading">
          <span className="eyebrow">FAQ</span>
          <h2>Helpful answers for parents</h2>
        </div>
        <div className="faq-grid">
          {faqs.map((faq) => (
            <details className="faq-card" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
