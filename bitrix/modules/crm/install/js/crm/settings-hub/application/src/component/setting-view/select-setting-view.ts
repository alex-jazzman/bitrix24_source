import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { CrmSettingsHubSettingField } from '../setting-field/setting-field';
import { CrmSettingsHubSettingRow } from '../setting-row/setting-row';
import {
	type RuntimeSettingState,
	type RuntimeSettingsStateContext,
	useSettingsStateContext,
} from '../../context/settings-state';
import { type SettingOption } from '../../infrastructure/service/settings/types';
import { type SettingId } from '../../model/types';

type SelectSettingViewSetup = {
	Outline: typeof Outline,
	settingsStateContext: RuntimeSettingsStateContext,
};

export const CrmSettingsHubSelectSettingView = defineComponent({
	name: 'CrmSettingsHubSelectSettingView',
	components: {
		BIcon,
		CrmSettingsHubSettingField,
		CrmSettingsHubSettingRow,
		Popup,
	},
	mixins: [locMixin],
	props: {
		settingId: {
			type: String as PropType<SettingId>,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
	},
	setup(): SelectSettingViewSetup
	{
		return { Outline, settingsStateContext: useSettingsStateContext() };
	},
	data(): { open: boolean, activeOptionIndex: number }
	{
		return { open: false, activeOptionIndex: 0 };
	},
	computed: {
		state(): RuntimeSettingState
		{
			return this.settingsStateContext.get(this.settingId);
		},
		displayTitle(): string
		{
			return this.title === '' ? (this.state.title ?? '') : this.title;
		},
		displayDescription(): string
		{
			return this.description === '' ? (this.state.hint ?? '') : this.description;
		},
		displayValue(): string
		{
			return this.state.label ?? '';
		},
		placeholder(): string
		{
			return this.loc('CRM_SETTINGS_HUB_VALUE_EMPTY');
		},
		titleId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-title`;
		},
		popupId(): string
		{
			return `crm-settings-hub-application-setting-${this.settingId}-select-popup`;
		},
		options(): readonly SettingOption[]
		{
			return this.state.schema?.type === 'select' ? this.state.schema.options : [];
		},
		isDisabled(): boolean
		{
			return this.state.canEdit !== true || this.settingsStateContext.isPending(this.settingId);
		},
		selectedOptionIndex(): number
		{
			const selectedIndex = this.options.findIndex((option) => option.value === this.state.raw);

			return selectedIndex === -1 ? 0 : selectedIndex;
		},
		popupOptions(): Object
		{
			return {
				id: this.popupId,
				ariaLabelledBy: this.titleId,
				bindElement: this.$refs.selectAnchor ?? window,
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
				padding: 0,
			};
		},
	},
	watch: {
		isDisabled(disabled: boolean): void
		{
			if (disabled)
			{
				this.closePopup(false);
			}
		},
	},
	methods: {
		openPopup(): void
		{
			if (this.isDisabled || this.open)
			{
				return;
			}

			this.activeOptionIndex = this.selectedOptionIndex;
			this.open = true;
			this.$nextTick(() => this.focusOption(this.activeOptionIndex));
		},
		closePopup(restoreFocus: boolean = true): void
		{
			if (!this.open)
			{
				return;
			}

			this.open = false;
			if (restoreFocus)
			{
				this.$nextTick(() => (this.$refs.selectTrigger as HTMLButtonElement | undefined)?.focus());
			}
		},
		focusOption(index: number): void
		{
			const optionButtons = this.$refs.optionButtons as HTMLButtonElement[] | undefined;
			optionButtons?.[index]?.focus();
		},
		handleOptionKeydown(event: KeyboardEvent, index: number): void
		{
			const lastIndex = this.options.length - 1;
			let nextIndex = index;

			switch (event.key)
			{
				case 'ArrowDown':
					nextIndex = index === lastIndex ? 0 : index + 1;
					break;
				case 'ArrowUp':
					nextIndex = index === 0 ? lastIndex : index - 1;
					break;
				case 'Home':
					nextIndex = 0;
					break;
				case 'End':
					nextIndex = lastIndex;
					break;
				default:
					return;
			}

			event.preventDefault();
			this.activeOptionIndex = nextIndex;
			this.$nextTick(() => this.focusOption(nextIndex));
		},
		selectOption(option: SettingOption): void
		{
			if (this.isDisabled)
			{
				return;
			}

			this.closePopup();
			void this.settingsStateContext.update(this.settingId, option.value);
		},
	},
	template: `
		<CrmSettingsHubSettingRow :action="null">
			<CrmSettingsHubSettingField
				:title="displayTitle"
				:title-id="titleId"
				:description="displayDescription"
				:unavailable="state.canEdit === false"
			>
				<template #value>
					<div
						ref="selectAnchor"
						class="crm-settings-hub-application__setting-field-value"
					>
						<div
							class="ui-system-input --l --stretched --dropdown crm-settings-hub-application__select"
							:class="{ '--disabled': isDisabled, '--active': open }"
						>
							<button
								ref="selectTrigger"
								type="button"
								class="ui-system-input-container crm-settings-hub-application__select-trigger"
								:data-testid="'crm-settings-hub-application-setting-' + settingId + '-select'"
								:aria-expanded="open"
								:aria-labelledby="titleId"
								:aria-controls="popupId"
								aria-haspopup="listbox"
								:disabled="isDisabled"
								@click.stop="openPopup"
								@keydown.enter.stop.prevent="openPopup"
								@keydown.space.stop.prevent="openPopup"
							>
								<span
									class="ui-system-input-value crm-settings-hub-application__select-value"
									:class="{ '--placeholder': !displayValue }"
								>
									{{ displayValue || placeholder }}
								</span>
								<BIcon class="ui-system-input-dropdown" :name="Outline.CHEVRON_DOWN_L"/>
							</button>
						</div>
						<Popup
							v-if="open"
							:id="popupId"
							:options="popupOptions"
							@close="closePopup"
						>
							<div
								class="crm-settings-hub-application__select-options"
								role="listbox"
								:aria-labelledby="titleId"
							>
								<button
									v-for="(option, index) in options"
									:key="index"
									ref="optionButtons"
									type="button"
									class="crm-settings-hub-application__select-option"
									role="option"
									:aria-selected="option.value === state.raw"
									:tabindex="activeOptionIndex === index ? 0 : -1"
									:data-testid="popupId + '-option-' + index"
									@click="selectOption(option)"
									@keydown="handleOptionKeydown($event, index)"
								>
									<span class="crm-settings-hub-application__select-option-title">{{ option.title }}</span>
									<span v-if="option.hint" class="crm-settings-hub-application__select-option-hint">{{ option.hint }}</span>
								</button>
							</div>
						</Popup>
					</div>
				</template>
			</CrmSettingsHubSettingField>
		</CrmSettingsHubSettingRow>
	`,
});
