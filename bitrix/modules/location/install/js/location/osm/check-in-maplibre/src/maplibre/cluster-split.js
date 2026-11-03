function projectAtZoom(latLng, zoom)
{
	const [lat, lng] = latLng;
	const scale = 512 * (2 ** zoom);
	const x = (lng + 180) / 360 * scale;
	const sinLat = Math.sin((lat * Math.PI) / 180);
	const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;

	return { x, y };
}

export function clusterWouldSplitAtZoom(latLngs, zoom, maxRadius)
{
	if (!Array.isArray(latLngs) || latLngs.length <= 1)
	{
		return false;
	}

	const seed = projectAtZoom(latLngs[0], zoom);

	return latLngs.slice(1).some((latLng) => {
		const point = projectAtZoom(latLng, zoom);

		return Math.hypot(point.x - seed.x, point.y - seed.y) > maxRadius;
	});
}
