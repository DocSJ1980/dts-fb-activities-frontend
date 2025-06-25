// Default map center (Islamabad, Pakistan)
export const DEFAULT_MAP_CENTER: [number, number] = [33.6844, 73.0479];

// Map zoom levels
export const MAP_ZOOM_LEVELS = {
  DEFAULT: 13,
  CITY: 11,
  DISTRICT: 9,
  COUNTRY: 6,
};

// Date format constants
export const DATE_FORMATS = {
  INPUT: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
};

// API endpoints
export const API_ENDPOINTS = {
  TOWNS: '/towns',
  UCS: '/towns/{townCode}/ucs',
  SURVEILLANCE_DATA: '/surveillance-data',
  CONTAINER_DATA: '/surveillance-data/{activityId}/containers',
};

// Activity tags
export const ACTIVITY_TAGS = {
  HOUSE_VISIT: 'House Visit',
  SHOP_VISIT: 'Shop Visit',
  CONTAINER_CHECK: 'Container Check',
  BREEDING_SITE: 'Breeding Site',
  TREATMENT: 'Treatment',
};

// Container types
export const CONTAINER_TYPES = {
  WATER_TANK: 'Water Tank',
  BUCKET: 'Bucket',
  FLOWER_POT: 'Flower Pot',
  TIRE: 'Tire',
  COOLER: 'Cooler',
  OTHER: 'Other',
};

// Status colors for UI
export const STATUS_COLORS = {
  POSITIVE: '#ef4444', // red-500
  NEGATIVE: '#22c55e', // green-500
  PENDING: '#f59e0b', // amber-500
  INFO: '#3b82f6', // blue-500
};
