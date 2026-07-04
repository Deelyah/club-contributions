import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// In production (e.g. Render) point DATA_DIR at a mounted persistent disk so the
// SQLite database and uploaded files survive redeploys/restarts. Locally it
// defaults to the server directory, preserving the original layout.
export const DATA_DIR = process.env.DATA_DIR || __dirname

export const DB_PATH = path.join(DATA_DIR, 'data.db')
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
export const RECEIPTS_DIR = path.join(UPLOADS_DIR, 'receipts')
export const PROFILES_DIR = path.join(UPLOADS_DIR, 'profiles')

// A freshly mounted disk is empty — make sure the upload folders exist.
for (const dir of [RECEIPTS_DIR, PROFILES_DIR]) {
  fs.mkdirSync(dir, { recursive: true })
}
