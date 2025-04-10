import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    password: string;
    isAdmin: boolean;
    comparePassword: (password: string) => Promise<boolean>;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        isAdmin: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Kaydetmeden önce şifreyi hashle
UserSchema.pre('save', async function (next) {
    // Şifre değişmediyse tekrar hashleme
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Şifre karşılaştırma metodu
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

// Model oluşturma
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
