import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase.js";
import { api } from "../lib/api.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [pageParams, setPageParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const refreshTimerRef = useRef(null);

  const navigate = useCallback((p, params = {}) => { setPage(p); setPageParams(params); }, []);

  const addNotification = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setNotifications(n => [...n, { id, msg, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 4500);
  }, []);

  const loadProfile = useCallback(async (sess) => {
    if (!sess?.access_token) { setUser(null); setTenant(null); return; }
    try {
      api.setToken(sess.access_token);
      // Load user profile directly from Supabase (works without backend)
      const { data: u } = await supabase
        .from("users")
        .select("*, tenants(*)")
        .eq("auth_user_id", sess.user.id)
        .single();
      if (u) {
        setUser({ id: u.id, name: u.name, email: u.email, role: u.role, must_change_password: u.must_change_password });
        setTenant(u.tenants || null);
      } else {
        // Fallback: set basic user from session
        setUser({ id: sess.user.id, name: sess.user.email, email: sess.user.email, role: "super_admin" });
        setTenant(null);
      }
      scheduleRefresh(sess);
    } catch { setUser(null); setTenant(null); }
  }, []);

  function scheduleRefresh(sess) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!sess?.expires_at) return;
    const expiresIn = (sess.expires_at * 1000) - Date.now() - 60000; // refresh 1 min before expiry
    if (expiresIn <= 0) { refreshSession(); return; }
    refreshTimerRef.current = setTimeout(refreshSession, Math.max(expiresIn, 0));
  }

  async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) { signOut(); return; }
    setSession(data.session);
    api.setToken(data.session.access_token);
    scheduleRefresh(data.session);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadProfile(session).finally(() => setLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) {
        setUser(null); setTenant(null); api.clearToken();
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        setLoading(false);
      } else {
        loadProfile(session);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadProfile]);

  const signOut = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await supabase.auth.signOut();
    api.clearToken();
    setUser(null); setTenant(null); setSession(null);
    setPage("dashboard");
  };

  return (
    <AppContext.Provider value={{
      session, user, tenant, loading, page, pageParams, navigate,
      sidebarOpen, setSidebarOpen, notifications, addNotification,
      signOut, refreshUser: () => loadProfile(session)
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
