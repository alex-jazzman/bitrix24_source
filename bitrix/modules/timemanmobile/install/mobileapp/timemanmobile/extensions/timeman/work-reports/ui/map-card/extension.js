/**
 * @module timeman/work-reports/ui/map-card
 */
jn.define('timeman/work-reports/ui/map-card', (require, exports, module) => {
	const { Component, Indent } = require('tokens');
	const { ChipButton, ChipButtonDesign, Icon } = require('ui-system/blocks/chips/chip-button');
	const { Loc } = require('timeman/work-reports/loc');
	const { PureComponent } = require('layout/pure-component');
	const { makeLibraryImagePath } = require('asset-manager');

	const mapImage = makeLibraryImagePath('map.png', 'graphic', 'timeman');

	const MAP_HEIGHT = 136;

	/**
	 * @param {MapCardProps} props
	 */
	class MapCard extends PureComponent
	{
		render()
		{
			const { checkInCount, testId } = this.props;

			if (Number(checkInCount) <= 0)
			{
				return null;
			}

			return View(
				{
					testId: testId('day-summary-map-card'),
					style: {
						width: '100%',
						height: 136,
						position: 'relative',
						borderRadius: Component.cardCornerXL.toNumber(),
						backgroundImage: this.#getMapImageUrl(),
						backgroundResizeMode: 'cover',
					},
				},
				this.#renderTimeBadge(),
				this.#renderCheckInCount(),
			);
		}

		#getMapImageUrl()
		{
			const { snapshotUrl } = this.props;

			return snapshotUrl ? currentDomain + snapshotUrl : mapImage;
		}

		#formatTimeReport()
		{
			const { timeReport } = this.props;

			if (!(timeReport instanceof Date))
			{
				return null;
			}

			const h = String(timeReport.getHours()).padStart(2, '0');
			const m = String(timeReport.getMinutes()).padStart(2, '0');

			return `${h}:${m}`;
		}

		#renderTimeBadge()
		{
			const { testId } = this.props;
			const time = this.#formatTimeReport();

			if (!time)
			{
				return null;
			}

			return ChipButton({
				testId: testId('day-summary-time-badge'),
				design: ChipButtonDesign.SUCCESS,
				icon: Icon.SOLID_CHECK,
				text: time,
				style: {
					position: 'absolute',
					top: Indent.L.toNumber(),
					right: Indent.L.toNumber(),
				},
			});
		}

		#renderCheckInCount()
		{
			const { checkInCount, testId } = this.props;
			if (!checkInCount)
			{
				return null;
			}

			return View(
				{
					testId: testId('day-summary-checkin-count'),
					style: {
						position: 'absolute',
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				ChipButton({
					testId: testId('daily-report-checkin-count-chip'),
					icon: Icon.LOCATION,
					design: ChipButtonDesign.GREY,
					text: Loc.getMessagePlural(
						'M_TIMEMAN_DAILY_REPORT_CHECKIN_COUNT',
						checkInCount,
						{ '#COUNT#': checkInCount },
					),
				}),
			);
		}
	}

	module.exports = {
		MapCard,
		MAP_HEIGHT,
	};
});
