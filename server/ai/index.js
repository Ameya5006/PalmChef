import 'dotenv/config'
import { createAiApp } from './app.js'
import { aiListenConfig } from './config.js'

const { port, host } = aiListenConfig()
createAiApp().listen(port, host, () => console.log(`PalmChef AI API listening on ${host}:${port}`))
