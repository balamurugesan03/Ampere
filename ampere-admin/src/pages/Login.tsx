import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Users2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import logoIcon from '../assets/logo-icon.png';
import logoFull from '../assets/logo-full.png';

const FEATURES = [
  { icon: Sparkles, text: 'Products, banners & orders in one place' },
  { icon: Users2, text: 'Full distributor network & rank tracking' },
  { icon: ShieldCheck, text: 'Manual payment verification, fully audited' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 700px 500px at 20% 10%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent), radial-gradient(ellipse 600px 500px at 90% 90%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent)',
          }}
        />
        <div className="relative">
          <img src={logoFull} alt="Ampere" className="h-16 w-auto object-contain" />
        </div>

        <div className="relative">
          <h2 className="text-[34px] leading-[1.15] font-bold font-[family-name:var(--font-display)] tracking-tight text-fg max-w-md">
            Run your health & wellness network from one dashboard.
          </h2>
          <div className="flex flex-col gap-3.5 mt-8">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <f.icon size={15} className="text-accent" strokeWidth={2.25} />
                </div>
                <p className="text-sm text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-subtle">© {new Date().getFullYear()} Ampere Health Store</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <form onSubmit={onSubmit} className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <img src={logoIcon} alt="Ampere" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold font-[family-name:var(--font-display)] text-fg">
              Ampere <span className="text-accent">Admin</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-fg mb-1.5">Welcome back</h1>
          <p className="text-sm text-muted mb-7">Sign in to manage the store</p>

          {!!error && (
            <div className="flex items-center gap-2 bg-danger-soft border border-danger/30 text-danger text-sm rounded-xl px-3.5 py-2.5 mb-5">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Email</label>
          <div className="relative mb-4">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ampere.com"
              className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-all focus:border-accent-border focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">Password</label>
          <div className="relative mb-7">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-all focus:border-accent-border focus:ring-4 focus:ring-accent-soft"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
