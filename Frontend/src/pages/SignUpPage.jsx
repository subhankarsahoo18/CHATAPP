import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    mobileNumber: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.username.trim()) return toast.error("Username is required");
    if (!formData.mobileNumber.trim()) return toast.error("Mobile number is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950 text-white overflow-hidden pt-16">
      {/* Left Column: Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Background Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-6 my-auto">
          {/* Logo & Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(56,189,248,0.35)] relative group">
                <MessageSquare className="size-5.5 z-10 transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 rounded-2xl bg-sky-400/25 blur-md" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Gupshup
              </span>
            </div>

            <div className="pt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Create your account
              </h1>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Join our real-time messenger community to chat, share media, and make calls.
              </p>
            </div>
          </div>

          {/* Sign Up Form Card */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name & Username in 2-col on sm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block pl-0.5">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Morgan"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block pl-0.5">
                    Username
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-sky-400 transition-colors text-xs font-bold pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="alex_morgan"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block pl-0.5">
                  Mobile Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 234 567 8900"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block pl-0.5">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block pl-0.5">
                  Password (min. 6 characters)
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40 group-focus-within:text-sky-400 transition-colors pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/25 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creating your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Sign In */}
            <div className="pt-5 mt-5 border-t border-white/10 text-center text-xs text-white/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-sky-400 hover:text-sky-300 font-bold ml-1 transition-colors underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-white/40">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Secure account creation with authenticated JWT sessions</span>
          </div>
        </div>
      </div>

      {/* Right Column: Modern Live Chat Showcase */}
      <AuthImagePattern
        title="Stay Connected Everywhere"
        subtitle="Experience real-time messaging, instant voice notes, group collaboration, and crystal WebRTC audio and video calling."
      />
    </div>
  );
};

export default SignUpPage;