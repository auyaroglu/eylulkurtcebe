import mongoose, { Schema, Document } from 'mongoose';

// İletişim formu veri modeli
export interface IContactForm extends Document {
    name: string;
    email: string;
    message: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    isRead: boolean;
}

// İletişim formu şeması
const ContactFormSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        ipAddress: { type: String, required: false },
        userAgent: { type: String, required: false },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Model oluşturma
export default mongoose.models.ContactForm ||
    mongoose.model<IContactForm>('ContactForm', ContactFormSchema);
