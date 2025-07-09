"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  role: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          if (typeof storedToken !== "string" || storedToken.trim() === "") {
            console.warn("Invalid token found in localStorage");
            return;
          }

          const parsedUser = JSON.parse(storedUser);
          if (!parsedUser || typeof parsedUser !== "object") {
            console.warn("Invalid user data found in localStorage");
            return;
          }

          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to initialize auth from localStorage:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    if (!newToken || typeof newToken !== "string" || newToken.trim() === "") {
      throw new Error("Invalid token provided");
    }
    if (!newUser || typeof newUser !== "object") {
      throw new Error("Invalid user provided");
    }

    const previousToken = token;
    const previousUser = user;

    setToken(newToken);
    setUser(newUser);

    try {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (error) {
      console.error("Failed to save auth data to localStorage:", error);
      setToken(previousToken);
      setUser(previousUser);
      throw new Error("Failed to persist authentication data");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Failed to clear auth data from localStorage:", error);
    }
  };

  const isAuthenticated = () => {
    return !!token && token.trim() !== "";
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
  };
}
