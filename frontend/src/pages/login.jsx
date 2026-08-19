import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/deliverylogo.png";
import api from "../../api/api";

function Login() {
  
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const toggleForm = () => {
    setIsLogin(!isLogin); setError("");
    setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      api.post("/users/login", {
        email: formData.email,
        password: formData.password
      })
      .then(res => {
        if (res.data && res.data.token) {
          // Check if user is admin
          const role = res.data.user?.role || 'user';
          if (role !== 'admin') {
            setError("Access denied. This login is for administrators only.");
            return;
          }
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", role);
          localStorage.setItem("userName", res.data.user?.name || "Administrator");
          localStorage.setItem("userEmail", res.data.user?.email || formData.email || "Admin");
          navigate("/dashboard");
        } else {
          setError("Failed to get token from server");
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || "Invalid email or password");
      });
    } 
    else {
      // REGISTER MODE
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

      api.post("/users/register", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: "admin"
      })
      .then(() => {
        setIsLogin(true);
        setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
      })
      .catch(err => {
        setError(err.response?.data?.message || "Registration failed");
      });
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE — Image */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('https://i.postimg.cc/fRKfLYW1/delivery-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-blue-900/20"></div>
        <div className="relative z-10 flex flex-col justify-end p-12">
          <h2 className="text-4xl font-bold mb-2 text-white">DeliveryHub</h2>      
          <p className="text-lg opacity-90">
           On time. Every time. That's our route.⏱️
          </p>
        </div>
      </div>

      {/*right sidee — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">  
             <div className="flex justify-center mb-4">
                    <img
                      src={logo}
                      className="w-56 h-auto p-"
                    />
                  </div>           
            <p className="text-gray-500 mt-1">
              {isLogin ? "Admin Sign In" : "Create admin account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email" name="email" placeholder="admin@deliveryhub.com" value={formData.email} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                ⚠️ {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={toggleForm} className="text-blue-600 font-medium hover:underline">
                {isLogin ? "Register here" : "Sign in here"}
              </button>
            </p>
          </div>

          {/* User login link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;