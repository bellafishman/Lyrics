//
// Bella Fishman
// Call python azapi_script.py to get lyrics for specific song

// need this line bc working with function traditionally using callbacks
// util allows us to use async
const util = require('util');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
// using python child function
const exec = require('child_process').exec;

// Promisify exec to use with async/await
const execPromise = util.promisify(exec);

// virtual environment activation script for python
const venvPath = '../python_scripts/venv/bin/activate';

async function getLyrics(songTitle, artistName = 'google') {
    try {
        console.log("getlyrics");
        console.log(songTitle);
        console.log(artistName);
        // Construct the command with the provided or default artist name
        const command = `source ${venvPath} && python3 ../python_scripts/azapi_script.py "${songTitle}" "${artistName}"`;
        
        // Execute the command
        const { stdout, stderr } = await execPromise(command);
        
        if (stderr) {
          throw new Error(`Stderr: ${stderr}`);
        }
        
        // Parse and return the lyrics from the command output
        const result = JSON.parse(stdout);
        return result.lyrics;

      } catch (error) {
        console.error('Error getting lyrics:', error.message);
        throw error;
      }
}

module.exports = {getLyrics};