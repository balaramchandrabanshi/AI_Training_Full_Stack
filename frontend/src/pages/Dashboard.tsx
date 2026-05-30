import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  TrendingUp,
  Boxes,
  Folder,
} from 'lucide-react';
import { DashboardStats, Inventory } from '../types';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { StatsSkeleton, CardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInventories, setRecentInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const [statsData, inventoriesData] = await Promise.all([
          api.getDashboardStats(),
          api.getInventories(),
        ]);
        setStats(statsData);
        const sorted = [...inventoriesData].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentInventories(sorted.slice(0, 3));
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">Overview Statistics</h2>
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatCard
                title="Total Items"
                value={stats ? stats.total_items.toLocaleString() : '0'}
                icon={<Package className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="In Stock"
                value={stats ? stats.in_stock.toLocaleString() : '0'}
                icon={<CheckCircle className="w-6 h-6" />}
                color="green"
              />
              <StatCard
                title="Low Stock"
                value={stats ? stats.low_stock.toLocaleString() : '0'}
                icon={<AlertTriangle className="w-6 h-6" />}
                color="amber"
              />
              <StatCard
                title="Out of Stock"
                value={stats ? stats.out_of_stock.toLocaleString() : '0'}
                icon={<XCircle className="w-6 h-6" />}
                color="red"
              />
              <StatCard
                title="Total Value"
                value={stats ? `$${stats.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                icon={<DollarSign className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Total Cost"
                value={stats ? `$${stats.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                icon={<TrendingUp className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Inventories"
                value={stats ? stats.inventory_count : 0}
                icon={<Boxes className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Categories"
                value={stats ? stats.category_count : 0}
                icon={<Folder className="w-6 h-6" />}
                color="blue"
              />
            </div>
          )}
        </div>

        {/* Recent Inventories */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Inventories</h2>
            <Link
              to="/inventories"
              className="text-blue-550 hover:text-blue-400 text-sm font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : recentInventories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentInventories.map((inventory) => (
                <Link
                  key={inventory.id}
                  to={`/inventories/${inventory.id}`}
                  className="group bg-slate-900 border border-slate-800 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                      <Boxes className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(inventory.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {inventory.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
                    {inventory.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-1">
                      <Folder className="w-4 h-4" />
                      <span>{inventory.category_count} categories</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{inventory.item_count} items</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-400 mb-4 text-sm">No inventories found.</p>
              <Link
                to="/inventories"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all duration-200"
              >
                Create Inventory
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
