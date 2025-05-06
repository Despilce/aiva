import mongoose from "mongoose";

const departmentMessageSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "solved"],
      default: "open",
    },
    acceptedAt: {
      type: Date,
    },
    solvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const DepartmentMessage = mongoose.model(
  "DepartmentMessage",
  departmentMessageSchema
);

export default DepartmentMessage;
