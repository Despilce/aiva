import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setIsProcessing(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setOriginalFile(file);
      };
      reader.readAsDataURL(file);

      // Show compression choice for large files
      if (file.size > 1024 * 1024) {
        // 1MB
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>
                Large image detected ({(file.size / (1024 * 1024)).toFixed(1)}
                MB)
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    toast.dismiss(t.id);
                    handleCompression(true);
                  }}
                >
                  Compress
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    handleCompression(false);
                  }}
                >
                  Send Original
                </button>
              </div>
            </div>
          ),
          { duration: 10000 }
        );
      }
    } catch (error) {
      toast.error("Failed to load image");
      console.error("Error loading image:", error);
      removeImage();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompression = async (shouldCompress) => {
    if (!originalFile) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(10); // Start progress

      if (shouldCompress) {
        // Load image for compression
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imagePreview;
        });
        setProcessingProgress(30); // Image loaded

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate dimensions
        const maxDimension = 1200;
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

        const finalImage = canvas.toDataURL("image/jpeg", 0.8);
        setProcessingProgress(85); // Image compressed

        // Convert to file
        const response = await fetch(finalImage);
        const blob = await response.blob();
        const compressedFile = new File([blob], originalFile.name, {
          type: "image/jpeg",
        });
        setOriginalFile(compressedFile);
        setProcessingProgress(100); // Conversion complete
      } else {
        // If not compressing, just show quick progress
        setProcessingProgress(50);
        await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay for UX
        setProcessingProgress(100);
      }

      toast.success("Image ready to send");
    } catch (error) {
      toast.error("Failed to process image");
      console.error("Error processing image:", error);
      removeImage();
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0); // Reset progress
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setOriginalFile(null);
    setUploadProgress(0);
    setProcessingProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (!selectedUser?._id) {
      toast.error("No chat selected");
      return;
    }

    let sendingToast;
    try {
      setIsProcessing(true);
      sendingToast = toast.loading("Sending message...");

      if (imagePreview && originalFile) {
        // Create FormData for image upload
        const formData = new FormData();
        if (text.trim()) {
          formData.append("text", text.trim());
        }
        formData.append("image", originalFile);

        // Use axios instead of XMLHttpRequest for better handling
        const response = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
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

        // Update chat store with new message
        const { messages, users } = useChatStore.getState();
        useChatStore.setState({
          messages: [...messages, response.data],
          users: users.some((u) => u._id === selectedUser._id)
            ? users
            : [...users, selectedUser],
        });
      } else {
        // Text-only message
        await sendMessage({
          text: text.trim(),
        });
      }

      // Clear form
      setText("");
      setImagePreview(null);
      setOriginalFile(null);
      setUploadProgress(0);
      setProcessingProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Ensure the loading toast is dismissed before showing success
      if (sendingToast) {
        toast.dismiss(sendingToast);
        // Small delay before showing success to prevent toast overlap
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      toast.success("Message sent successfully", {
        duration: 2000, // Show for 2 seconds only
      });
    } catch (error) {
      if (sendingToast) {
        toast.dismiss(sendingToast);
        // Small delay before showing error to prevent toast overlap
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to send message. Please try again";
      toast.error(errorMessage, {
        duration: 3000, // Show errors for 3 seconds
      });
      console.error("Failed to send message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
                flex items-center justify-center"
                type="button"
              >
                <X className="size-3" />
              </button>
            </div>
            <span className="text-xs text-base-content/60">
              {originalFile &&
                `${(originalFile.size / (1024 * 1024)).toFixed(1)}MB`}
            </span>
          </div>

          {/* Processing/Upload Progress Bar */}
          {(processingProgress > 0 ||
            (uploadProgress > 0 && uploadProgress < 100)) && (
            <div className="mt-2 w-full">
              <div className="w-full bg-base-300 rounded-full h-1.5">
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
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isProcessing}
          />

          <button
            type="button"
            className={`flex btn btn-circle btn-sm sm:btn-md ${
              isProcessing ? "loading loading-spinner" : ""
            } ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {!isProcessing && <Image size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm sm:btn-md btn-circle"
          disabled={(!text.trim() && !imagePreview) || isProcessing}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
