import fs from 'fs';
import path from 'path';

const DOSSIERS_DIR = '../dossiers';
const OUTPUT_DIR = './src/data';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'db.json');

// Simple YAML Parser that handles the specific structure of our dossiers
function parseYAML(yamlText) {
  const lines = yamlText.split('\n');
  const result = { professors: [] };
  let currentProf = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle professors list
    if (line === 'professors:') {
      continue;
    }

    if (line.startsWith('- name:')) {
      if (currentProf) {
        result.professors.push(currentProf);
      }
      currentProf = { name: line.replace('- name:', '').trim().replace(/^"(.*)"$/, '$1') };
      continue;
    }

    if (currentProf) {
      if (line.startsWith('role:')) {
        currentProf.role = line.replace('role:', '').trim().replace(/^"(.*)"$/, '$1');
      } else if (line.startsWith('interests:')) {
        currentProf.interests = line.replace('interests:', '').trim().replace(/^"(.*)"$/, '$1');
      } else if (line.startsWith('projects:')) {
        currentProf.projects = line.replace('projects:', '').trim().replace(/^"(.*)"$/, '$1');
      }
      // If we hit a non-professor key, flush the current professor
      if (!line.startsWith('role:') && !line.startsWith('interests:') && !line.startsWith('projects:') && !line.startsWith('- name:')) {
        result.professors.push(currentProf);
        currentProf = null;
      }
    }

    if (!currentProf) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim().replace(/^"(.*)"$/, '$1');
        
        if (value === 'true') {
          result[key] = true;
        } else if (value === 'false') {
          result[key] = false;
        } else if (!isNaN(value) && value !== '') {
          result[key] = Number(value);
        } else {
          result[key] = value;
        }
      }
    }
  }

  if (currentProf) {
    result.professors.push(currentProf);
  }

  return result;
}

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  if (!match) {
    return {
      metadata: {},
      content: content
    };
  }

  const yamlText = match[1];
  const mdContent = content.substring(match[0].length).trim();
  const metadata = parseYAML(yamlText);

  return {
    metadata,
    content: mdContent
  };
}

function run() {
  console.log('Parsing dossiers...');
  
  if (!fs.existsSync(DOSSIERS_DIR)) {
    console.error(`Dossiers directory not found at ${DOSSIERS_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(DOSSIERS_DIR).filter(file => file.endsWith('.md'));
  const universities = [];

  for (const file of files) {
    const filePath = path.join(DOSSIERS_DIR, file);
    try {
      const parsed = parseMarkdownFile(filePath);
      universities.push({
        ...parsed.metadata,
        markdown: parsed.content
      });
      console.log(`Successfully parsed: ${file}`);
    } catch (e) {
      console.error(`Error parsing ${file}:`, e);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(universities, null, 2), 'utf-8');
  console.log(`Database generated successfully at: ${OUTPUT_FILE}`);
}

run();
