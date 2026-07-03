import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';

export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bikeId: '',
    startTime: '',
    endTime: '',
    startingPrice: '',
    bidIncrement: '',
    reservePrice: '',
    extendOnLastMinuteBid: true,
  });

  useEffect(() => {
    api.getBikes().then((data) => setBikes(data.bikes)).catch((err) => {
      console.error(err);
      toast.error('Failed to load bikes');
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auctionData = {
        bikeId: formData.bikeId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        startingPrice: parseFloat(formData.startingPrice),
        bidIncrement: parseFloat(formData.bidIncrement),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        extendOnLastMinuteBid: formData.extendOnLastMinuteBid,
      };

      await api.createAuction(auctionData);
      toast.success('Auction created successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error(error.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton />

      <h1 className="text-3xl font-bold mb-8">Create New Auction</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Bike</label>
          <select
            name="bikeId"
            value={formData.bikeId}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Choose a bike...</option>
            {bikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.title} - {bike.year} {bike.make} {bike.model}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($)</label>
            <input
              type="number"
              name="startingPrice"
              value={formData.startingPrice}
              onChange={handleChange}
              className="input-field"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bid Increment ($)</label>
            <input
              type="number"
              name="bidIncrement"
              value={formData.bidIncrement}
              onChange={handleChange}
              className="input-field"
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Price ($) (Optional)</label>
          <input
            type="number"
            name="reservePrice"
            value={formData.reservePrice}
            onChange={handleChange}
            className="input-field"
            min="0"
            step="0.01"
          />
          <p className="text-sm text-gray-500 mt-1">Minimum price to sell. Hidden from buyers.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="extendOnLastMinuteBid"
            checked={formData.extendOnLastMinuteBid}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 rounded"
          />
          <label className="text-sm text-gray-700">Enable anti-sniping (extend auction on last-minute bids)</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Creating...' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
}
