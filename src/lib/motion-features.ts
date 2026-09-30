// Animation features (including drag for the swipe deck) are loaded right after first paint,
// keeping them out of the first download. See <LazyMotion> in main.tsx.
import { domMax } from 'framer-motion';

export default domMax;
