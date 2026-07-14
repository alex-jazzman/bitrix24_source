import { defineComponent, markRaw } from 'ui.vue3';
import { TagSelector } from 'ui.entity-selector';
import { HeadlineSm } from 'ui.system.typography.vue';
import { useFormState } from '../state';
import { loc } from '../utils/loc';

type SelectorDialog = {
	destroy(): void;
};

type OwnerItem = {
	getId(): string;
	setDeselectable(deselectable: boolean): void;
};

type OwnerItemSelectEvent = {
	getData(): {
		item: OwnerItem;
	};
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
export const MailboxOwnership = defineComponent({
	name: 'mailbox-ownership',

	components: { HeadlineSm },

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
		const selectorContainer = this.$refs.selectorContainer as Element | undefined;
		const preselected: Array<[string, string | number]> = this.state.access.ownerId
			? [['user', this.state.access.ownerId]]
			: [];

		// markRaw — see access-sharing.ts; selector internals use private class fields.
		this.selectorInstance = markRaw(new TagSelector({
			multiple: false,
			dialogOptions: {
				targetNode: selectorContainer as HTMLElement,
				popupOptions: {
					targetContainer: resolvePopupTargetContainer(selectorContainer),
				},
				context: 'MAIL_CHANGE_OWNER',
				preselectedItems: preselected,
				undeselectedItems: preselected,
				entities: [{ id: 'user', options: { intranetUsersOnly: true, emailUsers: false } }],
				events: {
					'Item:onSelect': (event: OwnerItemSelectEvent) => {
						const selectedItem = event.getData().item;
						const ownerId = parseInt(selectedItem.getId(), 10);
						this.state.access.ownerId = Number.isNaN(ownerId) ? null : ownerId;
						selectedItem.setDeselectable(false);
					},
				},
			},
		})) as OwnerSelectorInstance;
		this.selectorInstance.renderTo(this.$refs.selectorContainer as Element | undefined);
	},

	// language=Vue
	template: `
		<div class="mail-config-form__section" data-test-id="mail_config-form__owner-section">
			<div class="mail-config-form__section-header">
				<div class="mail_massconnect__integration-block_icon --mail"></div>
				<div class="mail-config-form__section-title-block">
					<HeadlineSm :accent="true">{{ loc('MAIL_CONFIG_FORM_OWNER_LABEL') }}</HeadlineSm>
				</div>
			</div>
			<div class="mail-config-form__section-content">
				<div ref="selectorContainer" data-test-id="mail_config-form__owner-selector"></div>
			</div>
		</div>
	`,
});
