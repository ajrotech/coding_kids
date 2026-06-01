import { courses } from '../data';
import { CreativeCodingIcon, AIIcon, AdaptiveLearningIcon, DesignIcon } from '../components/CourseIcons';

const courseIconComponents: any = {
  'Creative Coding for Kids': CreativeCodingIcon,
  'AI for Kidz': AIIcon,
  'Adaptive Learning in Modern Era': AdaptiveLearningIcon,
  'Creative Designing for Kids': DesignIcon,
};

function CoursesPage() {
  return (
    <div className="page">
      <section className="section page-intro">
        <span className="eyebrow">Courses</span>
        <h1>Fun classes for curious kids 🎓</h1>
        <p>Each course is packed with playful lessons, guided practice, and creative challenges that spark confidence and creativity.</p>
      </section>

      <section className="section course-list">
        {courses.map((course: any) => {
          const IconComponent = courseIconComponents[course.title];
          return (
            <article className="course-card" key={course.title}>
              {IconComponent && (
                <div className="course-svg-icon">
                  <IconComponent />
                </div>
              )}
              <div className="course-meta">
                <span className="course-level">{course.level}</span>
                <span className="course-duration">⏱️ {course.duration}</span>
              </div>
              <h2>{course.title}</h2>
              <p>{course.description}</p>
              <ul className="skills-list">
                {course.skills.map((skill: string) => (
                  <li key={skill}>✨ {skill}</li>
                ))}
              </ul>
              <a className="primary-btn small" href="/enroll">Enroll Now →</a>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default CoursesPage;
