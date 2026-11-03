export const AvatarSize = Object.freeze({
	XXS: 'XXS',
	XS: 'XS',
	S: 'S',
	M: 'M',
	L: 'L',
	XL: 'XL',
	XXL: 'XXL',
	XXXL: 'XXXL',
});

export const AvatarSizeMap = Object.freeze({
	[AvatarSize.XXXL]: 94,
	[AvatarSize.XXL]: 60,
	[AvatarSize.XL]: 48,
	[AvatarSize.L]: 42,
	[AvatarSize.M]: 32,
	[AvatarSize.S]: 22,
	[AvatarSize.XS]: 18,
	[AvatarSize.XXS]: 14,
});

/**
 * Pixel sizes used when the Air design is enabled.
 * Overrides on top of `AvatarSizeMap`; the exported base map is intentionally left untouched
 * so legacy (flag-off) branches keep their original geometry.
 */
export const AvatarSizeMapAir = Object.freeze({
	[AvatarSize.L]: 44,
});

/**
 * Resolves the numeric avatar size for a given `AvatarSize` step.
 * When the Air design is enabled, Air-specific overrides take precedence.
 */
export function getAvatarPixelSize(size: string, isAirDesignEnabled: boolean = false): number
{
	if (isAirDesignEnabled && AvatarSizeMapAir[size])
	{
		return AvatarSizeMapAir[size];
	}

	return AvatarSizeMap[size];
}

export const ChatAvatarType = {
	selfChat: 'selfChat',
};

export const EmptyAvatarType = Object.freeze({
	default: 'default',
	squared: 'squared',
	collab: 'collab',
});
