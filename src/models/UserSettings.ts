// src/models/UserSettings.ts
import { Schema, models, model, Model } from "mongoose";

export interface IUserSettings {
  pilotId: string;      // JAL1234 (uppercase)
  hoppieId?: string;
  simbriefId?: string;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    pilotId: { type: String, required: true, unique: true, index: true },
    hoppieId: { type: String, default: "" },
    simbriefId: { type: String, default: "" },
  },
  { timestamps: true }
);

// ใส่ชนิดให้โมเดลแบบชัด ๆ
export const UserSettings: Model<IUserSettings> =
  (models.UserSettings as Model<IUserSettings>) ||
  model<IUserSettings>("UserSettings", UserSettingsSchema);
