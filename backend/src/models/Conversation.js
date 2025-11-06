// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema({
//   role: { type: String, enum: ["user", "assistant"], required: true },
//   content: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// const conversationSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   title: { type: String },
//   messages: { type: [messageSchema], default: [] },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });

// conversationSchema.pre('save', function (next) {
//   this.updatedAt = new Date();
//   next();
// });

// export default mongoose.model("Conversation", conversationSchema);
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // <-- ✅ allows text or objects
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String },
  messages: { type: [messageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Conversation", conversationSchema);