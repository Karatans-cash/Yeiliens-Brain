/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BrainMonsterLogoIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-8 bg-transparent absolute top-0 z-50">
      <div className="flex items-center justify-center gap-3">
          <BrainMonsterLogoIcon className="w-12 h-12" />
          <h1 className="text-3xl font-bold tracking-wider text-[#EDEBE4] font-heading" style={{ textShadow: '0 0 8px rgba(80, 255, 229, 0.7)' }}>
            Brainwave Generator
          </h1>
      </div>
    </header>
  );
};

export default Header;