import { Type } from 'main.core';

type StageEditorPopupPositionOptions = {
	anchorWidth: number | null,
	popupWidth: number | null,
	angleWidth: number | null,
	angleLeftOffset: unknown,
};

type StageEditorPopupPosition = {
	offsetLeft: number,
	angleOffset: number,
};

export function calculateStageEditorPopupPosition(
	options: StageEditorPopupPositionOptions,
): StageEditorPopupPosition | null
{
	if (
		!Type.isNumber(options.anchorWidth)
		|| !Type.isNumber(options.popupWidth)
		|| options.popupWidth <= 0
		|| !Type.isNumber(options.angleWidth)
		|| !Type.isNumber(options.angleLeftOffset)
	)
	{
		return null;
	}

	return {
		offsetLeft: options.angleLeftOffset + (options.anchorWidth - options.popupWidth) / 2,
		angleOffset: (options.popupWidth - options.angleWidth) / 2,
	};
}
