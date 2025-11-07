import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // Firebase UID làm _id (string)
    _id: { type: String, required: true },
    email: { type: String, index: true },
    roles: { type: [String], default: ["user"], index: true },
    status: { type: String, default: "active", index: true },

    // Danh sách Artist mà user theo dõi
    followingArtistIds: [
      { type: Schema.Types.ObjectId, ref: "Artist", index: true },
    ],
  },
  { timestamps: true }
);

// ===== Methods =====
userSchema.methods.hasRole = function (role) {
  return Array.isArray(this.roles) && this.roles.includes(role);
};

userSchema.methods.isFollowingArtist = function (artistId) {
  const list = this.followingArtistIds || [];
  const target = String(artistId);
  return list.some((id) => String(id) === target);
};

userSchema.methods.followArtist = function (artistId) {
  if (this.isFollowingArtist(artistId)) return false;
  this.followingArtistIds = [...(this.followingArtistIds || []), artistId];
  return true;
};

userSchema.methods.unfollowArtist = function (artistId) {
  const list = this.followingArtistIds || [];
  const target = String(artistId);
  const next = list.filter((id) => String(id) !== target);
  const changed = next.length < list.length;
  this.followingArtistIds = next;
  return changed;
};

// ===== Statics =====
userSchema.statics.findOrCreateByUid = async function (uid, email) {
  let user = await this.findById(uid);
  if (!user) {
    user = await this.create({ _id: uid, email });
  } else if (email && user.email !== email) {
    user.email = email;
    await user.save();
  }
  return user;
};

// ===== Indexes =====
// userSchema.index({ _id: 1 });
// userSchema.index({ email: 1 });
userSchema.index({ status: 1, roles: 1 });
// userSchema.index({ followingArtistIds: 1 });

// ===== Export =====
export default mongoose.models.User || mongoose.model("User", userSchema);
