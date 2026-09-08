import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/dom/**/*.test.tsx'],
          setupFiles: ['tests/dom/setup.ts'],
        },
      },
      {
        test: {
          name: 'contracts',
          environment: 'node',
          include: ['tests/contracts/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'dsh-unit',
          environment: 'node',
          include: ['tests/dsh/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'dsh-dom',
          environment: 'jsdom',
          include: ['tests/dsh/dom/**/*.test.tsx'],
          setupFiles: ['tests/dsh/dom/setup.ts'],
        },
      },
      {
        test: {
          name: 'release',
          environment: 'node',
          include: ['tests/release/**/*.test.ts'],
          testTimeout: 120_000,
        },
      },
    ],
  },
})
