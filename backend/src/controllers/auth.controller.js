import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

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
        return res
          .status(400)
          .json({
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
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

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
