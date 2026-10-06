import { Text } from 'main.core';
import type { ButtonOptions } from 'ui.buttons';
import type { CounterOptions } from 'ui.cnt';
import { BMenu, type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { mapWritableState } from 'ui.vue3.pinia';

import { UiCheckbox } from 'socialnetwork.v2.components.elements.ui-checkbox';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';

import './copy-settings-field.css';
import { InjectionKey } from '../../../../const/index.js';

export type optionFoldersCopyType = {
	value: number,
	data: {
		title: string,
		descr: string,
	},
};

// @vue/component
export const CopySettingsField = {
	name: 'ProjectWizardCopySettingsField',
	components: {
		BMenu,
		TextMd,
		TextXs,
		UiCheckbox,
		UiField,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
			default: () => document.body,
		},
	},
	data(): Object
	{
		return {
			isCheckedTasks: false,
			isCheckedRobots: false,
			isCheckedFolders: false,
			isOpenedSelectorFoldersCopyType: false,
			valueFoldersCopyTypeSelected: null,
		};
	},
	computed: {
		...mapWritableState(useInterfaceStore, ['copyOptions']),
		optionsSelectorFoldersCopyType(): optionFoldersCopyType[]
		{
			return [
				{
					value: 1,
					data: {
						title: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_NO_FILES_TITLE'),
						descr: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_NO_FILES_DESCR'),
					},
				},
				{
					value: 2,
					data: {
						title: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_WITH_FILES_TITLE'),
						descr: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_WITH_FILES_DESCR'),
					},
				},
			];
		},
		itemsFoldersCopyType(): MenuItemOptions[]
		{
			return this.optionsSelectorFoldersCopyType.map((option) => ({
				isSelected: (option.value === this.valueFoldersCopyTypeSelected),
				title: option.data.title,
				subtitle: option.data.descr,
				onClick: () => this.handleSelectFoldersCopyTypeWithFiles(option.value),
			}));
		},
		propsSelectorFoldersCopyType(): MenuOptions
		{
			const minWidthPopup = 150;

			return {
				id: `folders-copy-type-menu-${Text.getRandom()}`,
				bindOptions: { forceBindPosition: true },
				bindElement: this.$refs.selectorFoldersCopyType,
				targetContainer: this.getWizardBodyContainer(),
				minWidth: minWidthPopup,
				items: this.itemsFoldersCopyType,
				autoHide: true,
				closeByEsc: true,
			};
		},
		titleSelectorFoldersCopyType(): string
		{
			const option = this.optionsSelectorFoldersCopyType.find((option) => (
				option.value === this.valueFoldersCopyTypeSelected
			));

			return option?.data?.title || '';
		},

	},
	watch: {
		isCheckedTasks(value): void {
			this.copyOptions = {
				...this.copyOptions,
				tasks: {
					...this.copyOptions.tasks,
					enabled: value,
				},
			};
		},
		isCheckedRobots(value): void {
			this.copyOptions = {
				...this.copyOptions,
				tasks: {
					...this.copyOptions.tasks,
					robots: value,
				},
			};
		},
		isCheckedFolders(value): void {
			this.copyOptions = {
				...this.copyOptions,
				disk: {
					...this.copyOptions.disk,
					enabled: value,
				},
			};
		},
		valueFoldersCopyTypeSelected(value): void {
			const isWithFiles = (value === 2);
			this.copyOptions = {
				...this.copyOptions,
				disk: {
					...this.copyOptions.disk,
					withFiles: isWithFiles,
				},
			};
		},
	},
	mounted(): void
	{
		this.valueFoldersCopyTypeSelected = this.optionsSelectorFoldersCopyType[0]?.value;
	},
	methods: {
		toggleIsOpenedSelectorFoldersCopyType(): void
		{
			this.isOpenedSelectorFoldersCopyType = !this.isOpenedSelectorFoldersCopyType;
		},
		handleChangeCheckerTasks(value: boolean): void
		{
			this.isCheckedTasks = Boolean(value);
			if (!this.isCheckedTasks)
			{
				this.isCheckedRobots = false;
			}
		},
		handleChangeCheckerRobots(value: boolean): void
		{
			this.isCheckedRobots = Boolean(value);
		},
		handleChangeCheckerFolders(value: boolean): void
		{
			this.isCheckedFolders = Boolean(value);
			if (!this.isCheckedFolders)
			{
				this.isOpenedSelectorFoldersCopyType = false;
			}
		},
		handleSelectFoldersCopyTypeWithFiles(value: number): void
		{
			this.valueFoldersCopyTypeSelected = value;
		},
		handleClickSelectorFoldersCopyType(): void
		{
			this.toggleIsOpenedSelectorFoldersCopyType();
		},

	},
	template: `
		<UiField
			ref="copySettingsField"
			class="socialnetwork--project-wizard-copy-settings-field scn-pw-copy-settings"
			:label="loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTIONS_LABEL')"
		>
			<ul class="scn-pw-copy-settings__options">
				<li
					class="scn-pw-copy-settings__option"
					:class="{
						'scn-pw-copy-settings__option_active': isCheckedTasks,
					}"
				>
					<div class="scn-pw-copy-settings__option-vis">
						<UiCheckbox
							class="scn-pw-copy-settings__option-checkbox"
							inputId="sonet-pw-copy-tasks"
							:isChecked="isCheckedTasks"
							:isDisabled="false"
							:isHighlighted="true"
							:isImportant="true"
							@change="handleChangeCheckerTasks"
						/>
					</div>
					<div class="scn-pw-copy-settings__option-text">
						<label class="scn-pw-copy-settings__option-head-label" for="sonet-pw-copy-tasks">
							<TextMd
								class="scn-pw-copy-settings__option-head"
							>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_TASKS_TITLE') }}</TextMd>
						</label>
						<TextXs
							class="scn-pw-copy-settings__option-descr"
						>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_TASKS_DESCR') }}</TextXs>
					</div>
				</li>
				<li
					class="scn-pw-copy-settings__option"
					:class="{
						'scn-pw-copy-settings__option_active': isCheckedRobots,
					}"
				>
					<div class="scn-pw-copy-settings__option-vis">
						<UiCheckbox
							class="scn-pw-copy-settings__checkbox"
							inputId="sonet-pw-copy-robots"
							:isChecked="isCheckedRobots"
							:isDisabled="!isCheckedTasks"
							:isHighlighted="true"
							:isImportant="true"
							@change="handleChangeCheckerRobots"
						/>
					</div>
					<div class="scn-pw-copy-settings__option-text">
						<div class="scn-pw-copy-settings__option-text">
							<label class="scn-pw-copy-settings__option-head-label" for="sonet-pw-copy-robots">
								<TextMd
									class="scn-pw-copy-settings__option-head"
								>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_ROBOTS_TITLE') }}</TextMd>
							</label>
							<TextXs
								class="scn-pw-copy-settings__option-descr"
							>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_ROBOTS_DESCR') }}</TextXs>
						</div>
					</div>
				</li>
				<li
					class="scn-pw-copy-settings__option"
					:class="{
						'scn-pw-copy-settings__option_active': isCheckedFolders,
					}"
				>
					<div class="scn-pw-copy-settings__option-vis">
						<UiCheckbox
							class="scn-pw-copy-settings__checkbox"
							inputId="sonet-pw-copy-folders"
							:isChecked="isCheckedFolders"
							:isDisabled="false"
							:isHighlighted="true"
							:isImportant="true"
							@change="handleChangeCheckerFolders"
						/>
					</div>
					<div class="scn-pw-copy-settings__option-text">
						<TextMd class="scn-pw-copy-settings__option-head">
							<label class="scn-pw-copy-settings__option-head-label" for="sonet-pw-copy-folders">
								<span
									class="scn-pw-copy-settings__option-head-text"
								>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TITLE') }}</span>
							</label>
							<button
								id="selectorFoldersCopyType"
								ref="selectorFoldersCopyType"
								type="button"
								class="scn-pw-copy-settings__option-head-action"
								:class="{
									'scn-pw-copy-settings__option-head-action_opened': isOpenedSelectorFoldersCopyType,
								}"
								:disabled="!isCheckedFolders"
								aria-haspopup="menu"
								:aria-expanded="isOpenedSelectorFoldersCopyType ? 'true' : 'false'"
								@click="handleClickSelectorFoldersCopyType"
							>{{ titleSelectorFoldersCopyType }}</button>
						</TextMd>
						<TextXs
							class="scn-pw-copy-settings__option-descr"
						>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_DESCR') }}</TextXs>
						<BMenu
							v-if="isOpenedSelectorFoldersCopyType"
							:options="propsSelectorFoldersCopyType"
							@close="isOpenedSelectorFoldersCopyType = false"
						/>
					</div>
				</li>
			</ul>
		</UiField>
	`,
};
