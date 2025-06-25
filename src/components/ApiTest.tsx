'use client';

import { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface TestResult {
  test: string;
  status: 'SUCCESS' | 'FAILED';
  data?: unknown;
  statusCode?: number;
  error?: string;
  params?: Record<string, unknown>;
}

export default function ApiTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const runTests = async () => {
    setLoading(true);
    const results: TestResult[] = [];

    // Test 1: Check if API is reachable
    try {
      const response = await axios.get(API_BASE_URL);
      results.push({
        test: 'API Base URL',
        status: 'SUCCESS',
        data: response.data,
        statusCode: response.status,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      results.push({
        test: 'API Base URL',
        status: 'FAILED',
        error: axiosError.message,
        statusCode: axiosError.response?.status,
        data: axiosError.response?.data,
      });
    }

    // Test 2: Check /towns endpoint
    try {
      const response = await axios.get(`${API_BASE_URL}/towns`);
      results.push({
        test: '/towns endpoint',
        status: 'SUCCESS',
        data: response.data,
        statusCode: response.status,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      results.push({
        test: '/towns endpoint',
        status: 'FAILED',
        error: axiosError.message,
        statusCode: axiosError.response?.status,
        data: axiosError.response?.data,
      });
    }

    // Test 3: Check /surveillance-data endpoint with minimal params
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API_BASE_URL}/surveillance-data`, {
        params: { date: today }
      });
      results.push({
        test: '/surveillance-data endpoint',
        status: 'SUCCESS',
        data: response.data,
        statusCode: response.status,
        params: { date: today },
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      results.push({
        test: '/surveillance-data endpoint',
        status: 'FAILED',
        error: axiosError.message,
        statusCode: axiosError.response?.status,
        data: axiosError.response?.data,
        params: { date: new Date().toISOString().split('T')[0] },
      });
    }

    // Test 4: Check what endpoints are available
    try {
      const response = await axios.get(`${API_BASE_URL}/docs`);
      results.push({
        test: 'API Documentation',
        status: 'SUCCESS',
        data: 'Documentation available',
        statusCode: response.status,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      results.push({
        test: 'API Documentation',
        status: 'FAILED',
        error: axiosError.message,
        statusCode: axiosError.response?.status,
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">API Connection Test</h2>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <strong>API Base URL:</strong> {API_BASE_URL}
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'SUCCESS'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{result.test}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'SUCCESS'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.status}
                </span>
              </div>

              {result.statusCode && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Status Code:</strong> {result.statusCode}
                </div>
              )}

              {result.params && (
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Parameters:</strong> {JSON.stringify(result.params)}
                </div>
              )}

              {result.error && (
                <div className="text-sm text-red-600 mb-2">
                  <strong>Error:</strong> {result.error}
                </div>
              )}

              {result.data != null && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    Response Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          Click &quot;Run Tests&quot; to check API connectivity
        </div>
      )}
    </div>
  );
}
