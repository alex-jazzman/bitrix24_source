import { delayMap } from '../const';

export function getAutoDeleteStatusText(hours: number): string
{
	return delayMap[hours] ?? '';
}
