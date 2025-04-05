import { X } from "lucide-react";

const ImagePreviewModal = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt="Full size preview"
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
      />
    </div>
  );
};

export default ImagePreviewModal;
