
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="ausu-gradient text-white py-6 shadow-lg relative overflow-hidden">
      <div className="container mx-auto px-4 relative flex items-center justify-center min-h-[100px] md:min-h-[120px]">
        {/* Logo positioned to the left */}
        <div className="md:absolute md:left-4 lg:left-8 flex-shrink-0 mb-4 md:mb-0">
          <img 
            src="https://www.au.edu.ng/wp-content/uploads/2021/04/logo.png" 
            alt="Al'Istiqama University Logo" 
            className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-md brightness-0 invert"
          />
        </div>

        {/* Text centered in the container */}
        <div className="text-center max-w-3xl">
          <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            AL'ISTIQAMA UNIVERSITY SUMAILA
          </h1>
          <p className="text-xs md:text-base lg:text-lg opacity-90 mt-1 font-medium uppercase tracking-wider">
            Computer Based Test (CBT) Examination System
          </p>
          <div className="flex justify-center gap-4 mt-3 text-[9px] md:text-xs uppercase tracking-widest font-bold opacity-75">
            <span>Integrity</span>
            <span>•</span>
            <span>Excellence</span>
            <span>•</span>
            <span>Service</span>
          </div>
        </div>
        
        {/* Hidden spacer to balance the flex layout on mobile if needed, 
            but absolute positioning handles the centering on desktop */}
        <div className="hidden md:block w-24 h-24 invisible"></div>
      </div>
    </header>
  );
};

export default Header;
