import { useState } from "react";
import { Link } from "react-router-dom";
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

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const { signup, isSigningUp } = useAuthStore();
  const [userType, setUserType] = useState("student");
  const [inputs, setInputs] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "Staff",
    department: "SSU(Student Support Unit)",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate password match
      if (inputs.password !== inputs.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // Validate password length
      if (inputs.password.length < 6) {
        toast.error("Password must be at least 6 characters");
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
      } else {
        // Staff/Manager validation
        if (!inputs.position || !inputs.department) {
          toast.error("Please select both position and department");
          return;
        }
        // Email validation - just check minimum length
        if (inputs.email.length < 3) {
          toast.error("Email prefix must be at least 3 characters");
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

      // Create signup data object
      const signupData = {
        fullName: inputs.fullName.trim(),
        email,
        password: inputs.password,
        userType,
      };

      // Add position and department for staff/manager
      if (userType === "other") {
        signupData.position = inputs.position;
        signupData.department = inputs.department;
      }

      await signup(signupData);
    } catch (error) {
      console.error("Signup error:", error);
      // The error message will be shown by the toast notification in the store
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
                  placeholder={
                    userType === "student"
                      ? "Full name (e.g., Izzatillo Tursunov)"
                      : "Full name (e.g., Syed Rizwan)"
                  }
                  value={inputs.fullName}
                  onChange={(e) =>
                    setInputs({ ...inputs, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Email/Student ID Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {userType === "student" ? "Student ID" : "Email Address"}
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {userType === "student" ? (
                    <ScanFace className="size-5 text-base-content/40" />
                  ) : (
                    <User className="size-5 text-base-content/40" />
                  )}
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder={
                    userType === "student"
                      ? "Enter your student ID (e.g., b2102387)"
                      : "Enter your email address"
                  }
                  value={inputs.email}
                  onChange={(e) =>
                    setInputs({ ...inputs, email: e.target.value.trim() })
                  }
                />
                {userType === "other" && !inputs.email.includes("@") && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
                    @mdis.uz
                  </span>
                )}
              </div>
            </div>

            {/* Position and Department Fields (for staff only) */}
            {userType === "other" && (
              <>
                {/* Position Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Position</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={inputs.position}
                    onChange={(e) =>
                      setInputs({ ...inputs, position: e.target.value })
                    }
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                {/* Department Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Department</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={inputs.department}
                    onChange={(e) =>
                      setInputs({ ...inputs, department: e.target.value })
                    }
                  >
                    <option value="SSU(Student Support Unit)">
                      SSU(Student Support Unit)
                    </option>
                    <option value="IT department">IT department</option>
                    <option value="EU(Exam Unit)">EU(Exam Unit)</option>
                    <option value="LRC(Learning Resource Center)">
                      LRC(Learning Resource Center)
                    </option>
                    <option value="CR(Central Registry)">
                      CR(Central Registry)
                    </option>
                    <option value="Academic department">
                      Academic department
                    </option>
                  </select>
                </div>
              </>
            )}

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
                  type="password"
                  className="input input-bordered w-full pl-10"
                  placeholder="Set a password (min. 8 chars)"
                  value={inputs.password}
                  onChange={(e) =>
                    setInputs({ ...inputs, password: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type="password"
                  className="input input-bordered w-full pl-10"
                  placeholder="Confirm your password"
                  value={inputs.confirmPassword}
                  onChange={(e) =>
                    setInputs({ ...inputs, confirmPassword: e.target.value })
                  }
                />
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
