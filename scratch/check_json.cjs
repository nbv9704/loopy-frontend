const fs = require('fs');
const path = require('path');

function checkFile(fileName) {
  const filePath = path.join('d:/loopy-frontend/src/i18n/locales/', fileName);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stack = [new Set()];
  
  lines.forEach((line, i) => {
    // Simple regex to match "key":
    const match = line.match(/^\s*"([^"]+)":/);
    if (match) {
      const key = match[1];
      const current = stack[stack.length - 1];
      if (current.has(key)) {
        console.log(`Duplicate key found in ${fileName}: "${key}" at line ${i + 1}`);
      }
      current.add(key);
    }
    
    // Very simple object tracking (doesn't handle multiline objects/arrays perfectly but good enough for well-formatted JSON)
    if (line.includes('{')) {
      stack.push(new Set());
    }
    if (line.includes('}')) {
      stack.pop();
    }
  });
}

['vi.json', 'en.json'].forEach(checkFile);
