import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import LoginView from '../components/LoginView';
import AdminView from '../components/AdminView';
import { getMe, logout as logoutApi } from '../lib/api-client';

const HomePage: NextPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    getMe()
      .then((user) => {
        if (user.role === 'SUPER_ADMIN') {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        // Not logged in
      })
      .finally(() => setIsChecking(false));
  }, []);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors
    }
    setIsLoggedIn(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {isLoggedIn ? (
        <AdminView onLogout={handleLogout} />
      ) : (
        <LoginView onLogin={handleLogin} />
      )}
    </div>
  );
};

export default HomePage;
