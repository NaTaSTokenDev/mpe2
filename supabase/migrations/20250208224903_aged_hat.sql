/*
  # Initial Schema for McPherson Maintenance Tracker

  1. New Tables
    - `vehicles`
      - `id` (uuid, primary key)
      - `name` (text) - Vehicle/equipment name
      - `type` (text) - Type of vehicle/equipment
      - `model` (text) - Model information
      - `year` (integer) - Manufacturing year
      - `vin` (text) - VIN or serial number
      - `created_at` (timestamp)
      - `user_id` (uuid) - Reference to auth.users
    
    - `maintenance_records`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid) - Reference to vehicles
      - `service_type` (text) - Type of service (oil change, etc)
      - `service_date` (date) - When service was performed
      - `mileage` (integer) - Mileage at service
      - `notes` (text) - Additional notes
      - `next_service_date` (date) - When next service is due
      - `next_service_mileage` (integer) - Mileage when next service is due
      - `performed_by` (uuid) - Reference to auth.users
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their team's data
*/

-- Create vehicles table
CREATE TABLE vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    model text,
    year integer,
    vin text,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create maintenance_records table
CREATE TABLE maintenance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    service_type text NOT NULL,
    service_date date NOT NULL,
    mileage integer,
    notes text,
    next_service_date date,
    next_service_mileage integer,
    performed_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Policies for vehicles
CREATE POLICY "Allow authenticated users to read all vehicles"
    ON vehicles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert vehicles"
    ON vehicles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their vehicles"
    ON vehicles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for maintenance_records
CREATE POLICY "Allow authenticated users to read all maintenance records"
    ON maintenance_records FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert maintenance records"
    ON maintenance_records FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their maintenance records"
    ON maintenance_records FOR UPDATE
    TO authenticated
    USING (auth.uid() = performed_by);