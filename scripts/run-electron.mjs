// VS Code gibi bazı ortamlar ELECTRON_RUN_AS_NODE=1 ayarlar; o zaman Electron düz Node gibi açılır.
// Bu betik değişkeni temizleyip Electron'u başlatır.
import { spawn } from 'node:child_process'
import electron from 'electron'

delete process.env.ELECTRON_RUN_AS_NODE
spawn(electron, ['.', ...process.argv.slice(2)], { stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0))
