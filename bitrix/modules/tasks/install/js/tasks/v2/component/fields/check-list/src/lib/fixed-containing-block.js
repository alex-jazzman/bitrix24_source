import { Dom } from 'main.core';

const ProbeStyle = {
	all: 'initial',
	position: 'fixed',
	top: '0',
	left: '0',
	width: '0',
	height: '0',
};

export function getFixedContainingBlockOffset(element: HTMLElement): { x: number, y: number }
{
	const probe = Dom.create('div', { style: ProbeStyle });

	Dom.append(probe, element);
	const { left, top } = probe.getBoundingClientRect();
	Dom.remove(probe);

	return { x: -left, y: -top };
}
