import { Type } from 'main.core';

import { Grid } from 'booking.const';
import { gridTokens, GridTokenKey } from 'booking.lib.grid';

import { MinAvailableZoom } from '../../components/grid-week/const';

export type WeekInitialZoomMeasurements = {
	containerWidth: number;
	leftPanelWidth: number;
	sidebarZoneWidth: number;
	weekCellWidth: number;
};

export class WeekInitialZoom
{
	calculate(measurements: WeekInitialZoomMeasurements): number
	{
		const { containerWidth, leftPanelWidth, sidebarZoneWidth, weekCellWidth } = measurements;
		const weekDaysWidth = weekCellWidth * Grid.Duration.Week;

		if (containerWidth <= 0 || weekDaysWidth <= 0)
		{
			return MinAvailableZoom;
		}

		const availableWidth = containerWidth - leftPanelWidth - sidebarZoneWidth;

		return Math.max(MinAvailableZoom, availableWidth / weekDaysWidth);
	}

	get(container: HTMLElement): number | null
	{
		if (!Type.isDomNode(container))
		{
			return null;
		}

		const measurements = {
			containerWidth: container.offsetWidth,
			leftPanelWidth: gridTokens.get(GridTokenKey.LeftPanelWidthWeek),
			sidebarZoneWidth: gridTokens.get(GridTokenKey.SidebarZoneWidth),
			weekCellWidth: gridTokens.get(GridTokenKey.WeekCellWidth),
		};

		if (!this.#hasRequiredMeasurements(measurements))
		{
			return null;
		}

		return this.calculate(measurements);
	}

	#hasRequiredMeasurements(measurements: WeekInitialZoomMeasurements): boolean
	{
		return (
			measurements.containerWidth > 0
			&& measurements.leftPanelWidth > 0
			&& measurements.sidebarZoneWidth > 0
			&& measurements.weekCellWidth > 0
		);
	}
}
