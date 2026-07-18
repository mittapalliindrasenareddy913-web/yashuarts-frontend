import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Globe, Instagram } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ArtistProfileScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleWhatsAppClick = () => {
    const name = user?.full_name || 'there';
    const message = encodeURIComponent(`Hi Yashu! I'm ${name} and I'm interested in commissioning custom artwork.`);
    window.open(`https://wa.me/919398029785?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center justify-center p-1"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Artist Profile</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Cover Image & Profile Pic */}
        <div className="relative">
          <div className="h-64 bg-gradient-to-r from-amber-500 to-orange-600">
            <img
              src="https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg"
              alt="Cover"
              className="w-full h-full object-cover opacity-50"
            />
          </div>
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl">
              <img
                src="/profile.jpg.jpeg"
                alt="Artist"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 pt-20 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Yashu</h2>
            <p className="text-lg text-gray-600 mb-4">Visionary Artist • Master Portraitist</p>
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-700 leading-relaxed italic">
                "Art is not what you see, but what you make others see. Every portrait tells a story, every stroke carries emotion. I transform moments into timeless masterpieces."
              </p>
            </div>
          </div>

          {/* About Me Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Cinzel', serif" }}>
              About Me
            </h3>
            <p className="text-gray-750 leading-relaxed mb-4">
              With over a decade of experience in portrait artistry, I specialize in pencil sketches, color portraits, and couple artwork that capture the essence of human emotion and beauty.
            </p>
            <p className="text-gray-750 leading-relaxed">
              Each piece is carefully crafted with attention to detail, bringing your cherished memories to life through the timeless medium of art. I believe every person has a unique story, and my mission is to tell that story through my artwork.
            </p>
          </div>

          {/* Portfolio Highlights */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Cinzel', serif" }}>
              Portfolio Highlights
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg',
                'https://images.pexels.com/photos/1269968/pexels-photo-1269968.jpeg',
                'https://images.pexels.com/photos/1545998/pexels-photo-1545998.jpeg',
                'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg'
              ].map((imgUrl, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <img
                    src={imgUrl}
                    alt={`Portfolio ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action - Socials */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white mb-8">
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
              Let's Create Together
            </h3>
            <p className="mb-6 text-white/90">
              Have a vision for a custom artwork? Let's discuss how I can bring your ideas to life.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center justify-center gap-2 bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-all shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <a
                href="https://instagram.com/yashu_arts_1067"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-all shadow-md"
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </a>
              <a
                href="https://yashuarts.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-all shadow-md"
              >
                <Globe className="w-5 h-5" />
                Website
              </a>
            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
              Services Offered
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✏️</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Pencil Sketches</h4>
                <p className="text-sm text-gray-600">Classic black and white portraits</p>
                <p className="text-amber-600 font-bold mt-2">From ₹800</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎨</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Color Portraits</h4>
                <p className="text-sm text-gray-600">Vibrant and lifelike artwork</p>
                <p className="text-orange-600 font-bold mt-2">From ₹1,500</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💑</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Couple Portraits</h4>
                <p className="text-sm text-gray-600">Celebrate love and togetherness</p>
                <p className="text-rose-600 font-bold mt-2">From ₹2,500</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArtistProfileScreen;
