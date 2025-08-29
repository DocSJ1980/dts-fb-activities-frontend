// Configuration utilities for environment variables

export const config = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // Maps configuration
  maps: {
    queryLimit: parseInt(process.env.MAPS_QUERY_LIMIT || '100000', 10),
    clusterThreshold: parseInt(process.env.MAPS_CLUSTER_THRESHOLD || '7000', 10),
  },
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    kfkoboToken: process.env.KFKOBO_TOKEN || '',
  },
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Validation function to ensure required environment variables are set
export function validateConfig() {
  const errors: string[] = [];
  
  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }
  
  if (!config.api.kfkoboToken) {
    errors.push('KFKOBO_TOKEN is required');
  }
  
  if (config.maps.queryLimit <= 0) {
    errors.push('MAPS_QUERY_LIMIT must be a positive number');
  }
  
  if (config.maps.clusterThreshold <= 0) {
    errors.push('MAPS_CLUSTER_THRESHOLD must be a positive number');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Helper function to get maps query limit with fallback
export function getMapsQueryLimit(): number {
  return config.maps.queryLimit;
}

// Helper function to get cluster threshold with fallback
export function getClusterThreshold(): number {
  return config.maps.clusterThreshold;
}
