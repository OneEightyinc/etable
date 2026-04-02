import type { NextApiRequest, NextApiResponse } from 'next';
import { findAdminByEmail, findAccountByEmail, hashPassword, createSession, setSessionCookie } from '@queue-platform/api/src/server';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const pwHash = hashPassword(password);

  const admin = findAdminByEmail(email);
  if (admin && admin.passwordHash === pwHash) {
    const session = createSession(admin.id, 'SUPER_ADMIN');
    setSessionCookie(res, session.id);
    return res.status(200).json({
      sessionId: session.id,
      user: { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
    });
  }

  const account = findAccountByEmail(email);
  if (account && account.passwordHash === pwHash && account.status === 'ACTIVE') {
    const session = createSession(account.id, 'STORE_ADMIN', account.id);
    setSessionCookie(res, session.id);
    return res.status(200).json({
      sessionId: session.id,
      user: { id: account.id, email: account.email, role: 'STORE_ADMIN', storeName: account.storeName, storeId: account.id },
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
}
