import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setIsSignUp(false);
          setError(null);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 md:p-6 font-bangla">
      {/* Main Grid Wrapper */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
        {/* LEFT SIDE: Brand & Blueprint Banner */}
        <div className="relative bg-[#1152a3] text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden">
          {/* Decorative Blueprint Technical Overlays */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl"></div>

          {/* Header Branding */}
          <div className="relative z-10 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 stroke-[2.5]" />
            <span className="font-bold tracking-wider text-lg">
              SUPER SHOP POS
            </span>
          </div>

          {/* Central Typography & Visuals */}
          <div className="relative z-10 my-auto text-center flex flex-col items-center">
            {/* Cash Counter Mini-Illustration Graphic */}
            <div className="mb-8 opacity-90 p-4 border border-white/20 rounded-lg bg-white/5 backdrop-blur-sm max-w-xs w-full">
              <div className="w-40 h-24 mx-auto border-2 border-dashed border-white/30 rounded flex flex-col items-center justify-center text-xs text-blue-200">
                <div className="w-12 h-8 bg-white/20 rounded mb-1"></div>
                <span>POS Station</span>
              </div>
            </div>

            <p className="text-blue-100 text-sm md:text-base mb-2 font-medium tracking-wide">
              Welcome to SuperShop
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Ready for a new day of sales?
            </h1>
            <div className="w-12 h-1 bg-white rounded-full mb-6 mx-auto"></div>
            <p className="text-blue-100/80 text-sm max-w-xs mx-auto">
              Enter your credentials to access the full register
            </p>
          </div>

          <div className="hidden md:block text-xs text-blue-200/50">
            Secure Terminal Connection
          </div>
        </div>

        {/* RIGHT SIDE: Interactive Login Engine Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Form Header */}
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Register Login
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enter your ID and Password to start your shift. Keep your
                details secure.
              </p>
            </div>

            {/* Shadcn style segmented auth toggle bar */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                  !isSignUp
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("signIn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                  isSignUp
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("signUp")}
              </button>
            </div>

            {/* Alerts & Errors */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Fields Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Register ID Input Row */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  {t("email")}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none placeholder:text-slate-400"
                    placeholder="e.g., REG1234"
                  />
                </div>
              </div>

              {/* Password Input Row */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  {t("password")}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password Row (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={isSignUp}
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none placeholder:text-slate-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Extras Option Frame */}
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 accent-blue-600"
                  />
                  <span>Keep me logged in (Session)</span>
                </label>
                <button
                  type="button"
                  className="text-blue-600 hover:underline transition-all"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Interactive Submit Trigger */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="uppercase tracking-wider">
                    {isSignUp ? t("createAccount") : "LOGIN"}
                  </span>
                )}
              </button>
            </form>

            {/* Combined System Footer & Copyright Info Area */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-1">
              <div className="text-xs text-slate-400 font-medium">
                System version 2.4.1 | Contact IT for support
              </div>
              <div className="text-xs text-slate-500 font-semibold tracking-wide">
                © ২০২৬ সুপার শপ POS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
