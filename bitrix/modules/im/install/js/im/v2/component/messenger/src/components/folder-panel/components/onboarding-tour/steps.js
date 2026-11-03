import { SystemFolderCode } from 'im.v2.const';

export type TourStep = {
	target: string,
	titleCode: string,
	textCode: string,
	buttonCode: string,
	image: ?string,
};

export const PANEL_TOUR_TARGET = 'panel';

// The step count never depends on the folders of the user, so the list is a constant of the tour.
// `image` is the modifier class that carries the illustration of a step; a step without one renders
// no illustration at all.
export const TOUR_STEPS: TourStep[] = Object.freeze([
	Object.freeze({
		target: PANEL_TOUR_TARGET,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_1_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_1_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_NEXT',
		image: '--folder',
	}),
	Object.freeze({
		target: SystemFolderCode.all,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_2_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_2_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_NEXT',
		image: '--tasks',
	}),
	Object.freeze({
		target: SystemFolderCode.collab,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_3_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_3_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_NEXT',
		image: '--projects',
	}),
	Object.freeze({
		target: SystemFolderCode.all,
		titleCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_4_TITLE',
		textCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_4_TEXT',
		buttonCode: 'IM_MESSENGER_FOLDER_PANEL_TOUR_BUTTON_SETUP',
		image: '--settings',
	}),
]);
