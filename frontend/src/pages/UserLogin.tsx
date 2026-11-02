import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import loginBg from "../assets/login-bg.jpg";

declare global {
  interface Window {
    google?: any;
    __googleGisInitialized?: boolean;
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "712852234051-demo.apps.googleusercontent.com";

function UserLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
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
            portal: "user",
          });

          if (res.data && res.data.token) {
            const role = (res.data.user?.role || "user").toLowerCase();
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", role);
            localStorage.setItem("portalContext", "user");
            localStorage.setItem("userName", res.data.user?.name || "Customer");
            localStorage.setItem("userEmail", res.data.user?.email || "");
            if (res.data.user?.picture) {
              localStorage.setItem("userPicture", res.data.user.picture);
            }

            // In User Portal, ALL authenticated users (including Admin & Super Admin) enter the User Dashboard (/shop)
            navigate("/shop");
          }
        } catch (err: any) {
          console.error("Google Auth Error:", err);
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
              cancel_on_tap_outside: true,
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
  }, [isLogin]);

  // Fallback trigger for direct One-Tap or manual prompt if GIS renders customized
  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is suppressed by browser policy, programmatic sign-in trigger
          console.log("GIS prompt notification:", notification);
        }
      });
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      setLoading(true);
      api
        .post("/users/login", {
          email: formData.email,
          password: formData.password,
          portal: "user",
        })
        .then((res) => {
          if (res.data && res.data.token) {
            const role = (res.data.user?.role || "user").toLowerCase();
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", role);
            localStorage.setItem("portalContext", "user");
            localStorage.setItem("userName", res.data.user?.name || "Customer");
            localStorage.setItem("userEmail", res.data.user?.email || formData.email);
            if (res.data.user?.picture) {
              localStorage.setItem("userPicture", res.data.user.picture);
            }
            // In User Portal, ALL authenticated accounts (including Admin & Super Admin) enter User Dashboard (/shop)
            navigate("/shop");
          } else {
            setError("Failed to get token from server");
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Invalid email or password");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      api
        .post("/users/register", {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        })
        .then(() => {
          setIsLogin(true);
          setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Registration failed");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <div className="min-h-screen bg-[#101112] text-white flex flex-col lg:flex-row font-sans">
      {/* LEFT SIDE — Premium Electronics Showcase with Neon Tech Background */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 border-r border-[#303236] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(16, 17, 18, 0.88), rgba(16, 17, 18, 0.65)), url(${loginBg})`
        }}
      >
        <div className="absolute top-10 -left-10 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-orange-400/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-xl shadow-sm">
            📦
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white">
              DELIVERY<span className="text-orange-500">HUB</span>
            </span>
            <p className="text-[10px] tracking-widest text-[#A5A5A5] uppercase font-bold">
              SMARTER TECH. BETTER LOGISTICS.
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202225] border border-[#303236] text-xs text-[#A5A5A5] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Same-day tech dispatch active in your area
          </div>

          <h2 className="text-4xl xl:text-6xl font-black tracking-tight leading-none text-white mb-4">
            UPGRADE TO <br />
            <span className="text-orange-500">NEXT GEN TECH</span>
          </h2>

          <p className="text-[#A5A5A5] text-base max-w-md leading-relaxed mb-8">
            Shop genuine consumer electronics, premium computer accessories, noise-cancelling headphones, and smart wearables with express dispatch.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md text-xs text-[#A5A5A5]">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#202225] border border-[#303236]">
              <span className="text-orange-500 text-lg">🛡️</span>
              <div>
                <strong className="text-white block font-semibold">Genuine Warranty</strong>
                <span>100% authentic tech products</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#202225] border border-[#303236]">
              <span className="text-orange-500 text-lg">⚡</span>
              <div>
                <strong className="text-white block font-semibold">Express Transit</strong>
                <span>Safe shockproof packaging</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#A5A5A5]">
          Need order help? Contact customer desk at <span className="text-white font-medium">support@deliveryhub.com</span>
        </div>
      </div>

      {/* RIGHT SIDE — Login / Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="lg:hidden flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-xl">
                📦
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                DELIVERY<span className="text-orange-500">HUB</span>
              </span>
            </div>

            <div className="inline-block px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              {isLogin ? "Customer Login" : "Member Registration"}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-[#A5A5A5]">
              {isLogin
                ? "Sign in to track orders, save shipping addresses, and explore electronics"
                : "Join thousands enjoying lightning-fast electronics delivery"}
            </p>
          </div>

          {/* EXACTLY ONE OFFICIAL GOOGLE LOGIN BUTTON */}
          <div className="pt-2">
            <div
              ref={googleBtnRef}
              onClick={handleGoogleClick}
              className="flex justify-center min-h-[44px]"
            >
              {/* Fallback stylized container while GIS loads */}
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
                <span>{googleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#303236] w-full"></div>
            <span className="bg-[#101112] px-3 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              OR EMAIL
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Alex Mercer"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#191A1C] border border-[#303236] rounded-xl text-white placeholder-[#A5A5A5]/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
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

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A5A5A5] mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#191A1C] border border-[#303236] rounded-xl text-white placeholder-[#A5A5A5]/40 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors text-sm"
                  required
                />
              </div>
            )}

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
              {loading ? "Please wait..." : isLogin ? "Sign In & Shop →" : "Create Account"}
            </button>
          </form>

          {/* Toggle and Admin Link */}
          <div className="pt-4 border-t border-[#303236] flex flex-col gap-3 text-center">
            <p className="text-xs text-[#A5A5A5]">
              {isLogin ? "New to DeliveryHub?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={toggleForm}
                className="text-orange-500 font-semibold hover:underline ml-1"
              >
                {isLogin ? "Sign up here" : "Sign in here"}
              </button>
            </p>

            <Link
              to="/admin/login"
              className="text-xs text-[#A5A5A5] hover:text-orange-400 transition-colors"
            >
              Are you an administrator? Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
