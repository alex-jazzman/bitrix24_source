// The dragged edge is snapped first, the opposite edge keeps its place; the minimum size
// wins over the grid node.
export function getSizeByEndEdge(endEdge: number, fixedStart: number, minSize: number): number
{
	return Math.max(endEdge - fixedStart, minSize);
}

export function getBoundsByStartEdge(
	startEdge: number,
	fixedEnd: number,
	minSize: number,
): { position: number, size: number }
{
	const size = fixedEnd - startEdge;

	return size < minSize
		? { position: fixedEnd - minSize, size: minSize }
		: { position: startEdge, size };
}
