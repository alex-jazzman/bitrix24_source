export const PanelType = Object.freeze({
	None: 'none',
	Text: 'text',
	Entity: 'entity',
});

export const PanelOpenSource = Object.freeze({
	Pointer: 'pointer',
	Keyboard: 'keyboard',
	Programmatic: 'programmatic',
});

export type PanelTypeValue = 'none' | 'text' | 'entity';
export type PanelOpenSourceValue = 'pointer' | 'keyboard' | 'programmatic';

export type PanelState = {
	activePanel: PanelTypeValue,
	openSource: ?PanelOpenSourceValue,
	textItemId: number | string | null,
	entityItemId: number | string | null,
	entityAnchor: ?HTMLElement,
	returnFocusElement: ?HTMLElement,
	pointerInside: boolean,
	focusInside: boolean,
	popupOpen: boolean,
	participantSelectorOpen: boolean,
};

export function createPanelState(): PanelState
{
	return {
		activePanel: PanelType.None,
		openSource: null,
		textItemId: null,
		entityItemId: null,
		entityAnchor: null,
		returnFocusElement: null,
		pointerInside: false,
		focusInside: false,
		popupOpen: false,
		participantSelectorOpen: false,
	};
}

export function getActiveItemId(state: PanelState): number | string | null
{
	return state.activePanel === PanelType.Text ? state.textItemId : state.entityItemId;
}

export function openTextPanel(
	_state: PanelState,
	itemId: number | string,
	source: PanelOpenSourceValue,
	returnFocusElement: ?HTMLElement = null,
): PanelState
{
	return {
		...createPanelState(),
		activePanel: PanelType.Text,
		openSource: source,
		textItemId: itemId,
		returnFocusElement,
	};
}

export function openEntityPanel(
	state: PanelState,
	itemId: number | string,
	source: PanelOpenSourceValue,
	anchor: ?HTMLElement = null,
	returnFocusElement: ?HTMLElement = null,
): PanelState
{
	if (
		source === PanelOpenSource.Pointer
		&& state.activePanel === PanelType.Entity
		&& state.openSource !== PanelOpenSource.Pointer
	)
	{
		return state;
	}

	if (source === PanelOpenSource.Pointer && state.activePanel === PanelType.Text)
	{
		if (String(state.textItemId) === String(itemId))
		{
			return closeEntityPanel(state);
		}

		return {
			...state,
			entityItemId: itemId,
			entityAnchor: anchor,
			pointerInside: true,
		};
	}

	return {
		...createPanelState(),
		activePanel: PanelType.Entity,
		openSource: source,
		entityItemId: itemId,
		entityAnchor: anchor,
		returnFocusElement,
		pointerInside: source === PanelOpenSource.Pointer,
	};
}

export function closeEntityPanel(state: PanelState): PanelState
{
	if (state.entityItemId === null)
	{
		return state;
	}

	if (state.activePanel === PanelType.Entity)
	{
		return createPanelState();
	}

	return {
		...state,
		entityItemId: null,
		entityAnchor: null,
		pointerInside: false,
	};
}

export function closePanel(state: PanelState): PanelState
{
	return createPanelState();
}

export function setPanelHold(
	state: PanelState,
	hold: 'pointerInside' | 'focusInside' | 'popupOpen' | 'participantSelectorOpen',
	value: boolean,
): PanelState
{
	if (state[hold] === value)
	{
		return state;
	}

	return { ...state, [hold]: value };
}

export function shouldClosePointerPanel(state: PanelState): boolean
{
	return (
		state.entityItemId !== null
		&& (
			state.activePanel === PanelType.Text
			|| state.openSource === PanelOpenSource.Pointer
		)
		&& !state.pointerInside
		&& !state.focusInside
		&& !state.popupOpen
		&& !state.participantSelectorOpen
	);
}

export function closePanelForMissingAnchor(state: PanelState, itemId: number | string): PanelState
{
	if (state.entityItemId === itemId)
	{
		return closeEntityPanel(state);
	}

	return getActiveItemId(state) === itemId ? closePanel(state) : state;
}
