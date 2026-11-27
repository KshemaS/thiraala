// Animation features for framer-motion's LazyMotion, in their own chunk so
// they download after the page has loaded instead of with every page.
// domMax (not domAnimation) because the bag and wishlist use layout animations.
import { domMax } from "framer-motion";

export default domMax;
