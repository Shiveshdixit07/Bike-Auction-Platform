import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Trash2, Gavel, Users, TrendingUp, DollarSign } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [settleModal, setSettleModal] = useState(null);
  const [settling, setSettling] = useState(false);

  const fetchDashboard = async () => {
    try {
      const data = await api.getAdminDashboard();
      setDashboard(data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    }
  };

  const fetchAuctions = async () => {
    try {
      const data = await api.getAuctions({ limit: 50 });
      setAuctions(data.auctions);
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
      toast.error('Failed to load auctions');
    }
  };

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchAuctions()]).finally(() => setLoading(false));
  }, []);

  const handlePublish = async (id) => {
    try {
      await api.publishAuction(id);
      toast.success('Auction published');
      fetchAuctions();
      fetchDashboard();
    } catch (error) {
      toast.error(error.message || 'Failed to publish auction');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this auction?')) return;
    try {
      await api.cancelAuction(id);
      toast.success('Auction cancelled');
      fetchAuctions();
      fetchDashboard();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel auction');
    }
  };

  const handleSettle = async () => {
    if (!settleModal) return;
    setSettling(true);
    try {
      await api.settleAuction(settleModal.id);
      toast.success('Auction settled');
      setSettleModal(null);
      fetchAuctions();
      fetchDashboard();
    } catch (error) {
      toast.error(error.message || 'Failed to settle auction');
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton to="/auctions" />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/admin/bikes/new" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Bike
          </Link>
          <Link to="/admin/auctions/new" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Auction
          </Link>
          <Link to="/admin/register" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Gavel className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Auctions</p>
              <p className="text-2xl font-bold">{dashboard?.totalAuctions || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Auctions</p>
              <p className="text-2xl font-bold">{dashboard?.activeAuctions || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bids Today</p>
              <p className="text-2xl font-bold">{dashboard?.bidsToday || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue in Progress</p>
              <p className="text-2xl font-bold">${dashboard?.revenueInProgress?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Auctions</h2>
          <button onClick={() => { fetchAuctions(); fetchDashboard(); }} className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer">
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Bike</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Current Bid</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ends</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction) => (
                <tr key={auction.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{auction.bike?.title || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{auction.bike?.make} {auction.bike?.model}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      auction.status === 'LIVE' ? 'badge-live' :
                      auction.status === 'SCHEDULED' ? 'badge-scheduled' :
                      auction.status === 'DRAFT' ? 'badge-draft' :
                      auction.status === 'SETTLED' ? 'badge-settled' :
                      auction.status === 'CANCELLED' ? 'badge-ended' :
                      'badge-ended'
                    }`}>
                      {auction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    ${auction.currentHighestBid || auction.startingPrice}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-500">
                    {new Date(auction.endTime).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/auctions/${auction.id}`}
                        className="p-2 text-gray-500 hover:text-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {auction.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(auction.id)}
                          className="p-2 text-green-500 hover:text-green-700 cursor-pointer"
                        >
                          Publish
                        </button>
                      )}
                      {auction.status === 'ENDED' && (
                        <button
                          onClick={() => setSettleModal(auction)}
                          className="p-2 text-green-600 hover:text-green-800 cursor-pointer"
                          title="Settle auction"
                        >
                          Settle
                        </button>
                      )}
                      {!['ENDED', 'SETTLED', 'CANCELLED'].includes(auction.status) && (
                        <button
                          onClick={() => handleCancel(auction.id)}
                          className="p-2 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {auctions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No auctions found. Create your first auction!
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!settleModal}
        onClose={() => setSettleModal(null)}
        title="Settle Auction"
        actions={
          <>
            <button onClick={() => setSettleModal(null)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSettle} className="btn-primary" disabled={settling}>
              {settling ? 'Settling...' : 'Confirm Settle'}
            </button>
          </>
        }
      >
        <p>
          Settle <strong>{settleModal?.bike?.title}</strong>? This will mark the auction
          as <strong>SETTLED</strong> if the reserve price was met, or{' '}
          <strong>CANCELLED</strong> if it was not.
        </p>
      </Modal>
    </div>
  );
}
