
import React from 'react';
import { MapPin } from 'lucide-react';
import { HolySite } from '../types';

interface SiteCardProps {
  site: HolySite;
  onClick: (site: HolySite) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onClick }) => {
  return (
    <div 
      onClick={() => onClick(site)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={site.imageUrl} 
          alt={site.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-blue-600 rounded-full uppercase tracking-wider">
            {site.category}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
          {site.name}
        </h3>
        <div className="flex items-start gap-1 text-slate-500 text-sm mb-4">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{site.location}</span>
        </div>
        <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {site.description}
        </p>
        <div className="pt-4 border-t border-slate-100">
          <button className="text-sm font-semibold text-blue-600 flex items-center gap-1 group/btn">
            자세히 보기 
            <span className="transition-transform group-hover/btn:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteCard;
