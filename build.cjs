const fs = require('node:fs');
const path = require('node:path');
const files = [
  'index.html', 'style.css', 'survey.css', 'app.js', 'config.js', 'survey-model.js',
  'admin.html', 'admin.css', 'admin.js',
  'assets/hero.png', 'assets/package-promotion.png', 'assets/PretendardVariable.woff2', 'assets/FONT-LICENSE.txt',
];
for (const file of files) {
  const target = path.join(__dirname, 'dist', file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(__dirname, file), target);
}
console.log(`Built ${files.length} public files in dist/`);
