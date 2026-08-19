import cloudinary from "../config/cloudinary.js";
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image.",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "quizhub/quizzes",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);

          return res.status(500).json({
            message: "Failed to upload image.",
          });
        }

        return res.status(200).json({
          message: "Image uploaded successfully.",
          url: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Upload image error:", error);

    res.status(500).json({
      message: "Failed to upload image.",
    });
  }
};