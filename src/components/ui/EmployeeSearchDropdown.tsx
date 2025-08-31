"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, ChevronDown } from "lucide-react";
import { Employee } from "@/types/employee-performance";
import { employeePerformanceApiService } from "@/services/api";

interface EmployeeSearchDropdownProps {
  selectedEmployee: Employee | null;
  onEmployeeSelect: (employee: Employee) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function EmployeeSearchDropdown({
  selectedEmployee,
  onEmployeeSelect,
  placeholder = "Search and select an employee...",
  disabled = false,
}: EmployeeSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search employees when search term changes
  useEffect(() => {
    const searchEmployees = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setEmployees([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await employeePerformanceApiService.searchEmployees(
          searchTerm
        );
        setEmployees(response.employees);
      } catch (err) {
        console.error("Error searching employees:", err);
        setError("Failed to search employees. Please try again.");
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchEmployees, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchInputRef.current) {
      searchInputRef.current.select();
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    onEmployeeSelect(employee);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayName = (employee: Employee) => {
    if (employee.name && employee.name.trim()) {
      return employee.name;
    }
    return employee.username;
  };

  const getSecondaryInfo = (employee: Employee) => {
    const parts = [];
    if (employee.designation) parts.push(employee.designation);
    if (employee.town) parts.push(employee.town);
    return parts.join(" • ");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Employee Display or Search Input */}
      <div className="relative">
        {selectedEmployee && !isOpen ? (
          <button
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className={`w-full p-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between transition-colors ${
              disabled
                ? "bg-gray-50 cursor-not-allowed opacity-50"
                : "hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate text-sm sm:text-base">
                  {getDisplayName(selectedEmployee)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">
                  @{selectedEmployee.username}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg transition-colors text-gray-900 placeholder:text-gray-500 ${
                disabled
                  ? "bg-gray-50 cursor-not-allowed opacity-50"
                  : "focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
            />
            {selectedEmployee && (
              <button
                onClick={() => onEmployeeSelect(null as unknown as Employee)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear selection"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2">Searching...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-600 text-sm">{error}</div>
          )}

          {!loading && !error && searchTerm.length < 2 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Type at least 2 characters to search
            </div>
          )}

          {!loading &&
            !error &&
            searchTerm.length >= 2 &&
            employees.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No employees found matching &quot;{searchTerm}&quot;
              </div>
            )}

          {!loading &&
            !error &&
            employees.length > 0 &&
            employees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => handleEmployeeSelect(employee)}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {getDisplayName(employee)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{employee.username}
                    </div>
                    {getSecondaryInfo(employee) && (
                      <div className="text-xs text-gray-400 truncate mt-1">
                        {getSecondaryInfo(employee)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}