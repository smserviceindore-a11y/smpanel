import { create } from 'zustand';

const TOKEN_KEY = 'hubToken';
const USER_KEY = 'hubUser';

// migrate old admin keys once
if (!localStorage.getItem(TOKEN_KEY) && localStorage.getItem('adminToken')) {
  localStorage.setItem(TOKEN_KEY, localStorage.getItem('adminToken'));
  localStorage.setItem(USER_KEY, localStorage.getItem('adminUser') || 'null');
}

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({ token: null, user: null });
  },
}));

export const roleHome = (role) => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/admin';
  if (role === 'support_agent') return '/support';
  if (role === 'developer') return '/developer';
  if (role === 'client') return '/client';
  return '/';
};
