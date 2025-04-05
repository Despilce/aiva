import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Lock, Eye, EyeOff, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ProfilePage = () => {
  const {
    authUser,
    isUpdatingProfile,
    updateProfile,
    changePassword,
    isChangingPassword,
  } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [biography, setBiography] = useState(authUser?.biography || "");
  const [passwordInputs, setPasswordInputs] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImg(e.target.result);
        setOriginalFile(file);
      };
      reader.readAsDataURL(file);

      // Process image
      await handleCompression(file);
    } catch (error) {
      toast.error("Failed to load image");
      console.error("Error loading image:", error);
      resetImage();
    }
  };

  const handleCompression = async (file) => {
    try {
      setProcessingProgress(10); // Start progress

      // Load image for compression
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      setProcessingProgress(30); // Image loaded

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate dimensions
      const maxDimension = 1000; // Reduced from 1200 to 1000 for profile pictures
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;
      setProcessingProgress(50); // Dimensions calculated

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      setProcessingProgress(70); // Image drawn

      // Try different quality levels if needed
      let quality = 0.8;
      let finalImage = canvas.toDataURL("image/jpeg", quality);
      let finalSize = Math.round((finalImage.length - 22) * 0.75);

      while (finalSize > 500000 && quality > 0.3) {
        // 500KB limit
        quality -= 0.1;
        finalImage = canvas.toDataURL("image/jpeg", quality);
        finalSize = Math.round((finalImage.length - 22) * 0.75);
      }

      setProcessingProgress(85); // Image compressed

      // Convert to file
      const response = await fetch(finalImage);
      const blob = await response.blob();
      const compressedFile = new File([blob], file.name, {
        type: "image/jpeg",
      });
      setProcessingProgress(100); // Conversion complete

      // Upload the compressed file
      await handleUpload(compressedFile);
    } catch (error) {
      toast.error("Failed to process image");
      console.error("Error processing image:", error);
      resetImage();
    } finally {
      setProcessingProgress(0);
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await axiosInstance.put(
        "/auth/update-profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setUploadProgress(progress);
            }
          },
        }
      );

      // Update auth store with new user data
      useAuthStore.setState((state) => ({
        authUser: { ...state.authUser, ...response.data },
      }));

      toast.success("Profile picture updated successfully");
      resetImage();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update profile picture";
      toast.error(errorMessage);
      console.error("Error uploading profile picture:", error);
      resetImage();
    }
  };

  const resetImage = () => {
    setSelectedImg(null);
    setOriginalFile(null);
    setUploadProgress(0);
    setProcessingProgress(0);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !passwordInputs.currentPassword ||
      !passwordInputs.newPassword ||
      !passwordInputs.confirmNewPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordInputs.newPassword !== passwordInputs.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordInputs.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    await changePassword({
      currentPassword: passwordInputs.currentPassword,
      newPassword: passwordInputs.newPassword,
    });

    // Reset form and close modal on success
    setPasswordInputs({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setShowChangePasswordModal(false);
  };

  const handleBioUpdate = async () => {
    try {
      await updateProfile({ biography });
      setIsEditingBio(false);
      toast.success("Biography updated successfully");
    } catch (error) {
      toast.error("Failed to update biography");
    }
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>

            {/* Processing/Upload Progress */}
            {(processingProgress > 0 ||
              (uploadProgress > 0 && uploadProgress < 100)) && (
              <div className="w-full max-w-xs">
                <div className="w-full bg-base-200 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${processingProgress || uploadProgress}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-base-content/60 mt-1">
                  {processingProgress > 0
                    ? `Processing: ${processingProgress}%`
                    : `Uploading: ${uploadProgress}%`}
                </span>
              </div>
            )}

            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.fullName}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </div>
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="btn btn-primary btn-sm"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Biography Section */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Biography
                </div>
                {!isEditingBio && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="btn btn-ghost btn-sm"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    className="textarea textarea-bordered w-full h-24 resize-none"
                    placeholder="Write something about yourself..."
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBiography(authUser?.biography || "");
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBioUpdate}
                      className="btn btn-primary btn-sm"
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border min-h-[60px]">
                  {biography || "No biography added yet"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>

          {/* Change Password Modal */}
          {showChangePasswordModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-base-100 rounded-lg max-w-md w-full p-6 space-y-6">
                <h3 className="text-xl font-semibold">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Current Password</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full"
                      value={passwordInputs.currentPassword}
                      onChange={(e) =>
                        setPasswordInputs({
                          ...passwordInputs,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full"
                      value={passwordInputs.newPassword}
                      onChange={(e) =>
                        setPasswordInputs({
                          ...passwordInputs,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Confirm New Password</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full"
                      value={passwordInputs.confirmNewPassword}
                      onChange={(e) =>
                        setPasswordInputs({
                          ...passwordInputs,
                          confirmNewPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowChangePasswordModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
