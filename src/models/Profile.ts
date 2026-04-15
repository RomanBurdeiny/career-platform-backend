import mongoose, { Schema, Model } from 'mongoose';
import { IProfile, Direction, Level, CareerGoal, City, EmploymentType, ProfileLang } from '../types';
import { computeYearsInCurrentRole } from '../utils/profileYears';

// Схема профиля
const profileSchema = new Schema<IProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  direction: {
    type: String,
    required: [true, 'Направление обязательно'],
    enum: Object.values(Direction),
  },
  level: {
    type: String,
    required: [true, 'Уровень обязателен'],
    enum: Object.values(Level),
  },
  skills: {
    type: [String],
    required: [true, 'Навыки обязательны'],
    validate: {
      validator: function(v: string[]) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Должен быть хотя бы один навык',
    },
  },
  experience: {
    type: String,
    required: [true, 'Опыт обязателен'],
  },
  careerGoal: {
    type: String,
    required: [true, 'Карьерная цель обязательна'],
    enum: Object.values(CareerGoal),
  },
  careerStartDate: {
    type: Date,
    default: null,
  },
  currentCompany: {
    type: String,
    maxlength: 255,
    default: null,
    trim: true,
  },
  city: {
    type: String,
    enum: Object.values(City),
    default: null,
  },
  employmentType: {
    type: String,
    enum: Object.values(EmploymentType),
    default: null,
  },
  lang: {
    type: String,
    enum: Object.values(ProfileLang),
    default: ProfileLang.RU,
  },
  wantsRelocation: {
    type: Boolean,
    default: false,
  },
  favoriteJobs: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Job',
    }],
    default: [], // По умолчанию пустой массив
  },
}, {
  timestamps: true,
});

profileSchema.virtual('yearsInCurrentRole').get(function (this: IProfile) {
  return computeYearsInCurrentRole(this.careerStartDate);
});

profileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    const plain = ret as unknown as { lang?: string | null; wantsRelocation?: boolean | null };
    if (plain.lang == null) plain.lang = ProfileLang.RU;
    if (plain.wantsRelocation == null) plain.wantsRelocation = false;
    return ret;
  },
});

profileSchema.set('toObject', { virtuals: true });

const Profile: Model<IProfile> = mongoose.model<IProfile>('Profile', profileSchema);

export default Profile;
