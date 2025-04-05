import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import uploadImage from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, userType } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !userType) {
      return res.status(400).json({ error: "Please fill in all fields" });
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

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      userType,
    });

    // Generate token
    generateToken(user._id, res);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
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
    const { profilePic, biography } = req.body;
    const userId = req.user._id;
    const updateData = {};

    if (profilePic) {
      try {
        const uploadResponse = await uploadImage(profilePic);
        updateData.profilePic = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(400).json({
          message:
            "Failed to upload image. Please try a different image or compress it further.",
        });
      }
    }

    if (biography !== undefined) {
      updateData.biography = biography;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
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
