import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import {
  BotMessageSquare,
  BrainCircuit,
  Eye,
  EyeOff,
  Lock,
  ScanFace,
} from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  // Use studentID (not email) for user input.
  const [formData, setFormData] = useState({
    studentID: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the trimmed studentID (to remove accidental spaces)
    const studentID = formData.studentID.trim();
    const password = formData.password;

    console.log("Trimmed Student ID:", studentID);

    // Manually enforce our regex check:
    if (!/^b\d{7}$/.test(studentID)) {
      alert("ID error: use 'b' followed by 7 digits.");
      return;
    }

    // Map the studentID to a dummy email (as sign-up did) so backend receives an email.
    const payload = {
      email: studentID + "@mdist.uz",
      password: password,
    };

    login(payload);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Heading */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center
                group-hover:bg-primary/20 transition-colors"
              >
                <BotMessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* Form with noValidate disables the browser's native validation */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Student ID Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Student ID</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ScanFace className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full pl-10"
                  placeholder="Student ID (e.g., b2102387)"
                  value={formData.studentID}
                  onChange={(e) =>
                    setFormData({ ...formData, studentID: e.target.value })
                  }
                  onBlur={(e) =>
                    setFormData({
                      ...formData,
                      studentID: e.target.value.trim(),
                    })
                  }
                  pattern="^b\\d{7}$"
                  title="ID error: use 'b' followed by 7 digits."
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full hover:bg-primary/80 hover:scale-105 transition-all duration-300"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <BrainCircuit className="h-5 w-5 animate-spin" /> Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don't have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title="Unlock Your Academic Potential"
        subtitle="Easily connect with staff, manage your academics, and achieve your goals."
      />
    </div>
  );
};

export default LoginPage;
