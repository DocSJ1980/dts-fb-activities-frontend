"use client";

import { useState, useRef, useEffect } from "react";

interface StringDropdownOption {
  value: string;
  label: string;
}

interface StringDropdownProps {
  options: StringDropdownOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

export default function StringDropdown({
  options,
  value,
  onChange,
  placeholder = "Select option",
  loading = false,
  disabled = false,
}: StringDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 py-2 text-left cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
          ${
            disabled || loading
              ? "bg-gray-50 text-gray-700 cursor-not-allowed"
              : "hover:border-gray-400 text-gray-700"
          }
          ${selectedOption ? "pr-16" : "pr-10"}
        `}
        disabled={disabled || loading}
      >
        <span
          className={`block truncate ${
            !selectedOption ? "text-gray-900 font-medium" : ""
          }`}
        >
          {loading
            ? "Loading..."
            : selectedOption
            ? selectedOption.label
            : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </button>

      {/* Clear button - separate from dropdown button */}
      {selectedOption && !disabled && !loading && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-800 hover:text-gray-600 z-10"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {isOpen && !loading && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white text-gray-700shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {options.length === 0 ? (
            <div className="text-gray-500 px-3 py-2">No options available</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-900 transition-colors text-gray-700
                  ${
                    option.value === value
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-900"
                  }
                `}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
