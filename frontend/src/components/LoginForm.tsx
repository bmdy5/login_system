'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, UserInfo } from '@/lib/api';
import { persistUserSession } from '@/lib/authSession';

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUser, setLastUser] = useState<UserInfo | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      setLastUser(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitAction = mode === 'register' ? register : login;
      const result = await submitAction({
        username: username.trim(),
        password
      });

      if (!result.success || !result.data) {
        setError(result.message || (mode === 'register' ? '注册失败' : '用户名或密码错误'));
        setLastUser(null);
        return;
      }

      setLastUser(result.data);
      persistUserSession(result.data);
      router.push('/dashboard/chat');
    } catch (requestError) {
      setError('请求失败，请检查后端服务是否启动');
      setLastUser(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1 className="title">{mode === 'register' ? '注册账号' : '登录系统'}</h1>
      <p className="subtitle">{mode === 'register' ? '请输入用户名和密码进行注册' : '请输入用户名和密码进行登录'}</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="label" htmlFor="username">
          用户名
          <input
            id="username"
            className="input"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="例如: alice"
          />
        </label>

        <label className="label" htmlFor="password">
          密码
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
          />
        </label>

        <button className="button" type="submit" disabled={loading}>
          {loading ? (mode === 'register' ? '注册中...' : '登录中...') : (mode === 'register' ? '注册并进入' : '登录')}
        </button>
      </form>

      <button
        className="mode-switch"
        type="button"
        onClick={() => {
          setMode((prev) => (prev === 'login' ? 'register' : 'login'));
          setError('');
          setLastUser(null);
        }}
      >
        {mode === 'register' ? '已有账号？去登录' : '没有账号？去注册'}
      </button>

      {error ? <p className="error">{error}</p> : null}

      {lastUser ? (
        <div className="success">
          <strong>登录成功，正在跳转...</strong>
          <ul className="info-list">
            <li>用户ID: {lastUser.id}</li>
            <li>用户名: {lastUser.username}</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
