import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Breadcrumb from '../components/Breadcrumb';
import { Item, ItemStatus, Inventory, Category } from '../types';
import { Package, Edit2, Trash2, Plus, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../api';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';

function StatusBadge({ status }: { status: ItemStatus }) {
  const statusConfig = {
    'in-stock': {
      label: 'In Stock',
      className: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    'low-stock': {
      label: 'Low Stock',
      className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    'out-of-stock': {
      label: 'Out of Stock',
      className: 'bg-red-500/10 text-red-500 border-red-500/20',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function CategoryDetail() {
  const { invId, catId } = useParams<{ invId: string; catId: string }>();
  
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formQuantity, setFormQuantity] = useState(0);
  const [formMinStock, setFormMinStock] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formCost, setFormCost] = useState(0);
  const [formSupplier, setFormSupplier] = useState('');
  const [formUnit, setFormUnit] = useState('pieces');
  const [formStatus, setFormStatus] = useState<ItemStatus>('in-stock');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Table Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCategoryData = async () => {
    if (!invId || !catId) return;
    try {
      setLoading(true);
      setError('');
      
      const [invData, catsData, itemsData] = await Promise.all([
        api.getInventory(invId),
        api.getCategories(invId),
        api.getItems({ cat_id: catId }),
      ]);

      setInventory(invData);
      setItems(itemsData);
      
      const matchedCat = catsData.find(c => c.id === catId);
      if (matchedCat) {
        setCategory(matchedCat);
      } else {
        setError('Category not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load category items.');
      toast.error(err.message || 'Failed to load category items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, [invId, catId]);

  const openCreateModal = () => {
    setFormName('');
    setFormSku('');
    setFormQuantity(0);
    setFormMinStock(0);
    setFormPrice(0);
    setFormCost(0);
    setFormSupplier('');
    setFormUnit('pieces');
    setFormStatus('in-stock');
    setModalError('');
    setIsCreateOpen(true);
  };

  const openEditModal = (item: Item) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormSku(item.sku);
    setFormQuantity(item.quantity);
    setFormMinStock(item.min_stock);
    setFormPrice(item.price);
    setFormCost(item.cost);
    setFormSupplier(item.supplier || '');
    setFormUnit(item.unit);
    setFormStatus(item.status);
    setModalError('');
    setIsEditOpen(true);
  };

  const openDeleteModal = (item: Item) => {
    setSelectedItem(item);
    setModalError('');
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId) return;
    if (!formName.trim() || !formSku.trim()) {
      setModalError('Name and SKU are required');
      return;
    }
    try {
      setModalLoading(true);
      setModalError('');
      await api.createItem({
        name: formName.trim(),
        sku: formSku.trim(),
        category_id: catId,
        quantity: Number(formQuantity),
        min_stock: Number(formMinStock),
        price: Number(formPrice),
        cost: Number(formCost),
        supplier: formSupplier.trim() || undefined,
        unit: formUnit.trim(),
        status: formStatus,
      });
      setIsCreateOpen(false);
      toast.success('Item created successfully!');
      fetchCategoryData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create item.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !catId) return;
    if (!formName.trim() || !formSku.trim()) {
      setModalError('Name and SKU are required');
      return;
    }
    try {
      setModalLoading(true);
      setModalError('');
      await api.updateItem(selectedItem.id, {
        name: formName.trim(),
        sku: formSku.trim(),
        category_id: catId,
        quantity: Number(formQuantity),
        min_stock: Number(formMinStock),
        price: Number(formPrice),
        cost: Number(formCost),
        supplier: formSupplier.trim() || undefined,
        unit: formUnit.trim(),
        status: formStatus,
      });
      setIsEditOpen(false);
      toast.success('Item updated successfully!');
      fetchCategoryData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update item.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setModalLoading(true);
      setModalError('');
      await api.deleteItem(selectedItem.id);
      setIsDeleteOpen(false);
      toast.success('Item deleted successfully!');
      fetchCategoryData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to delete item.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sorting & Filtering Logic
  const filteredAndSortedItems = items
    .filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        item.name.toLowerCase().includes(query) || 
        item.sku.toLowerCase().includes(query);

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = item.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'sku') {
        comparison = a.sku.localeCompare(b.sku);
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === 'price') {
        comparison = a.price - b.price;
      } else if (sortBy === 'cost') {
        comparison = a.cost - b.cost;
      } else if (sortBy === 'supplier') {
        comparison = (a.supplier || '').localeCompare(b.supplier || '');
      } else if (sortBy === 'unit') {
        comparison = a.unit.localeCompare(b.unit);
      } else if (sortBy === 'last_updated') {
        comparison = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination Logic
  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  if (loading && !category) {
    return (
      <Layout title="Category Details">
        <div className="space-y-6">
          <div className="h-6 w-48 bg-slate-800 animate-pulse rounded" />
          <TableSkeleton rows={5} cols={7} />
        </div>
      </Layout>
    );
  }

  if (error || !inventory || !category) {
    return (
      <Layout title="Category Not Found">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-slate-400 mb-4">{error || 'Category not found'}</p>
          <Link to="/inventories" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all duration-200">
            Back to Inventories
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={category.name}>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Inventories', path: '/inventories' },
            { label: inventory.name, path: `/inventories/${invId}` },
            { label: category.name },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400">
              Manage items inside the <span className="text-white font-medium">"{category.name}"</span> category
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 self-start sm:self-auto shadow-md"
          >
            <Plus className="w-5 h-5" />
            New Item
          </button>
        </div>

        {/* Controls: Search, Filter, Page Size */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search items by name or SKU..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items Table */}
        {loading ? (
          <TableSkeleton rows={pageSize} cols={7} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="overflow-x-auto">
              {paginatedItems.length > 0 ? (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800">
                        <th 
                          onClick={() => handleSort('name')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Name <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('sku')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            SKU <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('quantity')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Qty <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('min_stock')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Min Stock <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('price')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Price <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('cost')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Cost <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('supplier')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Supplier <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('unit')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Unit <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th 
                          onClick={() => handleSort('last_updated')}
                          className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            Updated <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {paginatedItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Package className="w-4 h-4 text-blue-500" />
                              </div>
                              <span className="text-sm font-medium text-white">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {item.min_stock}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            ${item.cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {item.supplier || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 capitalize">
                            {item.unit}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(item.last_updated).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                title="Edit Item"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-slate-400">
                      Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold text-white">{endIndex}</span> of{' '}
                      <span className="font-semibold text-white">{totalItems}</span> items
                    </p>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
                  <p className="text-slate-400 max-w-sm mx-auto mb-6 text-sm">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No items match your search or filter filters. Try adjusting them.'
                      : 'Add items to this category by clicking the button below.'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all duration-200"
                    >
                      <Plus className="w-5 h-5" />
                      New Item
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Item"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                placeholder="e.g. Wireless Mouse Pro"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                placeholder="e.g. WM-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                value={formQuantity}
                onChange={(e) => setFormQuantity(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Min Stock Threshold</label>
              <input
                type="number"
                value={formMinStock}
                onChange={(e) => setFormMinStock(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formCost}
                onChange={(e) => setFormCost(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier</label>
              <input
                type="text"
                value={formSupplier}
                onChange={(e) => setFormSupplier(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                placeholder="e.g. TechSupply Co."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                placeholder="e.g. pieces, boxes"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Stock Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as ItemStatus)}
              disabled={modalLoading}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
            >
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Item"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                placeholder="e.g. Wireless Mouse Pro"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SKU *
              </label>
              <input
                type="text"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-50"
                placeholder="e.g. WM-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                value={formQuantity}
                onChange={(e) => setFormQuantity(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Min Stock Threshold</label>
              <input
                type="number"
                value={formMinStock}
                onChange={(e) => setFormMinStock(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formCost}
                onChange={(e) => setFormCost(Number(e.target.value))}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier</label>
              <input
                type="text"
                value={formSupplier}
                onChange={(e) => setFormSupplier(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                placeholder="e.g. TechSupply Co."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                disabled={modalLoading}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                placeholder="e.g. pieces, boxes"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Stock Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as ItemStatus)}
              disabled={modalLoading}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
            >
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Item"
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
          Are you sure you want to delete item <span className="font-semibold text-white">"{selectedItem?.name}"</span>?
        </p>
        <p className="text-slate-400 text-xs mt-2">
          SKU: <span className="font-mono text-white">{selectedItem?.sku}</span>. This action cannot be undone.
        </p>
      </Modal>
    </Layout>
  );
}
