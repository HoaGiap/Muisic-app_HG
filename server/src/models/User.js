import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // dùng Firebase UID
    email: { type: String, index: true },
    roles: { type: [String], default: ["user"] },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

userSchema.methods.hasRole = function (role) {
  return Array.isArray(this.roles) && this.roles.includes(role);
};

export default mongoose.model("User", userSchema);
