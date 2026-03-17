export interface LoginPayload {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  loginCount: number;
  failedCount: number;
  lastLoginAt: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: UserInfo;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: UserInfo;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = (await response.json()) as LoginResponse;
  if (!response.ok) {
    return {
      success: false,
      message: json.message || '登录失败'
    };
  }

  return json;
}

export async function register(payload: LoginPayload): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = (await response.json()) as RegisterResponse;
  if (!response.ok) {
    return {
      success: false,
      message: json.message || '注册失败'
    };
  }

  return json;
}
