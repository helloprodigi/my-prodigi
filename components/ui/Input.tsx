"use client";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, ...props }: Props) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label && <span className="font-medium">{label}</span>}
      <input
        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
        {...props}
      />
    </label>
  );
}
