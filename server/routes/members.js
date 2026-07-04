import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'
import { PROFILES_DIR } from '../paths.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const profileStorage = multer.diskStorage({
  destination: PROFILES_DIR,
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
})
const upload = multer({ storage: profileStorage, limits: { fileSize: 5 * 1024 * 1024 } })

const router = Router()

// Admin: list all members (with optional search)
router.get('/', requireAdmin, (req, res) => {
  const db = getDb()
  const { search } = req.query
  let sql = "SELECT id, username, email, profile_picture, created_at FROM users WHERE role = 'member'"
  const params = []
  if (search?.trim()) {
    sql += ' AND (username LIKE ? OR id LIKE ?)'
    params.push(`%${search.trim()}%`, `%${search.trim()}%`)
  }
  sql += ' ORDER BY username ASC'
  res.json(db.prepare(sql).all(...params))
})

// Get specific member profile (admin or self)
router.get('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const db = getDb()
  const user = db.prepare(
    'SELECT id, username, email, role, profile_picture, created_at FROM users WHERE id = ?'
  ).get(req.params.id)
  if (!user) return res.status(404).json({ error: 'Member not found' })
  res.json(user)
})

// Upload profile picture (admin or self)
router.post('/:id/profile-picture', requireAuth, upload.single('photo'), (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const db = getDb()
  const picPath = `/uploads/profiles/${req.file.filename}`
  db.prepare('UPDATE users SET profile_picture = ? WHERE id = ?').run(picPath, req.params.id)
  res.json({ profile_picture: picPath })
})

export default router
