import { getAvatar } from './avatar-helper';

const AVATAR_LAYOUTS = [
	[], // 0
	[{ left: 27, top: 27 }], // 1 – centered
	[ // 2 – SW→NE diagonal; top-right (NE) rendered last → on top
		{ left: 15, top: 38 },
		{ left: 39, top: 14 },
	],
	[ // 3 – equilateral triangle; top vertex first, bottom row last (higher z-index)
		{ left: 27, top: 8 },
		{ left: 10, top: 38 },
		{ left: 44, top: 38 },
	],
	[ // 4 – diamond (r = 20); top, right, left, bottom rendered last → on top
		{ left: 27, top: 7 },
		{ left: 47, top: 27 },
		{ left: 6, top: 27 },
		{ left: 27, top: 47 },
	],
	[ // 5 – pentagon ring (r = 20); bottom vertex rendered last → on top
		{ left: 38, top: 10 },
		{ left: 15, top: 10 },
		{ left: 46, top: 33 },
		{ left: 7, top: 33 },
		{ left: 27, top: 46 },
	],
	[ // 6 – hexagon ring (r = 24); sorted top→bottom, bottom rendered last → on top
		{ left: 27, top: 3 },
		{ left: 47, top: 15 },
		{ left: 6, top: 15 },
		{ left: 47, top: 39 },
		{ left: 6, top: 39 },
		{ left: 27, top: 51 },
	],
	[ // 7 – hexagon ring (r = 24) + center; ring sorted top→bottom, center rendered last → on top
		{ left: 27, top: 3 },
		{ left: 47, top: 15 },
		{ left: 6, top: 15 },
		{ left: 47, top: 39 },
		{ left: 6, top: 39 },
		{ left: 27, top: 51 },
		{ left: 27, top: 27 }, // center – rendered last → on top
	],
	[ // 8 – octagon ring (r = 25); sorted top→bottom, bottom rendered last → on top
		{ left: 27, top: 2 },
		{ left: 44, top: 9 },
		{ left: 9, top: 9 },
		{ left: 52, top: 27 },
		{ left: 2, top: 27 },
		{ left: 44, top: 44 },
		{ left: 9, top: 44 },
		{ left: 27, top: 52 },
	],
];

// 9+ clusters: 7 avatars in a heptagon ring (r = 26, ~31% overlap) + overflow counter in the center.
// Outer ring sorted top→bottom so the lowest avatars are rendered last → appear on top.
const CLUSTER_OVERFLOW_LAYOUT = [
	{ left: 27, top: 1 },
	{ left: 47, top: 10 },
	{ left: 6, top: 10 },
	{ left: 52, top: 32 },
	{ left: 1, top: 32 },
	{ left: 38, top: 50 },
	{ left: 15, top: 50 },
	{ left: 27, top: 27 }, // center – rendered as overflow counter (always last)
];

// Base avatar size used for layout calculations
const BASE_AVATAR_SIZE = 32;

/**
 * Returns avatar size in pixels based on cluster marker count.
 * @param {number} count - Number of markers in the cluster
 * @returns {number}
 */
function getAvatarSize(count)
{
	if (count <= 2)
	{
		return 42;
	}

	if (count <= 4)
	{
		return 38;
	}

	if (count <= 5)
	{
		return 36;
	}

	return 32; // 6+ markers
}

export class ClusterIconFactory
{
	/**
	 * @param {Array<object|null>} markerConfigs - marker config objects passed from CheckInMapService
	 * @param {boolean} animated
	 * @returns {{ html: string, className: string, iconSize: number[], iconAnchor: number[] }}
	 */
	static createRouteIcon(markerConfigs, animated = true)
	{
		const count = markerConfigs.length;
		const label = count > 99 ? '99+' : String(count);
		const animateClass = animated ? ' map-route-cluster-animate' : '';

		return {
			html: `<div class="map-route-cluster-icon${animateClass}"><span class="map-route-cluster-count">${label}</span></div>`,
			className: 'map-route-cluster-marker',
			iconSize: [40, 40],
			iconAnchor: [20, 20],
		};
	}

	static createIcon(markerConfigs, animated = true)
	{
		const count = markerConfigs.length;
		const avatarUrls = markerConfigs.map((config) => config?.avatarUrl ?? null);
		const names = markerConfigs.map((config) => config?.name ?? '');
		const ids = markerConfigs.map((config) => config?.id ?? 0);

		// Determine avatar size based on count
		const avatarSize = getAvatarSize(count);
		// Offset to center avatars of different sizes (layouts are calculated for 32px)
		const sizeOffset = (BASE_AVATAR_SIZE - avatarSize) / 2;

		let layout = null;
		let showCounter = false;
		let counterValue = 0;

		if (count <= 8)
		{
			layout = AVATAR_LAYOUTS[count] ?? AVATAR_LAYOUTS[6].slice(0, count);
		}
		else
		{
			// 9+ avatars: 7 visible in a ring, overflow counter in the center
			layout = CLUSTER_OVERFLOW_LAYOUT;
			showCounter = true;
			counterValue = count - 7;
		}

		const animateClass = animated ? ' map-cluster-animate' : '';
		let html = `<div class="map-cluster-icon${animateClass}">`;

		const avatarSlots = showCounter ? layout.length - 1 : layout.length;
		for (let i = 0; i < avatarSlots; i++)
		{
			const { left, top } = layout[i];
			const adjustedLeft = left + sizeOffset;
			const adjustedTop = top + sizeOffset;
			const inner = getAvatar(avatarUrls[i], names[i], ids[i], avatarSize);
			html += `<div class="map-cluster-avatar" style="left:${adjustedLeft}px;top:${adjustedTop}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${i + 1};">${inner}</div>`;
		}

		if (showCounter)
		{
			const { left, top } = layout[layout.length - 1];
			const adjustedLeft = left + sizeOffset;
			const adjustedTop = top + sizeOffset;
			html += `<div class="map-cluster-avatar map-cluster-avatar--counter" style="left:${adjustedLeft}px;top:${adjustedTop}px;width:${avatarSize}px;height:${avatarSize}px;z-index:${avatarSlots + 1};"><span>+${counterValue}</span></div>`;
		}

		html += '</div>';

		return {
			html,
			className: 'map-cluster-marker',
			iconSize: [85, 85],
			iconAnchor: [42, 42],
		};
	}
}
