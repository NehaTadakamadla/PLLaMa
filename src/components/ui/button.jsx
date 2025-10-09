import React from "react";
import clsx from "clsx";

/**
 * Button component
 * Props:
 *  - children: button content
 *  - className: additional classes
 *  - variant: "default" | "outline"
 *  - ...rest: other button props
 */
export const Button = React.forwardRef(
  ({ children, className, variant = "default", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
      default: "bg-green-500 text-white hover:bg-green-600",
      outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    };

    return (
      <button
        ref={ref}
        className={clsx(baseClasses, variants[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
