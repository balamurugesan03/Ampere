import React from 'react';
import { ChevronDown, Loader2, X, type LucideIcon } from 'lucide-react';

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] transition-colors ${
        hover ? 'hover:border-border-strong' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-accent text-[#06170c] hover:bg-accent-hover shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_14px_-4px_var(--color-accent-border)]',
    secondary: 'bg-surface-2 text-fg border border-border hover:border-border-strong hover:bg-surface-hover',
    danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger-soft',
    ghost: 'bg-transparent text-muted hover:text-fg hover:bg-surface-hover',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />
      )}
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-all focus:border-accent-border focus:ring-4 focus:ring-accent-soft ${className}`}
    />
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-all focus:border-accent-border focus:ring-4 focus:ring-accent-soft resize-none ${className}`}
    />
  );
}

export function Select({
  children,
  className = '',
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={`w-full appearance-none bg-surface-2 border border-border rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-fg outline-none transition-all focus:border-accent-border focus:ring-4 focus:ring-accent-soft ${className}`}
      >
        {children}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
    </div>
  );
}

const badgeDot: Record<string, string> = {
  default: 'bg-subtle',
  green: 'bg-accent',
  red: 'bg-danger',
  yellow: 'bg-warning',
};

const badgeStyle: Record<string, string> = {
  default: 'bg-surface-2 text-muted border border-border',
  green: 'bg-accent-soft text-accent border border-accent-border',
  red: 'bg-danger-soft text-danger border border-danger/30',
  yellow: 'bg-warning-soft text-warning border border-warning/30',
};

export function Badge({
  children,
  tone = 'default',
  dot = true,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'green' | 'red' | 'yellow';
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle[tone]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${badgeDot[tone]}`} />}
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[var(--shadow-pop)] animate-scale-in">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border sticky top-0 bg-surface">
          <div>
            <h2 className="text-lg font-bold text-fg font-[family-name:var(--font-display)]">{title}</h2>
            {description && <p className="text-xs text-muted mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-subtle hover:text-fg hover:bg-surface-hover rounded-lg p-1.5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-7 gap-4">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-accent-soft border border-accent-border flex items-center justify-center shrink-0 mt-0.5">
            <Icon size={20} className="text-accent" strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-fg font-[family-name:var(--font-display)] tracking-tight">
            {title}
          </h1>
          {description && <p className="text-sm text-muted mt-1 max-w-2xl">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-muted py-8 justify-center text-sm">
      <Loader2 size={16} className="animate-spin text-accent" />
      {label ?? 'Loading...'}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
          <Icon size={24} className="text-subtle" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-fg font-semibold text-sm">{title}</p>
      {description && <p className="text-muted text-xs mt-1.5 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'default' | 'green' | 'red' | 'yellow';
}) {
  const toneColor: Record<string, string> = {
    default: 'text-fg bg-surface-2 border-border',
    green: 'text-accent bg-accent-soft border-accent-border',
    red: 'text-danger bg-danger-soft border-danger/30',
    yellow: 'text-warning bg-warning-soft border-warning/30',
  };
  return (
    <Card className="!p-4 relative overflow-hidden" hover>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted font-medium">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${toneColor[tone]}`}>
            <Icon size={15} strokeWidth={2.25} />
          </div>
        )}
      </div>
      <p className="text-[26px] leading-none font-bold text-fg font-[family-name:var(--font-display)] tracking-tight">
        {value}
      </p>
    </Card>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-gradient-to-br from-accent to-[#1c7a3a] text-[#06170c] font-bold flex items-center justify-center shrink-0"
    >
      {initials}
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    </Card>
  );
}

export function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-3.5 font-semibold text-muted text-xs uppercase tracking-wide border-b border-border bg-surface-2/60 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className = '',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td className={`px-4 py-3.5 border-b border-border ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="last:[&>td]:border-0 hover:bg-surface-hover/60 transition-colors">{children}</tr>;
}
