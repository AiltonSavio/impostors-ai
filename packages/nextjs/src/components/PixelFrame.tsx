import React from "react";

interface PixelFrameProps {
  children: React.ReactNode;
  className?: string;
  width?: string;
  height?: string;
}

const PixelFrame = ({ children, className, width = "w-full", height = "h-auto" }: PixelFrameProps) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${width} ${height} ${className}`}>
      {/* Outer border */}
      <div className="absolute inset-0 p-[4px] box-content">
        {/* Top border */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-pixelGold" />

        {/* Bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-pixelGold" />

        {/* Left border */}
        <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-pixelGold" />

        {/* Right border */}
        <div className="absolute top-0 right-0 bottom-0 w-[4px] bg-pixelGold" />

        {/* Corner pixels - top left */}
        <div className="absolute top-[-4px] left-[-4px] w-[12px] h-[4px] bg-pixelGold" />
        <div className="absolute top-[-4px] left-[-4px] w-[4px] h-[12px] bg-pixelGold" />
        <div className="absolute top-[0px] left-[8px] w-[4px] h-[4px] bg-pixelGold-dark" />
        <div className="absolute top-[8px] left-[0px] w-[4px] h-[4px] bg-pixelGold-dark" />

        {/* Corner pixels - top right */}
        <div className="absolute top-[-4px] right-[-4px] w-[12px] h-[4px] bg-pixelGold" />
        <div className="absolute top-[-4px] right-[-4px] w-[4px] h-[12px] bg-pixelGold" />
        <div className="absolute top-[0px] right-[8px] w-[4px] h-[4px] bg-pixelGold-dark" />
        <div className="absolute top-[8px] right-[0px] w-[4px] h-[4px] bg-pixelGold-dark" />

        {/* Corner pixels - bottom left */}
        <div className="absolute bottom-[-4px] left-[-4px] w-[12px] h-[4px] bg-pixelGold" />
        <div className="absolute bottom-[-4px] left-[-4px] w-[4px] h-[12px] bg-pixelGold" />
        <div className="absolute bottom-[0px] left-[8px] w-[4px] h-[4px] bg-pixelGold-dark" />
        <div className="absolute bottom-[8px] left-[0px] w-[4px] h-[4px] bg-pixelGold-dark" />

        {/* Corner pixels - bottom right */}
        <div className="absolute bottom-[-4px] right-[-4px] w-[12px] h-[4px] bg-pixelGold" />
        <div className="absolute bottom-[-4px] right-[-4px] w-[4px] h-[12px] bg-pixelGold" />
        <div className="absolute bottom-[0px] right-[8px] w-[4px] h-[4px] bg-pixelGold-dark" />
        <div className="absolute bottom-[8px] right-[0px] w-[4px] h-[4px] bg-pixelGold-dark" />

        {/* Border highlight and shadow effect */}
        <div className="absolute top-[4px] left-[4px] right-[4px] h-[1px] bg-pixelGold-light opacity-50" />
        <div className="absolute bottom-[4px] left-[4px] right-[4px] h-[1px] bg-pixelGold-darker opacity-50" />
        <div className="absolute top-[4px] left-[4px] bottom-[4px] w-[1px] bg-pixelGold-light opacity-50" />
        <div className="absolute top-[4px] right-[4px] bottom-[4px] w-[1px] bg-pixelGold-darker opacity-50" />
      </div>

      {/* Content */}
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6">{children}</div>
    </div>
  );
};

export default PixelFrame;