
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-green-950 text-white py-8 mt-auto border-t-8 border-yellow-500">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-xl font-bold mb-2">Al'Istiqama University Sumaila</h3>
        <p className="text-sm opacity-80 mb-4">Integrity • Excellence • Service</p>
        <div className="text-xs opacity-60 space-y-1">
          <p>© {new Date().getFullYear()} Directorate of ICT, Al'Istiqama University Sumaila. All rights reserved.</p>
          <p>For technical support: cbt-support@au.edu.ng | Phone: +234 706 045 1989</p>
          <p className="pt-2">Computer Based Test System v3.0 (Powered by Gemini)</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
