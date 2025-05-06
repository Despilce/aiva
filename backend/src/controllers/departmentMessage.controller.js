import DepartmentMessage from "../models/departmentMessage.model.js";
import User from "../models/user.model.js";

export const getDepartmentMessages = async (req, res) => {
  try {
    const { department } = req.params;
    const messages = await DepartmentMessage.find({ department })
      .sort({ createdAt: 1 })
      .populate("assignedStaff", "fullName");
    return res.json(Array.isArray(messages) ? messages : []);
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
    // Allow students to send messages at any time
    // Allow assigned staff to send messages after accepting
    let allow = false;
    if (sender.userType === "student") {
      allow = true;
    } else if (sender.userType === "staff") {
      // Find the latest assigned message for this department
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
      return res
        .status(403)
        .json({
          error:
            "Only students or the assigned staff can send messages to department portals.",
        });
    }
    const message = await DepartmentMessage.create({
      department,
      senderId: sender._id,
      senderName: sender.fullName,
      senderType: sender.userType,
      text,
      // Optionally store profilePic for frontend display
      profilePic: sender.profilePic || "",
      createdAt: new Date(),
    });
    res.status(201).json(message);
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
    message.assignedStaff = staff._id;
    message.status = "assigned";
    message.acceptedAt = new Date();
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to accept message" });
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
    // TODO: Update staff performance, save chat history if needed
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to solve message" });
  }
};
