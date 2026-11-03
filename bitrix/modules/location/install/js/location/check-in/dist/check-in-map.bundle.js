/* eslint-disable */
this.BX = this.BX || {};
this.BX.Location = this.BX.Location || {};
(function (exports, location_source, location_core, ui_avatar) {
	'use strict';

	/**
	 * Marker types for checkin map
	 * @module location/checkin
	 */
	const MarkerType = Object.freeze({
		CHECK_IN: 'checkin',
		AUTO_CHECK_IN: 'autocheckin',
		FIRST_CHECK_IN: 'firstcheckin',
		FIRST_AUTO_CHECK_IN: 'firstautocheckin',
		LAST_CHECK_IN: 'lastcheckin',
		LAST_AUTO_CHECK_IN: 'lastautocheckin',
		TRANSIT_AUTO_CHECK_IN: 'transitautocheckin',
		CURRENT_LOCATION: 'currentlocation',
		// Significant events (new map prototype). Values match the orchestrator
		// (stafftrackmobile .../content/src/marker-type.js).
		NUM_PIN: 'numpin',
		AUTO_DOT: 'autodot',
		START_POINT: 'startpoint',
		FINISH_POINT: 'finishpoint',
		EMPLOYEE_AVATAR: 'employeeavatar',
		STACK: 'stack',
		FINISH_GROUP: 'finishgroup',
		OFFICE: 'office'
	});

	/**
	 * Identity of an icon built by MarkerIconFactory: the same type and the same data mean the same icon.
	 *
	 * The map engine compares icons to decide whether a re-sent marker needs its DOM rewritten, and the
	 * generated html cannot answer that question. An avatar gets a fresh
	 * `ui-avatar-{timestamp}-{random}` mask id on every build (ui.avatar, AvatarBase.getUnicId), so two
	 * identical avatars never produce equal html - while the source they are built from stays equal.
	 *
	 * @param {String} type - MarkerType value
	 * @param {Object} data - payload createIconByType was called with
	 * @returns {String}
	 */
	function buildIconKey(type, data) {
		return `${type}:${stableStringify(data)}`;
	}

	// JSON with object keys in a fixed order, so that two equal payloads assembled with their keys in a
	// different order still serialize the same. Array order carries meaning and is kept as is.
	function stableStringify(value) {
		const sorted = JSON.stringify(value, (key, item) => isPlainObject(item) ? Object.fromEntries(Object.keys(item).sort().map(name => [name, item[name]])) : item);
		return sorted ?? 'null';
	}
	function isPlainObject(value) {
		return Boolean(value) && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
	}

	const OFFICE_DROP = Object.freeze({
		BUBBLE_SIZE: 40,
		TAIL_HEIGHT: 9,
		TAIL_OVERLAP: 1
	});
	const OFFICE_DROP_HEIGHT = OFFICE_DROP.BUBBLE_SIZE + OFFICE_DROP.TAIL_HEIGHT - OFFICE_DROP.TAIL_OVERLAP;
	const CI_MARKER_SIZE = Object.freeze({
		NUM_PIN: {
			iconSize: [30, 54],
			iconAnchor: [15, 45]
		},
		AUTO_DOT: {
			iconSize: [18, 18],
			iconAnchor: [9, 9]
		},
		START_POINT: {
			iconSize: [18, 18],
			iconAnchor: [9, 9]
		},
		FINISH_POINT: {
			iconSize: [18, 18],
			iconAnchor: [9, 9]
		},
		EMPLOYEE_AVATAR: {
			iconSize: [64, 72],
			iconAnchor: [32, 63]
		},
		FINISH_GROUP: {
			iconSize: [85, 85],
			iconAnchor: [42.5, 42.5]
		},
		OFFICE: {
			iconSize: [OFFICE_DROP.BUBBLE_SIZE, OFFICE_DROP_HEIGHT],
			iconAnchor: [OFFICE_DROP.BUBBLE_SIZE / 2, OFFICE_DROP_HEIGHT]
		}
	});
	const CI_STACK = Object.freeze({
		DISC: 18,
		CRESCENT_OFFSET: 6
	});

	// xN stack counter appears from this zoom in; below it check-in-map.js hangs the `ci-zoom-far` class and the
	// counter is hidden by CSS. Mirrored across the bundle boundary by osm check-in-map-service-maplibre
	// (ARROW_MIN_ZOOM): the direction-arrow layer uses this value as its minzoom so arrows and the counter reveal
	// together. osm cannot import this bundle, so keep the two copies in sync.
	const CI_XN_ZOOM_THRESHOLD = 15;
	const PLATE_MIN_ZOOM = 13;
	const CI_AVATAR_STACK = Object.freeze({
		FACE_SIZE: 22,
		OUTLINE: 2,
		OVERLAP: 9
	});

	// Background colours of empty avatars drawn on the map. Mirror of the app-wide palette
	// (mobile layout/ui/user/empty-avatar COLORS): the same employee keeps one colour on the map and in
	// every list of the app, so the copies must stay identical - guarded by the stafftrackmobile test
	// employee-palette-sync.test.js. This is not the team route palette of check-in v3 (stafftrackmobile
	// employee-palette.js): that one colours route lines and their discs, and its first slots differ on purpose.
	const EMPTY_AVATAR_PALETTE = Object.freeze(['#df532d', '#64a513', '#4ba984', '#4ba5c3', '#3e99ce', '#8474c8', '#1eb4aa', '#f76187', '#58cc47', '#ab7761', '#29619b', '#728f7a', '#ba9c7b', '#e8a441', '#556574', '#909090', '#5e5f5e']);

	// Palette indexing C - hash, no guard: id % len; NaN/negative gives undefined. Behavior kept as-is.
	const getColor = id => EMPTY_AVATAR_PALETTE[id % EMPTY_AVATAR_PALETTE.length];

	/**
	 * Returns the outerHTML of an AvatarRound component.
	 * Shows the avatar image when avatarUrl is provided; otherwise shows initials
	 * extracted from `name` on a background color derived from the numeric user `id`.
	 *
	 * @param {string|null} avatarUrl
	 * @param {string} name - used to extract initials (first letters of first two words)
	 * @param {number} id - numeric user id, determines the background color
	 * @param {number} size - desired pixel size of the avatar element
	 * @returns {string}
	 */
	function getAvatar(avatarUrl, name, id, size) {
		const avatar = new ui_avatar.AvatarRound({
			picPath: avatarUrl || '',
			title: name || '',
			size,
			baseColor: getColor(id)
		});
		return avatar.getContainer().outerHTML;
	}

	const MAX_REST_LABEL = 99;

	/**
	 * @typedef {{id: ?number, name: ?string, avatarUrl: ?string}} AvatarStackFace
	 */

	/**
	 * @param {AvatarStackFace} face
	 * @returns {string}
	 */
	function createFaceHtml(face) {
		const avatar = getAvatar(face?.avatarUrl, face?.name, face?.id, CI_AVATAR_STACK.FACE_SIZE);
		return `<span class="ci-avatar-stack-face" data-testid="check-in-avatar-stack-face">${avatar}</span>`;
	}

	/**
	 * @param {number} restCount
	 * @returns {string}
	 */
	function createRestFaceHtml(restCount) {
		const label = restCount > MAX_REST_LABEL ? `${MAX_REST_LABEL}+` : `+${restCount}`;
		return `<span class="ci-avatar-stack-face ci-avatar-stack-face--rest" data-testid="check-in-avatar-stack-rest">${label}</span>`;
	}

	/**
	 * @param {Array<AvatarStackFace>} faces
	 * @param {{maxFaces: ?number, totalCount: ?number}} [options]
	 * @returns {string}
	 */
	function createAvatarStackHtml(faces, options = {}) {
		const list = Array.isArray(faces) ? faces : [];
		const maxFaces = Number.isFinite(options?.maxFaces) ? Math.max(0, Math.trunc(options.maxFaces)) : list.length;
		const shown = list.slice(0, maxFaces);
		if (shown.length === 0) {
			return '';
		}
		const total = Number.isFinite(options?.totalCount) ? Math.trunc(options.totalCount) : list.length;
		const restCount = Math.max(0, total - shown.length);
		const restHtml = restCount > 0 ? createRestFaceHtml(restCount) : '';
		const facesHtml = shown.map(face => createFaceHtml(face)).join('');
		return `<div class="ci-avatar-stack" data-testid="check-in-avatar-stack">${facesHtml}${restHtml}</div>`;
	}

	const STACK_MAX_DISCS = 3;
	const OFFICE_PLATE_MAX_FACES = 5;
	const GROUP_AVATAR_LAYOUTS = Object.freeze({
		2: [{
			left: 15,
			top: 38
		}, {
			left: 39,
			top: 14
		}],
		3: [{
			left: 27,
			top: 8
		}, {
			left: 10,
			top: 38
		}, {
			left: 44,
			top: 38
		}]
	});
	const GROUP_BASE_AVATAR_SIZE = 32;

	// Palette indexing B - hash+guard: abs(Number(id) || 0) maps NaN/negative to 0. Intentional divergence; do not unify.
	function getEmployeeFallbackColor(id) {
		return EMPTY_AVATAR_PALETTE[Math.abs(Number(id) || 0) % EMPTY_AVATAR_PALETTE.length];
	}
	function escapeHtml(value) {
		return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}
	function getGroupAvatarHtml(avatarUrl, name, id, size) {
		if (avatarUrl) {
			return `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(String(name ?? ''))}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
		}
		const initial = escapeHtml(String(name || '').trim().charAt(0).toUpperCase());
		const fontSize = Math.round(size * 0.4);
		return `<div style="width:100%;height:100%;border-radius:50%;background:${getEmployeeFallbackColor(id)};color:#fff;` + `display:flex;align-items:center;justify-content:center;font:600 ${fontSize}px sans-serif;">${initial}</div>`;
	}
	function getStackGeometry(discCount) {
		const clamped = Math.max(0, Math.min(discCount, STACK_MAX_DISCS));
		const extra = Math.max(0, clamped - 1) * CI_STACK.CRESCENT_OFFSET;
		return {
			width: CI_STACK.DISC,
			height: CI_STACK.DISC + extra,
			anchorX: CI_STACK.DISC / 2,
			anchorY: CI_STACK.DISC / 2 + extra
		};
	}
	function getOfficePlateFacesHtml(office) {
		const assignedCount = Number.isFinite(office?.assignedCount) ? office.assignedCount : null;
		if (office?.isEmployeeListAvailable !== true) {
			const assignedLabel = String(office?.assignedLabel ?? '').trim();
			if (assignedLabel !== '') {
				return `<span class="ci-office-plate-count" data-testid="check-in-office-plate-count">${escapeHtml(assignedLabel)}</span>`;
			}
			return assignedCount === null ? '' : `<span class="ci-office-plate-count" data-testid="check-in-office-plate-count">${escapeHtml(assignedCount)}</span>`;
		}
		const employees = Array.isArray(office?.employees) ? office.employees : [];
		return createAvatarStackHtml(employees, {
			maxFaces: OFFICE_PLATE_MAX_FACES,
			totalCount: assignedCount ?? employees.length
		});
	}
	function getOfficePlateHtml(office) {
		const title = String(office?.title ?? '').trim();
		if (title === '') {
			return '';
		}
		const facesHtml = getOfficePlateFacesHtml(office);
		const facesRow = facesHtml === '' ? '' : `<div class="ci-office-plate-faces" data-testid="check-in-office-plate-faces">${facesHtml}</div>`;
		return `
		<div class="ci-office-plate" data-testid="check-in-office-plate">
			<div class="ci-office-plate-title" data-testid="check-in-office-plate-title">${escapeHtml(title)}</div>
			${facesRow}
		</div>
	`;
	}
	const OFFICE_BUILDING_PATH = 'M5 4h5a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1Z ' + 'M14 9h5a1 1 0 0 1 1 1v10h-7V10a1 1 0 0 1 1-1Z ' + 'M5.5 6.5h1.5v1.5H5.5Z M8 6.5h1.5v1.5H8Z ' + 'M5.5 9.5h1.5v1.5H5.5Z M8 9.5h1.5v1.5H8Z ' + 'M5.5 12.5h1.5v1.5H5.5Z M8 12.5h1.5v1.5H8Z ' + 'M14.5 11.5h1.5v1.5H14.5Z M17 11.5h1.5v1.5H17Z ' + 'M14.5 14.5h1.5v1.5H14.5Z M17 14.5h1.5v1.5H17Z';
	const PLAY_TRIANGLE_PATH = 'M12.5777 6.85421C13.4377 7.3726 13.4377 8.61966 12.5777 9.13806L6.15773 13.0079C5.22469 13.57 4.03534 12.898 4.03534 11.8086L4.03534 4.18298C4.03551 3.09365 5.22472 2.42206 6.15773 2.98442L12.5777 6.85421Z';

	/**
	 * Factory for creating marker icons
	 * @module location/checkin
	 */
	class MarkerIconFactory {
		static createLastCheckInIconHtml(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			const countBadge = checkInCount !== null && checkInCount !== undefined ? `<span class="employee-drop-badge">${checkInCount}</span>` : '';
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
		static createLastAutoCheckInIconHtml(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			const countBadge = checkInCount !== null && checkInCount !== undefined ? `<span class="employee-drop-badge">${checkInCount}</span>` : '';
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
		static createCurrentLocationIconHtml(avatarUrl, name, id) {
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
		static createCheckInIconHtml(time) {
			return `
			<div class="marker-container check-in-marker-container">
				<div class="marker-point-circle"></div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createFirstCheckInIconHtml(time) {
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
		static createFirstAutoCheckInIconHtml(time) {
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
		static createAutoCheckInIconHtml(time) {
			return `
			<div class="marker-container auto-check-in-marker-container">
				<div class="marker-point-circle"></div>
				<div class="marker-drop-time">${time}</div>
			</div>
		`;
		}
		static createTransitAutoCheckInIconHtml() {
			return `
			<div class="marker-container transit-auto-check-in-marker-container">
				<div class="marker-point-circle"></div>
			</div>
		`;
		}
		static getCheckInIconConfig(time) {
			return {
				html: this.createCheckInIconHtml(time),
				className: 'check-in-marker',
				iconSize: [60, 46],
				iconAnchor: [30, 5]
			};
		}
		static getAutoCheckInIconConfig(time) {
			return {
				html: this.createAutoCheckInIconHtml(time),
				className: 'custom-auto-check-in-marker',
				iconSize: [60, 46],
				iconAnchor: [30, 5]
			};
		}
		static getTransitAutoCheckInIconConfig() {
			return {
				html: this.createTransitAutoCheckInIconHtml(),
				className: 'custom-transit-auto-check-in-marker',
				iconSize: [10, 10],
				iconAnchor: [5, 5]
			};
		}
		static getFirstCheckInIconConfig(time) {
			return {
				html: this.createFirstCheckInIconHtml(time),
				className: 'custom-first-check-in-marker',
				iconSize: [60, 70],
				iconAnchor: [30, 20]
			};
		}
		static getFirstAutoCheckInIconConfig(time) {
			return {
				html: this.createFirstAutoCheckInIconHtml(time),
				className: 'custom-first-auto-check-in-marker',
				iconSize: [60, 70],
				iconAnchor: [30, 20]
			};
		}
		static getLastCheckInIconConfig(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			return {
				html: this.createLastCheckInIconHtml(avatarUrl, name, id, time, checkInCount, isDayClosed),
				className: 'custom-last-check-in-marker',
				iconSize: [60, 114],
				iconAnchor: [30, 73]
			};
		}
		static getLastAutoCheckInIconConfig(avatarUrl, name, id, time, checkInCount = null, isDayClosed = false) {
			return {
				html: this.createLastAutoCheckInIconHtml(avatarUrl, name, id, time, checkInCount, isDayClosed),
				className: 'custom-last-auto-check-in-marker',
				iconSize: [60, 114],
				iconAnchor: [30, 73]
			};
		}
		static getCurrentLocationIconConfig(avatarUrl, name, id) {
			return {
				html: this.createCurrentLocationIconHtml(avatarUrl, name, id),
				className: 'custom-current-location-marker',
				iconSize: [60, 78],
				iconAnchor: [30, 73]
			};
		}

		// --- New map significant events (prototype): dot on the line + number/avatar above it ---
		// All markers have a "line dot" at the base (anchor = dot center),
		// with the number/avatar placed above it. Dots share the same size (18px):
		//   manual - blue fill/white border, auto STAY - white fill/blue border,
		//   start - green fill/white border.

		static createNumPinIconHtml(num, active = false, stale = false) {
			return `
			<div class="ci-num-marker${active ? ' ci-num-marker--active' : ''}${stale ? ' ci-num-marker--stale' : ''}" data-testid="check-in-marker-num">
				<div class="ci-num-bubble">${num}</div>
				<div class="ci-num-tail"></div>
				<div class="ci-line-dot ci-line-dot--manual"></div>
			</div>
		`;
		}
		static getNumPinIconConfig(num, active = false, stale = false) {
			return {
				html: this.createNumPinIconHtml(num, active, stale),
				className: 'ci-num-pin-marker',
				...CI_MARKER_SIZE.NUM_PIN
			};
		}
		static createAutoDotIconHtml(active = false, stale = false) {
			return `<div class="ci-line-dot ci-line-dot--auto${active ? ' ci-line-dot--active' : ''}${stale ? ' ci-line-dot--stale' : ''}" data-testid="check-in-marker-auto"></div>`;
		}
		static getAutoDotIconConfig(active = false, stale = false) {
			return {
				html: this.createAutoDotIconHtml(active, stale),
				className: 'ci-auto-dot-marker',
				...CI_MARKER_SIZE.AUTO_DOT
			};
		}
		static createStartPointIconHtml(active = false) {
			// Center the triangle's visible bounding box: its x-center is 8.629, so min_x = 8.629 - 8 = 0.629 gives equal left/right margins.
			return `
			<div class="ci-line-dot ci-line-dot--start${active ? ' ci-line-dot--active' : ''}" data-testid="check-in-marker-start">
				<svg class="ci-start-play" width="9" height="9" viewBox="0.629 0 16 16" fill="none">
					<path d="${PLAY_TRIANGLE_PATH}" fill="currentColor"/>
				</svg>
			</div>
		`;
		}
		static getStartPointIconConfig(active = false) {
			return {
				html: this.createStartPointIconHtml(active),
				className: 'ci-start-dot-marker',
				...CI_MARKER_SIZE.START_POINT
			};
		}
		static createFinishPointIconHtml(active = false) {
			return `<div class="ci-line-dot ci-line-dot--finish${active ? ' ci-line-dot--active' : ''}" data-testid="check-in-marker-finish"></div>`;
		}
		static getFinishPointIconConfig(active = false) {
			return {
				html: this.createFinishPointIconHtml(active),
				className: 'ci-finish-marker',
				...CI_MARKER_SIZE.FINISH_POINT
			};
		}

		// `active` is selection, drawn as the same static halo every other marker type shows it with;
		// `pulse` is a live position, drawn as the running ring. They are separate states on purpose - one
		// key for both would make a selected terminal avatar indistinguishable from a live one.
		static createEmployeeAvatarIconHtml(avatarUrl, name, id, active = false, isAuto = false, pulse = false) {
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
		static getEmployeeAvatarIconConfig(avatarUrl, name, id, active = false, isAuto = false, pulse = false) {
			return {
				html: this.createEmployeeAvatarIconHtml(avatarUrl, name, id, active, isAuto, pulse),
				className: 'ci-avatar-marker',
				...CI_MARKER_SIZE.EMPLOYEE_AVATAR
			};
		}
		static createOfficeIconHtml(office) {
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
		static getOfficeIconConfig(office) {
			return {
				html: this.createOfficeIconHtml(office),
				className: 'ci-office-marker',
				...CI_MARKER_SIZE.OFFICE
			};
		}
		static createStackIconHtml(data) {
			const discs = Array.isArray(data?.discs) ? data.discs.slice(0, STACK_MAX_DISCS) : [];
			const count = Number.isFinite(data?.count) ? data.count : discs.length;
			const active = data?.active === true;
			const stale = data?.stale === true;
			const {
				width,
				height
			} = getStackGeometry(discs.length);
			const discsHtml = discs.map((disc, index) => {
				const kind = disc?.kind ?? 'manual';
				const top = index * CI_STACK.CRESCENT_OFFSET;
				const zIndex = discs.length - index;
				const label = kind === 'manual' && Number.isFinite(disc?.num) ? disc.num : '';
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
		static getStackIconConfig(data) {
			const discCount = Array.isArray(data?.discs) ? Math.min(data.discs.length, STACK_MAX_DISCS) : 0;
			const {
				width,
				height,
				anchorX,
				anchorY
			} = getStackGeometry(discCount);
			return {
				html: this.createStackIconHtml(data),
				className: 'ci-stack-marker',
				iconSize: [width, height],
				iconAnchor: [anchorX, anchorY]
			};
		}
		static createFinishGroupIconHtml(members) {
			const count = members.length;
			const layout = GROUP_AVATAR_LAYOUTS[count] ?? GROUP_AVATAR_LAYOUTS[3];
			const avatarSize = count <= 2 ? 42 : 38;
			const offset = (GROUP_BASE_AVATAR_SIZE - avatarSize) / 2;
			const showCounter = count > layout.length;
			const avatarSlots = showCounter ? layout.length - 1 : count;
			let html = '<div class="map-cluster-icon" data-testid="check-in-marker-finish-group">';
			for (let index = 0; index < avatarSlots; index++) {
				const {
					left,
					top
				} = layout[index];
				const member = members[index];
				html += `<div class="map-cluster-avatar" style="left:${left + offset}px;top:${top + offset}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${index + 1};">` + `${getGroupAvatarHtml(member.avatarUrl, member.name, member.id, avatarSize)}</div>`;
			}
			if (showCounter) {
				const {
					left,
					top
				} = layout[layout.length - 1];
				html += `<div class="map-cluster-avatar map-cluster-avatar--counter" style="left:${left + offset}px;top:${top + offset}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${avatarSlots + 1};"><span>+${count - avatarSlots}</span></div>`;
			}
			return `${html}</div>`;
		}
		static getFinishGroupIconConfig(members) {
			return {
				html: this.createFinishGroupIconHtml(members),
				className: 'map-cluster-marker',
				...CI_MARKER_SIZE.FINISH_GROUP
			};
		}

		/**
		 * Adds a bullet loader as an absolute overlay above the marker.
		 * The base icon geometry (iconSize/iconAnchor) is kept intact so the anchor dot stays in place.
		 * @param {Object} config
		 * @returns {Object}
		 */
		static wrapWithLoader(config) {
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
				html: `${config.html}${loaderHtml}`
			};
		}

		/**
		 * Create icon configuration based on marker type.
		 * Pass `data.loading = true` to overlay a bullet loader above the marker.
		 */
		static createIconByType(type, data) {
			let config;
			switch (type) {
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
					config = this.getLastCheckInIconConfig(data.avatarUrl, data.name, data.id, data.time, data.checkInCount, data.isDayClosed);
					break;
				case MarkerType.LAST_AUTO_CHECK_IN:
					config = this.getLastAutoCheckInIconConfig(data.avatarUrl, data.name, data.id, data.time, data.checkInCount, data.isDayClosed);
					break;
				case MarkerType.CURRENT_LOCATION:
					config = this.getCurrentLocationIconConfig(data.avatarUrl, data.name, data.id);
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
					config = this.getEmployeeAvatarIconConfig(data.avatarUrl, data.name, data.id, data.active, data.isAuto === true, data.pulse === true);
					break;
				case MarkerType.STACK:
					config = this.getStackIconConfig(data);
					break;
				case MarkerType.OFFICE:
					if (data.officeId === undefined || data.officeId === null) {
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

	const AVATAR_LAYOUTS = [[],
	// 0
	[{
		left: 27,
		top: 27
	}],
	// 1 – centered
	[
	// 2 – SW→NE diagonal; top-right (NE) rendered last → on top
	{
		left: 15,
		top: 38
	}, {
		left: 39,
		top: 14
	}], [
	// 3 – equilateral triangle; top vertex first, bottom row last (higher z-index)
	{
		left: 27,
		top: 8
	}, {
		left: 10,
		top: 38
	}, {
		left: 44,
		top: 38
	}], [
	// 4 – diamond (r = 20); top, right, left, bottom rendered last → on top
	{
		left: 27,
		top: 7
	}, {
		left: 47,
		top: 27
	}, {
		left: 6,
		top: 27
	}, {
		left: 27,
		top: 47
	}], [
	// 5 – pentagon ring (r = 20); bottom vertex rendered last → on top
	{
		left: 38,
		top: 10
	}, {
		left: 15,
		top: 10
	}, {
		left: 46,
		top: 33
	}, {
		left: 7,
		top: 33
	}, {
		left: 27,
		top: 46
	}], [
	// 6 – hexagon ring (r = 24); sorted top→bottom, bottom rendered last → on top
	{
		left: 27,
		top: 3
	}, {
		left: 47,
		top: 15
	}, {
		left: 6,
		top: 15
	}, {
		left: 47,
		top: 39
	}, {
		left: 6,
		top: 39
	}, {
		left: 27,
		top: 51
	}], [
	// 7 – hexagon ring (r = 24) + center; ring sorted top→bottom, center rendered last → on top
	{
		left: 27,
		top: 3
	}, {
		left: 47,
		top: 15
	}, {
		left: 6,
		top: 15
	}, {
		left: 47,
		top: 39
	}, {
		left: 6,
		top: 39
	}, {
		left: 27,
		top: 51
	}, {
		left: 27,
		top: 27
	} // center – rendered last → on top
	], [
	// 8 – octagon ring (r = 25); sorted top→bottom, bottom rendered last → on top
	{
		left: 27,
		top: 2
	}, {
		left: 44,
		top: 9
	}, {
		left: 9,
		top: 9
	}, {
		left: 52,
		top: 27
	}, {
		left: 2,
		top: 27
	}, {
		left: 44,
		top: 44
	}, {
		left: 9,
		top: 44
	}, {
		left: 27,
		top: 52
	}]];

	// 9+ clusters: 7 avatars in a heptagon ring (r = 26, ~31% overlap) + overflow counter in the center.
	// Outer ring sorted top→bottom so the lowest avatars are rendered last → appear on top.
	const CLUSTER_OVERFLOW_LAYOUT = [{
		left: 27,
		top: 1
	}, {
		left: 47,
		top: 10
	}, {
		left: 6,
		top: 10
	}, {
		left: 52,
		top: 32
	}, {
		left: 1,
		top: 32
	}, {
		left: 38,
		top: 50
	}, {
		left: 15,
		top: 50
	}, {
		left: 27,
		top: 27
	} // center – rendered as overflow counter (always last)
	];

	// Base avatar size used for layout calculations
	const BASE_AVATAR_SIZE = 32;

	/**
	 * Returns avatar size in pixels based on cluster marker count.
	 * @param {number} count - Number of markers in the cluster
	 * @returns {number}
	 */
	function getAvatarSize(count) {
		if (count <= 2) {
			return 42;
		}
		if (count <= 4) {
			return 38;
		}
		if (count <= 5) {
			return 36;
		}
		return 32; // 6+ markers
	}
	class ClusterIconFactory {
		/**
		 * @param {Array<object|null>} markerConfigs - marker config objects passed from CheckInMapService
		 * @param {boolean} animated
		 * @returns {{ html: string, className: string, iconSize: number[], iconAnchor: number[] }}
		 */
		static createRouteIcon(markerConfigs, animated = true) {
			const count = markerConfigs.length;
			const label = count > 99 ? '99+' : String(count);
			const animateClass = animated ? ' map-route-cluster-animate' : '';
			return {
				html: `<div class="map-route-cluster-icon${animateClass}"><span class="map-route-cluster-count">${label}</span></div>`,
				className: 'map-route-cluster-marker',
				iconSize: [40, 40],
				iconAnchor: [20, 20]
			};
		}
		static createIcon(markerConfigs, animated = true) {
			const count = markerConfigs.length;
			const avatarUrls = markerConfigs.map(config => config?.avatarUrl ?? null);
			const names = markerConfigs.map(config => config?.name ?? '');
			const ids = markerConfigs.map(config => config?.id ?? 0);

			// Determine avatar size based on count
			const avatarSize = getAvatarSize(count);
			// Offset to center avatars of different sizes (layouts are calculated for 32px)
			const sizeOffset = (BASE_AVATAR_SIZE - avatarSize) / 2;
			let layout = null;
			let showCounter = false;
			let counterValue = 0;
			if (count <= 8) {
				layout = AVATAR_LAYOUTS[count] ?? AVATAR_LAYOUTS[6].slice(0, count);
			} else {
				// 9+ avatars: 7 visible in a ring, overflow counter in the center
				layout = CLUSTER_OVERFLOW_LAYOUT;
				showCounter = true;
				counterValue = count - 7;
			}
			const animateClass = animated ? ' map-cluster-animate' : '';
			let html = `<div class="map-cluster-icon${animateClass}">`;
			const avatarSlots = showCounter ? layout.length - 1 : layout.length;
			for (let i = 0; i < avatarSlots; i++) {
				const {
					left,
					top
				} = layout[i];
				const adjustedLeft = left + sizeOffset;
				const adjustedTop = top + sizeOffset;
				const inner = getAvatar(avatarUrls[i], names[i], ids[i], avatarSize);
				html += `<div class="map-cluster-avatar" style="left:${adjustedLeft}px;top:${adjustedTop}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${i + 1};">${inner}</div>`;
			}
			if (showCounter) {
				const {
					left,
					top
				} = layout[layout.length - 1];
				const adjustedLeft = left + sizeOffset;
				const adjustedTop = top + sizeOffset;
				html += `<div class="map-cluster-avatar map-cluster-avatar--counter" style="left:${adjustedLeft}px;top:${adjustedTop}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${avatarSlots + 1};"><span>+${counterValue}</span></div>`;
			}
			html += '</div>';
			return {
				html,
				className: 'map-cluster-marker',
				iconSize: [85, 85],
				iconAnchor: [42, 42]
			};
		}
	}

	const MAP_CONTAINER_SELECTOR = '#check-in-map';

	// Hides everything the engine draws while the map stands on a stand-in centre (see init).
	const STAND_IN_CENTER_CLASS = 'ci-stand-in-center';
	// A tap is a choice of an object, not a move of the map, and a finger resting on the glass jitters by
	// a pixel or two - so the touch has to travel before the gesture counts as one. This is the usual slop
	// of a drag.
	const MANUAL_MOVE_SLOP_PX = 10;

	// A drag holds the finger down for seconds and raises touchmove at the frame rate. The host only needs
	// to know that the user has taken the map over, so the frames of one gesture are coalesced into windows
	// this long. The window belongs to the gesture alone: a press of a control is a single call, and a window
	// over it would take the report away rather than thin it out (see reportManualMove).
	const GESTURE_REPORT_WINDOW_MS = 300;

	// The commands with a button of the map's own control column behind them. Those buttons are drawn by the
	// native component on top of the webview, so the press itself never reaches this page - the command is
	// the whole of what the page gets to read it by. Pressing one is the user taking the camera over just as
	// a drag is. Everything else the host sends is the host drawing its own scene, the frames of the camera
	// it follows the live marker with included, and must stay silent.
	const USER_CAMERA_COMMANDS = new Set([location_core.CheckinMapCommandType.ZOOM_IN, location_core.CheckinMapCommandType.ZOOM_OUT, location_core.CheckinMapCommandType.FIT_TO_LAYERS]);

	/**
	 * Where the touches sit and how widely they are spread. A drag moves the centre; a pinch changes the
	 * spread while the centre may not move at all. Together they cover every gesture that moves the camera,
	 * and a single still finger answers neither. The count comes along because both readings are averages
	 * over the touches that are down: comparing two of them taken over a different number of fingers
	 * measures the change of the hand and not a move of the map.
	 * @returns {?{x: Number, y: Number, spread: Number, count: Number}}
	 */
	const getTouchGeometry = touches => {
		const points = Array.from(touches ?? []);
		if (points.length === 0) {
			return null;
		}
		const x = points.reduce((sum, point) => sum + point.clientX, 0) / points.length;
		const y = points.reduce((sum, point) => sum + point.clientY, 0) / points.length;
		const spread = points.reduce((sum, point) => sum + Math.hypot(point.clientX - x, point.clientY - y), 0) / points.length;
		return {
			x,
			y,
			spread,
			count: points.length
		};
	};
	class CheckInMap {
		#touchAnchor = null;
		#lastGestureReportAt = 0;
		constructor() {
			this.mapService = null;
			this.standsOnStandInCenter = false;
			this.subscribeToEvents();
			this.#subscribeToManualMove();
		}

		// Gestures that move the camera by hand are reported to the host, so it can drop a mode of its own
		// that keeps the camera elsewhere. The listeners capture: the engine handles these events on its
		// own canvas inside the container, and a bubbling listener would be at its mercy.
		#subscribeToManualMove() {
			const container = document.querySelector('#check-in-map');
			if (!container) {
				return;
			}
			const options = {
				capture: true,
				passive: true
			};
			container.addEventListener('touchstart', this.#onTouchStart, options);
			container.addEventListener('touchmove', this.#onTouchMove, options);
			container.addEventListener('wheel', this.#onWheel, options);
		}

		// Every gesture starts here, a second finger landing mid-drag included: the anchor is rebuilt from
		// the touches that are down now, so a pinch is measured from where it began rather than from where
		// the first finger landed.
		#onTouchStart = event => {
			this.#touchAnchor = getTouchGeometry(event.touches);
		};
		#onTouchMove = event => {
			const anchor = this.#touchAnchor;
			const current = getTouchGeometry(event.touches);
			if (!anchor || !current) {
				return;
			}

			// A finger lifted out of a pinch takes the centre halfway to the finger that stays and drops the
			// spread to zero - a jump well past the slop, with the map never touched. touchstart covers the
			// opposite direction; this covers the lift, and the gesture goes on being measured from where the
			// hand now is.
			if (current.count !== anchor.count) {
				this.#touchAnchor = current;
				return;
			}
			const hasMoved = Math.hypot(current.x - anchor.x, current.y - anchor.y) > MANUAL_MOVE_SLOP_PX || Math.abs(current.spread - anchor.spread) > MANUAL_MOVE_SLOP_PX;
			if (hasMoved) {
				this.#reportGesture();
			}
		};
		#onWheel = () => {
			this.#reportGesture();
		};

		// A gesture goes on raising events for as long as the hand is on the glass, and the host learns nothing
		// from the frames that follow the first one.
		#reportGesture() {
			const now = Date.now();
			if (now - this.#lastGestureReportAt < GESTURE_REPORT_WINDOW_MS) {
				return;
			}
			this.#lastGestureReportAt = now;
			this.#reportManualMove();
		}
		#reportManualMove() {
			// eslint-disable-next-line no-undef
			BXNativeBridge?.sendEvent(location_core.CheckInMapEventType.MAP_MOVED_BY_USER, {});
		}

		/**
		 * The section can be opened before the first GPS fix - geolocation switched on while it was already
		 * loading - and then the host command carries no centre. No engine builds a map without one, so the
		 * portal region point from the page bootstrap stands in. That point is a place the user has nothing
		 * to do with, so the map is held out of sight until a camera command lands it on real coordinates
		 * (see revealMap); until then the container shows its own background, the same colour the host
		 * paints behind the WebView.
		 */
		init(props) {
			const hasHostCenter = this.isValidCenter(props?.mapCenter);
			const mapCenter = hasHostCenter ? props.mapCenter : this.getDefaultMapCenter();
			if (!this.isValidCenter(mapCenter)) {
				console.error('INIT_MAP carries no map center and the page has no default point');
				return;
			}
			const preparedProps = {
				...this.getPreparedProps(props),
				mapCenter
			};

			// A previous map would otherwise stay alive in the same container, and the MapLibre engine keeps
			// its tile protocol in a global registry - it has to release it before the new map registers one.
			// The reference goes whatever the engine does on the way out, so a destroy that throws leaves the
			// next INIT_MAP a clean slate instead of a service half torn down.
			try {
				this.mapService?.destroy();
			} finally {
				this.mapService = null;
			}
			this.setStandInCenter(!hasHostCenter);
			const mapService = this.createMapService();
			// Kept before init() so that an initialisation that throws still releases its resources on the
			// next INIT_MAP.
			this.mapService = mapService;
			mapService.onZoomChanged = zoom => this.applyZoomState(zoom);
			mapService.init(preparedProps);
		}
		createMapService() {
			const sourceParams = BX.message('LOCATION_MOBILE_SOURCE_PARAMS') || {};
			return location_source.Factory.create(BX.message('LOCATION_MOBILE_SOURCE_CODE'), BX.message('LOCATION_MOBILE_LANGUAGE_ID'), BX.message('LOCATION_MOBILE_SOURCE_LANGUAGE_ID'), {
				...sourceParams,
				mapEngine: BX.message('LOCATION_MOBILE_MAP_ENGINE') || 'leaflet'
			}).checkinMap;
		}
		getDefaultMapCenter() {
			// The whole page bootstrap is read this way here (see createMapService): main.core is not in the
			// extension's rel, and pulling it in for one more message would change what the bundle carries.
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx, @bitrix24/bitrix24-rules/no-bx-message
			const defaultPoint = BX.message('LOCATION_MOBILE_DEFAULT_LOCATION_POINT');
			if (!defaultPoint) {
				return null;
			}
			try {
				const {
					latitude,
					longitude
				} = JSON.parse(defaultPoint);
				return [latitude, longitude];
			} catch (error) {
				// A point that cannot be read is no point at all: answered as a page that carries none, so a
				// broken bootstrap value is not thrown out of the command the way a missing center used to be.
				console.error('Failed to read the default location point:', error);
				return null;
			}
		}
		isValidCenter(center) {
			return Array.isArray(center) && center.length === 2 && center.every(coordinate => Number.isFinite(coordinate));
		}

		/**
		 * The camera is being put on coordinates the host actually has, so whatever the map was built on is
		 * no longer what it shows. Only a framing that carries coordinates gets here: a zoom changes the
		 * scale and leaves the camera where it is, and FIT_TO_LAYERS frames what is already drawn - which
		 * every path puts on the map together with the framing that carries its coordinates. So a day with
		 * nothing on it keeps the map hidden instead of showing the region point it was built on.
		 */
		revealMap() {
			this.setStandInCenter(false);
		}
		setStandInCenter(isOn) {
			this.standsOnStandInCenter = isOn;
			this.toggleContainerClass(STAND_IN_CENTER_CLASS, isOn);
		}
		applyZoomState(zoom) {
			this.toggleContainerClass('ci-zoom-far', zoom < CI_XN_ZOOM_THRESHOLD);
		}
		toggleContainerClass(className, isOn) {
			const container = document.querySelector(MAP_CONTAINER_SELECTOR);
			if (!container) {
				return;
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-classlist
			container.classList.toggle(className, isOn);
		}
		getPreparedProps(props = {}) {
			const preparedProps = {
				...props,
				containerId: MAP_CONTAINER_SELECTOR
			};
			if (Array.isArray(preparedProps.markers)) {
				preparedProps.markers = this.prepareMarkers(preparedProps.markers);
			}
			return preparedProps;
		}
		subscribeToEvents() {
			BXNativeBridge?.onReceiveEvent(this.onReceiveEvent);
		}
		onReceiveEvent = event => {
			const {
				eventType,
				data = {}
			} = event;
			if (!this.mapService && eventType !== location_core.CheckinMapCommandType.INIT_MAP) {
				console.error('Map service is not initialized. Call INIT_MAP first.');
				return;
			}
			if (USER_CAMERA_COMMANDS.has(eventType)) {
				this.#reportManualMove();
			}
			switch (eventType) {
				case location_core.CheckinMapCommandType.INIT_MAP:
					this.init(data);
					break;
				case location_core.CheckinMapCommandType.ADD_MARKERS:
					{
						const preparedData = this.getPreparedProps({
							markers: data.markers
						});
						this.mapService.addMarkers(preparedData.markers);
						break;
					}
				case location_core.CheckinMapCommandType.REMOVE_MARKERS:
					this.mapService.removeMarkers(data.ids);
					break;
				case location_core.CheckinMapCommandType.CLEAR_MARKERS:
					this.mapService.clearMarkers();
					break;
				case location_core.CheckinMapCommandType.ADD_LAYERS:
					this.mapService.addLayers(data.layers);
					break;
				case location_core.CheckinMapCommandType.REMOVE_LAYERS:
					this.mapService.removeLayers(data.ids);
					break;
				case location_core.CheckinMapCommandType.CLEAR_LAYERS:
					this.mapService.clearLayers();
					break;
				case location_core.CheckinMapCommandType.FIT_BOUNDS:
					{
						// The map the user is about to see stands on the stand-in centre, so the framing that
						// brings it to the real coordinates would otherwise be flown as a trip from there.
						const options = this.standsOnStandInCenter ? {
							...data.options,
							duration: 0
						} : data.options;
						if (Array.isArray(data.bounds) && data.bounds.length > 0) {
							this.revealMap();
						}
						this.mapService.fitBounds(data.bounds, options);
						break;
					}
				case location_core.CheckinMapCommandType.SET_ZOOM:
					this.mapService.setZoom(data.zoom);
					break;
				case location_core.CheckinMapCommandType.ZOOM_IN:
					this.mapService.zoomIn();
					break;
				case location_core.CheckinMapCommandType.ZOOM_OUT:
					this.mapService.zoomOut();
					break;
				case location_core.CheckinMapCommandType.FIT_TO_LAYERS:
					this.mapService.fitToLayers(data.maxZoom);
					break;
				case location_core.CheckinMapCommandType.ENABLE_CLUSTERING:
					{
						const isRouteMode = data.options?.mode === 'route';
						this.mapService.enableClustering({
							...data.options,
							clusterIconFactory: isRouteMode ? (markerConfigs, animated) => ClusterIconFactory.createRouteIcon(markerConfigs, animated) : (markerConfigs, animated) => ClusterIconFactory.createIcon(markerConfigs, animated)
						});
						break;
					}
				case location_core.CheckinMapCommandType.DISABLE_CLUSTERING:
					this.mapService.disableClustering();
					break;
				case location_core.CheckinMapCommandType.UPDATE_CLUSTER_ICON:
					{
						const markerConfigs = data.markerIds.map(id => this.mapService.getMarkerConfig(id));
						let iconConfig = ClusterIconFactory.createIcon(markerConfigs, false);
						if (data.loading) {
							iconConfig = MarkerIconFactory.wrapWithLoader(iconConfig);
						}
						this.mapService.setClusterIcon(data.markerIds, iconConfig);
						break;
					}
				case location_core.CheckinMapCommandType.UPDATE_SETTINGS:
					this.mapService.updateSettings(data);
					break;
				case location_core.CheckinMapCommandType.SET_GRAYSCALE:
					this.mapService.setGrayscale(data.enabled);
					break;
				default:
					console.warn('Unknown command type:', eventType);
			}
		};

		/**
		 * Process marker config: convert type-based config to full icon config
		 */
		processMarkerConfig(config) {
			const markerIcon = this.prepareIconConfig(config?.markerIcon);
			const preparedConfig = {
				...config,
				markerIcon
			};
			if (!markerIcon) {
				return preparedConfig;
			}
			const {
				type,
				data
			} = markerIcon;
			if (type) {
				const iconData = data || {};
				const iconConfig = MarkerIconFactory.createIconByType(type, iconData);
				if (iconConfig) {
					return {
						...preparedConfig,
						avatarUrl: preparedConfig.avatarUrl ?? data?.avatarUrl ?? null,
						name: preparedConfig.name ?? data?.name ?? null,
						id: preparedConfig.id ?? data?.id ?? null,
						// Key and icon come from the same data, so the two cannot drift apart.
						markerIcon: {
							...iconConfig,
							iconKey: buildIconKey(type, iconData)
						}
					};
				}
				console.error('Failed to create icon config for type:', type);
			}
			return preparedConfig;
		}

		/**
		 * Process multiple markers
		 */
		processMarkers(markers) {
			if (!Array.isArray(markers)) {
				return markers;
			}
			return markers.map(marker => ({
				id: marker.id,
				config: this.processMarkerConfig(marker.config)
			}));
		}
		prepareMarkers(markers) {
			if (!Array.isArray(markers)) {
				return markers;
			}
			return markers.map(marker => ({
				...marker,
				config: this.processMarkerConfig(marker.config)
			}));
		}
		prepareIconConfig(markerIcon) {
			if (!markerIcon) {
				return markerIcon;
			}

			// iconKey is not part of the host contract: the engine reads it as "the same icon, leave the
			// node alone", and only this class knows what an icon was built from.
			const {
				iconKey,
				...hostIcon
			} = markerIcon;

			// If icon has a type, we'll generate html via MarkerIconFactory
			// So we should remove the html property to avoid confusion
			if (hostIcon.type) {
				const {
					html,
					...restIcon
				} = hostIcon;
				return restIcon;
			}

			// If no type specified, keep the icon as is (including html)
			return hostIcon;
		}
	}

	exports.CheckInMap = CheckInMap;
	exports.MarkerIconFactory = MarkerIconFactory;
	exports.MarkerType = MarkerType;
	exports.OFFICE_PLATE_MAX_FACES = OFFICE_PLATE_MAX_FACES;
	exports.PLATE_MIN_ZOOM = PLATE_MIN_ZOOM;

})(this.BX.Location.CheckIn = this.BX.Location.CheckIn || {}, BX.Location.Source, BX.Location.Core, BX.UI);
//# sourceMappingURL=check-in-map.bundle.js.map
