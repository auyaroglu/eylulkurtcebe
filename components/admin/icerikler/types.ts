export interface ContentSectionProps {
    content: any;
    setContent: (content: any) => void;
    handleContentChange?: (section: string, field: string, value: string) => void;
}

export interface AccordionSectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}
