import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import {
  BotMessageSquare,
  BrainCircuit,
  Eye,
  EyeOff,
  Lock,
  ScanFace,
} from "lucide-react";
import { toast } from "react-hot-toast";

const LoginPage = () => {
  const { login, isLoggingIn } = useAuthStore();
  const [userType, setUserType] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Basic validation
      if (!inputs.email || !inputs.password) {
        toast.error("Please fill in all fields");
        return;
      }

      // Validate email/student ID format
      if (userType === "student") {
        // Student ID validation - must be b followed by 7 digits
        const studentIdPattern = /^b\d{7}$/i;
        if (!studentIdPattern.test(inputs.email)) {
          toast.error(
            "Student ID must start with 'b' followed by 7 digits (e.g., b2102387)"
          );
          return;
        }
      }

      // Format email based on user type
      const email =
        userType === "student"
          ? `${inputs.email.toLowerCase()}@mdis.uz`
          : inputs.email.includes("@")
          ? inputs.email
          : `${inputs.email}@mdis.uz`;

      await login({
        email,
        password: inputs.password,
        userType,
      });
    } catch (error) {
      console.error("Login error:", error);
      // The error message will be shown by the toast notification in the store
    }
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

          {/* User Type Toggle */}
          <div className="flex justify-center gap-4 p-1 bg-base-200 rounded-lg">
            <button
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                userType === "student"
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-300"
              }`}
              onClick={() => setUserType("student")}
              type="button"
            >
              Student
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                userType === "other"
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-300"
              }`}
              onClick={() => setUserType("other")}
              type="button"
            >
              Other
            </button>
          </div>

          {/* Form with noValidate disables the browser's native validation */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Email/Student ID */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {userType === "student"
                    ? "Student ID"
                    : userType === "staff"
                    ? "Email Address"
                    : "Manager ID"}
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ScanFace className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  required
                  className="input input-bordered w-full pl-10"
                  placeholder={
                    userType === "student"
                      ? "Enter your student ID (e.g., b2102387)"
                      : userType === "staff"
                      ? "Enter your email address"
                      : "Enter your manager ID"
                  }
                  value={inputs.email}
                  onChange={(e) =>
                    setInputs({ ...inputs, email: e.target.value.trim() })
                  }
                />
                {userType === "staff" && !inputs.email.includes("@") && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
                    @mdis.uz
                  </span>
                )}
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
                  placeholder="Enter your password"
                  value={inputs.password}
                  onChange={(e) =>
                    setInputs({ ...inputs, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content/60"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
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
                <span className="loading loading-spinner"></span>
              ) : (
                "Login"
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
