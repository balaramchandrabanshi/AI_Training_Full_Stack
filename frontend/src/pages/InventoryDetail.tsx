import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Breadcrumb from '../components/Breadcrumb';
import { Category, Inventory } from '../types';
import { Folder, Package, Plus, Edit2, Trash2 } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { CardSkeleton } from '../components/Skeleton';

export default function InventoryDetail() {
  const { invId } = useParams<{ invId: string }>();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchInventoryData = async () => {
    if (!invId) return;
    try {
      setLoading(true);
      setError('');
      const [invData, catsData] = await Promise.all([
        api.getInventory(invId),
        api.getCategories(invId),
      ]);
      setInventory(invData);
      setCategories(catsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory details.');
      toast.error(err.message || 'Failed to load inventory details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [invId]);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setModalError('');
    setIsCreateOpen(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setModalError('');
    setIsEditOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setModalError('');
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invId) return;
    if (!formName.trim()) {
      setModalError('Name is required');
      return;
    }
    try {
      setModalLoading(true);
      setModalError('');
      await api.createCategory(invId, formName.trim(), formDescription.trim());
      setIsCreateOpen(false);
      toast.success('Category created successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create category.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invId || !selectedCategory) return;
    if (!formName.trim()) {
      setModalError('Name is required');
      return;
    }
    try {
      setModalLoading(true);
      setModalError('');
      await api.updateCategory(invId, selectedCategory.id, formName.trim(), formDescription.trim());
      setIsEditOpen(false);
      toast.success('Category updated successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update category.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invId || !selectedCategory) return;
    try {
      setModalLoading(true);
      setModalError('');
      await api.deleteCategory(invId, selectedCategory.id);
      setIsDeleteOpen(false);
      toast.success('Category deleted successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to delete category.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading && !inventory) {
    return (
      <Layout title="Inventory Details">
        <div className="space-y-6">
          <div className="h-6 w-32 bg-slate-800 animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !inventory) {
    return (
      <Layout title="Inventory Not Found">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-slate-400 mb-4">{error || 'Inventory not found'}</p>
          <Link to="/inventories" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all duration-200">
            Back to Inventories
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={inventory.name}>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Inventories', path: '/inventories' },
            { label: inventory.name },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400">{inventory.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Category
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/inventories/${invId}/${category.id}`}
                className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <Folder className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full mr-2">
                      {category.item_count} items
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openEditModal(category);
                      }}
                      className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openDeleteModal(category);
                      }}
                      className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-green-400 transition-colors">
                  {category.name}
                </h3>

                <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
                  {category.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-500">
                    Last updated: {new Date(category.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <Folder className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No categories found</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-6 text-sm">
              Create your first category in this inventory to begin registering items.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              New Category
            </button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Category"
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
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={modalLoading}
              className="w-full px-3 py-2.5 bg-slate-805 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Computers"
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
              className="w-full px-3 py-2 bg-slate-805 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Desktop computers, notebooks and servers"
            />
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Category"
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
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={modalLoading}
              className="w-full px-3 py-2.5 bg-slate-805 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Computers"
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
              className="w-full px-3 py-2 bg-slate-805 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. Desktop computers, notebooks and servers"
            />
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Category"
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
          Are you sure you want to delete category <span className="font-semibold text-white">"{selectedCategory?.name}"</span>?
        </p>
        <p className="text-slate-400 text-xs mt-2">
          This action is permanent and will delete all items inside this category.
        </p>
      </Modal>
    </Layout>
  );
}
