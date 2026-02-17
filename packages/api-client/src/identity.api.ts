import { api } from './client.ts'
import type { User } from './types.ts'

export const identityApi = {
  me: () => api.get<User>('/identity/me'),
  login: (body: { email: string; password: string }) =>
    api.post<{ user: User; message: string }>('/identity/login', body),
  register: (body: { email: string; password: string; name: string; lastName: string }) =>
    api.post<User>('/identity/register', body),
  logout: () => api.post<{ message: string }>('/identity/logout', {}),
  updateProfile: (body: Partial<Pick<User, 'name' | 'lastName' | 'street' | 'city' | 'state' | 'country' | 'zipCode'>>) =>
    api.patch<User>('/identity/profile', body),
}
