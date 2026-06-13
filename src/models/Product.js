import mongoose from "mongoose";

const productSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
      },

      description: {
        type: String,
        default: "",
      },

      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },

      brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
      },

      price: {
        type: Number,
        required: true,
      },
      
      originalPrice: {
        type: Number,
        default: 0,
      },

      stock: {
        type: Number,
        default: 0,
      },

      sold: {
        type: Number,
        default: 0,
      },

      thumbnail: {
        type: String,
        default: "",
      },

      images: {
        type: [String],
        default: [],
      },

      specifications: {
        cpu: String,
        gpu: String,
        ram: String,
        storage: String,
        screen: String,
        battery: String,
        weight: String,
      },

      ratingAverage: {
        type: Number,
        default: 0,
      },

      reviewCount: {
        type: Number,
        default: 0,
      },

      isFeatured: {
        type: Boolean,
        default: false,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Product",
  productSchema
);