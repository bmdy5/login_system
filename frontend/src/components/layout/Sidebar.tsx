'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearUserSession } from '@/lib/authSession';

const menuItems = [
  {
    href: '/dashboard/chat',
    label: '大模型对话'
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearUserSession();
    router.replace('/');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>控制台</h1>
        <p>Login System</p>
      </div>

      <nav className="sidebar-nav" aria-label="主导航">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout} type="button">
        退出登录
      </button>
    </aside>
  );
}
