import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import uploadImage from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("image");

// Wrap multer in a promise to handle errors better
const handleUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          reject(new Error("File is too large. Maximum size is 10MB"));
        } else {
          reject(new Error("File upload error: " + err.message));
        }
      } else if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    // Handle file upload first
    await handleUpload(req, res);

    const text = req.body.text;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    let imageUrl;
    if (req.file) {
      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

        const uploadResponse = await uploadImage(dataUri);
        if (!uploadResponse?.secure_url) {
          throw new Error("Failed to get image URL from Cloudinary");
        }
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(400).json({
          error:
            "Failed to upload image. Please try again or use a different image.",
        });
      }
    }

    // Validate that either text or image is present
    if (!text && !imageUrl) {
      return res
        .status(400)
        .json({ error: "Message must contain either text or an image" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Emit socket event
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Failed to send message" });
  }
};

export const getUsersWithChats = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    // Get unique user IDs from messages
    const userIds = [
      ...new Set([
        ...messages.map((msg) => msg.senderId.toString()),
        ...messages.map((msg) => msg.receiverId.toString()),
      ]),
    ].filter((id) => id !== loggedInUserId.toString());

    // Get user details for the filtered IDs
    const usersWithChats = await User.find({
      _id: { $in: userIds },
    }).select("-password");

    res.status(200).json(usersWithChats);
  } catch (error) {
    console.error("Error in getUsersWithChats: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const searchQuery = req.query.q || "";

    const users = await User.find({
      $and: [
        { _id: { $ne: loggedInUserId } },
        {
          $or: [
            { fullName: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
