import mongoose, { Schema, Document } from 'mongoose';

// Proje çevirilerinin yapısı
export interface IProjectTranslation extends Document {
    locale: string; // 'tr' veya 'en'
    title: string;
    description: string;
    viewAll: string;
    pagination: {
        previous: string;
        next: string;
        page: string;
        of: string;
    };
    projectsPage: {
        title: string;
        description: string;
        backToHome: string;
        noProjects: string;
        filters: {
            all: string;
            title: string;
        };
    };
    detail: {
        backToProjects: string;
        technologies: string;
        gallery: string;
        relatedProjects: string;
    };
    idMapping: Record<string, string>; // Örn: {"proje1": "project1"}
    createdAt: Date;
    updatedAt: Date;
}

// Proje çevirileri şeması
const ProjectTranslationSchema: Schema = new Schema(
    {
        locale: { type: String, required: true, enum: ['tr', 'en'], unique: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        viewAll: { type: String, required: true },
        pagination: {
            previous: { type: String, required: true },
            next: { type: String, required: true },
            page: { type: String, required: true },
            of: { type: String, required: true },
        },
        projectsPage: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            backToHome: { type: String, required: true },
            noProjects: { type: String, required: true },
            filters: {
                all: { type: String, required: true },
                title: { type: String, required: true },
            },
        },
        detail: {
            backToProjects: { type: String, required: true },
            technologies: { type: String, required: true },
            gallery: { type: String, required: true },
            relatedProjects: { type: String, required: true },
        },
        idMapping: { type: Map, of: String, required: true },
    },
    { timestamps: true }
);

// Model oluşturma (eğer mongoose henüz initialize edilmediyse)
export default mongoose.models.ProjectTranslation ||
    mongoose.model<IProjectTranslation>('ProjectTranslation', ProjectTranslationSchema);
