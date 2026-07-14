import { defineComponent, markRaw } from 'ui.vue3';
import { Loc } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import { HeadlineSm } from 'ui.system.typography.vue';
import { BIcon, Set as IconSet } from 'ui.icon-set.api.vue';

import { useFormState } from '../state';
import {
	getAccessCodeBySelectorTag,
	getAccessUserOptions,
	getSelectorItemByAccessCode,
	type SelectorPreselectedItem,
	type SelectorTag,
} from '../utils/access-sharing';
import { loc } from '../utils/loc';

type SelectorDialog = {
	destroy(): void;
};

type AccessSelectorInstance = {
	renderTo(target: Element | null | undefined): void;
	getDialog(): SelectorDialog | null;
	getTags(): SelectorTag[];
	lock(): void;
	unlock(): void;
};

function resolvePopupTargetContainer(element: Element | null | undefined): HTMLElement
{
	return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
}

// @vue/component
export const AccessSharing = defineComponent({
	name: 'access-sharing',

	components: { HeadlineSm, BIcon },

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
			selectorInstance: null as AccessSelectorInstance | null,
			warningIconName: IconSet.WARNING,
		};
	},

	computed: {
		canEditAccess(): boolean
		{
			return Boolean(this.state.permissions.canEditAccess);
		},
		isLimitReached(): boolean
		{
			return Boolean(this.state.permissions.sharedMailboxLimitReached);
		},
		isSelectorLocked(): boolean
		{
			return !this.canEditAccess || this.isLimitReached;
		},
		limitTitleText(): string
		{
			return this.isLimitReached
				? (Loc.getMessage('MAIL_CONFIG_FORM_ACCESS_LIMIT_TITLE') ?? '')
				: '';
		},
		descriptionText(): string
		{
			if (!this.canEditAccess)
			{
				return Loc.getMessage('MAIL_CONFIG_FORM_ACCESS_OWNER_ONLY') ?? '';
			}

			if (this.isLimitReached)
			{
				const limit = Number(this.state.permissions.sharedMailboxLimit ?? 0);

				return Loc.getMessagePlural('MAIL_CONFIG_FORM_ACCESS_LIMIT_HINT', limit, {
					'#LIMIT#': String(limit),
				}) ?? '';
			}

			return Loc.getMessage('MAIL_CONFIG_FORM_ACCESS_DESCRIPTION') ?? '';
		},
		hintModifierClass(): string
		{
			return this.isLimitReached ? '--warning' : '';
		},
		showWarningIcon(): boolean
		{
			return this.isLimitReached;
		},
	},

	mounted(): void
	{
		const selectorContainer = this.$refs.selectorContainer as Element | undefined;

		// markRaw prevents Vue from wrapping the TagSelector in a reactive Proxy.
		// Inner Dialog/Popup use private class fields whose _assertClassBrand fails
		// through a Proxy ("Private element is not present on this object").
		const ownerId = this.state.access.ownerId;
		const undeselectedItems: SelectorPreselectedItem[] = ownerId
			? [['user', ownerId]]
			: [];
		const userOptions = getAccessUserOptions();

		this.selectorInstance = markRaw(new TagSelector({
			multiple: true,
			dialogOptions: {
				targetNode: selectorContainer as HTMLElement,
				popupOptions: {
					targetContainer: resolvePopupTargetContainer(selectorContainer),
				},
				context: 'MAIL_SHARE_ACCESS',
				preselectedItems: this.state.access.sharedWith
					.map((code: string) => getSelectorItemByAccessCode(code))
					.filter((item): item is SelectorPreselectedItem => item !== null),
				undeselectedItems,
				entities: [
					{
						id: 'user',
						dynamicLoad: true,
						dynamicSearch: true,
						options: userOptions,
					},
					{
						id: 'department',
						dynamicLoad: true,
						dynamicSearch: true,
						options: {
							selectMode: 'usersAndDepartments',
							allowSelectRootDepartment: true,
							allowFlatDepartments: true,
							userOptions,
						},
					},
				],
			},
			events: {
				onAfterTagAdd: () => this.updateAccess(),
				onAfterTagRemove: () => this.updateAccess(),
			},
		})) as AccessSelectorInstance;
		this.selectorInstance.renderTo(this.$refs.selectorContainer as Element | undefined);

		this.applyLockState();
	},

	watch: {
		isSelectorLocked(): void
		{
			this.applyLockState();
		},
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

	methods: {
		updateAccess(): void
		{
			if (!this.selectorInstance)
			{
				return;
			}

			this.state.access.sharedWith = this.selectorInstance.getTags()
				.map((tag) => getAccessCodeBySelectorTag(tag))
				.filter((code): code is string => code !== null);
		},

		applyLockState(): void
		{
			if (!this.selectorInstance)
			{
				return;
			}

			this.$nextTick(() => {
				if (!this.selectorInstance)
				{
					return;
				}

				if (this.isSelectorLocked)
				{
					this.selectorInstance.lock();
				}
				else
				{
					this.selectorInstance.unlock();
				}
			});
		},
	},

	// language=Vue
	template: `
		<div class="mail-config-form__section" data-test-id="mail_config-form__access-section">
			<div class="mail-config-form__section-header">
				<div class="mail_massconnect__integration-block_icon --access"></div>
				<div class="mail-config-form__section-title-block">
					<HeadlineSm>{{ loc('MAIL_CONFIG_FORM_ACCESS_LABEL') }}</HeadlineSm>
				</div>
			</div>
			<div class="mail-config-form__section-content">
				<div
					class="mail-config-form__alert-container"
					:class="hintModifierClass"
					data-test-id="mail_config-form__access-hint"
				>
					<BIcon
						v-if="showWarningIcon"
						class="mail-config-form__alert-icon"
						:name="warningIconName"
						:size="20"
					/>
					<div class="mail-config-form__alert-body">
						<HeadlineSm v-if="limitTitleText" class="mail-config-form__alert-title">{{ limitTitleText }}</HeadlineSm>
						<span class="mail-config-form__alert-message" style="white-space: pre-line">{{ descriptionText }}</span>
					</div>
				</div>
				<div
					class="mail-config-form__selector-wrapper"
					:class="{ '--locked': isSelectorLocked }"
					data-test-id="mail_config-form__access-selector"
				>
					<div ref="selectorContainer"></div>
				</div>
			</div>
		</div>
	`,
});
