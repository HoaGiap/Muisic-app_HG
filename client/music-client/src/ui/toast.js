// src/ui/toast.js
import { toast } from "react-hot-toast";

export const t = {
  ok: (msg) => toast.success(msg),
  err: (msg) => toast.error(msg),
  info: (msg) => toast(msg),
};

export default toast;
