import { projects } from '../data';
import { BalloonPopIcon, MazeGameIcon, CatchBallIcon, QuizGameIcon, AnimationIcon } from '../components/ProjectIcons';

const projectIconComponents: any = {
  'Balloon Pop Game': BalloonPopIcon,
  'Maze Game': MazeGameIcon,
  'Catch the Ball Game': CatchBallIcon,
  'Quiz Game': QuizGameIcon,
  'Animation Projects': AnimationIcon,
};

function ProjectsPage() {
  return (
    <div className="page">
      <section className="section page-intro project-page-intro">
        <span className="eyebrow">Games & Projects</span>
        <h1>Student Projects</h1>
        <p>Explore game projects, interactive stories, and creative animations built by young learners.</p>
      </section>

      <section className="section project-grid">
        {projects.map((project: any) => {
          const IconComponent = projectIconComponents[project.title];

          return (
            <article className="project-card" key={project.title}>
              <div className="project-thumb">
                {IconComponent && (
                  <div className="project-svg-icon">
                    <IconComponent />
                  </div>
                )}
                <span className="project-badge">{project.accent}</span>
              </div>

              <h2>{project.title}</h2>
              <p>{project.description}</p>

              <div className="project-actions">
                <button className="primary-btn small">Open Project</button>
                <button className="secondary-btn small">View Details</button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default ProjectsPage;
