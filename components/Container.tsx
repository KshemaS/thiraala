import React from "react";

type ContainerProps = {
    children: React.ReactNode;
    className?: string;
    headerMargin?: boolean;
};

// Simple utility function to join class names safely
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).map(c => c?.trim()).join(" ");
};

const Container: React.FC<ContainerProps> = ({
    children,
    className = "",
}) => {
    return (
        <div
            className={cn(
                `
          w-full
          px-[16px] 
          sm:px-[24px] 
          xl:px-0
          xl:max-w-[1280px]
          3xl:max-w-[1440px]
          mx-auto
        `,
                className
            )}
        >
            {children}
        </div>
    );
};

export default Container;
