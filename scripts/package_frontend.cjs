const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const staging = path.join(root, 'frontend', 'public');
const dist = path.join(root, 'dist');

if (process.argv.includes('--stage')) {
  if (path.resolve(staging) !== path.resolve(root, 'frontend', 'public')) throw new Error('Invalid staging directory');
  // This is generated output under the repository, never an arbitrary input path.
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  const copy = (name) => {
    const source = path.join(root, name);
    fs.cpSync(source, path.join(staging, name), { recursive: true, filter: filename => {
      const relative = path.relative(root, filename).split(path.sep).join('/');
      if (relative.split('/').some(part => ['target', '.git', '.idea', 'node_modules', '__pycache__'].includes(part) || part.startsWith('.env'))) return false;
      if (relative === 'lessons/COURSES.md' || /^lessons\/[^/]+\/PROGRESS\.md$/.test(relative)) return false;
      if (/^(lessons\/springboot(?:\/[^/]+)?|practice\/[^/]+)\/index\.html$/.test(relative)) return false;
      if (relative === 'assets/editor-entry.js' || relative.startsWith('assets/vendor/codemirror/editor.js')) return false;
      return true;
    } });
  };
  for (const name of ['assets', 'lessons', 'practice', 'README.md', 'docs/verification']) copy(name);
  console.log('Staged intended learning resources, excluding build outputs and private files.');
} else {
  const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const course = JSON.parse(fs.readFileSync(path.join(root, 'content/springboot/course.json'), 'utf8'));
  const routes = ['lessons/springboot/index.html', ...course.lessons.map(x => `lessons/springboot/${x.slug}/index.html`),
    ...Object.keys(course.aliases).map(slug => `lessons/springboot/${slug}/index.html`),
    ...course.modules.map(x => `lessons/springboot/modules/${x.id}/index.html`),
    'practice/spring-foundations/index.html', 'practice/reference-directory/index.html'];
  for (const route of routes) {
    const target = path.resolve(dist, route);
    if (!target.startsWith(dist + path.sep)) throw new Error('Route escapes output directory');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, shell);
  }
  console.log(`Created ${routes.length} static deep-link entries for React Router.`);
}
