export function isRealId(id: string | number): boolean
{
	return /^[1-9]\d*$/.test(String(id));
}
