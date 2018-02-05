const { readFileSync, writeFileSync, readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const ampify = require('../ampify');

const updateFiles = node => {
  const dir = lstatSync(node).isDirectory()
  if (dir) {
    const children = readdirSync(node);
    children.forEach(c => updateFiles(join(node, c)));
  } else {
    if (node.endsWith('.html')) {
      console.log('Updating', node);
      writeFileSync(node, ampify(readFileSync(node)));
    }
  }
};

updateFiles('docs/amp/')
