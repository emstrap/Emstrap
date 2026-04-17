import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminDetailGrid from "../../components/admin/AdminDetailGrid";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminModal from "../../components/admin/AdminModal";
import AdminSurface from "../../components/admin/AdminSurface";
import { AdminEmptyRow, AdminLoadingRow } from "../../components/admin/AdminTableState";
import { formatDate, getStatusBadgeClasses } from "../../components/admin/admin.utils";
import { getErrorMessage } from "../../services/api";
import {
  addAmbulance,
  deleteAmbulance,
  getAmbulances,
  updateAmbulance,
} from "../../services/ambulanceApi";

const initialForm = {
  driverName: "",
  vehicleNumber: "",
  contact: "",
  location: "",
  status: "AVAILABLE",
};

const statusOptions = ["AVAILABLE", "BUSY", "OFFLINE", "MAINTENANCE"];

export default function AdminAmbulance() {
  const [ambulances, setAmbulances] = useState([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [editingAmbulance, setEditingAmbulance] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAmbulances = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await getAmbulances();
      if (res.success) setAmbulances(res.ambulances || []);
      setError("");
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Failed to load ambulances");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => setForm(initialForm);

  const openEditModal = (ambulance) => {
    setEditingAmbulance(ambulance);
    setForm({
      driverName: ambulance.driverName || "",
      vehicleNumber: ambulance.vehicleNumber || "",
      contact: ambulance.contact || "",
      location: ambulance.location || "",
      status: ambulance.status || "AVAILABLE",
    });
  };

  const closeEditModal = () => {
    setEditingAmbulance(null);
    resetForm();
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await addAmbulance(form);
      if (res.success) {
        toast.success("Ambulance added successfully");
        resetForm();
        await fetchAmbulances({ silent: true });
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Failed to add ambulance"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingAmbulance) return;

    setSaving(true);

    try {
      const res = await updateAmbulance(editingAmbulance._id, form);
      if (res.success) {
        setAmbulances((current) => current.map((item) => item._id === editingAmbulance._id ? res.ambulance : item));
        setSelectedAmbulance((current) => current?._id === editingAmbulance._id ? res.ambulance : current);
        toast.success("Ambulance updated successfully");
        closeEditModal();
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Failed to update ambulance"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const loadingToast = toast.loading("Deleting ambulance...");

    try {
      const res = await deleteAmbulance(id);
      if (res.success) {
        setAmbulances((current) => current.filter((item) => item._id !== id));
        if (selectedAmbulance?._id === id) setSelectedAmbulance(null);
        toast.success("Ambulance deleted", { id: loadingToast });
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Failed to delete ambulance"), { id: loadingToast });
    }
  };

  const getDetails = (ambulance) => ({
    "Driver Name": ambulance.driverName,
    "Vehicle Number": ambulance.vehicleNumber,
    Contact: ambulance.contact,
    Location: ambulance.location,
    Status: ambulance.status,
    "Current Location": ambulance.currentLocation,
    "Active Request": ambulance.activeRequest,
    "Created Date": formatDate(ambulance.createdAt),
    "Updated Date": formatDate(ambulance.updatedAt),
    "Ambulance ID": ambulance._id,
  });

  const renderForm = (onSubmit, submitLabel, clearAction) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input name="driverName" value={form.driverName} onChange={handleInputChange} placeholder="Driver name" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" required />
      <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleInputChange} placeholder="Vehicle number" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" required />
      <input name="contact" value={form.contact} onChange={handleInputChange} placeholder="Contact" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" required />
      <input name="location" value={form.location} onChange={handleInputChange} placeholder="Location" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" required />
      <select name="status" value={form.status} onChange={handleInputChange} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
        {statusOptions.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      <div className="flex gap-3 md:col-span-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {saving ? "Saving..." : submitLabel}
        </button>
        <button type="button" onClick={clearAction} className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
          Clear
        </button>
      </div>
    </form>
  );

  return (
    <AdminLayout
      title="Ambulance"
      description="Merged ambulance and driver module backed by the /api/ambulances collection."
      actions={
        <button
          type="button"
          onClick={() => fetchAmbulances({ silent: true })}
          disabled={refreshing}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-900 disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      {error ? (
        <AdminSurface className="mb-6 border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </AdminSurface>
      ) : null}

      <AdminSurface className="mb-6 p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Add Ambulance</h2>
        {renderForm(handleCreate, "Add Ambulance", resetForm)}
      </AdminSurface>

      <AdminSurface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
                <th className="p-5 font-bold">Driver Name</th>
                <th className="p-5 font-bold">Vehicle Number</th>
                <th className="p-5 font-bold">Contact</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <AdminLoadingRow colSpan={5} label="Loading ambulances..." />
              ) : ambulances.length === 0 ? (
                <AdminEmptyRow colSpan={5} label="No ambulances found." />
              ) : ambulances.map((ambulance) => (
                <tr key={ambulance._id} onClick={() => setSelectedAmbulance(ambulance)} className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <td className="p-5 font-bold text-gray-900 dark:text-white">{ambulance.driverName}</td>
                  <td className="p-5 text-sm text-gray-600 dark:text-gray-400">{ambulance.vehicleNumber}</td>
                  <td className="p-5 text-sm text-gray-600 dark:text-gray-400">{ambulance.contact}</td>
                  <td className="p-5">
                    <span className={`rounded-full px-3 py-2 text-xs font-bold ${getStatusBadgeClasses(ambulance.status)}`}>
                      {ambulance.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => setSelectedAmbulance(ambulance)} className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700">View</button>
                      <button type="button" onClick={() => openEditModal(ambulance)} className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700">Update</button>
                      <button type="button" onClick={() => handleDelete(ambulance._id)} className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSurface>

      {selectedAmbulance ? (
        <AdminModal title={selectedAmbulance.driverName} subtitle="Full ambulance details" onClose={() => setSelectedAmbulance(null)}>
          <AdminDetailGrid data={getDetails(selectedAmbulance)} />
        </AdminModal>
      ) : null}

      {editingAmbulance ? (
        <AdminModal title={`Update ${editingAmbulance.driverName}`} subtitle="Edit the selected ambulance" onClose={closeEditModal}>
          {renderForm(handleUpdate, "Update Ambulance", closeEditModal)}
        </AdminModal>
      ) : null}
    </AdminLayout>
  );
}
