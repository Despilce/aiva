import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import uploadImage from "../lib/cloudinary.js";
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
}).single("profilePic");

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

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, userType, position, department } =
      req.body;

    // Basic validation
    if (!fullName || !email || !password || !userType) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Additional validation for staff
    if (userType === "staff") {
      if (!position || !department) {
        return res
          .status(400)
          .json({ error: "Position and department are required for staff" });
      }
    }

    // Validate email format based on user type
    if (userType === "student") {
      // Student email should be in format: b1234567@mdis.uz
      if (!email.endsWith("@mdis.uz")) {
        return res.status(400).json({ error: "Invalid student email format" });
      }
      const studentId = email.split("@")[0];
      if (!/^b\d{7}$/.test(studentId)) {
        return res.status(400).json({
          error: "Student ID should start with 'b' followed by 7 digits",
        });
      }
    } else if (userType === "staff") {
      // Staff email should be a valid email ending with @mdis.uz
      if (!email.endsWith("@mdis.uz")) {
        return res
          .status(400)
          .json({ error: "Staff email must be a valid MDIS email address" });
      }
      // Additional validation for staff email if needed
      const staffEmailPrefix = email.split("@")[0];
      if (staffEmailPrefix.length < 3) {
        return res.status(400).json({ error: "Invalid staff email format" });
      }
    } else {
      return res.status(400).json({ error: "Invalid user type" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        error:
          userType === "student"
            ? "Student ID already registered"
            : "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with position and department for staff
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      userType,
    };

    if (userType === "staff") {
      userData.position = position;
      userData.department = department;
    }

    const user = await User.create(userData);

    // Generate token
    generateToken(user._id, res);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      position: user.position,
      department: user.department,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Basic validation
    if (!email || !password || !userType) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    // Find user and validate user type
    const user = await User.findOne({ email });
    if (!user || user.userType !== userType) {
      return res.status(400).json({
        error:
          userType === "student"
            ? "Invalid student ID or password"
            : "Invalid email or password",
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate token
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // Handle file upload first if there's a file
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      await handleUpload(req, res);
    }

    const userId = req.user._id;
    const updateData = {};

    // Handle profile picture upload
    if (req.file) {
      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

        const uploadResponse = await uploadImage(dataUri);
        if (!uploadResponse?.secure_url) {
          throw new Error("Failed to get image URL from Cloudinary");
        }
        updateData.profilePic = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(400).json({
          error:
            "Failed to upload image. Please try again or use a different image.",
        });
      }
    }

    // Handle biography update
    if (req.body.biography !== undefined) {
      updateData.biography = req.body.biography;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No data to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in update profile:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update profile" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Not authorized" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in checkAuth controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Please provide both current and new password" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in changePassword controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStaffPerformance = async (req, res) => {
  try {
    const { staffId, isSolved } = req.body;
    console.log("Received performance update request:", { staffId, isSolved });

    if (!staffId || typeof isSolved !== "boolean") {
      console.log("Invalid request data:", { staffId, isSolved });
      return res.status(400).json({ error: "Invalid request data" });
    }

    const staff = await User.findById(staffId);
    console.log(
      "Found staff:",
      staff ? "yes" : "no",
      "userType:",
      staff?.userType
    );

    if (!staff || staff.userType !== "staff") {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Update performance metrics
    const currentMetrics = staff.performanceMetrics || {
      percentage: 0,
      totalIssues: 0,
      solvedIssues: 0,
    };
    console.log("Current metrics before update:", currentMetrics);

    // Increment total issues
    currentMetrics.totalIssues += 1;

    // If solved, increment solved issues
    if (isSolved) {
      currentMetrics.solvedIssues += 1;
    }

    // Calculate new percentage
    currentMetrics.percentage = Math.round(
      (currentMetrics.solvedIssues / currentMetrics.totalIssues) * 100
    );
    console.log("Updated metrics:", currentMetrics);

    // Update staff's performance metrics
    const updatedStaff = await User.findByIdAndUpdate(
      staffId,
      { performanceMetrics: currentMetrics },
      { new: true }
    ).select("-password");
    console.log("Staff updated successfully:", updatedStaff.performanceMetrics);

    res.status(200).json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff performance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
