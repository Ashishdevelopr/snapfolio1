import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  profilePhoto?: string;
  firebaseUid?: string;
  createdAt: Date;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateToken(): string;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    default: "" 
  },
  profilePhoto: { 
    type: String, 
    default: "" 
  },
  firebaseUid: { 
    type: String, 
    sparse: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date, 
    default: Date.now 
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateToken = function(): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    { userId: this._id, email: this.email },
    secret,
    { expiresIn: '7d' }
  );
};

export const UserModel = mongoose.model<IUser>("User", UserSchema); 