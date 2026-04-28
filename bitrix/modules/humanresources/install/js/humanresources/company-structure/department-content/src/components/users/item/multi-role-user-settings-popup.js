import { PermissionChecker } from 'humanresources.company-structure.permission-checker';
import { Type } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import { BIcon } from 'ui.icon-set.api.vue';
import { UI } from 'ui.notification';
import { mapState } from 'ui.vue3.pinia';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { UserSettingsTypes } from 'humanresources.company-structure.utils';
import { ConfirmationPopup } from 'humanresources.company-structure.structure-components';
import { DepartmentAPI } from '../../../api';
import './styles/multi-role-user-settings-popup.css';

const SELECTOR_ENTOTY_ID = 'multi-role-user-settings-items';

type PopupDataType = {
	showActionLoader: boolean,
	lockActionButton: boolean,
	settings: Record<string, Set<number>>,
};

// @vue/component
export const MultiRoleUserSettingsPopup = {
	name: 'MultiRoleUserSettingsPopup',

	components: {
		ConfirmationPopup,
		BIcon,
	},

	props: {
		user: {
			type: Object,
			required: true,
		},
	},

	emits: ['close'],

	data(): PopupDataType
	{
		return {
			showActionLoader: false,
			lockActionButton: false,
			settings: {
				[UserSettingsTypes.businessProcExcludeNodes]: new Set(),
				[UserSettingsTypes.reportsExcludeNodes]: new Set(),
			},
		};
	},

	computed:
	{
		...mapState(useChartStore, ['multipleUsers', 'departments', 'focusedNode']),
		businessProcListInvalid(): boolean
		{
			if (!PermissionChecker.getInstance().checkMultipleUsersBPSettingsAvailable())
			{
				return false;
			}

			return this.checkIfSettingsInvalid(UserSettingsTypes.businessProcExcludeNodes);
		},
		reportListInvalid(): boolean
		{
			if (!PermissionChecker.getInstance().checkMultipleUsersReportSettingsAvailable())
			{
				return false;
			}

			return this.checkIfSettingsInvalid(UserSettingsTypes.reportsExcludeNodes);
		},
		areSomeSettingsInvalid(): boolean
		{
			return this.reportListInvalid || this.businessProcListInvalid;
		},
		businessProcFeatureAvailable(): boolean
		{
			return PermissionChecker.getInstance().checkMultipleUsersBPSettingsAvailable();
		},
		reportFeatureAvailable(): boolean
		{
			return PermissionChecker.getInstance().checkMultipleUsersReportSettingsAvailable();
		},
	},

	async mounted(): void
	{
		const settings = await DepartmentAPI.getUserSettings(
			this.user.id,
			this.focusedNode,
		);

		this.settings = { ...this.settings, ...this.mapRawSettings(settings) };

		this.businessProcSelector = this.createTagSelector(
			UserSettingsTypes.businessProcExcludeNodes,
			!this.businessProcFeatureAvailable,
		);
		this.businessProcSelector.renderTo(this.$refs['business-proc-selector']);
		this.reportsSelector = this.createTagSelector(
			UserSettingsTypes.reportsExcludeNodes,
			!this.reportFeatureAvailable,
		);
		this.reportsSelector.renderTo(this.$refs['reports-selector']);
	},

	methods:
	{
		checkIfSettingsInvalid(type: string): boolean
		{
			if (!Type.isArray(this.multipleUsers[this.user.id]))
			{
				return true;
			}

			return this.settings[type]?.size === this.multipleUsers[this.user.id].length;
		},
		mapRawSettings(rawSettings: { settingsType: string, settingsValue: string }[]): Object<string, Set<(string)>>
		{
			return rawSettings.reduce((acc, { settingsType, settingsValue }) => {
				if (!Object.hasOwn(acc, settingsType))
				{
					acc[settingsType] = new Set();
				}

				acc[settingsType].add(Number(settingsValue));

				return acc;
			}, {});
		},
		createTagSelector(settingType: string, isLocked: boolean): TagSelector
		{
			const tagItems = this.getTagItems();

			return new TagSelector({
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.settings[settingType].delete(tag.id);
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.settings[settingType].add(tag.id);
					},
				},
				multiple: true,
				id: `multi-role-user-settings-selector-${settingType.toLowerCase()}`,
				locked: isLocked,
				tagFontWeight: '700',
				dialogOptions: {
					id: `multi-role-user-settings-dialog-${settingType.toLowerCase()}`,
					width: 367,
					height: 200,
					tagMaxWidth: 400,
					dropdownMode: true,
					showAvatars: false,
					items: tagItems,
					selectedItems: this.settings[settingType] && !isLocked
						? tagItems.filter((item) => !this.settings[settingType].has(item.id))
						: [],
					undeselectedItems: tagItems.filter((item) => !this.departments.get(item.id))
						.map((item) => [SELECTOR_ENTOTY_ID, item.id]),
				},
			});
		},
		getTagItems(): Object[]
		{
			const currentUserNodes = this.multipleUsers[this.user.id];

			if (!Type.isArray(currentUserNodes))
			{
				return [];
			}

			const tagItems = [];
			for (const currentUserNode of currentUserNodes)
			{
				const title = this.departments.get(currentUserNode)
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_SELECTOR_ITEM_TEXT', {
						'#DEPARTMENT_NAME#': this.departments.get(currentUserNode)?.name,
					})
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_SELECTOR_ITEM_TEXT_HIDDEN')
				;

				tagItems.push({
					id: currentUserNode,
					entityId: SELECTOR_ENTOTY_ID,
					tabs: 'recents',
					title,
					tagOptions: {
						bgColor: '#ADE7E4',
						textColor: '#207976',
						maxWidth: 400,
					},
					customData: { selectable: true },
				});
			}

			return tagItems;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		async confirm(): Promise<void>
		{
			this.showActionLoader = true;
			try
			{
				const settings = {};
				if (this.businessProcFeatureAvailable)
				{
					settings[UserSettingsTypes.businessProcExcludeNodes] = {
						values: [...this.settings[UserSettingsTypes.businessProcExcludeNodes]],
						replace: true,
					};
				}

				if (this.reportFeatureAvailable)
				{
					settings[UserSettingsTypes.reportsExcludeNodes] = {
						values: [...this.settings[UserSettingsTypes.reportsExcludeNodes]],
						replace: true,
					};
				}

				await DepartmentAPI.saveUserSettings(this.user.id, this.focusedNode, settings);

				UI.Notification.Center.notify({
					content: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_SAVE_SUCCESS'),
					autoHideDelay: 2000,
				});
			}
			catch
			{
				UI.Notification.Center.notify({
					content: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_SAVE_ERROR'),
					autoHideDelay: 2000,
				});
			}
			finally
			{
				this.showActionLoader = false;
				this.$emit('close');
			}
		},
		goToBPHelp(event): void
		{
			if (top.BX.Helper && this.businessProcFeatureAvailable)
			{
				event.preventDefault();
				top.BX.Helper.show('redirect=detail&code=27513420');
			}
		},
		goToReportsHelp(event): void
		{
			if (top.BX.Helper && this.reportFeatureAvailable)
			{
				event.preventDefault();
				top.BX.Helper.show('redirect=detail&code=27513420');
			}
		},
	},

	template: `
		<ConfirmationPopup
			@action="confirm"
			@close="$emit('close')"
			:showActionButtonLoader="showActionLoader"
			:lockActionButton="areSomeSettingsInvalid"
			:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_TITLE')"
			:confirmBtnText = "loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_CONFIRM_BUTTON')"
			:width="580"
			:padding="6"
			:minHeight="622"
			:maxHeight="622"
		>
			<template v-slot:content>
				<div class="hr-company-structure__multi-role-user-settings_container">
					<div class="hr-company-structure__multi-role-user-settings_hint-panel">
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_HINT_PANEL_TEXT') }}
					</div>
					<div class="hr-company-structure__multi-role-user-settings_option">
						<div
							class="hr-company-structure__multi-role-user-settings_option-title"
							:class="{'--soon': !businessProcFeatureAvailable}"
							:data-title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_SOON_BADGE')"
						>
							<div class="chart-wizard__settings__item-options__item-content_title-text">
								{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_BUSINESS_PROC_TITLE') }}
							</div>
							<span 
								:class="{
									'ui-hint': businessProcFeatureAvailable, 
									'hr-company-structure__multi-role-user-settings_ui-hint-disabled': !businessProcFeatureAvailable,
								}" 
								@click="goToBPHelp"
							>
								<span class="ui-hint-icon"/>
							</span>
						</div>
						<div
							ref="business-proc-selector"
							data-test-id="hr-company-structure__multi-role-user-settings__business-proc-selector"
						/>
						<div
							v-if="businessProcListInvalid"
							class="hr-company-structure__multi-role-user-settings_item-options-error"
						>
							<div class="ui-icon-set --warning"></div>
							<span>
								{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_EMPTY_LIST_ERROR') }}
							</span>
						</div>
					</div>
					<div class="hr-company-structure__multi-role-user-settings_option">
						<div 
							class="hr-company-structure__multi-role-user-settings_option-title"
							:class="{'--soon': !reportFeatureAvailable}"
							:data-title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_SOON_BADGE')"
						>
							<div class="chart-wizard__settings__item-options__item-content_title-text">
								{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_REPORTS_TITLE') }}
							</div>
							<span
								:class="{
									'ui-hint': reportFeatureAvailable, 
									'hr-company-structure__multi-role-user-settings_ui-hint-disabled': !reportFeatureAvailable,
								}"
								@click="goToReportsHelp"
							>
								<span class="ui-hint-icon"/>
							</span>
						</div>
						<div
							ref="reports-selector"
							data-test-id="hr-company-structure__multi-role-user-settings__reports-selector"
						/>
						<div
							v-if="reportListInvalid"
							class="hr-company-structure__multi-role-user-settings_item-options-error"
						>
							<div class="ui-icon-set --warning"></div>
							<span>
								{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_MULTI_ROLE_POPUP_EMPTY_LIST_ERROR') }}
							</span>
						</div>
					</div>
				</div>
			</template>
		</ConfirmationPopup>
	`,
};
