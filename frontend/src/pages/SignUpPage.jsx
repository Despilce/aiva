import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ScanFace,
  Brain,
  UserRoundPlus,
} from "lucide-react";
import { Link } from "react-router-dom";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    studentID: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return toast.error("Full name is required");
    }
    if (!formData.studentID.trim()) {
      return toast.error("Student ID is required");
    }
    if (!/^b\d{7}$/.test(formData.studentID.trim())) {
      return toast.error("ID error: use 'b' followed by 7 digits.");
    }
    if (!formData.password.trim()) {
      return toast.error("Password is required");
    }
    if (formData.password.trim().length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm() === true) {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.studentID.trim() + "@mdist.uz",
        studentID: formData.studentID.trim(),
        password: formData.password.trim(),
      };

      console.log("Payload:", payload);
      signup(payload);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO and Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <UserRoundPlus className="size-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold mt-2">Registration</h1>
              <p
                className="text-base mt-2"
                style={{
                  color: "var(--secondary-color)",
                  transition: "color 0.3s ease",
                }}
              >
                Join for institutional support.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Full name (e.g., Syed Rizwan)"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Student ID Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Student ID</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ScanFace className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Student ID (e.g., b2102387)"
                  value={formData.studentID}
                  onChange={(e) =>
                    setFormData({ ...formData, studentID: e.target.value })
                  }
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
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="Set a password (min. 8 chars)"
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
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-full hover:bg-primary/80 hover:scale-105 transition-all duration-300"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Brain className="size-5 animate-spin" /> Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <AuthImagePattern
        title="Connect with Your Institution"
        subtitle="Access resources, communicate with staff, and manage your academic needs."
      />
    </div>
  );
};

export default SignUpPage;
