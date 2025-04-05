/*
  # Initial schema setup for Work From Home application

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `igg` (text)
      - `full_name` (text)
      - `job_title` (text)
      - `area` (text)
      - `email` (text)
      - `reports_to` (text)
      - `created_at` (timestamp with time zone)

    - `work_status`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `status` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read their own employee data
      - Read/write their own work status entries
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  igg text NOT NULL,
  full_name text NOT NULL,
  job_title text NOT NULL,
  area text NOT NULL,
  email text NOT NULL,
  reports_to text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create work_status table
CREATE TABLE IF NOT EXISTS work_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_status ENABLE ROW LEVEL SECURITY;

-- Policies for employees table
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for work_status table
CREATE POLICY "Users can read own work status"
  ON work_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work status"
  ON work_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work status"
  ON work_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);