import { type Guide } from 'ui.tour';

export type TourInterface = {
	getGuide(): Guide;
	canShow(): boolean;
	show(): void;
}
