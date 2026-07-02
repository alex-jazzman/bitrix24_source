import { MarkerType } from './marker-type';
import { getAvatar } from './avatar-helper';

/**
 * Factory for creating marker icons
 * @module location/checkin
 */
export class MarkerIconFactory
{
	static createLastCheckInIconHtml(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false)
	{
		const countBadge = (checkInCount !== null && checkInCount !== undefined)
			? `<span class="employee-drop-badge">${checkInCount}</span>`
			: '';
		const dayClosedClass = isDayClosed ? ' day-closed' : '';

		return `
			<div class="marker-container last-check-in-marker-container${dayClosedClass}">
				<div class="employee-drop">
					<div class="employee-drop-content">
						${getAvatar(avatarUrl, name, id, 48)}
						${countBadge}
					</div>
				</div>
				<div class="marker-point-circle">
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
	}

	static createLastAutoCheckInIconHtml(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false)
	{
		const countBadge = (checkInCount !== null && checkInCount !== undefined)
			? `<span class="employee-drop-badge">${checkInCount}</span>`
			: '';
		const dayClosedClass = isDayClosed ? ' day-closed' : '';

		return `
			<div class="marker-container last-auto-check-in-marker-container${dayClosedClass}">
				<div class="employee-drop">
					<div class="employee-drop-content">
						${getAvatar(avatarUrl, name, id, 48)}
						${countBadge}
					</div>
				</div>
				<div class="marker-point-circle">
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
	}

	static createCheckInIconHtml(time)
	{
		return `
			<div class="marker-container check-in-marker-container">
				<div class="marker-point-circle"></div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
	}

	static createFirstCheckInIconHtml(time)
	{
		return `
			<div class="marker-container first-check-in-marker-container">
				<div class="first-check-in-marker-icon">
					<svg class="first-check-in-marker-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M12.5777 6.85421C13.4377 7.3726 13.4377 8.61966 12.5777 9.13806L6.15773 13.0079C5.22469 13.57 4.03534 12.898 4.03534 11.8086L4.03534 4.18298C4.03551 3.09365 5.22472 2.42206 6.15773 2.98442L12.5777 6.85421Z" fill="currentColor"/>
					</svg>
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
	}

	static createFirstAutoCheckInIconHtml(time)
	{
		return `
			<div class="marker-container first-auto-check-in-marker-container">
				<div class="first-check-in-marker-icon">
					<svg class="first-check-in-marker-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M12.5777 6.85421C13.4377 7.3726 13.4377 8.61966 12.5777 9.13806L6.15773 13.0079C5.22469 13.57 4.03534 12.898 4.03534 11.8086L4.03534 4.18298C4.03551 3.09365 5.22472 2.42206 6.15773 2.98442L12.5777 6.85421Z" fill="currentColor"/>
					</svg>
				</div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
	}

	static createAutoCheckInIconHtml(time)
	{
		return `
			<div class="marker-container auto-check-in-marker-container">
				<div class="marker-point-circle"></div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
	}

	static createTransitAutoCheckInIconHtml()
	{
		return `
			<div class="marker-container transit-auto-check-in-marker-container">
				<div class="marker-point-circle"></div>
			</div>
		`;
	}

	static getCheckInIconConfig(time)
	{
		return {
			html: this.createCheckInIconHtml(time),
			className: 'check-in-marker',
			iconSize: [60, 46],
			iconAnchor: [30, 5],
		};
	}

	static getAutoCheckInIconConfig(time)
	{
		return {
			html: this.createAutoCheckInIconHtml(time),
			className: 'custom-auto-check-in-marker',
			iconSize: [60, 46],
			iconAnchor: [30, 5],
		};
	}

	static getTransitAutoCheckInIconConfig()
	{
		return {
			html: this.createTransitAutoCheckInIconHtml(),
			className: 'custom-transit-auto-check-in-marker',
			iconSize: [10, 10],
			iconAnchor: [5, 5],
		};
	}

	static getFirstCheckInIconConfig(time)
	{
		return {
			html: this.createFirstCheckInIconHtml(time),
			className: 'custom-first-check-in-marker',
			iconSize: [60, 70],
			iconAnchor: [30, 20],
		};
	}

	static getFirstAutoCheckInIconConfig(time)
	{
		return {
			html: this.createFirstAutoCheckInIconHtml(time),
			className: 'custom-first-auto-check-in-marker',
			iconSize: [60, 70],
			iconAnchor: [30, 20],
		};
	}

	static getLastCheckInIconConfig(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false)
	{
		return {
			html: this.createLastCheckInIconHtml(avatarUrl, name, id, time, checkInCount, isDayClosed),
			className: 'custom-last-check-in-marker',
			iconSize: [60, 114],
			iconAnchor: [30, 73],
		};
	}

	static getLastAutoCheckInIconConfig(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false)
	{
		return {
			html: this.createLastAutoCheckInIconHtml(avatarUrl, name, id, time, checkInCount, isDayClosed),
			className: 'custom-last-auto-check-in-marker',
			iconSize: [60, 114],
			iconAnchor: [30, 73],
		};
	}

	/**
	 * Wraps any icon config with a bullet loader placed above the marker.
	 * Adjusts iconSize and iconAnchor to account for the extra loader height.
	 * @param {Object} config
	 * @returns {Object}
	 */
	static wrapWithLoader(config)
	{
		const LOADER_HEIGHT = 20;
		const loaderHtml = `
			<div class="marker-bullet-loader">
				<div class="ui-loader__bullet">
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
					<div class="ui-loader__bullet_item"></div>
				</div>
			</div>
		`;

		return {
			...config,
			html: `${loaderHtml}${config.html}`,
			iconSize: [config.iconSize[0], config.iconSize[1] + LOADER_HEIGHT],
			iconAnchor: [config.iconAnchor[0], config.iconAnchor[1] + LOADER_HEIGHT],
		};
	}

	/**
	 * Create icon configuration based on marker type.
	 * Pass `data.loading = true` to overlay a bullet loader above the marker.
	 */
	static createIconByType(type, data)
	{
		let config;

		switch (type)
		{
			case MarkerType.CHECK_IN:
				config = this.getCheckInIconConfig(data.time);
				break;

			case MarkerType.AUTO_CHECK_IN:
				config = this.getAutoCheckInIconConfig(data.time);
				break;

			case MarkerType.TRANSIT_AUTO_CHECK_IN:
				config = this.getTransitAutoCheckInIconConfig();
				break;

			case MarkerType.FIRST_CHECK_IN:
				config = this.getFirstCheckInIconConfig(data.time);
				break;

			case MarkerType.FIRST_AUTO_CHECK_IN:
				config = this.getFirstAutoCheckInIconConfig(data.time);
				break;

			case MarkerType.LAST_CHECK_IN:
				config = this.getLastCheckInIconConfig(
					data.avatarUrl,
					data.name,
					data.id,
					data.time,
					data.checkInCount,
					data.isDayClosed,
				);
				break;

			case MarkerType.LAST_AUTO_CHECK_IN:
				config = this.getLastAutoCheckInIconConfig(
					data.avatarUrl,
					data.name,
					data.id,
					data.time,
					data.checkInCount,
					data.isDayClosed,
				);
				break;

			default:
				console.error('Unknown marker type:', type);

				return null;
		}

		return data.loading ? this.wrapWithLoader(config) : config;
	}
}
