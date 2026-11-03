import { Dom, Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Label, LabelSize, LabelStyle } from 'ui.system.label';
import { Text as TypographyText } from 'ui.system.typography';

import type { VersionFieldType } from '../types';
import { BaseField } from './base-field';

// Allowlist of the DTO-11 state codes: a code coming from the server only picks an entry here and
// never reaches the markup. A code missing from the list renders the dash and not an empty cell -
// an empty place reads as a broken render.
const STATE_MESSAGE_IDS: Map<string, string> = new Map([
	['upToDate', 'BIZPROC_AI_AGENTS_GRID_VERSION_UP_TO_DATE'],
	['upgradeAvailable', 'BIZPROC_AI_AGENTS_GRID_VERSION_UPGRADE_AVAILABLE'],
	['customized', 'BIZPROC_AI_AGENTS_GRID_VERSION_CUSTOMIZED'],
	['customizedUpgradeAvailable', 'BIZPROC_AI_AGENTS_GRID_VERSION_CUSTOMIZED_UPGRADE_AVAILABLE'],
	['undetermined', 'BIZPROC_AI_AGENTS_GRID_VERSION_UNDETERMINED'],
	['manualBuild', 'BIZPROC_AI_AGENTS_GRID_VERSION_MANUAL_BUILD'],
]);

// The states shown as plain text: each of them points at nothing the reader has to notice, so the
// label is left to the states that do.
const PLAIN_TEXT_STATES: Set<string> = new Set(['upToDate', 'undetermined', 'manualBuild']);

const NO_STATE = 'none';

const DASH = '\u2014';

const TEXT_CLASS = 'bizproc-ai-agents-grid-version-text';

// The short date the upgrade dialog shows.
const DATE_FORMAT = 'd.m.Y';

/**
 * Version cell of an AI-agents grid row (DTO-10). The two params are independent axes: a state is
 * shown as its own text, a date on its own is shown as a date, and neither leaves a dash.
 *
 * The cell is a pure function of its params and holds no state of its own, so a row repaint after
 * an upgrade costs nothing. It is also deliberately non-interactive: the column is visible to
 * users who may not upgrade at all, and an upgrade overwrites the owner's own edits.
 */
export class VersionField extends BaseField
{
	render(params: VersionFieldType): void
	{
		const state = this.#resolveState(params?.state);

		Dom.attr(this.getFieldNode(), {
			'data-test-id': 'bizproc-ai-agents-grid-version',
			'data-version-state': state ?? NO_STATE,
		});

		this.appendToFieldNode(this.#renderContent(state, params?.date));
	}

	/**
	 * A known state code or null: an unknown code carries nothing the cell can render, and the
	 * attribute must not report a state that is not shown.
	 */
	#resolveState(state: ?string): ?string
	{
		return Type.isStringFilled(state) && STATE_MESSAGE_IDS.has(state) ? state : null;
	}

	#renderContent(state: ?string, date: ?number): HTMLElement
	{
		if (state)
		{
			const text = Loc.getMessage(STATE_MESSAGE_IDS.get(state));

			// A phrase missing from the bundle comes back as an empty string, so the cell falls
			// back to the same dash an unknown code gets.
			if (!Type.isStringFilled(text))
			{
				return this.#renderText(DASH);
			}

			return PLAIN_TEXT_STATES.has(state) ? this.#renderText(text) : this.#renderLabel(text);
		}

		if (Type.isNumber(date) && date > 0)
		{
			return this.#renderText(DateTimeFormat.format(DATE_FORMAT, date));
		}

		return this.#renderText(DASH);
	}

	#renderText(text: string): HTMLElement
	{
		return TypographyText.render(
			text,
			{
				size: 'xs',
				tag: 'div',
				className: TEXT_CLASS,
			},
		);
	}

	#renderLabel(text: string): HTMLElement
	{
		const label = new Label({
			value: text,
			size: LabelSize.SM,
			style: LabelStyle.TINTED_NO_ACCENT,
		});

		return label.render();
	}
}
