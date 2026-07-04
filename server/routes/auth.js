import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db.js'
import { requireAuth, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req, res) => {
  const { username, email, password } = req.body
  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }
  const db = getDb()
  const id = uuidv4()
  try {
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, username.trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 10), 'member')
    const token = jwt.sign({ id, username: username.trim(), role: 'member' }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id, username: username.trim(), email: email.trim().toLowerCase(), role: 'member' } })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Username or email is already taken' })
    } else {
      res.status(500).json({ error: 'Registration failed' })
    }
  }
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username.toLowerCase())
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, profile_picture: user.profile_picture }
  })
})

router.get('/me', requireAuth, (req, res) => {
  const db = getDb()
  const user = db.prepare(
    'SELECT id, username, email, role, profile_picture, created_at FROM users WHERE id = ?'
  ).get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

export default router
