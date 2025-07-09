"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type User = {
  id: string;
  username: string;
  role: string;
  avatar?: string;
  balance: {
    available: number;
    frozen: number;
  };
  bank?: {
    name: string;
    accountNumber: string;
    accountHolder: string;
  };
  verification?: {
    verified: boolean;
    cccdFront: string;
    cccdBack: string;
  };
  status?: {
    active: boolean;
    betLocked: boolean;
    withdrawLocked: boolean;
  };
  createdAt?: string;
  lastLogin?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function useAuthStandalone(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi khi khởi tạo để kiểm tra trạng thái đăng nhập
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

  // Kiểm tra xác thực
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json().catch((e) => {
          console.error("Error parsing auth response:", e);
          return null;
        });
        if (data?.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập
 const login = (newToken: string, newUser: any) => {
  setToken(newToken)
  setUser(newUser)
  localStorage.setItem("token", newToken)
  localStorage.setItem("user", JSON.stringify(newUser))
  document.cookie = `token=${newToken}; path=/; max-age=604800`
}
const logout = () => {
  setToken(null)
  setUser(null)
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

  // Đăng xuất
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (typeof window !== "undefined") localStorage.removeItem("token");
      setUser(null);
    } catch (error) {
      setUser(null);
    }
  };

  // Kiểm tra xác thực
  const isAuthenticated = () => user !== null;
  // Kiểm tra quyền admin
  const isAdmin = () => user?.role === "admin";
  // Làm mới thông tin user
  const refreshUser = async () => {
    await checkAuth();
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    refreshUser,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthStandalone();
  return (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}
