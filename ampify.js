const { readFileSync, writeFileSync, readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const ampify = require('../amplify');

const updateFiles = node => {
  const dir = lstatSync(node).isDirectory()
  if (dir) {
    const children = readdirSync(node);
    children.forEach(c => updateFiles(join(node, c)));
  } else {
    if (node.endsWith('.html')) {
      ampify(readFileSync(node), {
        imgBase: 'docs'
      }).then(c => writeFileSync(node, c)).then(() => console.log('Updated', node));
    }
  }
};

updateFiles('docs/amp/')
