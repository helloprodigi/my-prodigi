"use client";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function Button({ children, className = "", ...props }: Props) {
  return (
    <button
      className={`px-4 py-2 bg-foreground text-background rounded-md disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
