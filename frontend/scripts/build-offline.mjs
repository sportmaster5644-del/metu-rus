import { readdir, readFile, writeFile } from 'node:fs/promises'
const files = await readdir(new URL('../dist/assets/', import.meta.url))
const worker = new URL('../dist/sw.js', import.meta.url)
let text = await readFile(worker, 'utf8')
const shell = ['index.html', 'manifest.webmanifest', 'metu-logo.jpg', 'models/tutor.glb', ...files.map(f => 'assets/' + f)]
text = text.replace(/const FILES = .*?;/, `const FILES = ${JSON.stringify(shell)};`)
await writeFile(worker, text)
console.log(`Offline cache: ${shell.length} files`)
