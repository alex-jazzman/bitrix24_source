import { Text } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import { getMemberRoles, teamMemberRoles } from 'humanresources.company-structure.api';
import { PermissionChecker, PermissionCheckerClass } from 'humanresources.company-structure.permission-checker';
import {
	WizardApiEntityChangedDict,
	NodeSettingsTypes,
	EntityTypes,
	type UserData,
} from 'humanresources.company-structure.utils';
import { AuthorityTypes } from '../../consts';

const HEAD_TYPE_ENTITY_ID = 'head-type';
const USER_TYPE_ENTITY_ID = 'user';

// @vue/component
export const Settings = {
	name: 'NodeSettings',

	props: {
		name: {
			type: String,
			required: true,
		},
		/** @type {Record<string, Set>} */
		initSettings: {
			type: Object,
			required: false,
			default: () => {},
		},
		shouldErrorHighlight: {
			type: Boolean,
			required: true,
		},
		entityType: {
			type: String,
			required: true,
		},
		/** @type UserData[] */
		heads: {
			type: Array,
			required: false,
			default: () => [],
		},
		employeesIds: {
			type: Array,
			required: false,
			default: () => [],
		},
		isEditMode: {
			type: Boolean,
			required: true,
		},
	},

	emits: ['applyData'],

	data(): { permissionChecker: ?PermissionCheckerClass }
	{
		return {
			permissionChecker: null,
			settings: {
				[NodeSettingsTypes.businessProcAuthority]: new Set(),
				[NodeSettingsTypes.reportsAuthority]: new Set(),
				[NodeSettingsTypes.teamReportExceptions]: new Set(),
			},
		};
	},

	computed:
	{
		isTeamEntity(): boolean
		{
			return this.entityType === EntityTypes.team;
		},
		isBusinessProcHeadNotSelected(): boolean
		{
			if (!this.isTeamEntity)
			{
				return false;
			}

			const bpSettings = this.settings[NodeSettingsTypes.businessProcAuthority];

			return !bpSettings || bpSettings.size === 0;
		},
		isReportsHeadNotSelected(): boolean
		{
			return false; // temporary allow empty list

			if (!this.isTeamEntity)
			{
				return false;
			}

			const reportsSettings = this.settings[NodeSettingsTypes.reportsAuthority];

			return !reportsSettings || reportsSettings.size === 0;
		},
		businessDescription(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_BUSINESS_PROC_DESCRIPTION', {
					'#DEPARTMENT_NAME#': Text.encode(this.name),
				})
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_SETTINGS_BUSINESS_PROC_DESCRIPTION')
			;
		},
		reportsDescriptions(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_REPORTS_DESCRIPTION', {
					'#DEPARTMENT_NAME#': Text.encode(this.name),
				})
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_SETTINGS_REPORTS_DESCRIPTION')
			;
		},
		hintTitle(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_HINT_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_SETTINGS_HINT_TITLE')
			;
		},
		businessProcWarningText(): string | null
		{
			const settingsType = NodeSettingsTypes.businessProcAuthority;
			const phrasePrefix = 'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_SETTINGS_BUSINESS_PROC';

			if (this.isTeamEntity || this.isBpSelectorLocked)
			{
				return null;
			}

			return this.getWarningText(settingsType, phrasePrefix);
		},
		reportWarningText(): string | null
		{
			const settingsType = NodeSettingsTypes.reportsAuthority;
			const phrasePrefix = 'HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_SETTINGS_REPORT';

			if (this.isTeamEntity && this.settings[settingsType].size === 0)
			{
				return this.loc(`${phrasePrefix}_EMPTY`);
			}

			if (this.isTeamEntity || this.isReportSelectorLocked)
			{
				return null;
			}

			return this.getWarningText(settingsType, phrasePrefix);
		},
		isBpSelectorLocked(): boolean
		{
			return this.isTeamEntity ? false : !this.permissionChecker.checkDepartmentBPSettingsAvailable();
		},
		isReportSelectorLocked(): boolean
		{
			return this.isTeamEntity
				? !this.permissionChecker.checkTeamReportSettingsAvailable()
				: !this.permissionChecker.checkDepartmentReportsSettingsAvailable()
			;
		},
		areTeamReportExceptionsAvailable(): boolean
		{
			return this.isTeamEntity && this.permissionChecker.checkTeamReportExceptionsAvailable();
		},
	},

	watch:
	{
		/**
		 * In case entityType was changed
		 */
		initSettings:
		{
			handler(payload: Record<string, Set>): void
			{
				this.settings = payload;
				this.initSettingsValue(this.settings, NodeSettingsTypes.businessProcAuthority);
				this.initSettingsValue(this.settings, NodeSettingsTypes.reportsAuthority);
				this.initSettingsValue(this.settings, NodeSettingsTypes.teamReportExceptions);
			},
		},
		heads:
		{
			handler(payload: number[], oldVal: number[]): void
			{
				const isSameArray = Array.isArray(payload)
					&& Array.isArray(oldVal)
					&& payload.length === oldVal.length
					&& payload.every((item) => oldVal.some((oldItem) => oldItem.id === item.id))
					&& oldVal.every((oldItem) => payload.some((item) => item.id === oldItem.id))
				;

				if (isSameArray || !this.reportExceptionsSelector)
				{
					return;
				}

				this.reloadUserSelector(this.employeesIds, payload);
			},
		},
		employeesIds:
		{
			/**
			 * When employees list is updated, we need to update selector which can include only employees from the list
			 * @param payload
			 * @param oldVal
			 */
			handler(payload: number[], oldVal: number[]): void
			{
				const isSameArray = Array.isArray(payload)
					&& Array.isArray(oldVal)
					&& payload.length === oldVal.length
					&& payload.every((item) => oldVal.includes(item))
					&& oldVal.every((oldItem) => payload.includes(oldItem))
				;

				if (isSameArray || !this.reportExceptionsSelector)
				{
					return;
				}

				this.reloadUserSelector(payload, this.heads);
			},
		},
	},

	created(): void
	{
		this.hints = [
			this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_HINT_1'),
			this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_HINT_2'),
		];

		this.settings = this.initSettings;
		this.permissionChecker = PermissionChecker.getInstance();
		this.initialSettingsValues = {
			[NodeSettingsTypes.businessProcAuthority]: new Set(),
			[NodeSettingsTypes.reportsAuthority]: new Set(),
			[NodeSettingsTypes.teamReportExceptions]: new Set(),
		};
		this.initBPSelector();
		this.initReportsSelector();
		this.initReportExceptionsSelector();
	},

	mounted(): void
	{
		this.businessProcSelector.renderTo(this.$refs['business-proc-selector']);
		this.reportsSelector.renderTo(this.$refs['reports-selector']);
		if (this.areTeamReportExceptionsAvailable)
		{
			this.reportExceptionsSelector.renderTo(this.$refs['report-exceptions-selector']);
		}
	},

	activated(): void
	{
		this.$emit('applyData', {
			isDepartmentDataChanged: false,
			isValid: !this.isBusinessProcHeadNotSelected,
			settings: this.settings,
		});
	},

	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		applyData(): void
		{
			this.$emit('applyData', {
				apiEntityChanged: WizardApiEntityChangedDict.settings,
				settings: this.settings,
				isDepartmentDataChanged: true,
				isValid: !this.isBusinessProcHeadNotSelected,
			});
		},
		/**
		 * This method is used in case entityType was changed, so all settings should be reevaluated
		 */
		initSettingsValue(payload: Record<string, Set>, settingType: string): void
		{
			const initValues = payload[settingType] ?? new Set();

			if (settingType === NodeSettingsTypes.reportsAuthority)
			{
				initValues.add(AuthorityTypes.departmentAllHeads);
			}

			if (settingType === NodeSettingsTypes.teamReportExceptions)
			{
				this.reportExceptionsSelector.dialog.setPreselectedItems(
					[...initValues].map((item) => [USER_TYPE_ENTITY_ID, item]),
				);

				return;
			}

			const preselectedItems = this.getTagItems(false, true)
				.filter((item) => initValues.has(item.id))
				.map((item) => item.id)
			;

			preselectedItems.forEach((preselectedItem): void => {
				let selector: TagSelector = null;

				switch (settingType)
				{
					case NodeSettingsTypes.businessProcAuthority:
						selector = this.businessProcSelector;
						break;
					case NodeSettingsTypes.reportsAuthority:
						selector = this.reportsSelector;
						break;
					default:
						return;
				}

				const item = selector.dialog.getItem([HEAD_TYPE_ENTITY_ID, preselectedItem]);

				if (item)
				{
					this.initialSettingsValues[settingType].add(preselectedItem);
					item.select();
				}
			});
		},
		initBPSelector(): void
		{
			// deputy is always available for departments
			const canDeselectHead = this.permissionChecker.checkDeputyApprovalBPAvailable() || !this.isTeamEntity;
			const canSelectDeputy = this.permissionChecker.checkDeputyApprovalBPAvailable() || !this.isTeamEntity;
			this.businessProcSelector = this.getTagSelector(
				NodeSettingsTypes.businessProcAuthority,
				this.isBpSelectorLocked,
				canDeselectHead,
				canSelectDeputy,
			);
		},
		initReportsSelector(): void
		{
			const canSelectDeputy = this.permissionChecker.checkDeputyGetReportsAvailable() || !this.isTeamEntity;

			// add mandatory item
			if (this.isTeamEntity)
			{
				this.settings[NodeSettingsTypes.reportsAuthority].add(AuthorityTypes.departmentAllHeads);
			}

			this.reportsSelector = this.getTagSelector(
				NodeSettingsTypes.reportsAuthority,
				this.isReportSelectorLocked,
				true,
				canSelectDeputy,
			);
		},
		initReportExceptionsSelector(): void
		{
			if (!this.isTeamEntity)
			{
				return;
			}

			const deputyIds = this.heads
				.filter((head) => head.role !== teamMemberRoles.head)
				.map((head) => head.id)
			;
			this.initialSettingsValues[NodeSettingsTypes.teamReportExceptions] = new Set(
				this.settings[NodeSettingsTypes.teamReportExceptions],
			);
			this.reportExceptionsSelector = this.getUserSelector([...this.employeesIds, ...deputyIds]);
		},
		getWarningText(settingsType: string, phrasePrefix: string): string | null
		{
			const memberRoles = getMemberRoles(this.entityType);
			const hasHead = this.heads.some((item: UserData) => item.role === memberRoles.head);
			const hasDeputy = this.heads.some((item: UserData) => item.role === memberRoles.deputyHead);
			const headSelected = this.settings[settingsType].has(AuthorityTypes.departmentHead);
			const deputySelected = this.settings[settingsType]
				.has(AuthorityTypes.departmentDeputy)
			;

			if (headSelected && hasHead && deputySelected && !hasDeputy)
			{
				return this.loc(`${phrasePrefix}_HAS_HEAD_NO_DEPUTY`);
			}

			if (headSelected && !hasHead && deputySelected && hasDeputy)
			{
				return this.loc(`${phrasePrefix}_NO_HEAD_HAS_DEPUTY`);
			}

			if (headSelected && !hasHead && deputySelected && !hasDeputy)
			{
				return this.loc(`${phrasePrefix}_NO_HEAD_NO_DEPUTY`);
			}

			if (headSelected && !hasHead && !deputySelected)
			{
				return this.loc(`${phrasePrefix}_NO_HEAD`);
			}

			if (!headSelected && deputySelected && !hasDeputy)
			{
				return this.loc(`${phrasePrefix}_NO_DEPUTY`);
			}

			if (!headSelected && !deputySelected)
			{
				return this.loc(`${phrasePrefix}_EMPTY`);
			}

			return null;
		},
		getTagSelector(
			settingType: string,
			isLocked: boolean,
			canUnselectHead: boolean,
			isDeputyAvailable: boolean,
		): TagSelector
		{
			const items = this.getTagItems(isLocked, isDeputyAvailable, settingType);
			const unselectedHeadItems = settingType === NodeSettingsTypes.reportsAuthority
				? [[HEAD_TYPE_ENTITY_ID, AuthorityTypes.departmentAllHeads]]
				: [[HEAD_TYPE_ENTITY_ID, AuthorityTypes.departmentHead]]
			;

			// cleanup unused settings
			this.settings[settingType] = new Set(
				[...this.settings[settingType]]
					.filter((item) => items.some((availableItem) => availableItem.id === item)),
			);

			return new TagSelector({
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.settings[settingType].add(tag.id);

						if (this.initialSettingsValues[settingType].has(tag.id))
						{
							this.initialSettingsValues[settingType].delete(tag.id);
						}
						else
						{
							this.applyData();
						}
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.settings[settingType].delete(tag.id);
						this.applyData();
					},
				},
				multiple: true,
				id: 'head-type-selector',
				locked: isLocked,
				tagFontWeight: '700',
				showAddButton: !isLocked,
				dialogOptions: {
					id: 'head-type-selector',
					events: {
						'Item:onBeforeSelect': (event: BaseEvent) => {
							const { item } = event.getData();
							if (!item.getCustomData()?.get('selectable'))
							{
								event.preventDefault();
							}
						},
					},
					width: 400,
					height: 220,
					tagMaxWidth: 400,
					dropdownMode: true,
					showAvatars: false,
					selectedItems: items.filter(((item) => this.settings[settingType].has(item.id))),
					items,
					undeselectedItems: canUnselectHead
						? []
						: unselectedHeadItems,
				},
			});
		},
		getTagItems(isLocked: boolean, isDeputyAvailable: boolean, settingType: string): Array
		{
			const lockedTagOptions = {
				bgColor: '#BDC1C6',
				textColor: '#525C69',
			};
			const departmentTagOptions = {
				bgColor: '#ADE7E4',
				textColor: '#207976',
				maxWidth: 400,
			};
			const teamTagOptions = {
				bgColor: '#CCE3FF',
				textColor: '#3592FF',
				maxWidth: 400,
			};

			const soonItemOptions = {
				customData: { selectable: false },
				textColor: '#C9CCD0',
				badges: [
					{
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_SOON_ITEM_BADGE'),
						textColor: '#FFFFFF',
						bgColor: '#2FC6F6',
					},
				],
				badgesOptions: {
					justifyContent: 'right',
				},
			};

			const deputyOptions = isDeputyAvailable
				? { customData: { selectable: true } }
				: soonItemOptions
			;

			const departmentHead = {
				id: AuthorityTypes.departmentHead,
				entityId: HEAD_TYPE_ENTITY_ID,
				tabs: 'recents',
				title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_DEPARTMENT_HEAD_ITEM'),
				tagOptions: isLocked ? lockedTagOptions : departmentTagOptions,
				customData: { selectable: true },
			};

			const departmentAllHeads = {
				id: AuthorityTypes.departmentAllHeads,
				entityId: HEAD_TYPE_ENTITY_ID,
				tabs: 'recents',
				title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_DEPARTMENT_ALL_HEADS'),
				tagOptions: isLocked ? lockedTagOptions : departmentTagOptions,
				customData: { selectable: true },
			};

			const teamHead = {
				id: AuthorityTypes.teamHead,
				entityId: HEAD_TYPE_ENTITY_ID,
				tabs: 'recents',
				title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_TEAM_HEAD_ITEM'),
				tagOptions: isLocked ? lockedTagOptions : teamTagOptions,
				customData: { selectable: true },
			};

			const departmentDeputy = {
				id: AuthorityTypes.departmentDeputy,
				entityId: HEAD_TYPE_ENTITY_ID,
				tabs: 'recents',
				title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_DEPARTMENT_DEPUTY_ITEM'),
				tagOptions: isLocked ? lockedTagOptions : departmentTagOptions,
				...deputyOptions,
			};

			const teamDeputy = {
				id: AuthorityTypes.teamDeputy,
				entityId: HEAD_TYPE_ENTITY_ID,
				tabs: 'recents',
				title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_TEAM_DEPUTY_ITEM'),
				tagOptions: isLocked ? lockedTagOptions : teamTagOptions,
				...deputyOptions,
			};

			if (this.isTeamEntity)
			{
				if (settingType === NodeSettingsTypes.reportsAuthority)
				{
					return [departmentAllHeads, teamHead, teamDeputy];
				}

				// put deputies if they are locked, otherwise put after corresponding heads
				return isDeputyAvailable
					? [departmentHead, departmentDeputy, teamHead, teamDeputy]
					: [departmentHead, teamHead, departmentDeputy, teamDeputy]
				;
			}

			return [departmentHead, departmentDeputy];
		},
		goToBPHelp(event): void
		{
			if (top.BX.Helper)
			{
				event.preventDefault();
				top.BX.Helper.show('redirect=detail&code=25455744');
			}
		},
		goToReportHelp(event): void
		{
			if (top.BX.Helper)
			{
				event.preventDefault();
				top.BX.Helper.show('redirect=detail&code=27450586');
			}
		},
		getUserSelector(allUsers: number[]): TagSelector
		{
			return new TagSelector({
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.settings[NodeSettingsTypes.teamReportExceptions].add(tag.id);

						if (this.initialSettingsValues[NodeSettingsTypes.teamReportExceptions].has(tag.id))
						{
							this.initialSettingsValues[NodeSettingsTypes.teamReportExceptions].delete(tag.id);
						}
						else
						{
							this.applyData();
						}
					},
					onTagRemove: (event: BaseEvent) => {
						const { tag } = event.getData();
						this.settings[NodeSettingsTypes.teamReportExceptions].delete(tag.id);
						this.applyData();
					},
				},
				multiple: true,
				locked: allUsers.length === 0,
				dialogOptions: {
					preselectedItems: [...this.settings[NodeSettingsTypes.teamReportExceptions]]
						.map((item) => [USER_TYPE_ENTITY_ID, item]),
					events: {
						onLoad: (event) => {
							const users = event.target.items.get(USER_TYPE_ENTITY_ID);

							users.forEach((user) => {
								user.setLink('');
							});
						},
					},
					height: 250,
					width: 380,
					entities: [
						{
							id: USER_TYPE_ENTITY_ID,
							options: {
								intranetUsersOnly: true,
								inviteEmployeeLink: false,
								maxUsersInRecentTab: 100,
								userId: allUsers,
							},
						},
					],
					dropdownMode: true,
					hideOnDeselect: false,
				},
			});
		},
		reloadUserSelector(employeeIds, heads): void
		{
			const deputyIds = heads
				.filter((head) => head.role !== teamMemberRoles.head)
				.map((head) => head.id)
			;
			const { dialog } = this.reportExceptionsSelector;
			// we copy current settings because with removing items they also will be removed via an event
			const currentSettings = new Set([...this.settings[NodeSettingsTypes.teamReportExceptions]]
				.filter((userId) => employeeIds.includes(userId) || deputyIds.includes(userId)))
			;
			// remove all items, because "load" method only adds new items, but doesn't remove old ones
			dialog.removeItems();
			if ([...employeeIds, ...deputyIds].length === 0)
			{
				// explicitly lock selector, otherwise all users will be present
				this.reportExceptionsSelector.setLocked(true);
			}
			else
			{
				dialog.getEntity(USER_TYPE_ENTITY_ID).options.userId = [...employeeIds, ...deputyIds];
				dialog.loadState = 'UNSENT'; // without this force reload doesn't work
				dialog.load(); // force reload dialog items
			}
			this.settings[NodeSettingsTypes.teamReportExceptions] = currentSettings;
			this.initSettingsValue(this.settings, NodeSettingsTypes.teamReportExceptions);
		},
	},

	template: `
		<div class="chart-wizard__settings">
			<div class="chart-wizard__settings__item" :class="{ '--team': isTeamEntity }">
				<div v-if="!isEditMode" class="chart-wizard__settings__item-hint">
					<div class="chart-wizard__settings__item-hint_logo"></div>
					<div class="chart-wizard__settings__item-hint_text">
						<div class="chart-wizard__settings__item-hint_title">
							{{ hintTitle }}
						</div>
						<div v-for="hint in hints"
							class="chart-wizard__settings__item-hint_text-item"
						>
							<div class="chart-wizard__settings__item-hint_text-item_icon"></div>
							<span>{{ hint }}</span>
						</div>
					</div>
				</div>
				<div class="chart-wizard__settings__item-options">
					<div 
						class="chart-wizard__settings__item-options__item-content_title"
						:class="{'--soon': isBpSelectorLocked}"
						:data-title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_ENTITY_ACCESS_TITLE')"
					>
						<div 
							class="chart-wizard__settings__item-options__item-content_title-text"
							:class="{'--soon': isBpSelectorLocked}"
						>
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_BUSINESS_PROC_TITLE') }}
						</div>
						<span v-if="isTeamEntity" class="ui-hint" @click="goToBPHelp">
							<span class="ui-hint-icon"/>
						</span>
					</div>
					<div class="chart-wizard__settings__item-description-container">
						<span 
							class="chart-wizard__settings__item-description-text"
							:class="{'--soon': isBpSelectorLocked}"
							v-html="businessDescription"
						>
						</span>
					</div>
					<div
						class="chart-wizard__settings__business-proc-selector"
						:class="{ 'ui-ctl-warning': (isBusinessProcHeadNotSelected) }"
						ref="business-proc-selector"
						data-test-id="hr-company-structure__settings__business-proc-selector"
					/>
					<div
						v-if="isBusinessProcHeadNotSelected"
						class="chart-wizard__settings__item-options-error"
					>
						<div class="ui-icon-set --warning"></div>
						<span class="chart-wizard__settings__item-options-error-message">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_BUSINESS_PROC_HEAD_ERROR') }}
						</span>
					</div>
					<div
						v-else-if="businessProcWarningText"
						class="chart-wizard__settings__item-options-warning"
					>
						<div class="ui-icon-set --warning"></div>
						<span>
							{{ businessProcWarningText }}
						</span>
					</div>
				</div>
				<div class="chart-wizard__settings__item-options">
					<div 
						class="chart-wizard__settings__item-options__item-content_title"
						:class="{'--soon': isReportSelectorLocked}"
						:data-title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_ENTITY_ACCESS_TITLE')"
					>
						<div 
							class="chart-wizard__settings__item-options__item-content_title-text"
							:class="{'--soon': isReportSelectorLocked}"
						>
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_REPORTS_TITLE') }}
						</div>
						<span v-if="isTeamEntity" class="ui-hint" @click="goToReportHelp">
							<span class="ui-hint-icon"/>
						</span>
					</div>
					<div class="chart-wizard__settings__item-description-container">
						<span
							class="chart-wizard__settings__item-description-text"
							:class="{'--soon': isReportSelectorLocked}"
							v-html="reportsDescriptions"
						>
						</span>
					</div>
					<div
						class="chart-wizard__settings__reports-selector"
						ref="reports-selector"
						data-test-id="hr-company-structure__settings__reports-selector"
					/>
					<div
						v-if="isReportsHeadNotSelected"
						class="chart-wizard__settings__item-options-error"
					>
						<div class="ui-icon-set --warning"></div>
						<span class="chart-wizard__settings__item-options-error-message">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_REPORTS_HEAD_ERROR') }}
						</span>
					</div>
					<div
						v-else-if="reportWarningText"
						class="chart-wizard__settings__item-options-warning"
					>
						<div class="ui-icon-set --warning"></div>
						<span>
							{{ reportWarningText }}
						</span>
					</div>
				</div>
				<div class="chart-wizard__settings__item-options" v-if="areTeamReportExceptionsAvailable">
					<div class="chart-wizard__settings__item-description-container">
						<span class="chart-wizard__settings__item-description-text">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_SETTINGS_REPORT_EXCEPTIONS_DESCRIPTION') }}
						</span>
					</div>
					<div
						class="chart-wizard__settings__report-exceptions-selector"
						ref="report-exceptions-selector"
						data-test-id="hr-company-structure__settings__report-exceptions-selector"
					/>
				</div>
			</div>
		</div>
	`,
};
