import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";

declare global {
  interface Window {
    google?: any;
    __googleGisInitialized?: boolean;
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "712852234051-demo.apps.googleusercontent.com";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services
  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      if (response && response.credential) {
        try {
          setGoogleLoading(true);
          setError("");

          const res = await api.post("/users/google-login", {
            idToken: response.credential,
            portal: "admin",
          });

          if (res.data && res.data.token) {
            const role = (res.data.user?.role || "user").toLowerCase();
            if (role !== "admin" && role !== "super_admin") {
              setError(
                "You are not authorized to access the admin portal."
              );
              setGoogleLoading(false);
              return;
            }

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", role);
            localStorage.setItem("portalContext", "admin");
            localStorage.setItem("userName", res.data.user?.name || "Administrator");
            localStorage.setItem("userEmail", res.data.user?.email || "");
            if (res.data.user?.picture) {
              localStorage.setItem("userPicture", res.data.user.picture);
            }
            navigate("/dashboard");
          }
        } catch (err: any) {
          console.error("Admin Google Login Error:", err);
          setError(err.response?.data?.message || "Google authentication failed.");
        } finally {
          setGoogleLoading(false);
        }
      }
    };

    const renderGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          if (!window.__googleGisInitialized) {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
              auto_select: false,
              itp_support: true,
              use_fedcm_for_prompt: false,
            });
            window.__googleGisInitialized = true;
          }

          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 380,
            logo_alignment: "left",
          });
        } catch (e) {
          console.warn("Google GIS init error:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const checkGisInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGisInterval);
          renderGoogleButton();
        }
      }, 150);
      return () => clearInterval(checkGisInterval);
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    api
      .post("/users/login", {
        email: formData.email,
        password: formData.password,
        portal: "admin",
      })
      .then((res) => {
        if (res.data && res.data.token) {
          const role = (res.data.user?.role || "user").toLowerCase();
          if (role !== "admin" && role !== "super_admin") {
            setError("You are not authorized to access the admin portal.");
            setLoading(false);
            return;
          }
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", role);
          localStorage.setItem("portalContext", "admin");
          localStorage.setItem("userName", res.data.user?.name || "Administrator");
          localStorage.setItem("userEmail", res.data.user?.email || formData.email);
          navigate("/dashboard");
        } else {
          setError("Failed to authenticate session.");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Invalid credentials for admin account.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#101112] text-white flex flex-col lg:flex-row font-sans">
      {/* LEFT SIDE — Cinematic Dark Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#191A1C] relative overflow-hidden flex-col justify-between p-12 border-r border-[#303236]">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#FF8A24]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-xl shadow-sm">
            📦
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">
              DELIVERY<span className="text-orange-500">HUB</span>
            </h1>
            <p className="text-[10px] tracking-widest text-orange-400 uppercase font-bold">
              ADMINISTRATION PORTAL
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202225] border border-[#303236] text-xs text-[#A5A5A5] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Role-Based Access Control Active
          </div>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white mb-4">
            GOVERNANCE & <br />
            <span className="text-orange-500">ADMIN OPS.</span>
          </h2>

          <p className="text-[#A5A5A5] text-base max-w-md leading-relaxed mb-8">
            Access secure order dispatch, partner tracking, catalog inventory, and platform administration.
          </p>

          <div className="bg-[#202225] p-5 rounded-2xl border border-[#303236] max-w-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private Admin Policy
            </div>
            <p className="text-xs text-[#A5A5A5] leading-relaxed">
              Public administrator signups are strictly disabled. Only the designated Main Administrator (SUPER_ADMIN) can create administrator accounts.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#A5A5A5]">
          © {new Date().getFullYear()} DeliveryHub Technologies Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE — Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-xl">
                📦
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                DELIVERY<span className="text-orange-500">HUB</span>
              </span>
            </div>

            <div className="inline-block px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              Restricted Portal
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Administrator Sign In
            </h2>
            <p className="text-sm text-[#A5A5A5]">
              Authenticate via verified Google Identity or administrative credentials.
            </p>
          </div>

          {/* EXACTLY ONE OFFICIAL GOOGLE LOGIN BUTTON */}
          <div>
            <div ref={googleBtnRef} className="flex justify-center min-h-[44px]">
              <button
                type="button"
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-sm font-semibold transition-all shadow-sm focus:outline-none border border-gray-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{googleLoading ? "Verifying Google Account..." : "Continue with Google"}</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#303236] w-full"></div>
            <span className="bg-[#101112] px-3 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              OR CREDENTIALS
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                Work Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="admin@deliveryhub.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#191A1C] border border-[#303236] rounded-xl text-white placeholder-[#A5A5A5]/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#191A1C] border border-[#303236] rounded-xl text-white placeholder-[#A5A5A5]/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#A5A5A5] hover:text-white text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wide shadow-sm transition-all disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating..." : "Access Dashboard →"}
            </button>
          </form>

          {/* Invitation Notice (No public registration link!) */}
          <div className="pt-4 border-t border-[#303236] space-y-4 text-center">
            <div className="p-3.5 rounded-xl bg-[#191A1C] border border-[#303236] text-xs text-gray-400 text-left">
              <span className="font-semibold text-white block mb-0.5">Need Administrator Access?</span>
              Admin accounts are invitation-only. Please contact the Main Administrator (SUPER_ADMIN) to receive an invitation.
            </div>

            <Link
              to="/"
              className="inline-block text-xs text-[#A5A5A5] hover:text-white transition-colors"
            >
              ← Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
