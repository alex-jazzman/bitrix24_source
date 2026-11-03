import { Dom, Loc, Tag, Text } from 'main.core';

import 'ui.icon-set.actions';

import { ConditionGroup } from '../condition/condition-group';

export const ConditionViewMode = {
	Legacy: 'legacy',
	New: 'new',
};

const ICON_SIZE = 20;
// The plus of the add button is the `icon l` of the mockup, a size below the icons of the cards.
const ADD_ICON_SIZE = 18;

// The plus is the only glyph the extension takes from the outline set, and the set costs 128Kb of
// stylesheet on every page the extension is loaded on - the pages of the robots and of the debugger
// included, where the `new` view is never built. So it is drawn here instead, with the geometry of
// `ui/install/js/ui/icon-set/outline/dist/images/plus-l.svg` and `currentColor` in place of the
// baked-in fill: the glyph keeps following the colour of the caption and the theme along with it.
const ADD_ICON_PATH = 'M11.2998 18.3C11.2998 18.6866 11.6132 19 11.9998 19C12.3864 19 12.6998 18.6866 12.6998 18.3V12.6998H18.3C18.6866 12.6998 19 12.3864 19 11.9998C19 11.6132 18.6866 11.2998 18.3 11.2998H12.6998V5.7C12.6998 5.3134 12.3864 5 11.9998 5C11.6132 5 11.2998 5.3134 11.2998 5.7V11.2998H5.7C5.3134 11.2998 5 11.6132 5 11.9998C5 12.3864 5.3134 12.6998 5.7 12.6998H11.2998V18.3Z';

// The cross of a card is the `cross-20` of `ui.icon-set.actions` - the set the legacy view of this
// extension already draws its own cross from. It is written out here instead of being built by the
// `Icon` of `ui.icon-set.api.core`: that extension is 52Kb of JS on every page `bizproc.condition`
// is loaded on, the robots designer and the debugger included, where this view is never built. The
// markup is the one `Icon.render()` produces, so the glyph and the colour still come from the set:
// the icon is decorative and the accessible name stays on the control that carries it.
export function renderRemoveIcon(): HTMLElement
{
	const node = Tag.render`<div class="ui-icon-set --cross-20" aria-hidden="true"></div>`;
	Dom.style(node, '--ui-icon-set__icon-size', `${ICON_SIZE}px`);

	return node;
}

export function normalizeConditionViewMode(viewMode: ?string): string
{
	return viewMode === ConditionViewMode.New ? ConditionViewMode.New : ConditionViewMode.Legacy;
}

export class ConditionViewRenderer
{
	// The description of a joined card states the rule its switch applies, so it belongs to the
	// joiner and not to the card.
	getJoinerDescription(joiner: string): string
	{
		return Loc.getMessage(
			joiner === ConditionGroup.JOINER.Or
				? 'BIZPROC_JS_AUTOMATION_CONDITION_JOINER_DESCRIPTION_OR'
				: 'BIZPROC_JS_AUTOMATION_CONDITION_JOINER_DESCRIPTION_AND',
		);
	}

	// `Tag.render` appends an element substitution after the bare text of its tag, whatever their
	// order in the template, so the caption of the add button is an element of its own - that is
	// what keeps the plus in front of it.
	createGroupNode(conditionNodes: Array<HTMLElement>)
	{
		return Tag.render`
			<div class="bizproc-condition-group-list" data-testid="bp-condition-group">
				<div ref="draggableNode" class="bizproc-condition-group__items">${conditionNodes}</div>
				<button ref="addButton" type="button" class="bizproc-condition-group__add" data-testid="bp-condition-group-add">
					<svg class="bizproc-condition-group__add-icon" width="${ADD_ICON_SIZE}" height="${ADD_ICON_SIZE}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${ADD_ICON_PATH}" fill="currentColor"></path></svg>
					<span class="bizproc-condition-group__add-caption">
						${Text.encode(Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_TITLE'))}
					</span>
				</button>
			</div>
		`;
	}

	createRootGroupNode(conditionNode: HTMLElement)
	{
		return Tag.render`
			<div class="bizproc-condition-group ui-draggable--item" data-testid="bp-condition-group-card">
				<div class="bizproc-condition-group__header" data-testid="bp-condition-header">
					<span class="bizproc-condition-group__drag" aria-hidden="true" data-testid="bp-condition-group-drag"></span>
					<span class="bizproc-condition-group__badge" data-testid="bp-condition-group-badge">
						${Text.encode(Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_TITLE'))}
					</span>
					<span class="bizproc-condition-group__description" data-testid="bp-condition-group-description">
						${Text.encode(Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_DESCRIPTION'))}
					</span>
					<span class="bizproc-condition-group__header-action" data-role="condition-header-action"></span>
				</div>
				<div class="bizproc-condition-group__items">${conditionNode}</div>
			</div>
		`;
	}

	createNestedGroupNode(conditionNode: HTMLElement, joiner: string)
	{
		return Tag.render`
			<div class="bizproc-condition-group bizproc-condition-group--nested ui-draggable--item" data-testid="bp-condition-group-nested">
				<div class="bizproc-condition-group__header" data-testid="bp-condition-header">
					<span class="bizproc-condition-group__drag" aria-hidden="true" data-testid="bp-condition-group-drag"></span>
					<span class="bizproc-condition-group__joiner" data-role="condition-joiner">
						<button data-role="condition-joiner-and" data-testid="bp-condition-logic-and" type="button" aria-pressed="${joiner === ConditionGroup.JOINER.And ? 'true' : 'false'}" class="bizproc-condition-row__joiner-button ${joiner === ConditionGroup.JOINER.And ? '--active' : ''}">${Text.encode(Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_AND'))}</button>
						<button data-role="condition-joiner-or" data-testid="bp-condition-logic-or" type="button" aria-pressed="${joiner === ConditionGroup.JOINER.Or ? 'true' : 'false'}" class="bizproc-condition-row__joiner-button ${joiner === ConditionGroup.JOINER.Or ? '--active' : ''}">${Text.encode(Loc.getMessage('BIZPROC_AUTOMATION_ROBOT_CONDITION_OR'))}</button>
					</span>
					<span class="bizproc-condition-group__description" data-role="condition-joiner-description" data-testid="bp-condition-group-description">${Text.encode(this.getJoinerDescription(joiner))}</span>
					<span class="bizproc-condition-group__header-action" data-role="condition-header-action"></span>
				</div>
				<div class="bizproc-condition-group__items">${conditionNode}</div>
			</div>
		`;
	}
}
