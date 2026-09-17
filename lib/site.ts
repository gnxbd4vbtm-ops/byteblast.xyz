export const siteConfig = {
  name: 'Byte / ByteBlast',
  displayName: 'Byte',
  brandName: 'ByteBlast',
  url: 'https://byteblast.xyz',
  description:
    'Developer portfolio for Byte, focused on Linux, programming, networking, self-hosting, AI/ML, automation, and open-source software.',
  tagline: 'Developer • Linux • Open Source • Automation',
  github: 'https://github.com',
  email: 'contact@byteblast.xyz',
  githubUsername: 'byteblast',
  keywords: [
    'Byte',
    'ByteBlast',
    'developer',
    'Linux',
    'open source',
    'C#',
    'Python',
    'C++',
    'self-hosting',
    'networking',
    'AI/ML',
    'automation',
  ],
};

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/status', label: 'Status' },
  { href: '/contact', label: 'Contact' },
  { href: siteConfig.github, label: 'GitHub', external: true },
];

export type ProjectStatus = 'Active' | 'Experimental' | 'Archived' | 'Private';

export type ProjectItem = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  technologies: string[];
  status: ProjectStatus;
  version: string;
  featured: boolean;
  repo: string | null;
  website: string | null;
  source: string | null;
  screenshot: string | null;
  accent: string;
};

export const projects: ProjectItem[] = [
  {
    slug: 'ai-git-committer',
    name: 'ai-git-committer',
    shortDescription: 'AI commit messages for a simpler git workflow.',
    description:
      'A Python tool for generating cleaner commit messages using AI so Git history stays readable without extra effort.',
    technologies: ['Python', 'Git', 'AI', 'CLI', 'Automation'],
    status: 'Active',
    version: '0.9.0',
    featured: true,
    repo: 'https://github.com',
    website: null,
    source: 'https://github.com',
    screenshot: null,
    accent: 'cyan',
  },
  {
    slug: 'byteformat',
    name: 'byteformat',
    shortDescription: 'Small utilities for code formatting and cleanup tasks.',
    description:
      'A simple project for formatting and fixing repetitive code patterns in a quick and consistent way.',
    technologies: ['Python', 'Formatting', 'CLI', 'Automation'],
    status: 'Active',
    version: '0.6.0',
    featured: true,
    repo: null,
    website: null,
    source: null,
    screenshot: null,
    accent: 'amber',
  },
  {
    slug: 'elo-server',
    name: 'EloServer',
    shortDescription: 'A local server project focused on reliability and quick tools.',
    description:
      'A small server-side project for running tools locally with a simple setup and practical automation in mind.',
    technologies: ['C#', 'Linux', 'Server', 'Automation'],
    status: 'Active',
    version: '0.8.0',
    featured: true,
    repo: null,
    website: null,
    source: null,
    screenshot: null,
    accent: 'violet',
  },
  {
    slug: 'byteblast-xyz',
    name: 'byteblast.xyz',
    shortDescription: 'This site and personal portfolio.',
    description:
      'The portfolio site for Byte, built around a simple developer profile, project list, and public status information.',
    technologies: ['Next.js', 'TypeScript', 'CSS', 'Portfolio'],
    status: 'Active',
    version: '1.0.0',
    featured: true,
    repo: null,
    website: 'https://byteblast.xyz',
    source: null,
    screenshot: null,
    accent: 'emerald',
  },
];

export const statusServices = [
  { name: 'Main website', state: 'Operational', detail: 'Primary portfolio and public site' },
  { name: 'API', state: 'Degraded Performance', detail: 'Internal APIs and automation endpoints' },
  { name: 'GitHub sync', state: 'Operational', detail: 'Public repository and profile integration' },
  { name: 'Self-hosting stack', state: 'Partial Outage', detail: 'Experimental homelab services' },
];

export const skillGroups = [
  {
    title: 'Core',
    items: ['Python', 'C#', 'C++', 'Shell / fish', 'Git', 'Docker'],
  },
  {
    title: 'Systems',
    items: ['Linux', 'CachyOS / Arch', 'KDE Plasma', 'Networking', 'Self-hosting'],
  },
  {
    title: 'Web',
    items: ['Next.js', 'TypeScript', 'REST APIs', 'HTML', 'CSS', 'Automation'],
  },
  {
    title: 'AI & tooling',
    items: ['AI/ML projects', 'Automation', 'Open source workflows', 'CLI tooling'],
  },
];
