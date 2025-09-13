// src/models/UserSettings.ts
import { Schema, models, model, Model } from "mongoose";

export interface IUserSettings {
  apiKey: string;     // ใช้ค่านี้เป็นตัวอ้างอิงหลัก
  hoppieId?: string;
  simbriefId?: string;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    apiKey: { type: String, required: true, unique: true, index: true },
    hoppieId: { type: String, default: "" },
    simbriefId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const UserSettings: Model<IUserSettings> =
  (models.UserSettings as Model<IUserSettings>) ||
  model<IUserSettings>("UserSettings", UserSettingsSchema);
