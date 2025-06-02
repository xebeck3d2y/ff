const API_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    me: `${API_URL}/auth/me`,
    deleteUser: `${API_URL}/auth/users`,
    init2fa: `${API_URL}/auth/2fa/setup/init`,
    confirm2fa: `${API_URL}/auth/2fa/setup/confirm`,
    verify2fa: `${API_URL}/auth/2fa/verify`,
    disable2fa: `${API_URL}/auth/2fa/disable`,
  },
  files: {
    list: `${API_URL}/files`,
    upload: `${API_URL}/files`,
    download: (fileId: string) => `${API_URL}/files/${fileId}/download`,
    share: (fileId: string) => `${API_URL}/files/${fileId}/share`,
    revokeShare: (fileId: string, userId: string) => `${API_URL}/files/${fileId}/share/${userId}`,
    delete: (fileId: string) => `${API_URL}/files/${fileId}`,
  },
  users: {
    search: `${API_URL}/users/search`,
  },
};

export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false
};

