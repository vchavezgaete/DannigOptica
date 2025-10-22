import { useEffect, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextType } from "./AuthContext";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setTokenState(t);
  }, []);

  const login  = ({ token: t }: { token: string }) => setToken(t);
  const logout = () => setToken(null);

  const value: AuthContextType = { token, setToken, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
