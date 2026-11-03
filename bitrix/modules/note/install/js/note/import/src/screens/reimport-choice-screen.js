import { Dom, Loc, Tag, Text } from 'main.core';
import { Alert, AlertDesign } from 'ui.system.alert';
import { RadioButton, RadioButtonSize } from 'ui.system.radiobutton';
import { canUpdateExistingCollections, REIMPORT_ACTION } from '../constants';
import { renderCollectionCard } from './parts/collection-card';
import type { ReimportAction, ReimportChoiceScreenState } from '../type';

export type ReimportChoiceScreenHandlers = {
	onActionChange: (action: ReimportAction) => void,
	onToggleCollectionExpanded: (collectionId: string) => void,
	onRetryTreeLoad: (collectionId: string) => void,
	sourceType?: string,
};

const ACTION_GROUP = 'note-import-reimport-action';

const ACTION_OPTIONS = [
	{
		action: REIMPORT_ACTION.UPDATE,
		testId: 'note-import-reimport-update',
		titleCode: 'NOTE_IMPORT_REIMPORT_ACTION_UPDATE',
		captionCode: 'NOTE_IMPORT_REIMPORT_ACTION_UPDATE_HINT',
	},
	{
		action: REIMPORT_ACTION.CREATE,
		testId: 'note-import-reimport-create',
		titleCode: 'NOTE_IMPORT_REIMPORT_ACTION_CREATE',
		captionCode: 'NOTE_IMPORT_REIMPORT_ACTION_CREATE_HINT',
	},
];

export function renderReimportChoiceScreen(
	state: ReimportChoiceScreenState,
	handlers: ReimportChoiceScreenHandlers,
): HTMLElement
{
	const container = Tag.render`<div class="note-import-screen note-import-screen-reimport-choice"></div>`;
	const canUpdate = canUpdateExistingCollections(state.collections);
	const count = state.collections.length;

	container.append(renderAlert(
		Loc.getMessagePlural('NOTE_IMPORT_REIMPORT_NOTICE', count),
		AlertDesign.tintedWarning,
		'note-import-reimport-notice',
	));

	const list = Tag.render`<div class="note-import-collection-list"></div>`;
	for (const collection of state.collections)
	{
		list.append(renderCollectionCard(
			{ id: collection.externalId, name: collection.name },
			state,
			handlers,
			{ hasCheckbox: false },
		));
	}
	container.append(list);

	// The options answer one question, and a screen reader has no other way to learn which one.
	const options = Tag.render`<div class="note-import-reimport-option-list" role="radiogroup"></div>`;
	Dom.attr(options, 'aria-label', Loc.getMessage('NOTE_IMPORT_REIMPORT_GROUP_ARIA'));
	const radios: Map<ReimportAction, RadioButton> = new Map();
	for (const option of ACTION_OPTIONS)
	{
		if (option.action === REIMPORT_ACTION.UPDATE && !canUpdate)
		{
			continue;
		}

		options.append(renderOption(option, state.action, count, radios, handlers.onActionChange));
	}
	container.append(options);

	if (!canUpdate)
	{
		container.append(renderAlert(
			Loc.getMessagePlural('NOTE_IMPORT_REIMPORT_NO_MODERATE', count),
			AlertDesign.tintedWarning,
			'note-import-reimport-forbidden',
		));
	}

	if (state.errorMessage !== '')
	{
		container.append(renderAlert(
			state.errorMessage,
			AlertDesign.tintedAlert,
			'note-import-reimport-error',
		));
	}

	return container;
}

function renderOption(
	option: { action: ReimportAction, testId: string, titleCode: string, captionCode: string },
	currentAction: ReimportAction,
	count: number,
	radios: Map<ReimportAction, RadioButton>,
	onActionChange: (action: ReimportAction) => void,
): HTMLElement
{
	const inputId = `${ACTION_GROUP}-${option.action}`;
	const hintId = `${inputId}-hint`;
	const radio = new RadioButton({
		group: ACTION_GROUP,
		size: RadioButtonSize.Md,
		checked: option.action === currentAction,
		attributes: {
			id: inputId,
			// The hint describes the option, it is not part of its name: inside the label it would
			// be read as one long name of the radio instead of the consequence it explains.
			'aria-describedby': hintId,
			'data-testid': option.testId,
		},
		onChange: () => {
			// A native group of radios sends `change` to the newly picked input only, and each
			// radio draws its own mark, so the one left behind is unmarked by hand: the screen is
			// deliberately not redrawn on a pick, and `setChecked` leaves focus where it stands.
			radios.forEach((item, action) => item.setChecked(action === option.action));
			onActionChange(option.action);
		},
	});
	radios.set(option.action, radio);

	const row = Tag.render`
		<div class="note-import-reimport-option">
			<div class="note-import-reimport-option__text">
				<label class="note-import-reimport-option__title" for="${inputId}">
					${Text.encode(Loc.getMessagePlural(option.titleCode, count))}
				</label>
				<div class="note-import-subtitle" id="${hintId}">
					${Text.encode(Loc.getMessagePlural(option.captionCode, count))}
				</div>
			</div>
		</div>
	`;
	row.prepend(radio.render());

	return row;
}

function renderAlert(text: string, design: string, testId: string): HTMLElement
{
	const alert = new Alert({ design, content: text }).render();
	alert.dataset.testid = testId;

	return alert;
}
