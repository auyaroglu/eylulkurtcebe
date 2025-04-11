import mongoose, { Schema, Document } from 'mongoose';

// Content modelinin temel yapısı
export interface IContent extends Document {
    locale: string; // 'tr' veya 'en'
    nav: {
        links: Array<{
            label: string;
            url: string;
        }>;
    };
    hero: {
        title: string;
        description: string;
        contactButton: string;
        projectsButton: string;
    };
    about: {
        title: string;
        description: string;
        experience: {
            title: string;
            description: string;
        };
        education: {
            title: string;
            description: string;
        };
    };
    skills: {
        title: string;
        description: string;
        categories: {
            frontend: {
                // Seramik Teknikleri
                title: string;
                skills: Array<{
                    name: string;
                    level: number;
                }>;
            };
            backend: {
                // Malzeme Bilgisi
                title: string;
                skills: Array<{
                    name: string;
                    level: number;
                }>;
            };
            database: {
                // Tasarım
                title: string;
                skills: Array<{
                    name: string;
                    level: number;
                }>;
            };
        };
    };
    expertise: {
        title: string;
        description: string;
        categories: Array<{
            title: string;
            description: string;
            icon?: string;
        }>;
    };
    contact: {
        title: string;
        description: string;
        info: {
            title: string;
            location: string;
        };
        form: {
            title: string;
            name: string;
            email: string;
            message: string;
            submit: string;
        };
    };
    footer: {
        description: string;
        quickLinks: {
            title: string;
            links: Array<{
                label: string;
                url: string;
            }>;
        };
        contact: {
            title: string;
            email: string;
            location: string;
            instagram?: string;
        };
        socialMedia: {
            email: string;
            linkedin?: string;
            instagram?: string;
        };
        rights: string;
    };
}

// Content şeması
const ContentSchema: Schema = new Schema(
    {
        locale: { type: String, required: true, enum: ['tr', 'en'], unique: true },
        nav: {
            links: [
                {
                    label: { type: String, required: true },
                    url: { type: String, required: true },
                },
            ],
        },
        hero: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            contactButton: { type: String, required: true },
            projectsButton: { type: String, required: true },
        },
        about: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            experience: {
                title: { type: String, required: true },
                description: { type: String, required: true },
            },
            education: {
                title: { type: String, required: true },
                description: { type: String, required: true },
            },
        },
        skills: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            categories: {
                frontend: {
                    title: { type: String, required: true },
                    skills: [
                        {
                            name: { type: String, required: true },
                            level: { type: Number, required: true, min: 0, max: 100 },
                        },
                    ],
                },
                backend: {
                    title: { type: String, required: true },
                    skills: [
                        {
                            name: { type: String, required: true },
                            level: { type: Number, required: true, min: 0, max: 100 },
                        },
                    ],
                },
                database: {
                    title: { type: String, required: true },
                    skills: [
                        {
                            name: { type: String, required: true },
                            level: { type: Number, required: true, min: 0, max: 100 },
                        },
                    ],
                },
            },
        },
        expertise: {
            title: { type: String, required: false },
            description: { type: String, required: false },
            categories: [
                {
                    title: { type: String, required: false },
                    description: { type: String, required: false },
                    icon: { type: String, required: false },
                },
            ],
        },
        contact: {
            title: { type: String, required: true },
            description: { type: String, required: true },
            info: {
                title: { type: String, required: true },
                location: { type: String, required: true },
            },
            form: {
                title: { type: String, required: true },
                name: { type: String, required: true },
                email: { type: String, required: true },
                message: { type: String, required: true },
                submit: { type: String, required: true },
            },
        },
        footer: {
            description: { type: String, required: true },
            quickLinks: {
                title: { type: String, required: true },
                links: [
                    {
                        label: { type: String, required: true },
                        url: { type: String, required: true },
                    },
                ],
            },
            contact: {
                title: { type: String, required: true },
                email: { type: String, required: true },
                location: { type: String, required: true },
                instagram: { type: String, required: false },
            },
            socialMedia: {
                email: { type: String, required: true },
                linkedin: { type: String, required: false },
                instagram: { type: String, required: false },
            },
            rights: { type: String, required: true },
        },
    },
    { timestamps: true }
);

// Model oluşturma (eğer mongoose henüz initialize edilmediyse)
export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
