import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    biography: {
      type: String,
      default: "",
    },
    userType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    position: {
      type: String,
      enum: ["Staff", "Manager"],
      required: function () {
        return this.userType === "staff";
      },
    },
    department: {
      type: String,
      enum: [
        "SSU(Student Support Unit)",
        "IT department",
        "EU(Exam Unit)",
        "LRC(Learning Resource Center)",
        "CR(Central Registry)",
      ],
      required: function () {
        return this.userType === "staff";
      },
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    // Performance metrics for staff
    performanceMetrics: {
      type: {
        percentage: {
          type: Number,
          default: 0,
        },
        totalIssues: {
          type: Number,
          default: 0,
        },
        solvedIssues: {
          type: Number,
          default: 0,
        },
      },
      default: {
        percentage: 0,
        totalIssues: 0,
        solvedIssues: 0,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
