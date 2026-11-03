import './open-app-loader.css';
import { LoadingScreen } from './loading-screen';

// OpenAppLayoutRenderer inlines this bundle at the end of the open-app page body, so the overlay,
// the iframe and the spacer are already in the DOM; the extension depends on nothing on purpose:
// any other resource would delay the first paint of the page
LoadingScreen.attach(document, document.documentElement);
