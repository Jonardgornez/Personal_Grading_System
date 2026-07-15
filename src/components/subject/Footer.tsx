import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-[#0b1b33] text-[#7fa1c3] text-sm py-4 px-6 flex flex-col sm:flex-row justify-between items-center border-t border-slate-800">
      <div>&copy; 2026 Online Grading System</div>

      <div className="text-right mt-2 sm:mt-0 sm:w-1/4 text-xs sm:text-sm">
        Developed by{" "}
        <span className="text-white font-semibold">Jonard M. Gornez</span>
      </div>
    </footer>
  );
};

export default Footer;
