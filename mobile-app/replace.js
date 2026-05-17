const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  // Replace hex
  if(c.toLowerCase().includes('#1193d4')) { 
    c = c.replace(/#1193d4/gi, '#2874f0'); 
    changed = true; 
  }
  // Replace rgb components
  if(c.includes('17, 147, 212')) { 
    c = c.replace(/17,\s*147,\s*212/g, '40, 116, 240'); 
    changed = true; 
  }

  // Also catch tailwind blue hex just in case
  if(c.toLowerCase().includes('#3b82f6')) {
    c = c.replace(/#3b82f6/gi, '#2874f0');
    changed = true;
  }
  
  if(changed) {
     fs.writeFileSync(f, c);
     console.log('Fixed:', f);
  }
});
console.log('Replacement finished!');
