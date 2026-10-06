/**
 * Pure predicate: tells whether the URL is a supported video-service URL.
 *
 * The `vk` service is honored only when vkVideoAvailable is true; every other
 * service is checked regardless of the flag. Matchers are the single source of
 * truth from BX.Landing.Utils.Matchers.
 *
 * @memberOf BX.Landing
 */
export function isSupportedVideoUrl(
	value: string,
	services: Array<string>,
	vkVideoAvailable: boolean,
): boolean
{
	const matchers = BX.Landing.Utils.Matchers;

	return services.some((service: string): boolean => {
		if (service === 'vk' && vkVideoAvailable !== true)
		{
			return false;
		}

		const matcher = matchers[service];

		return Boolean(matcher) && matcher.test(value);
	});
}
