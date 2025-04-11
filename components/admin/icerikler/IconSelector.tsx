'use client';

import { useState } from 'react';
import {
    RiFlaskFill,
    RiPaletteFill,
    RiBuilding2Fill,
    RiMicroscopeFill,
    RiTestTubeFill,
    RiPaintBrushFill,
    RiShape2Fill,
    RiLeafFill,
    RiFireFill,
    RiWaterFlashFill,
    RiToolsFill,
    RiArtboard2Fill,
    RiRulerFill,
    RiDraftFill,
    RiLightbulbFill,
    RiSettings2Fill,
    RiBubbleChartFill,
    RiDropFill,
    RiPenNibFill,
    RiComputerFill,
    RiDatabase2Fill,
    RiGitRepositoryFill,
    RiServerFill,
    RiCodeBoxFill,
    RiCodeSFill,
    RiTerminalBoxFill,
    RiLayout4Fill,
    RiDeviceFill,
    RiBook2Fill,
    RiBookOpenFill,
    RiBookmarkFill,
    RiGraduationCapFill,
    RiLinksFill,
    RiRocketFill,
    RiStarFill,
    RiShieldCheckFill,
    RiCloudFill,
    RiUserSettingsFill,
    RiUserHeartFill,
    RiLineChartFill,
    RiPieChartFill,
    RiBarChartGroupedFill,
    RiListSettingsFill,
    RiSearchEyeFill,
    RiFilterFill,
    RiBriefcaseFill,
    RiShoppingBag2Fill,
    RiEarthFill,
    RiGlobalFill,
    RiMapPinFill,
} from 'react-icons/ri';

export interface IconSelectorProps {
    value: string;
    onChange: (icon: string) => void;
}

export default function IconSelector({ value, onChange }: IconSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Kullanılabilir ikonlar - 50 adet seçilmiş ikon
    const icons = [
        { name: 'flask', icon: <RiFlaskFill size={24} />, label: 'Şişe/Laboratuvar' },
        { name: 'palette', icon: <RiPaletteFill size={24} />, label: 'Palet/Renk' },
        { name: 'industry', icon: <RiBuilding2Fill size={24} />, label: 'Endüstri/Fabrika' },
        { name: 'microscope', icon: <RiMicroscopeFill size={24} />, label: 'Mikroskop/Bilim' },
        { name: 'test-tube', icon: <RiTestTubeFill size={24} />, label: 'Test Tüpü' },
        { name: 'brush', icon: <RiPaintBrushFill size={24} />, label: 'Fırça/Boyama' },
        { name: 'shape', icon: <RiShape2Fill size={24} />, label: 'Şekil/Form' },
        { name: 'settings', icon: <RiSettings2Fill size={24} />, label: 'Ayarlar/Teknik' },
        { name: 'leaf', icon: <RiLeafFill size={24} />, label: 'Yaprak/Doğal' },
        { name: 'fire', icon: <RiFireFill size={24} />, label: 'Ateş/Pişirim' },
        { name: 'water', icon: <RiWaterFlashFill size={24} />, label: 'Su/Sıvı' },
        { name: 'tools', icon: <RiToolsFill size={24} />, label: 'Aletler' },
        { name: 'artboard', icon: <RiArtboard2Fill size={24} />, label: 'Sanat Tahtası' },
        { name: 'ruler', icon: <RiRulerFill size={24} />, label: 'Cetvel/Ölçüm' },
        { name: 'draft', icon: <RiDraftFill size={24} />, label: 'Taslak/Çizim' },
        { name: 'bulb', icon: <RiLightbulbFill size={24} />, label: 'Ampul/Fikir' },
        { name: 'bubble', icon: <RiBubbleChartFill size={24} />, label: 'Kabarcık/Efekt' },
        { name: 'drop', icon: <RiDropFill size={24} />, label: 'Damla/Sıvı' },
        { name: 'pen', icon: <RiPenNibFill size={24} />, label: 'Kalem/Yazım' },
        { name: 'computer', icon: <RiComputerFill size={24} />, label: 'Bilgisayar' },
        { name: 'database', icon: <RiDatabase2Fill size={24} />, label: 'Veritabanı' },
        { name: 'repository', icon: <RiGitRepositoryFill size={24} />, label: 'Depo/Repo' },
        { name: 'server', icon: <RiServerFill size={24} />, label: 'Sunucu' },
        { name: 'code-box', icon: <RiCodeBoxFill size={24} />, label: 'Kod Kutusu' },
        { name: 'code', icon: <RiCodeSFill size={24} />, label: 'Kod' },
        { name: 'terminal', icon: <RiTerminalBoxFill size={24} />, label: 'Terminal' },
        { name: 'layout', icon: <RiLayout4Fill size={24} />, label: 'Düzen/Layout' },
        { name: 'device', icon: <RiDeviceFill size={24} />, label: 'Cihaz' },
        { name: 'book', icon: <RiBook2Fill size={24} />, label: 'Kitap' },
        { name: 'book-open', icon: <RiBookOpenFill size={24} />, label: 'Açık Kitap' },
        { name: 'bookmark', icon: <RiBookmarkFill size={24} />, label: 'Yer İşareti' },
        { name: 'graduation', icon: <RiGraduationCapFill size={24} />, label: 'Mezuniyet/Eğitim' },
        { name: 'links', icon: <RiLinksFill size={24} />, label: 'Bağlantılar' },
        { name: 'rocket', icon: <RiRocketFill size={24} />, label: 'Roket/Başlat' },
        { name: 'star', icon: <RiStarFill size={24} />, label: 'Yıldız' },
        { name: 'shield', icon: <RiShieldCheckFill size={24} />, label: 'Kalkan/Güvenlik' },
        { name: 'cloud', icon: <RiCloudFill size={24} />, label: 'Bulut' },
        {
            name: 'user-settings',
            icon: <RiUserSettingsFill size={24} />,
            label: 'Kullanıcı Ayarları',
        },
        { name: 'user-heart', icon: <RiUserHeartFill size={24} />, label: 'Kullanıcı Kalp' },
        { name: 'line-chart', icon: <RiLineChartFill size={24} />, label: 'Çizgi Grafik' },
        { name: 'pie-chart', icon: <RiPieChartFill size={24} />, label: 'Pasta Grafik' },
        { name: 'bar-chart', icon: <RiBarChartGroupedFill size={24} />, label: 'Çubuk Grafik' },
        { name: 'list-settings', icon: <RiListSettingsFill size={24} />, label: 'Liste Ayarları' },
        { name: 'search', icon: <RiSearchEyeFill size={24} />, label: 'Arama' },
        { name: 'filter', icon: <RiFilterFill size={24} />, label: 'Filtre' },
        { name: 'briefcase', icon: <RiBriefcaseFill size={24} />, label: 'Evrak Çantası/İş' },
        { name: 'shopping', icon: <RiShoppingBag2Fill size={24} />, label: 'Alışveriş' },
        { name: 'earth', icon: <RiEarthFill size={24} />, label: 'Dünya' },
        { name: 'global', icon: <RiGlobalFill size={24} />, label: 'Global' },
        { name: 'map-pin', icon: <RiMapPinFill size={24} />, label: 'Harita İşareti' },
    ];

    // Seçili ikonun index'ini bulma
    const selectedIconIndex = icons.findIndex(icon => icon.name === value);

    // Seçili ikon veya default ikon gösterimi
    const renderSelectedIcon = () => {
        if (selectedIconIndex !== -1) {
            return icons[selectedIconIndex].icon;
        }
        return <RiFlaskFill size={24} />;
    };

    return (
        <div className="relative">
            <div
                className="w-full flex justify-between items-center px-4 py-2 text-white bg-gray-700 rounded-md border border-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    <span className="text-primary mr-2">{renderSelectedIcon()}</span>
                    <span>
                        {selectedIconIndex !== -1 ? icons[selectedIconIndex].label : 'İkon Seçin'}
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>

            {isOpen && (
                <div className="w-full max-h-64 overflow-y-auto absolute z-10 mt-1 bg-gray-800 rounded-md border border-gray-600 shadow-lg">
                    <div className="grid grid-cols-2 p-2">
                        {icons.map((icon, index) => (
                            <div
                                key={icon.name}
                                className={`flex items-center p-2 hover:bg-gray-700 cursor-pointer rounded ${
                                    icon.name === value ? 'bg-gray-700' : ''
                                }`}
                                onClick={() => {
                                    onChange(icon.name);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="text-primary mr-2">{icon.icon}</span>
                                <span>{icon.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
