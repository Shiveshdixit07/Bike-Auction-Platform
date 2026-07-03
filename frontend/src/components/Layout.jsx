import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Bike, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                <Bike className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">BikeAuction</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              <Link to="/auctions" className="text-gray-600 hover:text-gray-900 font-medium">
                Auctions
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                  Admin Dashboard
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-secondary text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Register
                  </Link>
                </div>
              )}
            </nav>

            <button
              className="md:hidden p-2 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 px-4">
            <div className="flex flex-col gap-3">
              <Link to="/auctions" className="text-gray-600 hover:text-gray-900 font-medium">
                Auctions
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                  Admin Dashboard
                </Link>
              )}
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Hi, {user.name}</span>
                  <button onClick={handleLogout} className="text-left text-gray-600 hover:text-gray-900 cursor-pointer">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="text-gray-600 hover:text-gray-900 font-medium">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} BikeAuction Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
