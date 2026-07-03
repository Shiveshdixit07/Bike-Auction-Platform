import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../lib/api';
import AuctionCard from '../components/AuctionCard';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'LIVE', 'SCHEDULED', 'ENDED'];

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchAuctions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const data = await api.getAuctions(params);
      setAuctions(data.auctions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAuctions();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton to="/" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Auctions</h1>
        <p className="text-gray-600">Find your next motorcycle at a great price</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by make, model..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.filter(Boolean).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : auctions.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchAuctions(page)}
                  className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No auctions found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
