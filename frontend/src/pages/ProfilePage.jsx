import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Lock, Eye, EyeOff, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const {
    authUser,
    isUpdatingProfile,
    updateProfile,
    changePassword,
    isChangingPassword,
  } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [biography, setBiography] = useState(authUser?.biography || "");
  const [passwordInputs, setPasswordInputs] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 1200; // Max width or height
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed image as base64 string
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8); // 0.8 quality
          resolve(compressedBase64);
        };
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show loading toast
      const loadingToast = toast.loading("Processing image...");

      // Compress image if it's larger than 100KB
      let base64Image;
      if (file.size > 100 * 1024) {
        // 100KB
        base64Image = await compressImage(file);
      } else {
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }

      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Profile picture updated successfully");
    } catch (error) {
      toast.error("Failed to update profile picture");
      console.error("Error uploading image:", error);
    }
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
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
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
