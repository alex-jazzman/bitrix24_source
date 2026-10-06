import { type GridRenderParams } from 'booking.lib.grid';

export type BookingGridRenderContext = {
	gridMode: $PropertyType<GridRenderParams, 'gridMode'>,
	resourcesIds: $PropertyType<GridRenderParams, 'resourcesIds'>,
	zoom: $PropertyType<GridRenderParams, 'zoom'>,
	offHoursExpanded: $PropertyType<GridRenderParams, 'offHoursExpanded'>,
	multiSelectEnabled?: boolean,
	resizeEnabled?: boolean,
	restrictionPopupEnabled?: boolean,
	quickFilterEnabled?: boolean,
	offHoursControlsEnabled?: boolean,
};
