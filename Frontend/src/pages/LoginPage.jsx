import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import AuthImagePattern from "../components/AuthImagePattern";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950 text-white overflow-hidden pt-16">
      {/* Left Column: Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10">
        {/* Background Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8">
          {/* Logo & Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(56,189,248,0.35)] relative group">
                <MessageSquare className="size-6 z-10 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 rounded-2xl bg-sky-400/25 blur-md" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Gupshup
              </span>
            </div>

            <div className="pt-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-white/50 mt-1.5 leading-relaxed">
                Sign in to continue chatting, making HD calls, and connecting with groups.
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block pl-0.5">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pl-0.5">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-4.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Sign Up */}
            <div className="pt-6 mt-6 border-t border-white/10 text-center text-xs text-white/60">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-sky-400 hover:text-sky-300 font-bold ml-1 transition-colors underline-offset-4 hover:underline"
              >
                Create one now
              </Link>
            </div>
          </div>

          {/* Trust Footnote */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-white/40">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Encrypted WebSockets & WebRTC peer transmission</span>
          </div>
        </div>
      </div>

      {/* Right Column: Modern Live Chat Showcase */}
      <AuthImagePattern
        title="Connect Beyond Limits"
        subtitle="Enjoy seamless group messaging, crystal voice notes, and multi-user video calling on any device."
      />
    </div>
  );
};

export default LoginPage;