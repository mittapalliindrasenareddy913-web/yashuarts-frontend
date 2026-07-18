import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { optimizeImage } from '../utils/image';

export const ArtworkCard = ({ artwork, onLike, isLiked = false, onClick }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/artwork/${artwork.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#0D0D0D] border border-[#D4AF37]/30 rounded-[22px] p-3 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-[#D4AF37] hover:shadow-[0_0_12px_rgba(212,175,55,0.18)] flex flex-col justify-between"
    >
      <div className="overflow-hidden rounded-[16px] aspect-[4/3] sm:aspect-square bg-slate-950">
        <img
          src={optimizeImage(artwork.image_url, 600, 600)}
          alt={artwork.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-sm sm:text-base text-slate-100 line-clamp-1">
          {artwork.title}
        </h3>
        <div className="flex items-center justify-between mt-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike?.(artwork.id);
            }}
            aria-label={isLiked ? 'Unlike artwork' : 'Like artwork'}
            title={isLiked ? 'Unlike artwork' : 'Like artwork'}
            className="text-[#D4AF37] hover:scale-110 active:scale-95 transition-transform p-1 -ml-1 flex items-center justify-center"
          >
            <Heart
              className={`w-5 h-5 ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
          </button>
          <span className="text-sm sm:text-base font-bold text-[#D4AF37]">
            ₹{artwork.price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;
