import { Text } from 'main.core';
import { Popup } from 'main.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';
import { getConditionFieldUnresolvedHint } from '../../utils';

import './style.css';

const HINT_WIDTH = 320;
const ICON_SIZE = 18;

let popupIdCounter = 0;

/**
 * A warning next to a caption that stayed technical: the reference of the field is broken for good. The
 * explanation opens on a click and is repeated in `title`, so it is available on hover as well. The
 * click stops here: in the editor of the condition it would open the dialog of the field, in the
 * preview card — the editor of the constructions.
 */
// @vue/component
export const UnresolvedFieldHint = {
	name: 'UnresolvedFieldHint',
	components: { BIcon },
	props:
	{
		unresolved:
		{
			type: String,
			default: null,
		},
		fieldTitle:
		{
			type: String,
			default: '',
		},
		testId:
		{
			type: String,
			required: true,
		},
	},
	setup(): { getMessage: () => string; iconSet: Outline; iconSize: number; popupId: string }
	{
		const { getMessage } = useLoc();
		popupIdCounter++;

		return {
			getMessage,
			iconSet: Outline,
			iconSize: ICON_SIZE,
			// `aria-controls` needs the id before the popover exists: one id per component instance.
			popupId: `editor-chart-unresolved-field-hint-popup-${popupIdCounter}`,
		};
	},
	data(): Object
	{
		// Mirrors the non-reactive popover instance: the template needs a reactive open state.
		return { isHintShown: false };
	},
	computed:
	{
		// No text — no icon: a warning the user cannot read explains nothing.
		hint(): string
		{
			return getConditionFieldUnresolvedHint(this.unresolved);
		},
		// Names the field the warning belongs to: a card holds one icon per construction, and without
		// the caption they all share a single accessible name.
		ariaLabel(): string
		{
			if (!this.fieldTitle)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_ARIA_LABEL');
			}

			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_NAMED_ARIA_LABEL', {
				'#FIELD#': this.fieldTitle,
			});
		},
	},
	watch:
	{
		/**
		 * The popover lives in the body of the document while only the button is under a `v-if`, so the
		 * component stays mounted once the reason is gone and beforeUnmount() never comes. Without this
		 * the hint would hang on screen bound to an anchor already detached — or keep explaining a reason
		 * that has changed since it was opened.
		 */
		hint(): void
		{
			this.closeHint();
		},
	},
	created(): void
	{
		// The popover is a class instance: reactive state would proxy it and break its private fields
		// on destroy.
		this.popup = null;
	},
	beforeUnmount(): void
	{
		this.closeHint();
	},
	methods:
	{
		onShowHint(event: MouseEvent): void
		{
			if (this.popup)
			{
				this.closeHint();

				return;
			}

			const anchor = event.currentTarget;
			this.popup = new Popup({
				id: this.popupId,
				bindElement: anchor,
				content: Text.encode(this.hint),
				width: HINT_WIDTH,
				darkMode: true,
				angle: true,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				// `main.popup` gives the container `role="dialog"`, and a dialog needs a name of its own:
				// the reason itself already comes to the screen reader from the content.
				ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_FIELD_UNRESOLVED_POPUP_ARIA_LABEL'),
				// A click on the icon has to toggle the hint: auto-hide would close it before this handler
				// runs, and the reopen right after would look like the icon does nothing. A click inside
				// the hint keeps it open, just as the standard check this handler replaces does.
				autoHideHandler: (autoHideEvent: MouseEvent): boolean => {
					const target = autoHideEvent.target;

					return !anchor.contains(target) && !this.popup?.getPopupContainer().contains(target);
				},
				events: {
					onPopupClose: (): void => this.closeHint(),
				},
			});
			this.popup.show();
			this.isHintShown = true;
		},
		// Every way out of the popover comes here: the repeated click, Esc, an outer click and unmount.
		closeHint(): void
		{
			const popup = this.popup;
			this.popup = null;
			this.isHintShown = false;
			popup?.destroy();
		},
	},
	template: `
		<button
			v-if="hint"
			type="button"
			class="editor-chart-unresolved-field-hint"
			:title="hint"
			:aria-label="ariaLabel"
			:aria-expanded="isHintShown ? 'true' : 'false'"
			:aria-controls="isHintShown ? popupId : null"
			:data-test-id="testId"
			@click.stop="onShowHint"
		>
			<BIcon :name="iconSet.ALERT_ACCENT" :size="iconSize" aria-hidden="true"/>
		</button>
	`,
};
