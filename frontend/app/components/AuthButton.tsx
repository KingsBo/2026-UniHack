"use client";

interface AuthStatus {
  authenticated: boolean;
  user?: {
    login: string;
    name?: string;
    avatar_url?: string;
  };
}

interface AuthButtonProps {
  authStatus: AuthStatus | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function AuthButton({ authStatus, onLogin, onLogout }: AuthButtonProps) {
  if (!authStatus) {
    return null;
  }

  if (authStatus.authenticated) {
    return (
      <div className="flex items-center gap-3">
        {authStatus.user?.avatar_url && (
          <img
            src={authStatus.user.avatar_url}
            alt={authStatus.user.login}
            className="h-8 w-8 rounded-full"
          />
        )}
        <span className="text-sm text-zinc-400">{authStatus.user?.login}</span>
        <button
          onClick={onLogout}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLogin}
      className="rounded-lg bg-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600"
    >
      Login with GitHub
    </button>
  );
}

