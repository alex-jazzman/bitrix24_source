export function normalizeFileSize(bytes: mixed): string
{
	const value = Number(bytes);
	if (!Number.isFinite(value) || value < 1)
	{
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB'];
	const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
	const normalized = value / (1024 ** index);
	const rounded = normalized >= 10 || index === 0 ? Math.round(normalized) : Number(normalized.toFixed(1));

	return `${rounded} ${units[index]}`;
}
