export interface Vehicle {
  id: string;
  name: string;
  type: string;
  model: string;
  year: number;
  vin: string;
  created_at: string;
  user_id: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  mileage: number;
  notes: string;
  next_service_date: string;
  next_service_mileage: number;
  performed_by: string;
  created_at: string;
}