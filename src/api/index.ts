import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

export const authApi = {
  register: (d: { username: string; email: string; password: string }) => api.post('/auth/register', d),
  login: (d: { username: string; password: string }) => api.post('/auth/login', d),
  me: () => api.get('/auth/me')
}

export const membersApi = {
  list: (search?: string) => api.get('/members', { params: { search } }),
  get: (id: string) => api.get(`/members/${id}`),
  uploadProfilePicture: (id: string, file: File) => {
    const form = new FormData()
    form.append('photo', file)
    return api.post(`/members/${id}/profile-picture`, form)
  }
}

export const paymentsApi = {
  getMy: () => api.get('/payments/my'),
  getByMember: (memberId: string) => api.get(`/payments/member/${memberId}`),
  add: (data: FormData) => api.post('/payments', data),
  update: (id: string, data: FormData) => api.put(`/payments/${id}`, data)
}

export const duesApi = {
  get: () => api.get('/dues'),
  set: (d: { amount: number; frequency: string; start_date: string }) => api.post('/dues', d)
}

export const auditApi = {
  get: (memberId?: string) => api.get('/audit', { params: { member_id: memberId } })
}
