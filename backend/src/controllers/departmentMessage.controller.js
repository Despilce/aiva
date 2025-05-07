import DepartmentMessage from "../models/departmentMessage.model.js";
import User from "../models/user.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getDepartmentMessages = async (req, res) => {
  try {
    const { department } = req.params;
    const user = req.user;
    let query = { department };
    let messages = await DepartmentMessage.find(query)
      .sort({ createdAt: 1 })
      .populate("assignedStaff", "fullName");
    // Manager: full access
    if (user.userType === "manager" && user.department === department) {
      return res.json(Array.isArray(messages) ? messages : []);
    }
    // Find the current active chat (open or assigned, not solved/not_solved)
    let activeChat = null;
    if (user.userType === "student") {
      // Find the latest open or assigned issue for this student
      activeChat = messages
        .slice()
        .reverse()
        .find(
          (msg) =>
            String(msg.senderId) === String(user._id) &&
            (msg.status === "open" || msg.status === "assigned")
        );
      if (activeChat) {
        // Show all messages for this chat (same senderId, and if assigned, same assignedStaff, after acceptedAt)
        const chatMessages = messages.filter(
          (msg) =>
            String(msg.senderId) === String(user._id) &&
            ((activeChat.status === "open" && msg.status === "open") ||
              (activeChat.status === "assigned" &&
                ((msg.status === "assigned" &&
                  msg.assignedStaff &&
                  String(msg.assignedStaff._id) ===
                    String(activeChat.assignedStaff._id)) ||
                  msg.createdAt >= activeChat.acceptedAt)))
        );
        return res.json(chatMessages);
      }
      // Otherwise, show only their own messages and replies
      messages = messages.filter(
        (msg) =>
          String(msg.senderId) === String(user._id) ||
          (msg.assignedStaff &&
            String(msg.assignedStaff._id) === String(user._id))
      );
      return res.json(messages);
    }
    if (user.userType === "staff") {
      // Find the latest assigned issue for this staff that is not solved/not_solved
      activeChat = messages
        .slice()
        .reverse()
        .find(
          (msg) =>
            msg.status === "assigned" &&
            msg.assignedStaff &&
            String(msg.assignedStaff._id) === String(user._id)
        );
      if (activeChat) {
        // Show all messages for this chat (same senderId, after acceptedAt)
        const chatMessages = messages.filter(
          (msg) =>
            String(msg.senderId) === String(activeChat.senderId) &&
            (msg.createdAt >= activeChat.acceptedAt ||
              msg._id === activeChat._id)
        );
        return res.json(chatMessages);
      }
      // If no active assigned chat, show all open student issues (not assigned) for this department
      messages = messages.filter(
        (msg) =>
          msg.status === "open" &&
          msg.senderType === "student" &&
          !msg.assignedStaff
      );
      return res.json(messages);
    }
    // Default: return nothing
    return res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch department messages" });
  }
};

export const sendDepartmentMessage = async (req, res) => {
  try {
    const { department } = req.params;
    const { text } = req.body;
    const sender = req.user;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text required" });
    }
    // Allow students to send messages at any time ONLY if they have no open/assigned issue
    // Allow assigned staff to send messages after accepting
    let allow = false;
    let isNewIssue = false;
    if (sender.userType === "student") {
      // Check if student has any open or assigned issue
      const existing = await DepartmentMessage.findOne({
        department,
        senderId: sender._id,
        status: { $in: ["open", "assigned"] },
      });
      if (!existing) {
        allow = true;
        isNewIssue = true;
      } else {
        // If assigned, allow only if the assigned chat is still active (not solved/not_solved)
        if (existing.status === "assigned") {
          allow = true;
        }
      }
    } else if (sender.userType === "staff") {
      // Find the latest assigned message for this department that is not solved/not_solved
      const latestAssigned = await DepartmentMessage.findOne({
        department,
        status: "assigned",
        assignedStaff: sender._id,
      }).sort({ acceptedAt: -1 });
      if (latestAssigned) {
        allow = true;
      }
    }
    if (!allow) {
      return res.status(403).json({
        error:
          "You cannot send a new message until your previous issue is handled by staff.",
      });
    }
    // If new issue, create as open; otherwise, add as a reply (assigned chat)
    let message;
    if (isNewIssue) {
      message = await DepartmentMessage.create({
        department,
        senderId: sender._id,
        senderName: sender.fullName,
        senderType: sender.userType,
        text,
        profilePic: sender.profilePic || "",
        createdAt: new Date(),
        status: "open",
      });
    } else {
      message = await DepartmentMessage.create({
        department,
        senderId: sender._id,
        senderName: sender.fullName,
        senderType: sender.userType,
        text,
        profilePic: sender.profilePic || "",
        createdAt: new Date(),
      });
    }
    res.status(201).json(message);
    // Emit socket event to all staff in department and the student
    const staff = await User.find({ department, userType: "staff" });
    staff.forEach((s) => {
      const staffSocket = getReceiverSocketId(s._id.toString());
      if (staffSocket) {
        io.to(staffSocket).emit("departmentMessage:new", message);
      }
    });
    // Emit to student
    const studentSocket = getReceiverSocketId(sender._id.toString());
    if (studentSocket) {
      io.to(studentSocket).emit("departmentMessage:new", message);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to send department message" });
  }
};

export const acceptDepartmentMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const staff = req.user;
    const message = await DepartmentMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.status !== "open") {
      return res
        .status(400)
        .json({ error: "Message already assigned or solved" });
    }
    // Prevent staff from accepting if they already have an assigned chat
    const alreadyAssigned = await DepartmentMessage.findOne({
      department: message.department,
      status: "assigned",
      assignedStaff: staff._id,
    });
    if (alreadyAssigned) {
      return res.status(403).json({
        error:
          "You already have an assigned issue. Finish it before accepting another.",
      });
    }
    message.assignedStaff = staff._id;
    message.status = "assigned";
    message.acceptedAt = new Date();
    await message.save();
    res.status(200).json(message);
    // Emit socket event to student and assigned staff
    const studentSocket = getReceiverSocketId(message.senderId.toString());
    const staffSocket = getReceiverSocketId(message.assignedStaff.toString());
    const privateChatPayload = {
      studentId: message.senderId,
      staffId: message.assignedStaff,
      department: message.department,
    };
    if (studentSocket) {
      io.to(studentSocket).emit(
        "departmentMessage:privateChatStart",
        privateChatPayload
      );
    }
    if (staffSocket) {
      io.to(staffSocket).emit(
        "departmentMessage:privateChatStart",
        privateChatPayload
      );
    }
    // Emit accepted event to all staff and the student for real-time portal update
    const staffList = await User.find({
      department: message.department,
      userType: "staff",
    });
    staffList.forEach((s) => {
      const sSocket = getReceiverSocketId(s._id.toString());
      if (sSocket) {
        io.to(sSocket).emit("departmentMessage:accepted", message);
      }
    });
    const studentSocket2 = getReceiverSocketId(message.senderId.toString());
    if (studentSocket2) {
      io.to(studentSocket2).emit("departmentMessage:accepted", message);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to accept department message" });
  }
};

export const solveDepartmentMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const staff = req.user;
    const message = await DepartmentMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (String(message.assignedStaff) !== String(staff._id)) {
      return res
        .status(403)
        .json({ error: "Only assigned staff can solve this message" });
    }
    message.status = "solved";
    message.solvedAt = new Date();
    await message.save();
    // Update staff performance metrics
    if (message.assignedStaff) {
      const staffUser = await User.findById(message.assignedStaff);
      if (staffUser && staffUser.userType === "staff") {
        const metrics = staffUser.performanceMetrics || {
          percentage: 0,
          totalIssues: 0,
          solvedIssues: 0,
        };
        metrics.totalIssues += 1;
        metrics.solvedIssues += 1;
        metrics.percentage =
          metrics.totalIssues > 0
            ? Math.round((metrics.solvedIssues / metrics.totalIssues) * 100)
            : 0;
        staffUser.performanceMetrics = metrics;
        await staffUser.save();
      }
    }
    res.status(200).json(message);
    // Emit solved event to all staff and the student for real-time portal update
    const staffList = await User.find({
      department: message.department,
      userType: "staff",
    });
    staffList.forEach((s) => {
      const sSocket = getReceiverSocketId(s._id.toString());
      if (sSocket) {
        io.to(sSocket).emit("departmentMessage:solved", message);
      }
    });
    const studentSocket = getReceiverSocketId(message.senderId.toString());
    if (studentSocket) {
      io.to(studentSocket).emit("departmentMessage:solved", message);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to solve department message" });
  }
};

export const markMessageNotSolved = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await DepartmentMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.status !== "assigned") {
      return res.status(400).json({ error: "Message is not assigned" });
    }
    message.status = "not_solved";
    await message.save();
    // Update staff performance
    if (message.assignedStaff) {
      const staff = await User.findById(message.assignedStaff);
      if (staff && staff.userType === "staff") {
        const metrics = staff.performanceMetrics || {
          percentage: 0,
          totalIssues: 0,
          solvedIssues: 0,
        };
        metrics.totalIssues += 1;
        // Do not increment solvedIssues
        metrics.percentage =
          metrics.totalIssues > 0
            ? Math.round((metrics.solvedIssues / metrics.totalIssues) * 100)
            : 0;
        staff.performanceMetrics = metrics;
        await staff.save();
      }
    }
    res.json(message);
    // Emit failed event to all staff and the student for real-time portal update
    const staffList = await User.find({
      department: message.department,
      userType: "staff",
    });
    staffList.forEach((s) => {
      const sSocket = getReceiverSocketId(s._id.toString());
      if (sSocket) {
        io.to(sSocket).emit("departmentMessage:failed", message);
      }
    });
    const studentSocket = getReceiverSocketId(message.senderId.toString());
    if (studentSocket) {
      io.to(studentSocket).emit("departmentMessage:failed", message);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as not solved" });
  }
};

export const resetAllPerformance = async (req, res) => {
  try {
    await User.updateMany(
      { userType: { $in: ["staff", "manager"] } },
      {
        $set: {
          "performanceMetrics.percentage": 0,
          "performanceMetrics.totalIssues": 0,
          "performanceMetrics.solvedIssues": 0,
        },
      }
    );
    res.json({ message: "All staff and department performance reset to 0%" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset performance" });
  }
};
