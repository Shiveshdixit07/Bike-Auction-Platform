import { useState } from 'react';
import { Gavel } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function BidForm({ auction, onBidPlaced }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const minimumBid = parseFloat(auction.currentHighestBid) > 0
    ? parseFloat(auction.currentHighestBid) + parseFloat(auction.bidIncrement)
    : parseFloat(auction.startingPrice);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount < minimumBid) {
      toast.error(`Minimum bid is $${minimumBid}`);
      return;
    }

    setLoading(true);
    try {
      await api.placeBid(auction.id, bidAmount);
      toast.success('Bid placed successfully!');
      setAmount('');
      onBidPlaced?.();
    } catch (error) {
      toast.error(error.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Bid (minimum: ${minimumBid})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minimumBid}
            step={auction.bidIncrement}
            className="input-field pl-8"
            placeholder={minimumBid.toString()}
            disabled={auction.status !== 'LIVE'}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || auction.status !== 'LIVE'}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Gavel className="h-4 w-4" />
        {loading ? 'Placing Bid...' : 'Place Bid'}
      </button>

      {auction.status !== 'LIVE' && (
        <p className="text-sm text-gray-500 text-center">
          {auction.status === 'ENDED' ? 'This auction has ended' : 'This auction is not live'}
        </p>
      )}
    </form>
  );
}
