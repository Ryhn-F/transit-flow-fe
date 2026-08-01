-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Station Nodes spatial table
CREATE TABLE IF NOT EXISTS station_nodes_geojson (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(100) UNIQUE NOT NULL,
  station_name VARCHAR(255) NOT NULL,
  line_name VARCHAR(100),
  city VARCHAR(100) DEFAULT 'Jakarta',
  geometry GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Field Survey Submissions & Exit Geometries
CREATE TABLE IF NOT EXISTS survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id VARCHAR(100) REFERENCES station_nodes_geojson(station_id) ON DELETE CASCADE,
  surveyor_name VARCHAR(255) NOT NULL,
  exit_door_width_m NUMERIC(5,2) CHECK (exit_door_width_m > 0),
  stair_width_m NUMERIC(5,2) CHECK (stair_width_m >= 0),
  sidewalk_width_m NUMERIC(5,2) CHECK (sidewalk_width_m > 0),
  obstacle_type VARCHAR(100) CHECK (obstacle_type IN ('vendor', 'construction', 'angkot_queue', 'parking', 'other', 'none')),
  notes TEXT,
  geometry GEOMETRY(Geometry, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial Indices for fast GIS spatial queries
CREATE INDEX IF NOT EXISTS idx_station_nodes_geom ON station_nodes_geojson USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_geom ON survey_submissions USING GIST (geometry);
