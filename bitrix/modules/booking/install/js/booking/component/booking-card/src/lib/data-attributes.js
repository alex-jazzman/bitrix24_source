import type { EntityDataAttribute } from 'booking.const';

type DataAttributesParams = {
	id: number | string,
	kind: $Values<typeof EntityDataAttribute>,
	element: string,
};

export function buildBookingCardDataAttributes(params: DataAttributesParams): {[key: string]: string | number}
{
	return {
		'data-id': params.id,
		'data-kind': params.kind,
		'data-element': params.element,
	};
}
