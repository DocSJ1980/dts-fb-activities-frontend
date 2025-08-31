import { NextRequest, NextResponse } from "next/server";
import {
  searchEmployees,
  getEmployeeById,
  getEmployeePerformance,
  getEmployeeActivities,
} from "@/lib/employee-performance-queries";
import {
  EmployeePerformanceFilters,
  EmployeeSearchResponse,
  EmployeePerformanceResponse,
  EmployeeActivitiesResponse,
} from "@/types/employee-performance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    console.log("Employee Performance API - Endpoint:", endpoint);

    switch (endpoint) {
      case "search-employees": {
        const searchTerm = searchParams.get("search") || "";
        
        if (!searchTerm.trim()) {
          return NextResponse.json(
            { error: "Search term is required" },
            { status: 400 }
          );
        }

        console.log("Searching employees with term:", searchTerm);
        const result: EmployeeSearchResponse = await searchEmployees(searchTerm);
        
        return NextResponse.json(result);
      }

      case "employee-performance": {
        const employeeIdParam = searchParams.get("employeeId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        if (!employeeIdParam || !dateFrom || !dateTo) {
          return NextResponse.json(
            { error: "employeeId, dateFrom, and dateTo parameters are required" },
            { status: 400 }
          );
        }

        const employeeId = parseInt(employeeIdParam);
        if (isNaN(employeeId)) {
          return NextResponse.json(
            { error: "Invalid employeeId parameter" },
            { status: 400 }
          );
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
          return NextResponse.json(
            { error: "Invalid date format. Use YYYY-MM-DD" },
            { status: 400 }
          );
        }

        const employee = await getEmployeeById(employeeId);
        if (!employee) {
          return NextResponse.json(
            { error: "Employee not found" },
            { status: 404 }
          );
        }

        const filters: EmployeePerformanceFilters = {
          employeeId,
          username: employee.username,
          dateFrom,
          dateTo,
        };

        console.log("Getting employee performance for:", {
          employeeId,
          username: employee.username,
          dateFrom,
          dateTo,
        });

        const result: EmployeePerformanceResponse = await getEmployeePerformance(filters);
        
        return NextResponse.json(result);
      }

      case "employee-activities": {
        const employeeIdParam = searchParams.get("employeeId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const pageParam = searchParams.get("page") || "1";
        const limitParam = searchParams.get("limit") || "30";

        if (!employeeIdParam || !dateFrom || !dateTo) {
          return NextResponse.json(
            { error: "employeeId, dateFrom, and dateTo parameters are required" },
            { status: 400 }
          );
        }

        const employeeId = parseInt(employeeIdParam);
        const page = parseInt(pageParam);
        const limit = parseInt(limitParam);

        if (isNaN(employeeId) || isNaN(page) || isNaN(limit)) {
          return NextResponse.json(
            { error: "Invalid numeric parameters" },
            { status: 400 }
          );
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
          return NextResponse.json(
            { error: "Invalid date format. Use YYYY-MM-DD" },
            { status: 400 }
          );
        }

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 2000) {
          return NextResponse.json(
            { error: "Page must be >= 1, limit must be between 1 and 2000" },
            { status: 400 }
          );
        }

        const employee = await getEmployeeById(employeeId);
        if (!employee) {
          return NextResponse.json(
            { error: "Employee not found" },
            { status: 404 }
          );
        }

        const filters: EmployeePerformanceFilters = {
          employeeId,
          username: employee.username,
          dateFrom,
          dateTo,
        };

        console.log("Getting employee activities for:", {
          employeeId,
          username: employee.username,
          dateFrom,
          dateTo,
          page,
          limit,
        });

        const result: EmployeeActivitiesResponse = await getEmployeeActivities(
          filters,
          page,
          limit
        );
        
        return NextResponse.json(result);
      }

      default: {
        return NextResponse.json(
          { error: "Invalid endpoint. Available endpoints: search-employees, employee-performance, employee-activities" },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error("Employee Performance API Error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}