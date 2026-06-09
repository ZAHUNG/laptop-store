import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    city: String,
    district: String,
    ward: String,
    detail: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    refreshToken: {
        type: String,
        default: null
    },

    phone: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    },

    avatar: {
      type: String,
      default: ""
    },

    addresses: [addressSchema]
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;