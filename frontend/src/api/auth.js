import client from './client';

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function register(payload) {
  const { data } = await client.post('/auth/register', payload);
  return data;
}

export async function getMe() {
  const { data } = await client.get('/auth/me');
  return data.user;
}
