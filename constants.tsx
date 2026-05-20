
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Goku Ultra Instinct Premium Tee',
    price: 1250,
    image: 'https://picsum.photos/seed/goku/600/800',
    category: 'Oversized',
    description: 'High-quality organic cotton tee featuring master ultra instinct Goku.',
    anime: 'Dragon Ball',
    colors: ['Jet Black', 'Pure White', 'Vibe Navy']
  },
  {
    id: '2',
    name: 'Shadow Monarch Jin-Woo',
    price: 1350,
    image: 'https://picsum.photos/seed/solo/600/800',
    category: 'Regular',
    description: 'Premium black tee with glowing purple aesthetics of the Shadow Monarch.',
    anime: 'Solo Leveling',
    colors: ['Deep Purple', 'Midnight Black']
  },
  {
    id: '3',
    name: 'Survey Corps Wings of Freedom',
    price: 1100,
    image: 'https://picsum.photos/seed/aot/600/800',
    category: 'Premium',
    description: 'The iconic Wings of Freedom embroidered on high-density cotton.',
    anime: 'Attack on Titan',
    colors: ['Forest Green', 'Stone Grey', 'Black']
  },
  {
    id: '4',
    name: 'Uchiha Itachi Crow Aesthetic',
    price: 1400,
    image: 'https://picsum.photos/seed/itachi/600/800',
    category: 'Oversized',
    description: 'Streetwear style oversized tee with red and black minimal graphics.',
    anime: 'Naruto',
    colors: ['Crimson Red', 'Onyx Black']
  },
  {
    id: '5',
    name: 'Jujutsu High Uniform Design',
    price: 1200,
    image: 'https://picsum.photos/seed/jjk/600/800',
    category: 'Standard',
    description: 'Comfortable everyday wear with the Jujutsu Kaisen academy crest.',
    anime: 'Jujutsu Kaisen',
    colors: ['Navy Blue', 'Dark Grey']
  },
  {
    id: '6',
    name: 'Gear 5 Joyboy Edition',
    price: 1500,
    image: 'https://picsum.photos/seed/luffy/600/800',
    category: 'Luxury',
    description: 'The legendary Nika form in a vibrant, artistic print.',
    anime: 'One Piece',
    colors: ['Cloud White', 'Bright Yellow']
  }
];

export const SIZES = ['M', 'L', 'XL', '2XL'];

export const SIZE_CHART = [
  { size: 'M', chest: '39', length: '27.5', sleeve: '8.5' },
  { size: 'L', chest: '40.5', length: '28', sleeve: '8.75' },
  { size: 'XL', chest: '43', length: '29', sleeve: '9' },
  { size: '2XL', chest: '45', length: '30', sleeve: '9.25' },
];
