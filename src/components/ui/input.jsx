import React from "react";
import clsx from "clsx";

/**
 * Input component
 * Props:
 *  - className: additional classes
 *  - ...rest: input props (type, value, onChange, placeholder, etc.)
 */
export const Input = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 transition-all duration-200",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
