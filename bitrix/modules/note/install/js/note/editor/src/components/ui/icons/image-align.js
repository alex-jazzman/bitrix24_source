import { icon } from './icon-helper';

// Align icons for the image overlay pill. Stroke uses currentColor so the icon
// follows the pill button state (default / hover / active) like every other editor icon.
export const ImageAlignLeftIcon = icon(`
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M19 6.59961H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M18.9998 12H11.437" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M19 17.2002H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<rect x="5.35547" y="10.3457" width="3.24805" height="3.24805" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
`);

export const ImageAlignCenterIcon = icon(`
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M5.00049 6.59961H19.0005" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M5.00036 12H7.35303" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M16.6478 12H19.0005" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M5.00049 17.2002H19.0005" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<rect width="3.24805" height="3.24805" transform="matrix(-1 0 0 1 13.6245 10.3457)" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
`);

export const ImageAlignRightIcon = icon(`
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M5.00049 6.59961H19.0005" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M5.00073 12H12.5635" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="M5.00049 17.2002H19.0005" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	<rect width="3.24805" height="3.24805" transform="matrix(-1 0 0 1 18.645 10.3457)" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
`);
