import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, History, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch(err) {
      console.error(err);
    }
  };

  const isTestMode = location.pathname.startsWith('/test');

  const navLinks = isTestMode
    ? [
        { path: '/test', name: 'Overview', icon: LayoutDashboard },
        { path: '/test-history', name: 'Test History', icon: History }
      ]
    : [
        { path: '/dashboard', name: 'Overview', icon: LayoutDashboard },
        { path: '/history', name: 'Sessions', icon: History },
      ];

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-700/50 bg-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-3 group cursor-pointer" title="Change Mode">
            <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              FocusFlow
            </span>
          </Link>
          <div className="flex space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400 shadow-inner border border-primary-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-primary-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
            {currentUser && (
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-300 ml-2 border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
