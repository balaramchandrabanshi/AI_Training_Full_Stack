import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Item, ItemStatus } from '../types';
import { Package, Search, Box, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../api';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

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

function EmptyState({ searchQuery, statusFilter }: { searchQuery: string; statusFilter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="p-4 bg-slate-800 rounded-full mb-4">
        <Box className="w-12 h-12 text-slate-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
      <p className="text-slate-400 text-center max-w-md text-sm">
        {searchQuery || statusFilter !== 'all'
          ? 'No items match your search or filter filters. Try adjusting them.'
          : 'Create category items first to view them here.'}
      </p>
    </div>
  );
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        setError('');
        const data = await api.getItems();
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch items.');
        toast.error(err.message || 'Failed to fetch items.');
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter items based on search query (Name or SKU) and stock status
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
      } else if (sortBy === 'min_stock') {
        comparison = a.min_stock - b.min_stock;
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

  // Pagination calculations
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

  return (
    <Layout title="All Items">
      <div className="space-y-6">
        {/* Controls Layout */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search items by name or SKU..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
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

        {/* Status Handling */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={pageSize} cols={7} />
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>
                {filteredAndSortedItems.length === items.length
                  ? `Showing all ${items.length} items`
                  : `Found ${filteredAndSortedItems.length} of ${items.length} items`}
              </span>
            </div>

            {/* Items Table */}
            {paginatedItems.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="overflow-x-auto">
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
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl">
                <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
