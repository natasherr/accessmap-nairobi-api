import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const { API_URL } = loadEnv(mode, resolve(projectRoot, '../server'), 'API_URL')
  const apiUrl = API_URL || 'https://accessmap-nairobi-api-1.onrender.com'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.API_URL': JSON.stringify(apiUrl),
    },
  }
})
