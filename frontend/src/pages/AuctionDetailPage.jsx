import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, User, Gavel, History, Trophy, XCircle } from 'lucide-react';
import api from '../lib/api';
import BidForm from '../components/BidForm';
import BackButton from '../components/BackButton';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime));

  function getTimeLeft(end) {
    const diff = new Date(end) - new Date();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className="flex items-center gap-2 text-2xl font-mono">
      <Clock className="h-6 w-6" />
      <span>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export default function AuctionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuction = async () => {
    try {
      const data = await api.getAuction(id);
      setAuction(data);
    } catch (error) {
      toast.error('Failed to load auction');
    }
  };

  const fetchBids = async () => {
    try {
      const data = await api.getBids(id, { limit: 20 });
      setBids(data.bids);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
      toast.error('Failed to load bid history');
    }
  };

  useEffect(() => {
    Promise.all([fetchAuction(), fetchBids()]).finally(() => setLoading(false));
  }, [id]);

  const { subscribeToBidPlaced } = useSocket(id);

  useEffect(() => {
    const unsubscribe = subscribeToBidPlaced((data) => {
      if (data.auctionId === id) {
        setAuction((prev) => ({
          ...prev,
          currentHighestBid: data.amount,
          endTime: data.newEndTime || prev.endTime,
        }));
        fetchBids();
        if (data.bidderId !== user?.id?.slice(-4)) {
          toast(`New bid: $${data.amount}`);
        }
      }
    });

    return unsubscribe;
  }, [id, user, subscribeToBidPlaced]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-video bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-gray-500">Auction not found</p>
      </div>
    );
  }

  const bike = auction.bike;
  const isActive = auction.status === 'LIVE';
  const currentBid = parseFloat(auction.currentHighestBid) || parseFloat(auction.startingPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton to="/auctions" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
            {bike?.images?.[0] ? (
              <img src={bike.images[0]} alt={bike.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Gavel className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="card">
            <h1 className="text-2xl font-bold mb-2">{bike?.title}</h1>
            <p className="text-gray-600 mb-4">{bike?.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Make</p>
                <p className="font-medium">{bike?.make}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{bike?.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <p className="font-medium">{bike?.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mileage</p>
                <p className="font-medium">{bike?.mileage?.toLocaleString()} mi</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Condition</p>
                <p className="font-medium">{bike?.condition}</p>
              </div>
            </div>

            {bike?.ownerNotes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Seller Notes</p>
                <p className="text-gray-700">{bike.ownerNotes}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              Bid History
            </h2>
            {bids.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Bidder</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => (
                      <tr key={bid.id} className="border-b border-gray-50">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {bid.bidder?.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 text-right font-medium">${bid.amount}</td>
                        <td className="py-2 text-right text-sm text-gray-500">
                          {new Date(bid.placedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No bids yet</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Current Bid</p>
              <p className="text-4xl font-bold text-primary-600">${currentBid}</p>
              <p className="text-sm text-gray-500 mt-1">
                {bids.length} bid{bids.length !== 1 ? 's' : ''}
              </p>
            </div>

            {isActive ? (
              <CountdownTimer endTime={auction.endTime} />
            ) : auction.status === 'SETTLED' && auction.winner ? (
              <div className="text-center py-4 space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Trophy className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <p className="text-lg font-bold text-green-700">Auction Won!</p>
                <p className="text-sm text-gray-600">
                  Won by <span className="font-semibold">{auction.winner.name}</span> for{' '}
                  <span className="font-semibold text-green-700">${parseFloat(auction.currentHighestBid).toFixed(2)}</span>
                </p>
              </div>
            ) : auction.status === 'CANCELLED' ? (
              <div className="text-center py-4 space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <p className="text-lg font-bold text-red-700">Auction Cancelled</p>
                {auction.currentHighestBidderId && (
                  <p className="text-sm text-gray-600">
                    Reserve price was not met
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="badge badge-ended text-lg px-4 py-2">{auction.status}</span>
              </div>
            )}
          </div>

          {user && isActive ? (
            <div className="card">
              <h3 className="font-semibold mb-4">Place Your Bid</h3>
              <BidForm auction={auction} onBidPlaced={fetchBids} />
            </div>
          ) : !user ? (
            <div className="card text-center">
              <p className="text-gray-600 mb-4">Login to place a bid</p>
              <a href="/login" className="btn-primary block">Login</a>
            </div>
          ) : null}

          <div className="card">
            <h3 className="font-semibold mb-2">Auction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Starting Price</span>
                <span>${auction.startingPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bid Increment</span>
                <span>${auction.bidIncrement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="badge badge-live">{auction.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ends</span>
                <span>{new Date(auction.endTime).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
