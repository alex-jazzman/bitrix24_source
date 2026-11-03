import { MarkerType } from './marker-type';
import { getAvatar } from './avatar-helper';
import { createAvatarStackHtml } from './avatar-stack';
import { CI_MARKER_SIZE, CI_STACK, EMPTY_AVATAR_PALETTE } from './checkin-tokens';

const STACK_MAX_DISCS = 3;

export const OFFICE_PLATE_MAX_FACES = 5;

const GROUP_AVATAR_LAYOUTS = Object.freeze({
	2: [{ left: 15, top: 38 }, { left: 39, top: 14 }],
	3: [{ left: 27, top: 8 }, { left: 10, top: 38 }, { left: 44, top: 38 }],
});
const GROUP_BASE_AVATAR_SIZE = 32;

// Palette indexing B - hash+guard: abs(Number(id) || 0) maps NaN/negative to 0. Intentional divergence; do not unify.
function getEmployeeFallbackColor(id)
{
	return EMPTY_AVATAR_PALETTE[Math.abs(Number(id) || 0) % EMPTY_AVATAR_PALETTE.length];
}

function escapeHtml(value)
{
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function getGroupAvatarHtml(avatarUrl, name, id, size)
{
	if (avatarUrl)
	{
		return `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(String(name ?? ''))}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
	}

	const initial = escapeHtml(String(name || '').trim().charAt(0).toUpperCase());
	const fontSize = Math.round(size * 0.4);

	return `<div style="width:100%;height:100%;border-radius:50%;background:${getEmployeeFallbackColor(id)};color:#fff;`
		+ `display:flex;align-items:center;justify-content:center;font:600 ${fontSize}px sans-serif;">${initial}</div>`;
}

function getStackGeometry(discCount)
{
	const clamped = Math.max(0, Math.min(discCount, STACK_MAX_DISCS));
	const extra = Math.max(0, clamped - 1) * CI_STACK.CRESCENT_OFFSET;

	return {
		width: CI_STACK.DISC,
		height: CI_STACK.DISC + extra,
		anchorX: CI_STACK.DISC / 2,
		anchorY: CI_STACK.DISC / 2 + extra,
	};
}

function getOfficePlateFacesHtml(office)
{
	const assignedCount = Number.isFinite(office?.assignedCount) ? office.assignedCount : null;

	if (office?.isEmployeeListAvailable !== true)
	{
		const assignedLabel = String(office?.assignedLabel ?? '').trim();

		if (assignedLabel !== '')
		{
			return `<span class="ci-office-plate-count" data-testid="check-in-office-plate-count">${escapeHtml(assignedLabel)}</span>`;
		}

		return assignedCount === null
			? ''
			: `<span class="ci-office-plate-count" data-testid="check-in-office-plate-count">${escapeHtml(assignedCount)}</span>`;
	}

	const employees = Array.isArray(office?.employees) ? office.employees : [];

	return createAvatarStackHtml(employees, {
		maxFaces: OFFICE_PLATE_MAX_FACES,
		totalCount: assignedCount ?? employees.length,
	});
}

function getOfficePlateHtml(office)
{
	const title = String(office?.title ?? '').trim();

	if (title === '')
	{
		return '';
	}

	const facesHtml = getOfficePlateFacesHtml(office);
	const facesRow = facesHtml === ''
		? ''
		: `<div class="ci-office-plate-faces" data-testid="check-in-office-plate-faces">${facesHtml}</div>`;

	return `
		<div class="ci-office-plate" data-testid="check-in-office-plate">
			<div class="ci-office-plate-title" data-testid="check-in-office-plate-title">${escapeHtml(title)}</div>
			${facesRow}
		</div>
	`;
}

const OFFICE_BUILDING_PATH = 'M5 4h5a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1Z '
	+ 'M14 9h5a1 1 0 0 1 1 1v10h-7V10a1 1 0 0 1 1-1Z '
	+ 'M5.5 6.5h1.5v1.5H5.5Z M8 6.5h1.5v1.5H8Z '
	+ 'M5.5 9.5h1.5v1.5H5.5Z M8 9.5h1.5v1.5H8Z '
	+ 'M5.5 12.5h1.5v1.5H5.5Z M8 12.5h1.5v1.5H8Z '
	+ 'M14.5 11.5h1.5v1.5H14.5Z M17 11.5h1.5v1.5H17Z '
	+ 'M14.5 14.5h1.5v1.5H14.5Z M17 14.5h1.5v1.5H17Z';

const PLAY_TRIANGLE_PATH = 'M12.5777 6.85421C13.4377 7.3726 13.4377 8.61966 12.5777 9.13806L6.15773 13.0079C5.22469 13.57 4.03534 12.898 4.03534 11.8086L4.03534 4.18298C4.03551 3.09365 5.22472 2.42206 6.15773 2.98442L12.5777 6.85421Z';

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

	static createCurrentLocationIconHtml(avatarUrl, name, id)
	{
		return `
			<div class="marker-container current-location-marker-container" data-testid="check-in-marker-current-location">
				<div class="employee-drop">
					<div class="employee-drop-content">
						${getAvatar(avatarUrl, name, id, 48)}
					</div>
				</div>
				<div class="marker-point-circle">
				</div>
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
						<path d="${PLAY_TRIANGLE_PATH}" fill="currentColor"/>
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
						<path d="${PLAY_TRIANGLE_PATH}" fill="currentColor"/>
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

	static getCurrentLocationIconConfig(avatarUrl, name, id)
	{
		return {
			html: this.createCurrentLocationIconHtml(avatarUrl, name, id),
			className: 'custom-current-location-marker',
			iconSize: [60, 78],
			iconAnchor: [30, 73],
		};
	}

	// --- New map significant events (prototype): dot on the line + number/avatar above it ---
	// All markers have a "line dot" at the base (anchor = dot center),
	// with the number/avatar placed above it. Dots share the same size (18px):
	//   manual - blue fill/white border, auto STAY - white fill/blue border,
	//   start - green fill/white border.

	static createNumPinIconHtml(num, active = false, stale = false)
	{
		return `
			<div class="ci-num-marker${active ? ' ci-num-marker--active' : ''}${stale ? ' ci-num-marker--stale' : ''}" data-testid="check-in-marker-num">
				<div class="ci-num-bubble">${num}</div>
				<div class="ci-num-tail"></div>
				<div class="ci-line-dot ci-line-dot--manual"></div>
			</div>
		`;
	}

	static getNumPinIconConfig(num, active = false, stale = false)
	{
		return {
			html: this.createNumPinIconHtml(num, active, stale),
			className: 'ci-num-pin-marker',
			...CI_MARKER_SIZE.NUM_PIN,
		};
	}

	static createAutoDotIconHtml(active = false, stale = false)
	{
		return `<div class="ci-line-dot ci-line-dot--auto${active ? ' ci-line-dot--active' : ''}${stale ? ' ci-line-dot--stale' : ''}" data-testid="check-in-marker-auto"></div>`;
	}

	static getAutoDotIconConfig(active = false, stale = false)
	{
		return {
			html: this.createAutoDotIconHtml(active, stale),
			className: 'ci-auto-dot-marker',
			...CI_MARKER_SIZE.AUTO_DOT,
		};
	}

	static createStartPointIconHtml(active = false)
	{
		// Center the triangle's visible bounding box: its x-center is 8.629, so min_x = 8.629 - 8 = 0.629 gives equal left/right margins.
		return `
			<div class="ci-line-dot ci-line-dot--start${active ? ' ci-line-dot--active' : ''}" data-testid="check-in-marker-start">
				<svg class="ci-start-play" width="9" height="9" viewBox="0.629 0 16 16" fill="none">
					<path d="${PLAY_TRIANGLE_PATH}" fill="currentColor"/>
				</svg>
			</div>
		`;
	}

	static getStartPointIconConfig(active = false)
	{
		return {
			html: this.createStartPointIconHtml(active),
			className: 'ci-start-dot-marker',
			...CI_MARKER_SIZE.START_POINT,
		};
	}

	static createFinishPointIconHtml(active = false)
	{
		return `<div class="ci-line-dot ci-line-dot--finish${active ? ' ci-line-dot--active' : ''}" data-testid="check-in-marker-finish"></div>`;
	}

	static getFinishPointIconConfig(active = false)
	{
		return {
			html: this.createFinishPointIconHtml(active),
			className: 'ci-finish-marker',
			...CI_MARKER_SIZE.FINISH_POINT,
		};
	}

	// `active` is selection, drawn as the same static halo every other marker type shows it with;
	// `pulse` is a live position, drawn as the running ring. They are separate states on purpose - one
	// key for both would make a selected terminal avatar indistinguishable from a live one.
	static createEmployeeAvatarIconHtml(avatarUrl, name, id, active = false, isAuto = false, pulse = false)
	{
		const dotKind = isAuto ? 'auto' : 'manual';
		const modifiers = `${active ? ' ci-avatar--active' : ''}${pulse ? ' ci-avatar--pulse' : ''}`;

		return `
			<div class="ci-avatar${modifiers}" data-testid="check-in-marker-avatar">
				<div class="ci-avatar-body">
					<div class="ci-avatar-circle">${getAvatar(avatarUrl, name, id, 42)}</div>
				</div>
				<div class="ci-avatar-tail"></div>
				<div class="ci-line-dot ci-line-dot--${dotKind}"></div>
			</div>
		`;
	}

	static getEmployeeAvatarIconConfig(avatarUrl, name, id, active = false, isAuto = false, pulse = false)
	{
		return {
			html: this.createEmployeeAvatarIconHtml(avatarUrl, name, id, active, isAuto, pulse),
			className: 'ci-avatar-marker',
			...CI_MARKER_SIZE.EMPLOYEE_AVATAR,
		};
	}

	static createOfficeIconHtml(office)
	{
		const active = office?.active === true ? ' ci-office--active' : '';

		return `
			<div class="ci-office${active}" data-testid="check-in-marker-office-${escapeHtml(office?.officeId)}">
				<div class="ci-office-bubble">
					<div class="ci-office-circle">
						<svg class="ci-office-building" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
							<path d="${OFFICE_BUILDING_PATH}" fill="currentColor" fill-rule="evenodd"/>
						</svg>
					</div>
				</div>
				<div class="ci-office-tail"></div>
				${getOfficePlateHtml(office)}
			</div>
		`;
	}

	static getOfficeIconConfig(office)
	{
		return {
			html: this.createOfficeIconHtml(office),
			className: 'ci-office-marker',
			...CI_MARKER_SIZE.OFFICE,
		};
	}

	static createStackIconHtml(data)
	{
		const discs = Array.isArray(data?.discs) ? data.discs.slice(0, STACK_MAX_DISCS) : [];
		const count = Number.isFinite(data?.count) ? data.count : discs.length;
		const active = data?.active === true;
		const stale = data?.stale === true;
		const { width, height } = getStackGeometry(discs.length);

		const discsHtml = discs.map((disc, index) => {
			const kind = disc?.kind ?? 'manual';
			const top = index * CI_STACK.CRESCENT_OFFSET;
			const zIndex = discs.length - index;
			const label = (kind === 'manual' && Number.isFinite(disc?.num)) ? disc.num : '';

			return `<div class="ci-stack-disc ci-stack-disc--${kind}" style="top: ${top}px; z-index: ${zIndex};">${label}</div>`;
		}).join('');

		const badge = count >= 2 ? `<span class="ci-xn-badge">×${count}</span>` : '';

		return `
			<div class="ci-stack${active ? ' ci-stack--active' : ''}${stale ? ' ci-stack--stale' : ''}" style="width: ${width}px; height: ${height}px;" data-testid="check-in-marker-stack">
				${discsHtml}
				${badge}
			</div>
		`;
	}

	static getStackIconConfig(data)
	{
		const discCount = Array.isArray(data?.discs)
			? Math.min(data.discs.length, STACK_MAX_DISCS)
			: 0;
		const { width, height, anchorX, anchorY } = getStackGeometry(discCount);

		return {
			html: this.createStackIconHtml(data),
			className: 'ci-stack-marker',
			iconSize: [width, height],
			iconAnchor: [anchorX, anchorY],
		};
	}

	static createFinishGroupIconHtml(members)
	{
		const count = members.length;
		const layout = GROUP_AVATAR_LAYOUTS[count] ?? GROUP_AVATAR_LAYOUTS[3];
		const avatarSize = count <= 2 ? 42 : 38;
		const offset = (GROUP_BASE_AVATAR_SIZE - avatarSize) / 2;
		const showCounter = count > layout.length;
		const avatarSlots = showCounter ? layout.length - 1 : count;

		let html = '<div class="map-cluster-icon" data-testid="check-in-marker-finish-group">';
		for (let index = 0; index < avatarSlots; index++)
		{
			const { left, top } = layout[index];
			const member = members[index];
			html += `<div class="map-cluster-avatar" style="left:${left + offset}px;top:${top + offset}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${index + 1};">`
				+ `${getGroupAvatarHtml(member.avatarUrl, member.name, member.id, avatarSize)}</div>`;
		}

		if (showCounter)
		{
			const { left, top } = layout[layout.length - 1];
			html += `<div class="map-cluster-avatar map-cluster-avatar--counter" style="left:${left + offset}px;top:${top + offset}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${avatarSlots + 1};"><span>+${count - avatarSlots}</span></div>`;
		}

		return `${html}</div>`;
	}

	static getFinishGroupIconConfig(members)
	{
		return {
			html: this.createFinishGroupIconHtml(members),
			className: 'map-cluster-marker',
			...CI_MARKER_SIZE.FINISH_GROUP,
		};
	}

	/**
	 * Adds a bullet loader as an absolute overlay above the marker.
	 * The base icon geometry (iconSize/iconAnchor) is kept intact so the anchor dot stays in place.
	 * @param {Object} config
	 * @returns {Object}
	 */
	static wrapWithLoader(config)
	{
		const loaderHtml = `
			<div class="marker-bullet-loader" data-testid="check-in-marker-loader">
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
			html: `${config.html}${loaderHtml}`,
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

			case MarkerType.CURRENT_LOCATION:
				config = this.getCurrentLocationIconConfig(
					data.avatarUrl,
					data.name,
					data.id,
				);
				break;

			case MarkerType.NUM_PIN:
				config = this.getNumPinIconConfig(data.num, data.active, data.stale);
				break;

			case MarkerType.AUTO_DOT:
				config = this.getAutoDotIconConfig(data.active, data.stale);
				break;

			case MarkerType.START_POINT:
				config = this.getStartPointIconConfig(data.active);
				break;

			case MarkerType.FINISH_POINT:
				config = this.getFinishPointIconConfig(data.active);
				break;

			case MarkerType.EMPLOYEE_AVATAR:
				// `isAuto` is a cross-bundle contract key: the host (stafftrack check-in v3) fills it from the
				// check-in the avatar stands for, so the dot under it encodes the same type as the timeline row.
				// Absent means manual, which keeps every caller that does not know the type on the former look.
				config = this.getEmployeeAvatarIconConfig(
					data.avatarUrl,
					data.name,
					data.id,
					data.active,
					data.isAuto === true,
					data.pulse === true,
				);
				break;

			case MarkerType.STACK:
				config = this.getStackIconConfig(data);
				break;

			case MarkerType.OFFICE:
				if (data.officeId === undefined || data.officeId === null)
				{
					console.error('Office marker has no officeId:', data);
				}

				config = this.getOfficeIconConfig(data);
				break;

			case MarkerType.FINISH_GROUP:
				config = this.getFinishGroupIconConfig(data.members);
				break;

			default:
				console.error('Unknown marker type:', type);

				return null;
		}

		return data.loading ? this.wrapWithLoader(config) : config;
	}
}
