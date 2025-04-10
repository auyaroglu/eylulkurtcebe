import React from 'react';
import Navbar from './Navbar';

type HeaderProps = {
    lng: string;
};

const Header: React.FC<HeaderProps> = ({ lng }) => {
    return (
        <header className="w-full bg-transparent absolute top-0 left-0 z-50">
            <Navbar lng={lng} />
        </header>
    );
};

export default Header;
