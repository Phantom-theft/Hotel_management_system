import courtyardImg from '../assets/gallery/Courtyard.jfif'
import entranceImg from '../assets/gallery/Entrance.jfif'
import lobbyImg from '../assets/gallery/Lobby.jfif'
import loungeImg from '../assets/gallery/Lounge.jfif'
import poolImg from '../assets/gallery/Pool.jfif'
import restaurantImg from '../assets/gallery/Restaurant.jfif'
import rooftopImg from '../assets/gallery/Rooftop.jfif'
import spaImg from '../assets/gallery/Spa.jfif'

export interface GalleryItem {
  id: string
  title: string
  description: string
  imageUrl?: string
  gradient: string
}

/** Local property photos from src/assets/gallery */
export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'lobby',
    title: 'Lobby',
    description:
      'A calm arrival, day or night — soft light, harbor maps, and a front desk that greets you by name.',
    imageUrl: lobbyImg,
    gradient: 'linear-gradient(145deg, #1e3a6e 0%, #0f1e3c 40%, #c9a227 100%)',
  },
  {
    id: 'entrance',
    title: 'Entrance',
    description:
      'Stone steps, lantern light, and the first glimpse of the coast just beyond the doors.',
    imageUrl: entranceImg,
    gradient: 'linear-gradient(155deg, #1e3a6e 0%, #0f1e3c 35%, #c9a227 90%)',
  },
  {
    id: 'lounge',
    title: 'Lounge',
    description: 'Low armchairs, harbor views, and a quiet corner to read or meet before dinner.',
    imageUrl: loungeImg,
    gradient: 'linear-gradient(140deg, #0f1e3c 0%, #334155 50%, #d4a574 100%)',
  },
  {
    id: 'pool',
    title: 'Pool',
    description: 'A sheltered deck for afternoon swims and quiet hours with a book.',
    imageUrl: poolImg,
    gradient: 'linear-gradient(145deg, #2563eb 0%, #0f1e3c 55%, #94a3b8 100%)',
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Seasonal plates, local seafood, and a dining room built for unhurried evenings.',
    imageUrl: restaurantImg,
    gradient: 'linear-gradient(150deg, #0f1e3c 0%, #1e3a6e 60%, #e8c49a 100%)',
  },
  {
    id: 'rooftop',
    title: 'Rooftop',
    description: 'Open air above the harbor — morning coffee, sunset drinks, and a breeze off the water.',
    imageUrl: rooftopImg,
    gradient: 'linear-gradient(135deg, #1e3a6e 0%, #64748b 50%, #f5e6d3 100%)',
  },
  {
    id: 'spa',
    title: 'Spa',
    description: 'Warm stone, eucalyptus steam, and treatments paced to your stay.',
    imageUrl: spaImg,
    gradient: 'linear-gradient(140deg, #0f1e3c 0%, #334155 50%, #d4a574 100%)',
  },
  {
    id: 'courtyard',
    title: 'Courtyard',
    description: 'A sheltered garden between wings — morning light, evening quiet, and room to breathe.',
    imageUrl: courtyardImg,
    gradient: 'linear-gradient(160deg, #1e3a6e 0%, #2563eb 30%, #f5e6d3 100%)',
  },
]
