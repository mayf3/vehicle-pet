import { createServer } from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dshRoot = process.env.DSH_REFERENCE_WORKTREE
if (!dshRoot) throw new Error('DSH_REFERENCE_WORKTREE is required')
const mockModule = await import(pathToFileURL(path.join(
  dshRoot,
  'packages/test-support/llm-mock-server/src/index.ts',
)).href)

const sequence = ['slow_success', 'slow_success', 'tool_call_success', 'invalid_request', 'stall', 'slow_success']
const options = {
  host: '127.0.0.1',
  port: Number(process.env.VEHICLE_PET_MOCK_LLM_PORT ?? '8901'),
  sequence,
  repeatLast: true,
  chunkDelayMs: 400,
  toolName: 'ask_user_question',
  toolArguments: JSON.stringify({
    questions: [{
      id: 'e2e-continue',
      question: 'Continue the e2e flow?',
      options: [{ label: 'Yes, continue' }, { label: 'Stop here' }],
    }],
  }),
  onEvent: event => process.stdout.write(`${JSON.stringify(event)}\n`),
}

let mock = await mockModule.startMockLlmServer(options)
let restart = Promise.resolve()

const control = createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/reset') {
    response.writeHead(404).end()
    return
  }
  restart = restart.then(async () => {
    await mock.close()
    mock = await mockModule.startMockLlmServer(options)
  })
  void restart.then(() => {
    response.writeHead(204).end()
  }, error => {
    response.writeHead(500, { 'content-type': 'text/plain' }).end(String(error))
  })
})
await new Promise((resolve, reject) => {
  control.once('error', reject)
  control.listen(8902, '127.0.0.1', resolve)
})
process.stdout.write(`${JSON.stringify({ type: 'ready', baseURL: mock.baseURL, controlPort: 8902 })}\n`)

async function shutdown() {
  control.close()
  await restart.catch(() => {})
  await mock.close()
  process.exit(0)
}
process.once('SIGTERM', () => { void shutdown() })
process.once('SIGINT', () => { void shutdown() })
