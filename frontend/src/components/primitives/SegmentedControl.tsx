import React from "react";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`segmented-glass-control segmented-${size} ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            className={`segmented-glass-item ${isActive ? "active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <span className="segmented-icon">{opt.icon}</span>}
            <span className="segmented-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
