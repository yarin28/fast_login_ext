// build.js - A Node.js script to package your extension
const fs = require('fs');
const ChromeExtension = require('crx');
const path = require('path');

async function packageExtension() {
  // Initialize the ChromeExtension object
  const crx = new ChromeExtension({
    privateKey: fs.readFileSync(path.resolve('key.pem')),
    codebase: 'https://your-gitlab-instance.com/path/to/extension.crx',
    rootDirectory: path.resolve('.')
  });

  try {
    // Pack all files from your extension directory
    const crxBuffer = await crx.pack();

    // Save the .crx file
    fs.writeFileSync('fast_login.crx', crxBuffer);

    // Generate and save the updates.xml
    const updateXML = await crx.generateUpdateXML();
    fs.writeFileSync('updates.xml', updateXML);

    console.log('Extension packaged successfully!');
  } catch (err) {
    console.error('Error packaging extension:', err);
  }
}

packageExtension();

