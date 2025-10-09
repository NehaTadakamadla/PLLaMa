// src/components/ui/card.js
import React from "react";

export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};
