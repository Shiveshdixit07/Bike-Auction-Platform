import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Gavel, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function HomePage() {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuctions({ status: 'LIVE', limit: 6 })
      .then((data) => setLiveAuctions(data.auctions))
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Your Perfect Ride at Auction
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Bid on quality used motorcycles in real-time auctions. Transparent, exciting, and secure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auctions" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Browse Auctions
              </Link>
              <Link to="/register" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Find a Bike</h3>
              <p className="text-gray-600">Browse our selection of quality used motorcycles with detailed descriptions and photos.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gavel className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Place Your Bid</h3>
              <p className="text-gray-600">Join live auctions and bid in real-time. Get notified when you're outbid.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold mb-2">Win the Auction</h3>
              <p className="text-gray-600">If you have the highest bid when the auction ends, the bike is yours!</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Live Auctions</h2>
            <Link to="/auctions" className="text-primary-600 hover:text-primary-700 font-medium">
              View All &rarr;
            </Link>
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
          ) : liveAuctions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveAuctions.map((auction) => {
                const bike = auction.bike;
                return (
                  <div key={auction.id} className="card hover:shadow-md transition-shadow group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                      {bike?.images?.[0] ? (
                        <img src={bike.images[0]} alt={bike.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Gavel className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {bike?.title || 'Untitled Bike'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {bike?.year} {bike?.make} {bike?.model}
                    </p>
                    <Link
                      to={`/auctions/${auction.id}`}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      Join Bidding
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No live auctions at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Shield className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold">Secure Bidding</h3>
              <p className="text-sm text-gray-600">Your bids are protected with industry-standard security.</p>
            </div>
            <div>
              <Gavel className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold">Real-Time Updates</h3>
              <p className="text-sm text-gray-600">See bids as they happen with our live auction feed.</p>
            </div>
            <div>
              <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold">Fair Pricing</h3>
              <p className="text-sm text-gray-600">Transparent auction process ensures fair market prices.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
