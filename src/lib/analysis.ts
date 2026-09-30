import type { JobRole } from '@/lib/supabase';

// Normalize a skill name for comparison: lowercase, trim, remove common suffixes
function normalize(skill: string): string {
  return skill.toLowerCase().trim().replace(/\s*\([^)]*\)/g, '').trim();
}

// Known skill aliases — maps common variations to canonical names
const SKILL_ALIASES: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'postgre': 'postgresql',
  'postgres': 'postgresql',
  'py': 'python',
  'c++': 'cpp',
  'go': 'golang',
  'k8s': 'kubernetes',
  'tf': 'terraform',
  'rest api': 'rest apis',
  'rest': 'rest apis',
  'api': 'rest apis',
  'ui': 'user interface design',
  'ux': 'user experience design',
};

function canonicalize(skill: string): string {
  const norm = normalize(skill);
  return SKILL_ALIASES[norm] ?? norm;
}

// Check if two skill names are a partial match (one contains the other, or share a root word)
function isPartialMatch(a: string, b: string): boolean {
  const na = canonicalize(a);
  const nb = canonicalize(b);
  if (na === nb) return false; // exact match handled elsewhere
  // One is a substring of the other (e.g., "Data Visualization" contains "Visualization")
  if (na.includes(nb) || nb.includes(na)) return true;
  // Share a significant word (4+ chars)
  const wordsA = na.split(/[\s\-_/.]+/).filter((w) => w.length >= 4);
  const wordsB = nb.split(/[\s\-_/.]+/).filter((w) => w.length >= 4);
  return wordsA.some((w) => wordsB.includes(w));
}

export type AnalysisResult = {
  matched: string[];
  partial: string[];
  missing: string[];
  atsScore: number;
  suggestions: string[];
};

export function analyzeSkills(userSkills: string[], role: JobRole): AnalysisResult {
  const userCanonical = userSkills.map(canonicalize);
  const requiredCanonical = role.required_skills.map(canonicalize);

  const matched: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];

  role.required_skills.forEach((reqSkill, i) => {
    const reqCanon = requiredCanonical[i];
    if (userCanonical.includes(reqCanon)) {
      matched.push(reqSkill);
    } else {
      // Check for partial matches
      const partialFound = userSkills.some((userSkill) => {
        const uCanon = canonicalize(userSkill);
        return uCanon !== reqCanon && isPartialMatch(userSkill, reqSkill);
      });
      if (partialFound) {
        partial.push(reqSkill);
      } else {
        missing.push(reqSkill);
      }
    }
  });

  const total = role.required_skills.length || 1;
  const score = Math.round((matched.length / total) * 100);

  // ATS scoring: weighted combination of skill match, keyword density, and section completeness
  const atsScore = Math.min(100, Math.round((matched.length * 0.7 + partial.length * 0.3) / total * 100));

  const suggestions: string[] = [];
  if (missing.length > 0) {
    suggestions.push(`Add these key skills to your resume: ${missing.slice(0, 5).join(', ')}`);
  }
  if (partial.length > 0) {
    suggestions.push(`Strengthen these partially matched skills: ${partial.slice(0, 3).join(', ')}`);
  }
  if (userSkills.length < 5) {
    suggestions.push('List more skills — aim for at least 8-10 relevant technical skills');
  }
  if (matched.length === 0) {
    suggestions.push('Your resume has no matching skills for this role. Consider updating your skill list.');
  }
  if (atsScore >= 80) {
    suggestions.push('Excellent match! Your profile aligns well with this role.');
  }
  if (suggestions.length === 0) {
    suggestions.push('Your profile is well-aligned with this role. Keep refining your resume for even better results.');
  }

  return { matched, partial, missing, atsScore, suggestions };
}

export type RoadmapStepData = {
  id: string;
  skill: string;
  description: string;
  resource_name: string;
  resource_url: string;
  duration_weeks: number;
  completed: boolean;
};

// Curated learning resources for common skills
const LEARNING_RESOURCES: Record<string, { name: string; url: string; weeks: number; desc: string }> = {
  'python': { name: 'Python for Beginners - freeCodeCamp', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', weeks: 4, desc: 'Learn Python fundamentals: variables, loops, functions, OOP, and data structures.' },
  'javascript': { name: 'JavaScript Algorithms - freeCodeCamp', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', weeks: 5, desc: 'Master JavaScript basics, ES6 features, and core data structures.' },
  'react': { name: 'React Official Tutorial', url: 'https://react.dev/learn', weeks: 4, desc: 'Build interactive UIs with components, hooks, and state management.' },
  'typescript': { name: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', weeks: 2, desc: 'Add static typing to JavaScript for safer, more maintainable code.' },
  'node.js': { name: 'Node.js Official Docs', url: 'https://nodejs.org/en/docs/guides', weeks: 3, desc: 'Server-side JavaScript: modules, file system, HTTP, and Express basics.' },
  'sql': { name: 'SQLBolt Interactive Course', url: 'https://sqlbolt.com/', weeks: 2, desc: 'Learn SQL queries: SELECT, JOIN, GROUP BY, subqueries, and aggregation.' },
  'postgresql': { name: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', weeks: 2, desc: 'Deep dive into PostgreSQL: tables, indexes, functions, and performance.' },
  'java': { name: 'Java Programming - freeCodeCamp', url: 'https://www.freecodecamp.org/news/learn-java-full-course/', weeks: 5, desc: 'Java syntax, OOP, collections, exception handling, and basic concurrency.' },
  'git': { name: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2', weeks: 1, desc: 'Version control essentials: commits, branches, merging, and pull requests.' },
  'docker': { name: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', weeks: 2, desc: 'Containerize applications with Docker: images, containers, and compose.' },
  'machine learning': { name: 'Machine Learning - Andrew Ng (Coursera)', url: 'https://www.coursera.org/specializations/machine-learning-introduction', weeks: 8, desc: 'Foundations of ML: regression, classification, neural networks, and model evaluation.' },
  'data structures': { name: 'Data Structures - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/data-structures/', weeks: 4, desc: 'Arrays, linked lists, trees, graphs, hash maps, and complexity analysis.' },
  'algorithms': { name: 'Algorithms - Khan Academy', url: 'https://www.khanacademy.org/computing/computer-science/algorithms', weeks: 4, desc: 'Sorting, searching, dynamic programming, and algorithm design techniques.' },
  'html': { name: 'HTML Tutorial - W3Schools', url: 'https://www.w3schools.com/html/', weeks: 1, desc: 'Semantic HTML structure, forms, accessibility, and best practices.' },
  'css': { name: 'CSS Tricks - Consume CSS', url: 'https://web.dev/learn/css/', weeks: 2, desc: 'Layouts with Flexbox and Grid, responsive design, and CSS animations.' },
  'tailwind css': { name: 'Tailwind CSS Documentation', url: 'https://tailwindcss.com/docs/installation', weeks: 1, desc: 'Utility-first CSS framework for rapid UI development.' },
  'tableau': { name: 'Tableau Public Training', url: 'https://www.tableau.com/learn/training', weeks: 2, desc: 'Create interactive dashboards and data visualizations with Tableau.' },
  'power bi': { name: 'Power BI Learning Path', url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi', weeks: 2, desc: 'Build reports and dashboards with Power BI Desktop and Service.' },
  'statistics': { name: 'Statistics and Probability - Khan Academy', url: 'https://www.khanacademy.org/math/statistics-probability', weeks: 4, desc: 'Descriptive stats, probability distributions, hypothesis testing, and regression.' },
  'pandas': { name: 'Pandas Tutorials - Real Python', url: 'https://realpython.com/learning-paths/pandas-data-science/', weeks: 2, desc: 'Data manipulation with Pandas: DataFrames, indexing, cleaning, and aggregation.' },
  'numpy': { name: 'NumPy Quickstart', url: 'https://numpy.org/doc/stable/user/quickstart.html', weeks: 1, desc: 'Numerical computing with arrays, vectorized operations, and linear algebra.' },
  'scikit-learn': { name: 'Scikit-learn Tutorials', url: 'https://scikit-learn.org/stable/tutorial/index.html', weeks: 3, desc: 'ML with scikit-learn: preprocessing, models, pipelines, and evaluation.' },
  'tensorflow': { name: 'TensorFlow Tutorials', url: 'https://www.tensorflow.org/tutorials', weeks: 4, desc: 'Deep learning with TensorFlow: tensors, layers, training, and deployment.' },
  'linux': { name: 'Linux Journey', url: 'https://linuxjourney.com/', weeks: 2, desc: 'Command line, file permissions, processes, and shell scripting.' },
  'kubernetes': { name: 'Kubernetes Basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', weeks: 3, desc: 'Orchestrate containers: pods, deployments, services, and scaling.' },
  'aws': { name: 'AWS Cloud Practitioner Essentials', url: 'https://aws.amazon.com/training/learn-about/cloud-practitioner/', weeks: 3, desc: 'Cloud fundamentals: EC2, S3, RDS, IAM, and AWS service overview.' },
  'ci/cd': { name: 'CI/CD with GitHub Actions', url: 'https://docs.github.com/en/actions/learn-github-actions', weeks: 2, desc: 'Automate build, test, and deployment pipelines with GitHub Actions.' },
  'terraform': { name: 'Terraform Getting Started', url: 'https://developer.hashicorp.com/terraform/tutorials', weeks: 2, desc: 'Infrastructure as code: provision cloud resources with Terraform.' },
  'responsive design': { name: 'Responsive Web Design - freeCodeCamp', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', weeks: 2, desc: 'Build websites that adapt to mobile, tablet, and desktop screens.' },
  'rest apis': { name: 'REST API Tutorial', url: 'https://restfulapi.net/', weeks: 2, desc: 'Design and consume RESTful APIs: HTTP methods, status codes, and authentication.' },
  'redux': { name: 'Redux Fundamentals', url: 'https://redux.js.org/tutorials/fundamentals/part-1-overview', weeks: 2, desc: 'State management with Redux: actions, reducers, store, and middleware.' },
  'data visualization': { name: 'Data Visualization - Kaggle', url: 'https://www.kaggle.com/learn/data-visualization', weeks: 2, desc: 'Create meaningful charts and graphs to communicate data insights.' },
  'data cleaning': { name: 'Data Cleaning - Kaggle', url: 'https://www.kaggle.com/learn/data-cleaning', weeks: 1, desc: 'Handle missing values, outliers, duplicates, and data type issues.' },
  'excel': { name: 'Excel Skills for Business - Coursera', url: 'https://www.coursera.org/learn/excel-skills-for-business-essentials', weeks: 2, desc: 'Spreadsheet essentials: formulas, charts, pivot tables, and data analysis.' },
  'circuit design': { name: 'Circuit Design - All About Circuits', url: 'https://www.allaboutcircuits.com/textbook/', weeks: 5, desc: "Analog and digital circuit fundamentals: Ohm's law, KVL/KCL, op-amps." },
  'embedded c': { name: 'Embedded C Programming', url: 'https://embetronicx.com/tutorials/embedded-c/', weeks: 3, desc: 'Program microcontrollers with embedded C: GPIO, interrupts, timers.' },
  'matlab': { name: 'MATLAB Onramp', url: 'https://matlabacademy.mathworks.com/courses/matlab-onramp', weeks: 2, desc: 'MATLAB basics: arrays, scripts, plotting, and toolboxes.' },
  'solidworks': { name: 'SolidWorks Tutorials', url: 'https://my.solidworks.com/training/', weeks: 4, desc: '3D CAD modeling: parts, assemblies, drawings, and simulation.' },
  'ansys': { name: 'ANSYS Innovation Courses', url: 'https://www.ansys.com/academic/students/free-courses', weeks: 3, desc: 'Finite element analysis for structural, thermal, and fluid problems.' },
};

export function generateRoadmap(missingSkills: string[], roleId: string): RoadmapStepData[] {
  return missingSkills.map((skill, idx) => {
    const canon = canonicalize(skill);
    const resource = LEARNING_RESOURCES[canon] ?? {
      name: `Search for ${skill} courses`,
      url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial course')}`,
      weeks: 3,
      desc: `Learn ${skill} — find online courses, documentation, and practice projects to build proficiency.`,
    };
    return {
      id: `step-${idx}-${Date.now()}`,
      skill,
      description: resource.desc,
      resource_name: resource.name,
      resource_url: resource.url,
      duration_weeks: resource.weeks,
      completed: false,
    };
  });
}

// Generate resume improvement suggestions based on ATS analysis
export function generateResumeSuggestions(
  resume: { skills: string[]; projects: unknown[]; internships: unknown[]; education: unknown[]; achievements: string[] },
  role: JobRole
): string[] {
  const suggestions: string[] = [];

  if (resume.skills.length === 0) {
    suggestions.push('Add your technical skills — this is the most important section for ATS scanning');
  } else if (resume.skills.length < 5) {
    suggestions.push('Expand your skills section — aim for at least 8-10 relevant skills');
  }

  if (resume.projects.length === 0) {
    suggestions.push('Add at least 2 projects to demonstrate practical experience');
  }

  if (resume.internships.length === 0) {
    suggestions.push('Include any internships or work experience, even if short-term');
  }

  if (resume.education.length === 0) {
    suggestions.push('Add your education details including degree, institution, and graduation year');
  }

  if (resume.achievements.length === 0) {
    suggestions.push('Add achievements, certifications, or awards to stand out');
  }

  // Check for keyword alignment with role
  const userSkillsLower = resume.skills.map((s) => s.toLowerCase());
  const roleKeywords = role.required_skills.filter(
    (s) => !userSkillsLower.some((u) => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))
  );
  if (roleKeywords.length > 0) {
    suggestions.push(`Include these keywords from the job description: ${roleKeywords.slice(0, 5).join(', ')}`);
  }

  return suggestions;
}
