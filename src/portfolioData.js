/**
 * PORTFOLIO CONTENT — the only file you need to edit to change what the site says.
 *
 * Rules this file follows:
 *  - Only facts that were supplied are written here. Nothing is invented.
 *  - Empty strings / empty arrays are HIDDEN in the UI (no placeholder links, no fake claims).
 *  - To add something real, fill in the empty field and it appears automatically.
 *
 * Block types understood by ContentPanel:
 *   { type: 'text',     heading?, text }
 *   { type: 'list',     heading?, items: string[] }
 *   { type: 'tags',     heading?, items: string[] }
 *   { type: 'timeline', heading?, items: [{ title, meta?, text? }] }
 *   { type: 'projects', heading?, items: [{ title, status?, description, stack?: string[],
 *                                           github?, live?, screenshots?: string[], results?: string[] }] }
 *   { type: 'links',    heading? }               // renders every contact link that is filled in below
 */

export const profile = {
  university: 'JK Lakshmipat University, Jaipur',
  degree: 'B.Tech, Computer Science and Engineering',
  years: '2024–2028',

  // Fill these in to enable the lamp's orbit. Anything left empty is hidden everywhere.
  contact: {
    email: '', //  e.g. 'name@example.com'
    linkedin: 'https://www.linkedin.com/in/deepanshu-shekhawat-289110320/?isSelfProfile=true',
    github: 'https://github.com/deepanshu-shekhawat',
    instagram: '', //  full https:// URL
    resume: '', //  path like '/resume.pdf' (put the file in /public) or a full URL
  },
};

const emptyNote = (what) => `${what} will appear here once the details are added.`;

export const streetObjects = [
  /* ───────────────────────── 1. AUTO RICKSHAW ───────────────────────── */
  {
    id: 'auto',
    model: 'auto_rickshaw',
    title: 'Auto Rickshaw',
    hindi: 'ऑटो रिक्शा',
    role: 'Identity & journey',
    pinLabel: 'THE RIDE',
    hoverLabel: 'MEET THE DRIVER',
    orbitHint: 'My story, from the back seat',
    planets: [
      {
        id: 'about',
        title: 'About Me',
        hindi: 'मेरे बारे में',
        blurb: 'A CS student who builds things out of curiosity.',
        blocks: [
          {
            type: 'text',
            text: `Computer Science and Engineering student at ${profile.university}. Developer by curiosity, creator by instinct.`,
          },
          {
            type: 'tags',
            heading: 'Interests',
            items: ['Technology', 'AI / ML', 'Web development', 'Creative work'],
          },
          {
            type: 'text',
            heading: 'How I work',
            text: 'I like learning by building: a model that has to be evaluated honestly, a website that has to feel like somewhere, a story that has to be told on screen.',
          },
        ],
      },
      {
        id: 'education',
        title: 'Education',
        hindi: 'शिक्षा',
        blurb: `${profile.degree} · ${profile.years}`,
        blocks: [
          {
            type: 'timeline',
            items: [
              {
                title: profile.degree,
                meta: `${profile.university} · ${profile.years}`,
              },
            ],
          },
          {
            type: 'list',
            heading: 'Foundations I am studying',
            items: [
              'Data structures and algorithms',
              'Database management systems',
              'Operating systems',
              'Computer networks',
            ],
          },
        ],
      },
      {
        id: 'experience',
        title: 'Experience',
        hindi: 'अनुभव',
        blurb: 'Research, projects, clubs and creative leadership.',
        blocks: [
          {
            type: 'list',
            heading: 'Research & project work',
            items: [
              'Sepsis prediction research (machine learning)',
              'Infectious-Disease-Triage',
              'Friend or Phish? — phishing-awareness simulator',
            ],
          },
          {
            type: 'list',
            heading: 'University & creative responsibilities',
            items: [
              'University committee and club responsibilities',
              'Content creation',
              'Event coordination',
              'Leadership',
            ],
          },
          // Add real internships here: { title: 'Role — Company', meta: 'Dates', text: 'What you did' }
          { type: 'timeline', heading: 'Internships', items: [] },
        ],
      },
      {
        id: 'achievements',
        title: 'Achievements',
        hindi: 'उपलब्धियाँ',
        blurb: 'Verified milestones only.',
        // Add verified items: { title, meta, text }
        blocks: [{ type: 'timeline', items: [] }],
        emptyNote: emptyNote('Verified achievements'),
      },
      {
        id: 'contact',
        title: 'Contact',
        hindi: 'संपर्क',
        blurb: 'Say hello — the lamp has the details.',
        blocks: [{ type: 'links' }],
        emptyNote: 'Contact links have not been added yet.',
      },
    ],
  },

  /* ───────────────────────────── 2. CHAI STALL ───────────────────────── */
  {
    id: 'stall',
    model: 'tea_stall',
    title: 'Chai Stall',
    hindi: 'चाय की टपरी',
    role: 'Projects & things I have built',
    pinLabel: 'THE TAPRI',
    hoverLabel: 'EXPLORE PROJECTS',
    orbitHint: 'Everything I have brewed so far',
    planets: [
      {
        id: 'ml',
        title: 'AI / Machine Learning',
        short: 'AI / ML',
        hindi: 'मशीन लर्निंग',
        blurb: 'Triage and prediction research.',
        blocks: [
          {
            type: 'projects',
            items: [
              {
                title: 'Infectious-Disease-Triage',
                description: 'A machine-learning project on infectious-disease triage.',
                stack: [],
                github: 'https://github.com/healthai-2026/Infectious-Disease-Triage',
                results: [],
              },
              {
                title: 'Sepsis prediction research',
                status: 'Research',
                description:
                  'Research on predicting sepsis with machine-learning models: data preprocessing, model training and evaluation.',
                stack: [],
                github: '',
                results: [],
              },
            ],
          },
          {
            type: 'tags',
            heading: 'Toolkit',
            items: ['Python', 'NumPy', 'Pandas', 'SciPy', 'scikit-learn', 'XGBoost', 'Matplotlib', 'Jupyter'],
          },
        ],
      },
      {
        id: 'web',
        title: 'Web Development',
        short: 'Web Dev',
        hindi: 'वेब डेवलपमेंट',
        blurb: 'React, 3D, and the site you are standing in.',
        blocks: [
          {
            type: 'projects',
            items: [
              {
                title: 'This street portfolio',
                description:
                  'An explorable 3D Indian street where every object opens a part of the portfolio through an orbital menu.',
                stack: ['React', 'Vite', 'Three.js', 'React Three Fiber', 'Drei', 'Framer Motion'],
                github: '',
              },
            ],
          },
          {
            type: 'tags',
            heading: 'Web stack I use',
            items: ['React', 'Node.js', 'npm', 'HTML', 'CSS', 'JavaScript'],
          },
        ],
      },
      {
        id: 'security',
        title: 'Cybersecurity',
        short: 'Security',
        hindi: 'साइबर सुरक्षा',
        blurb: 'Learning to think like the phisher.',
        blocks: [
          {
            type: 'projects',
            items: [
              {
                title: 'Friend or Phish?',
                description:
                  'A phishing-awareness simulator: an interactive experience that helps people practise telling genuine messages from phishing attempts.',
                stack: [],
                github: 'https://github.com/deepanshu-shekhawat/Phish-or-Friend',
                live: '',
              },
            ],
          },
        ],
      },
      {
        id: 'data',
        title: 'Data Science',
        short: 'Data',
        hindi: 'डेटा साइंस',
        blurb: 'Analysis, features, and honest comparisons.',
        blocks: [
          {
            type: 'list',
            heading: 'What I work on',
            items: [
              'Data analysis and visualization',
              'Python-based experimentation',
              'Model comparisons and statistical analysis',
              'Data preprocessing and feature engineering',
            ],
          },
          {
            type: 'tags',
            heading: 'Tools',
            items: ['Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Jupyter Notebook'],
          },
        ],
      },
      {
        id: 'github',
        title: 'GitHub',
        hindi: 'गिटहब',
        blurb: 'Source code and documentation.',
        blocks: [
          { type: 'links', only: ['github'] },
          { type: 'tags', heading: 'Where the work lives', items: ['Git', 'GitHub'] },
        ],
        emptyNote: 'Repository links have not been added yet.',
      },
    ],
  },

  /* ───────────────────────────── 3. OLD PC ───────────────────────────── */
  {
    id: 'pc',
    model: 'old_pc',
    title: 'Old PC',
    hindi: 'पुराना कंप्यूटर',
    role: 'Technical skills',
    pinLabel: 'CYBER CAFÉ',
    hoverLabel: 'C:\\> OPEN SKILLS_',
    orbitHint: 'The toolbox, honestly labelled',
    planets: [
      {
        id: 'languages',
        title: 'Languages',
        hindi: 'भाषाएँ',
        blurb: 'What I write code in.',
        blocks: [{ type: 'tags', items: ['C', 'C++', 'Python', 'JavaScript', 'HTML & CSS', 'SQL'] }],
      },
      {
        id: 'mltools',
        title: 'AI / ML Tools',
        short: 'AI / ML Tools',
        hindi: 'एआई टूल्स',
        blurb: 'The data and modelling stack.',
        blocks: [
          {
            type: 'tags',
            items: ['NumPy', 'Pandas', 'SciPy', 'scikit-learn', 'XGBoost', 'Matplotlib', 'Jupyter Notebook'],
          },
        ],
      },
      {
        id: 'webtech',
        title: 'Web Technologies',
        short: 'Web Tech',
        hindi: 'वेब तकनीक',
        blurb: 'Front-end and runtime tools.',
        blocks: [{ type: 'tags', items: ['React', 'Node.js', 'npm', 'HTML', 'CSS', 'JavaScript'] }],
      },
      {
        id: 'devtools',
        title: 'Developer Tools',
        short: 'Dev Tools',
        hindi: 'डेवलपर टूल्स',
        blurb: 'Where code gets written and tried.',
        blocks: [{ type: 'tags', items: ['Git & GitHub', 'VS Code', 'Jupyter Notebook'] }],
      },
      {
        id: 'cs',
        title: 'DSA / Computer Science',
        short: 'DSA / CS',
        hindi: 'कंप्यूटर साइंस',
        blurb: 'The fundamentals underneath everything.',
        blocks: [
          {
            type: 'list',
            items: [
              'Data structures and algorithms',
              'Database management systems',
              'Operating systems',
              'Computer networks',
            ],
          },
        ],
      },
    ],
  },

  /* ──────────────────────────── 4. STREET LAMP ───────────────────────── */
  {
    id: 'lamp',
    model: 'street_lamp',
    title: 'Street Lamp',
    hindi: 'स्ट्रीट लैंप',
    role: 'Contact & opportunities',
    pinLabel: 'THE LAMP',
    hoverLabel: 'SAY HELLO',
    orbitHint: 'Find me under the light',
    planets: [
      { id: 'email', title: 'Email', hindi: 'ईमेल', contactKey: 'email', blurb: 'Write to me.' },
      { id: 'linkedin', title: 'LinkedIn', hindi: 'लिंक्डइन', contactKey: 'linkedin', blurb: 'Professional profile.' },
      { id: 'github', title: 'GitHub', hindi: 'गिटहब', contactKey: 'github', blurb: 'Code and repositories.' },
      { id: 'instagram', title: 'Instagram', hindi: 'इंस्टाग्राम', contactKey: 'instagram', blurb: 'Creative side.' },
      { id: 'resume', title: 'Resume', hindi: 'रिज़्यूमे', contactKey: 'resume', blurb: 'The latest resume.' },
    ],
    emptyNote: 'Contact links have not been added yet.',
  },

  /* ──────────────────────────── 5. TEA TABLE ─────────────────────────── */
  {
    id: 'table',
    model: 'tea_table_set',
    title: 'Tea Table',
    hindi: 'चाय की मेज़',
    role: 'Creative identity & campus life',
    pinLabel: 'THE BAITHAK',
    hoverLabel: 'PULL UP A CHAIR',
    orbitHint: 'The creative side, over a cup of chai',
    planets: [
      {
        id: 'creative',
        title: 'Creative Work',
        hindi: 'रचनात्मक काम',
        blurb: 'Stories told on screen.',
        blocks: [
          {
            type: 'list',
            items: ['Video editing', 'Reel concepts', 'Visual storytelling', 'Creative experiments'],
          },
        ],
      },
      {
        id: 'campus',
        title: 'Campus Life',
        hindi: 'कैंपस लाइफ',
        blurb: 'Events, culture, clubs.',
        blocks: [
          {
            type: 'list',
            items: ['University events', 'Cultural activities', 'Club participation'],
          },
        ],
      },
      {
        id: 'leadership',
        title: 'Leadership',
        hindi: 'नेतृत्व',
        blurb: 'Coordinating people and ideas.',
        blocks: [
          {
            type: 'list',
            items: ['Event coordination', 'Social media responsibilities', 'Club contributions'],
          },
        ],
      },
      {
        id: 'design',
        title: 'Design',
        hindi: 'डिज़ाइन',
        blurb: 'Posters, identities, interfaces.',
        blocks: [
          {
            type: 'list',
            items: [
              'Posters',
              'Visual identities',
              'Promotional content',
              'Website design and creative assets',
            ],
          },
        ],
      },
      {
        id: 'interests',
        title: 'Personal Interests',
        short: 'Interests',
        hindi: 'रुचियाँ',
        blurb: 'What keeps me curious.',
        blocks: [
          {
            type: 'list',
            items: ['Technology', 'Creative experimentation', 'Learning and building new things'],
          },
        ],
      },
    ],
  },
];

/* ───────────────────────────── helpers ───────────────────────────── */

export const contactMeta = {
  email: { label: 'Email', href: (v) => `mailto:${v}`, display: (v) => v, external: false },
  linkedin: { label: 'LinkedIn', href: (v) => v, display: (v) => v.replace(/^https?:\/\/(www\.)?/, ''), external: true },
  github: { label: 'GitHub', href: (v) => v, display: (v) => v.replace(/^https?:\/\/(www\.)?/, ''), external: true },
  instagram: { label: 'Instagram', href: (v) => v, display: (v) => v.replace(/^https?:\/\/(www\.)?/, ''), external: true },
  resume: { label: 'Resume', href: (v) => v, display: () => 'Open / download', external: true },
};

/** Contact links that have actually been supplied. */
export function getContactLinks(only) {
  return Object.entries(contactMeta)
    .filter(([key]) => (!only || only.includes(key)) && profile.contact[key])
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      href: meta.href(profile.contact[key]),
      display: meta.display(profile.contact[key]),
      external: meta.external,
    }));
}

/** The planets an object will actually show (lamp planets are hidden until their link exists). */
export function getVisiblePlanets(obj) {
  return obj.planets.filter((p) => !p.contactKey || profile.contact[p.contactKey]);
}

export const getObject = (id) => streetObjects.find((o) => o.id === id);
