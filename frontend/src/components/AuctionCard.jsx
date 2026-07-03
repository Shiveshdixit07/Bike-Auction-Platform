import { Link } from 'react-router-dom';
import { Clock, Gavel, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    <span className="font-mono text-sm">
      {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </span>
  );
}

const statusColors = {
  DRAFT: 'badge-draft',
  SCHEDULED: 'badge-scheduled',
  LIVE: 'badge-live',
  ENDED: 'badge-ended',
  SETTLED: 'badge-ended',
  CANCELLED: 'badge-ended',
};

export default function AuctionCard({ auction }) {
  const bike = auction.bike;
  const isActive = auction.status === 'LIVE';

  return (
    <Link
      to={`/auctions/${auction.id}`}
      className="card hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="relative">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
          {bike?.images?.[0] ? (
            <img
              src={bike.images[0]}
              alt={bike.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Gavel className="h-12 w-12" />
            </div>
          )}
        </div>
        <span className={`absolute top-2 right-2 badge ${statusColors[auction.status]}`}>
          {auction.status}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
          {bike?.title || 'Untitled Bike'}
        </h3>
        <p className="text-sm text-gray-500">
          {bike?.year} {bike?.make} {bike?.model}
        </p>

        <div className="pt-2 border-t border-gray-100">
          {isActive ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-green-600">
                <Clock className="h-4 w-4" />
                <CountdownTimer endTime={auction.endTime} />
              </div>
              <span className="text-sm font-semibold text-primary-600">Join Bidding &rarr;</span>
            </div>
          ) : auction.status === 'SETTLED' && auction.winner ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-green-600">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">{auction.winner.name}</span>
              </div>
              <p className="text-sm font-semibold text-green-700">
                ${parseFloat(auction.currentHighestBid || auction.startingPrice).toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {new Date(auction.endTime).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                ${auction.currentHighestBid || auction.startingPrice}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
