import { spawn } from 'node:child_process'

function run(command, args, name, color) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] arrêté (code ${code})`)
      process.exit(code)
    }
  })
  return child
}

console.log('[grh] Démarrage API (3000) + Vite…')
run('node', ['server/index.mjs'], 'api', 'cyan')
run('npx', ['vite'], 'vite', 'green')
