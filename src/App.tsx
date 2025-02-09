import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Vehicle, MaintenanceRecord } from './types';
import { Calendar, Clock, File as Oil, Truck, Plus, PenTool as Tool, X, LogIn } from 'lucide-react';

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: ''
  });
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    type: '',
    model: '',
    year: new Date().getFullYear(),
    vin: ''
  });
  const [newService, setNewService] = useState({
    service_type: '',
    service_date: new Date().toISOString().split('T')[0],
    mileage: '',
    notes: '',
    next_service_date: '',
    next_service_mileage: ''
  });

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedVehicle) {
      fetchMaintenanceRecords(selectedVehicle);
    }
  }, [selectedVehicle]);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password
      });

      if (error) throw error;
    } catch (error: any) {
      setAuthError(error.message);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password
      });

      if (error) throw error;
      else {
        setAuthError('Check your email for the confirmation link.');
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }

  async function fetchMaintenanceRecords(vehicleId: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false });
      
      if (error) throw error;
      setMaintenanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('vehicles')
        .insert([
          {
            ...newVehicle,
            user_id: user.id
          }
        ]);

      if (error) throw error;
      
      setShowAddVehicle(false);
      setNewVehicle({
        name: '',
        type: '',
        model: '',
        year: new Date().getFullYear(),
        vin: ''
      });
      fetchVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (!user || !selectedVehicle) {
        console.error('User not authenticated or no vehicle selected');
        return;
      }

      const { error } = await supabase
        .from('maintenance_records')
        .insert([
          {
            vehicle_id: selectedVehicle,
            service_type: newService.service_type,
            service_date: newService.service_date,
            mileage: newService.mileage ? parseInt(newService.mileage) : null,
            notes: newService.notes,
            next_service_date: newService.next_service_date || null,
            next_service_mileage: newService.next_service_mileage ? parseInt(newService.next_service_mileage) : null,
            performed_by: user.id
          }
        ]);

      if (error) throw error;
      
      setShowAddService(false);
      setNewService({
        service_type: '',
        service_date: new Date().toISOString().split('T')[0],
        mileage: '',
        notes: '',
        next_service_date: '',
        next_service_mileage: ''
      });
      fetchMaintenanceRecords(selectedVehicle);
    } catch (error) {
      console.error('Error adding service record:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Truck size={32} className="text-blue-600" />
            <h1 className="text-2xl font-bold ml-3">McPherson Maintenance</h1>
          </div>
          
          <form onSubmit={handleSignIn} className="space-y-4">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {authError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <LogIn size={20} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck size={32} />
              <h1 className="text-2xl font-bold">McPherson Maintenance Tracker</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-400 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Vehicle List */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Vehicles</h2>
              <button 
                onClick={() => setShowAddVehicle(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <Plus size={20} className="text-blue-600" />
              </button>
            </div>
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedVehicle === vehicle.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  <div className="font-medium">{vehicle.name}</div>
                  <div className="text-sm text-gray-500">
                    {vehicle.year} {vehicle.model}
                  </div>
                </button>
              ))}
            </div>

            {/* Add Vehicle Modal */}
            {showAddVehicle && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add New Vehicle</h3>
                    <button
                      onClick={() => setShowAddVehicle(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                      type="button"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newVehicle.name}
                        onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newVehicle.type}
                        onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Truck">Truck</option>
                        <option value="Car">Car</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <input
                        type="text"
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="number"
                        value={newVehicle.year}
                        onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                      <input
                        type="text"
                        value={newVehicle.vin}
                        onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowAddVehicle(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        Add Vehicle
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Records */}
          <div className="md:col-span-3">
            {selectedVehicle ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Maintenance History</h2>
                  <button 
                    onClick={() => setShowAddService(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    type="button"
                  >
                    <Oil size={20} />
                    <span>Add Service Record</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="border-l-4 border-blue-500 pl-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{record.service_type}</h3>
                          <div className="text-sm text-gray-500 space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar size={16} />
                              <span>Serviced: {new Date(record.service_date).toLocaleDateString()}</span>
                            </div>
                            {record.mileage && (
                              <div className="flex items-center space-x-2">
                                <Clock size={16} />
                                <span>Mileage: {record.mileage.toLocaleString()} miles</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            Next Service:
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.next_service_date
                              ? new Date(record.next_service_date).toLocaleDateString()
                              : 'Not scheduled'}
                          </div>
                        </div>
                      </div>
                      {record.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <Tool size={16} className="inline-block mr-2" />
                          {record.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Service Modal */}
                {showAddService && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Add Service Record</h3>
                        <button
                          onClick={() => setShowAddService(false)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                          type="button"
                        >
                          <X size={20} className="text-gray-500" />
                        </button>
                      </div>
                      <form onSubmit={handleAddService} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Type
                          </label>
                          <input
                            type="text"
                            value={newService.service_type}
                            onChange={(e) => setNewService({ ...newService, service_type: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Oil Change, Tire Rotation, etc."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Date
                          </label>
                          <input
                            type="date"
                            value={newService.service_date}
                            onChange={(e) => setNewService({ ...newService, service_date: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Mileage
                          </label>
                          <input
                            type="number"
                            value={newService.mileage}
                            onChange={(e) => setNewService({ ...newService, mileage: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            value={newService.notes}
                            onChange={(e) => setNewService({ ...newService, notes: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                            placeholder="Service details, parts replaced, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Next Service Date
                          </label>
                          <input
                            type="date"
                            value={newService.next_service_date}
                            onChange={(e) => setNewService({ ...newService, next_service_date: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Next Service Mileage
                          </label>
                          <input
                            type="number"
                            value={newService.next_service_mileage}
                            onChange={(e) => setNewService({ ...newService, next_service_mileage: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Optional"
                          />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            type="button"
                            onClick={() => setShowAddService(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                          >
                            Add Service Record
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <Truck size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a vehicle to view its maintenance history</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;