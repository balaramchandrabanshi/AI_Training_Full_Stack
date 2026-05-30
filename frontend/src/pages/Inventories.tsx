import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { Inventory } from '../types';
import { Boxes, Folder, Package, Plus, Edit2, Trash2 } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { CardSkeleton } from '../components/Skeleton';

export default function Inventories() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchInventories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getInventories();
      setInventories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventories.');
      toast.error(err.message || 'Failed to load inventories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setModalError('');
    setIsCreateOpen(true);
  };

  const openEditModal = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setFormName(inventory.name);
    setFormDescription(inventory.description || '');
    setModalError('');
    setIsEditOpen(true);
  };

  const openDeleteModal = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setModalError('');
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Name is required');
      return;
    }
    try {
      setModalLoading(true);
      setModalError('');
      await api.createInventory(formName.trim(), formDescription.trim());
      setIsCreateOpen(false);
      toast.success('Inventory created successfully!');
      fetchInventories();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create inventory.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    if (!formName.trim()) {
      setModalError('Name is required');
      return;
    }
    try {
      setModalLoading(true);
      setModalError('');
      await api.updateInventory(selectedInventory.id, formName.trim(), formDescription.trim());
      setIsEditOpen(false);
      toast.success('Inventory updated successfully!');
      fetchInventories();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update inventory.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    try {
      setModalLoading(true);
      setModalError('');
      await api.deleteInventory(selectedInventory.id);
      setIsDeleteOpen(false);
      toast.success('Inventory deleted successfully!');
      fetchInventories();
    } catch (err: any) {
      setModalError(err.message || 'Failed to delete inventory.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Layout title="Inventories">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400">
              Manage your inventory locations and their categories
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Inventory
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : inventories.length > 0 ? (
          /* Inventory Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventories.map((inventory) => (
              <Link
                key={inventory.id}
                to={`/inventories/${inventory.id}`}
                className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <Boxes className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openEditModal(inventory);
                      }}
                      className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit Inventory"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openDeleteModal(inventory);
                      }}
                      className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Inventory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {inventory.name}
                </h3>

                <p className="text-sm text-slate-400 mb-6 line-clamp-2 min-h-[40px]">
                  {inventory.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Folder className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {inventory.category_count}
                      </p>
                      <p className="text-xs text-slate-500">Categories</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Package className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {inventory.item_count}
                      </p>
                      <p className="text-xs text-slate-500">Items</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No inventories found</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-6 text-sm">
              Create your first inventory location to start organizing your product items.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              New Inventory
            </button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Inventory"
        onSubmit={handleCreateSubmit}
        submitLabel="Create"
        loading={modalLoading}
      >
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {modalError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Inventory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={modalLoading}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Main Warehouse"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={modalLoading}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Primary storage facility for all products"
            />
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Inventory"
        onSubmit={handleEditSubmit}
        submitLabel="Save Changes"
        loading={modalLoading}
      >
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {modalError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Inventory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={modalLoading}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Main Warehouse"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={modalLoading}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Primary storage facility for all products"
            />
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Inventory"
        onSubmit={handleDeleteSubmit}
        submitLabel="Yes, Delete"
        submitColor="red"
        loading={modalLoading}
      >
        {modalError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {modalError}
          </div>
        )}
        <p className="text-slate-300 text-sm">
          Are you sure you want to delete <span className="font-semibold text-white">"{selectedInventory?.name}"</span>?
        </p>
        <p className="text-slate-400 text-xs mt-2">
          This action is permanent and will delete all categories and items inside this location.
        </p>
      </Modal>
    </Layout>
  );
}
