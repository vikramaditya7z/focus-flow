import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const key = env.split('VITE_GEMINI_API_KEY=')[1]?.trim();

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(r => r.json())
  .then(d => {
    const models = d.models.map(m => m.name);
    console.log(models);
  }).catch(e => console.error(e));
