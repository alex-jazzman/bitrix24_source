import { defineComponent, markRaw } from 'ui.vue3';
import { TagSelector } from 'ui.entity-selector';

import { useFormState } from '../state';
import { loc } from '../utils/loc';

type SelectorDialog = {
	destroy(): void;
};

type OwnerSelectorInstance = {
	renderTo(target: Element | null | undefined): void;
	getDialog(): SelectorDialog | null;
};

function resolvePopupTargetContainer(element: Element | null | undefined): HTMLElement
{
	return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
}

// @vue/component
export const ConnectionRequestOwner = defineComponent({
	name: 'connection-request-owner',

	setup()
	{
		return {
			state: useFormState(),
			loc,
		};
	},

	data()
	{
		return {
			selectorInstance: null as OwnerSelectorInstance | null,
		};
	},

	beforeUnmount(): void
	{
		if (this.selectorInstance)
		{
			const dialog = this.selectorInstance.getDialog();
			if (dialog)
			{
				dialog.destroy();
			}
		}
	},

	mounted(): void
	{
		const requesterId = this.state.access.ownerId;
		if (!requesterId)
		{
			return;
		}

		const selectorContainer = this.$refs.selectorContainer as Element | undefined;
		const preselected: Array<[string, string | number]> = [['user', requesterId]];

		// markRaw — selector internals use private class fields that fail through a Vue proxy.
		// Lock the requester: preselectedItems == undeselectedItems mirrors the legacy wizard
		// behaviour where the admin cannot pick a different target user when completing a request.
		this.selectorInstance = markRaw(new TagSelector({
			multiple: false,
			showAddButton: false,
			dialogOptions: {
				targetNode: selectorContainer as HTMLElement,
				popupOptions: {
					targetContainer: resolvePopupTargetContainer(selectorContainer),
				},
				context: 'MAIL_CLIENT_CONFIG_CONNECTION_REQUEST_OWNER',
				preselectedItems: preselected,
				undeselectedItems: preselected,
				entities: [{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						intranetUsersOnly: true,
						emailUsers: false,
					},
				}],
			},
		})) as OwnerSelectorInstance;
		this.selectorInstance.renderTo(selectorContainer);
	},

	// language=Vue
	template: `
		<div
			class="mail-config-form__owner-inline-field"
			data-test-id="mail_config-form__connection-request-owner"
		>
			<label class="mail-config-form__owner-inline-label">
				{{ loc('MAIL_CONFIG_FORM_CONNECTION_REQUEST_OWNER_LABEL') }}
			</label>
			<div
				class="mail-config-form__selector-wrapper --locked"
				data-test-id="mail_config-form__connection-request-owner-selector"
			>
				<div ref="selectorContainer"></div>
			</div>
		</div>
	`,
});
