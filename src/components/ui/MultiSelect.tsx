"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string; // For grouping by town
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  maxDisplayItems?: number;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  loading = false,
  disabled = false,
  maxDisplayItems = 3
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.group && option.group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, MultiSelectOption[]>);

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemoveItem = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));
  const displayItems = selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - maxDisplayItems;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`
          min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer
          flex items-center justify-between gap-2 bg-white
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap gap-1 min-h-[24px]">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 py-1">{placeholder}</span>
          ) : (
            <>
              {displayItems.map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  <span className="max-w-[120px] truncate">{option.label}</span>
                  <button
                    onClick={(e) => handleRemoveItem(option.value, e)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                    disabled={disabled}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                  +{remainingCount} more
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {Object.keys(groupedOptions).length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
            ) : (
              Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {/* Group Header */}
                  <div className="px-3 py-1 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {group}
                  </div>
                  
                  {/* Group Options */}
                  {groupOptions.map(option => {
                    const isSelected = value.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        className={`
                          px-3 py-2 cursor-pointer flex items-center justify-between
                          hover:bg-gray-100 text-sm
                          ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                        `}
                        onClick={() => handleToggleOption(option.value)}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {selectedOptions.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>{selectedOptions.length} selected</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
