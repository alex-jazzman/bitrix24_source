import { UI } from 'ui.notification';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { mapState } from 'ui.vue3.pinia';
import { Event } from 'main.core';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { getMemberRoles, reportedErrorTypes } from 'humanresources.company-structure.api';
import { TreePreview } from './tree-preview/tree-preview';
import { Department } from './steps/department';
import { Employees } from './steps/employees';
import { BindChat } from './steps/bind-chat';
import { Entities } from './steps/entities';
import { TeamRights } from './steps/team-rights';
import { WizardAPI } from '../api';
import { chartWizardActions } from '../actions';
import { sendData as analyticsSendData } from 'ui.analytics';
import type { WizardData, Step, DepartmentData, DepartmentUserIds } from '../types';
import { PermissionChecker } from 'humanresources.company-structure.permission-checker';
import { EntityTypes, NodeColorsSettingsDict } from 'humanresources.company-structure.utils';
import { AuthorityTypes, SettingsTypes } from '../consts';
import 'ui.buttons';
import 'ui.forms';
import '../style.css';

const SaveMode = Object.freeze({
	moveUsers: 'moveUsers',
	addUsers: 'addUsers',
});

export const ChartWizard = {
	name: 'chartWizard',

	emits: ['modifyTree', 'close'],

	components: { Department, Employees, BindChat, TreePreview, Entities, TeamRights },

	props: {
		nodeId: {
			type: Number,
			required: true,
		},
		isEditMode: {
			type: Boolean,
			required: true,
		},
		showEntitySelector: {
			type: Boolean,
			required: false,
		},
		entity: {
			type: String,
		},
		entityType: {
			type: String,
			default: EntityTypes.department,
		},
		source: {
			type: String,
		},
		refToFocus: {
			type: String,
			default: null,
		},
	},

	data(): WizardData
	{
		return {
			stepIndex: 0,
			waiting: false,
			isValidStep: false,
			isDepartmentDataChanged: false,
			departmentData: {
				id: 0,
				parentId: 0,
				name: '',
				description: '',
				heads: [],
				employees: [],
				chats: [],
				channels: [],
				userCount: 0,
				createDefaultChat: true,
				createDefaultChannel: true,
				teamColor: NodeColorsSettingsDict.blue,
				entityType: EntityTypes.department,
				settings: {
					[SettingsTypes.businessProcAuthority]: new Set([AuthorityTypes.departmentHead]),
					[SettingsTypes.reportsAuthority]: new Set([AuthorityTypes.departmentHead]),
				},
			},
			removedUsers: [],
			employeesIds: [],
			departmentSettings: {
				[SettingsTypes.businessProcAuthority]: new Set([AuthorityTypes.departmentHead]),
				[SettingsTypes.reportsAuthority]: new Set([AuthorityTypes.departmentHead]),
			},
			shouldErrorHighlight: false,
			visibleSteps: [],
			saveMode: SaveMode.moveUsers,
		};
	},

	created(): void
	{
		this.init();
	},

	beforeUnmount(): void
	{
		Event.unbind(window, 'beforeunload', this.handleBeforeUnload);
	},

	computed: {
		stepTitle(): string
		{
			if (this.isFirstStep && !this.isEditMode)
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_CREATE');
			}

			const currentStep = this.visibleSteps[0] === 'entities'
				? this.stepIndex
				: this.stepIndex + 1;

			if (!this.isEditMode)
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_STEP_PROGRESS', {
					'#CURRENT_STEP#': currentStep,
					'#MAX_STEP#': this.steps.length - 1,
				});
			}

			return this.departmentData?.entityType === EntityTypes.team
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EDIT_TEAM_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EDIT_TITLE');
		},
		closeConfirmTitle(): string
		{
			if (this.isEditMode)
			{
				return this.departmentData?.entityType === EntityTypes.team
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_EDIT_WIZARD_TEAM_TITLE')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_EDIT_WIZARD_DEPARTMENT_TITLE')
				;
			}

			return this.departmentData?.entityType === EntityTypes.team
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_CREATE_WIZARD_TEAM_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_CREATE_WIZARD_DEPARTMENT_TITLE')
			;
		},
		currentStep(): Step
		{
			const id = this.visibleSteps[this.stepIndex];

			return this.steps.find((step) => id === step.id);
		},
		componentInfo(): { name: string, params?: Object }
		{
			const {
				parentId,
				name,
				description,
				heads,
				entityType,
				teamColor,
			} = this.departmentData;

			const components = {
				department: {
					name: 'Department',
					params: {
						parentId,
						name,
						description,
						entityType,
						teamColor,
						refToFocus: this.refToFocus,
						shouldErrorHighlight: this.shouldErrorHighlight,
						isEditMode: this.isEditMode,
					},
				},
				employees: {
					name: 'Employees',
					params: {
						heads,
						entityType,
						employeesIds: this.employeesIds,
						isEditMode: this.isEditMode,
					},
				},
				bindChat: {
					name: 'BindChat',
					params: {
						heads,
						name,
						entityType,
					},
				},
				teamRights: {
					name: 'TeamRights',
					params: {
						name,
						settings: this.departmentSettings,
					},
				},
				entities: {
					name: 'Entities',
					params: {
						parentId,
					},
				},
			};

			const { id: stepId } = this.currentStep;

			return components[stepId];
		},
		isFirstStep(): boolean
		{
			return this.currentStep.id === 'entities';
		},
		hasTreePreview(): boolean
		{
			return !['entities', 'bindChat', 'teamRights'].includes(this.currentStep.id);
		},
		isChatStep(): boolean
		{
			return this.currentStep.id === 'bindChat';
		},
		filteredSteps(): string[]
		{
			return this.visibleSteps.filter((step) => step !== 'entities');
		},
		rootId(): number
		{
			const { id } = [...this.departments.values()].find((department) => {
				return department.parentId === 0;
			});

			return id;
		},
		isTeamEntity(): boolean
		{
			return this.departmentData?.entityType === EntityTypes.team;
		},
		createButtonText(): string
		{
			return this.isTeamEntity
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_CREATE_TEAM_BTN')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_CREATE_BTN')
			;
		},
		...mapState(useChartStore, ['departments', 'userId', 'currentDepartments']),
	},

	methods: {
		handleBeforeUnload(event: Event): void
		{
			event.preventDefault();
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		async init(): Promise<void>
		{
			// Important: we need to call createSteps as soon as we get entityType or determine a lack of it

			Event.bind(window, 'beforeunload', this.handleBeforeUnload);
			if (this.isEditMode)
			{
				const {
					id,
					name,
					description,
					parentId,
					heads,
					userCount,
					children,
					entityType,
					teamColor,
					employees = [],
				} = this.departments.get(this.nodeId);

				this.getMemberRoles(entityType);
				this.createSteps(entityType);
				this.createVisibleSteps();
				this.createDefaultSaveMode(entityType);

				this.departmentData = {
					...this.departmentData,
					id,
					parentId,
					name,
					description,
					heads,
					userCount,
					children,
					employees,
					entityType,
					teamColor,
					createDefaultChat: false,
					createDefaultChannel: false,
				};
				const rawSettings = await WizardAPI.getSettings(this.nodeId);
				this.departmentSettings = rawSettings.reduce((acc, { settingsType, settingsValue }) => {
					if (!Object.hasOwn(acc, settingsType))
					{
						acc[settingsType] = new Set();
					}
					acc[settingsType].add(settingsValue);

					return acc;
				}, { ...this.departmentSettings });

				this.employeesIds = await WizardAPI.getEmployees(this.nodeId);

				return;
			}

			if (this.entityType)
			{
				this.departmentData.entityType = this.entityType;
			}

			this.getMemberRoles(this.entityType);
			this.createSteps(this.entityType);
			this.createVisibleSteps();
			this.createDefaultSaveMode(this.entityType);

			if (this.nodeId)
			{
				this.departmentData.parentId = this.nodeId;

				return;
			}

			this.departmentData.parentId = 0;

			analyticsSendData({
				tool: 'structure',
				category: 'structure',
				event: 'create_wizard',
				c_element: this.source,
			});
		},
		getMemberRoles(entityType): void
		{
			this.memberRoles = getMemberRoles(entityType);
		},
		createVisibleSteps(): void
		{
			switch (this.entity)
			{
				case 'department':
					this.visibleSteps = ['department'];
					break;
				case 'employees':
					this.visibleSteps = ['employees'];
					break;
				case 'teamRights':
					this.visibleSteps = ['teamRights'];
					break;
				default:
					this.visibleSteps = this.showEntitySelector
						? this.steps.map((step) => step.id)
						: this.steps.filter((step) => step.id !== 'entities').map((step) => step.id);
					break;
			}
		},
		move(buttonId: string = 'next'): void
		{
			if (buttonId === 'next' && !this.isValidStep)
			{
				this.shouldErrorHighlight = true;

				return;
			}

			this.stepIndex = buttonId === 'back' ? this.stepIndex - 1 : this.stepIndex + 1;
			this.pickStepsAnalytics();
		},
		close(sendEvent: boolean = false): void
		{
			this.$emit('close');
			if (sendEvent)
			{
				analyticsSendData({
					tool: 'structure',
					category: 'structure',
					event: 'cancel_wizard',
					c_element: this.source,
				});
			}
		},
		closeWithConfirm(): void
		{
			if (!this.isDepartmentDataChanged)
			{
				this.close(true);

				return;
			}

			const confirmPopup = new MessageBox({
				title: this.closeConfirmTitle,
				message: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_WIZARD_MESSAGE'),
				yesCaption: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_WIZARD_OK_CAPTION'),
				noCaption: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_CLOSE_WIZARD_NO_CAPTION'),
				onYes: () => {
					this.close(true);

					return true;
				},
				minHeight: 155,
				buttons: MessageBoxButtons.YES_NO,
				popupOptions: {
					closeIcon: true,
					className: 'humanresources-chart-wizard__close-confirm-popup',
				},
			});
			confirmPopup.getYesButton().setRound(true);
			confirmPopup.getNoButton().setRound(true);
			confirmPopup.show();
		},
		onApplyData(
			data: {
				isValid?: boolean,
				isDepartmentDataChanged?: boolean,
				removedUsers?: User, ...Partial<DepartmentData>
			},
		): void
		{
			const prevEntityType = this.departmentData.entityType;
			const { isValid = true, isDepartmentDataChanged = true, removedUsers = [], ...departmentData } = data;
			this.isValidStep = isValid;
			this.isDepartmentDataChanged = this.isDepartmentDataChanged || isDepartmentDataChanged;
			if (departmentData)
			{
				this.departmentData = {
					...this.departmentData,
					...departmentData,
				};
			}

			this.removedUsers = removedUsers;
			if (isValid)
			{
				this.shouldErrorHighlight = false;
			}

			// change steps and roles according to entityType
			if (prevEntityType !== this.departmentData.entityType)
			{
				this.getMemberRoles(this.departmentData.entityType);
				this.createSteps(this.departmentData.entityType);
				this.createVisibleSteps();
				this.createDefaultSaveMode(this.departmentData.entityType);

				const prevMemberRoles = getMemberRoles(prevEntityType);
				const rolesKeys = Object.keys(prevMemberRoles);
				this.departmentData.heads = this.departmentData.heads.map((item) => {
					const roleKey = rolesKeys.find((key) => prevMemberRoles[key] === item.role);

					return { ...item, role: this.memberRoles[roleKey] };
				});

				this.departmentData.employees = this.departmentData.employees
					.map((item) => ({ ...item, role: this.memberRoles.employee }))
				;
			}

			// change NodeColorsSettingsDict according to entityType
			this.departmentData.teamColor = this.isTeamEntity
				? this.departmentData.teamColor ?? NodeColorsSettingsDict.blue
				: null
			;
		},
		createSteps(entityType: string = 'DEPARTMENT'): void
		{
			if (entityType === EntityTypes.team)
			{
				this.steps = [
					{
						id: 'entities',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_SELECT_ENTITY_TITLE'),
					},
					{
						id: 'department',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_TITLE'),
					},
					{
						id: 'employees',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_EMPLOYEES_TITLE'),
					},
					{
						id: 'bindChat',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TEAM_TITLE'),
					},
					{
						id: 'teamRights',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_TEAM_RIGHTS_TITLE'),
					},
				];
			}
			else
			{
				this.steps = [
					{
						id: 'entities',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_SELECT_ENTITY_TITLE'),
					},
					{
						id: 'department',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DEPARTMENT_TITLE'),
					},
					{
						id: 'employees',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EMPLOYEES_TITLE'),
					},
					{
						id: 'bindChat',
						title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BINDCHAT_TITLE_MSGVER_1'),
					},
				];
			}
		},
		getUsersPromise(departmentId: number): Promise<void>
		{
			const ids = this.calculateEmployeeIds();
			const { headsIds, deputiesIds, employeesIds } = ids;

			const departmentUserIds = {
				[this.memberRoles.head]: headsIds,
				[this.memberRoles.deputyHead]: deputiesIds,
				[this.memberRoles.employee]: employeesIds,
			};

			return this.getUserMemberPromise(departmentId, departmentUserIds);
		},
		calculateEmployeeIds(): Object
		{
			const { heads, employees = [] } = this.departmentData;

			return [...heads, ...employees].reduce((acc, user) => {
				const { headsIds, deputiesIds, employeesIds } = acc;
				if (user.role === this.memberRoles.head)
				{
					headsIds.push(user.id);
				}
				else if (user.role === this.memberRoles.deputyHead)
				{
					deputiesIds.push(user.id);
				}
				else
				{
					employeesIds.push(user.id);
				}

				return acc;
			}, {
				headsIds: [],
				deputiesIds: [],
				employeesIds: [],
			});
		},
		getUserMemberPromise(departmentId: number, ids: DepartmentUserIds, role: string): Promise<void>
		{
			if (this.isEditMode)
			{
				return WizardAPI.saveUsers(departmentId, ids);
			}

			const hasUsers = Object.values(ids).some((userIds) => userIds.length > 0);
			if (!hasUsers)
			{
				return Promise.resolve();
			}

			const parentId = this.departmentData.parentId ?? null;
			if (this.saveMode === SaveMode.moveUsers)
			{
				return WizardAPI.moveUsers(departmentId, ids, parentId);
			}

			return WizardAPI.saveUsers(departmentId, ids, parentId);
		},
		async create(): Promise<void>
		{
			const {
				name,
				parentId,
				description,
				chats,
				channels,
				createDefaultChat,
				createDefaultChannel,
				entityType,
				teamColor,
				settings,
			} = this.departmentData;

			let departmentId = 0;
			let accessCode = '';
			this.waiting = true;
			try
			{
				const [newDepartment] = await WizardAPI.addDepartment(
					name,
					parentId,
					description,
					entityType,
					teamColor?.name,
				);
				departmentId = newDepartment.id;
				accessCode = newDepartment.accessCode;

				const data = await this.getUsersPromise(departmentId);
				if (data?.updatedDepartmentIds)
				{
					chartWizardActions.refreshDepartments(data.updatedDepartmentIds);
				}
				else
				{
					chartWizardActions.tryToAddCurrentDepartment(this.departmentData, departmentId);
				}

				await WizardAPI.saveChats(
					departmentId,
					{ chat: [...chats], channel: [...channels] },
					{ chat: Number(createDefaultChat), channel: Number(createDefaultChannel) },
				);

				if (entityType === EntityTypes.team)
				{
					await WizardAPI.createSettings(
						departmentId,
						{
							[SettingsTypes.businessProcAuthority]: {
								values: [...settings[SettingsTypes.businessProcAuthority]],
								replace: true,
							},
						},
						parentId,
					);
				}
			}
			catch (error)
			{
				if (!reportedErrorTypes.has(error.code))
				{
					UI.Notification.Center.notify({
						content: error.message,
						autoHideDelay: 4000,
					});
				}

				return;
			}
			finally
			{
				this.waiting = false;
			}

			chartWizardActions.createDepartment({ ...this.departmentData, id: departmentId, accessCode });
			this.$emit('modifyTree', { id: departmentId, parentId, showConfetti: true });

			const { headsIds, deputiesIds, employeesIds } = this.calculateEmployeeIds();

			analyticsSendData(
				{
					tool: 'structure',
					category: 'structure',
					event: 'create_dept',
					c_element: this.source,
					p2: `headAmount_${headsIds.length}`,
					p3: `secondHeadAmount_${deputiesIds.length}`,
					p4: `employeeAmount_${employeesIds.length}`,
				},
			);
			this.close();
		},
		async save(): Promise<void>
		{
			if (!this.isValidStep)
			{
				this.shouldErrorHighlight = true;

				return;
			}

			const { id, parentId, name, description, teamColor, settings } = this.departmentData;
			const currentNode = this.departments.get(id);
			const targetNodeId = currentNode?.parentId === parentId ? null : parentId;
			this.waiting = true;
			const usersPromise = this.entity === 'employees'
				? this.getUsersPromise(id)
				: Promise.resolve();
			const departmentPromise = this.entity === 'department'
				? WizardAPI.updateDepartment(id, targetNodeId, name, description, teamColor?.name)
				: Promise.resolve();
			const settingsPromise = this.entity === 'teamRights'
				? WizardAPI.updateSettings(
					id,
					{
						[SettingsTypes.businessProcAuthority]: {
							values: [...settings[SettingsTypes.businessProcAuthority]],
							replace: true,
						},
					},
					parentId,
				)
				: Promise.resolve();

			this.pickEditAnalytics(id, parentId);
			try
			{
				const [usersResponse] = await Promise.all([usersPromise, departmentPromise, settingsPromise]);
				let userMovedToRootIds = [];
				if (this.removedUsers.length > 0)
				{
					userMovedToRootIds = usersResponse?.userMovedToRootIds ?? [];
					if (userMovedToRootIds.length > 0)
					{
						chartWizardActions.moveUsersToRootDepartment(this.removedUsers, userMovedToRootIds);
					}
				}

				const store = useChartStore();
				if (userMovedToRootIds.includes(this.userId))
				{
					store.changeCurrentDepartment(id, this.rootId);
				}
				else if (this.removedUsers.some((user) => user.id === this.userId))
				{
					store.changeCurrentDepartment(id);
				}
				else
				{
					chartWizardActions.tryToAddCurrentDepartment(this.departmentData, id);
				}

				chartWizardActions.editDepartment(this.departmentData);
			}
			catch (e)
			{
				console.error(e);

				return;
			}
			finally
			{
				this.waiting = false;
			}

			this.$emit('modifyTree', { id, parentId });
			this.close();
		},
		handleSaveModeChanged(actionId: string): void
		{
			this.saveMode = actionId;
		},
		createDefaultSaveMode(entityType: string = 'DEPARTMENT'): void
		{
			if (entityType === EntityTypes.team)
			{
				this.saveMode = SaveMode.addUsers;
			}
			else
			{
				this.saveMode = SaveMode.moveUsers;
			}
		},
		pickEditAnalytics(departmentId: number, parentId: number): void
		{
			const currentNode = this.departments.get(departmentId);
			switch (this.entity)
			{
				case 'department':
					analyticsSendData({
						tool: 'structure',
						category: 'structure',
						event: 'edit_dept_name',
						c_element: this.source,
						p1: currentNode?.parentId === parentId ? 'editHead_N' : 'editHeadDept_Y',
						p2: currentNode?.name === name ? 'editName_N' : 'editName_Y',
					});
					break;
				case 'employees':
				{
					const { headsIds, deputiesIds, employeesIds } = this.calculateEmployeeIds();
					analyticsSendData({
						tool: 'structure',
						category: 'structure',
						event: 'edit_dept_employee',
						c_element: this.source,
						p2: `headAmount_${headsIds.length}`,
						p3: `secondHeadAmount_${deputiesIds.length}`,
						p4: `employeeAmount_${employeesIds.length}`,
					});
					break;
				}
				default:
					break;
			}
		},
		pickStepsAnalytics(): void
		{
			let event = null;
			switch (this.currentStep.id)
			{
				case 'department':
					event = 'create_dept_step1';
					break;
				case 'employees':
					event = 'create_dept_step2';
					break;
				case 'bindChat':
					event = 'create_dept_step3';
					break;
				case 'teamRights':
					event = 'create_dept_step4';
					break;
				default:
					break;
			}

			if (event)
			{
				analyticsSendData({
					tool: 'structure',
					category: 'structure',
					event,
					c_element: this.source,
				});
			}
		},
	},

	template: `
		<div class="chart-wizard">
			<div class="chart-wizard__dialog" :style="{ 'max-width': !isEditMode && isFirstStep ? '580px' : '843px' }">
				<div class="chart-wizard__head">
					<div class="chart-wizard__head_close" @click="closeWithConfirm(true)"></div>
					<p class="chart-wizard__head_title">{{ stepTitle }}</p>
					<p class="chart-wizard__head_descr" :class="{ '--first-step': isFirstStep, '--edit-mode': isEditMode }">
						{{ currentStep.title }}
					</p>
					<div class="chart-wizard__head_stages" v-if="!isFirstStep && !isEditMode">
						<div
							v-for="n in filteredSteps.length"
							class="chart-wizard__head_stage"
							:class="{ '--completed': stepIndex >= (this.showEntitySelector ? n : n - 1), '--team': isTeamEntity }"
						></div>
					</div>
				</div>
				<div class="chart-wizard__content" :style="{ display: !isEditMode && isFirstStep ? 'block' : 'flex' }">
					<KeepAlive>
						<component
							:is="componentInfo.name"
							v-bind="componentInfo.params"
							v-on="{
								applyData: onApplyData,
								saveModeChanged: componentInfo.name === 'Employees' ? handleSaveModeChanged : undefined
							}"
						>
						</component>
					</KeepAlive>
					<div v-if="hasTreePreview" class="chart-wizard__tree_container">
						<TreePreview
							:parentId="departmentData.parentId"
							:name="departmentData.name"
							:heads="departmentData.heads"
							:userCount="departmentData.userCount"
							:entityType="departmentData.entityType"
							:teamColor="departmentData.teamColor"
						/>
					</div>
				</div>
				<div class="chart-wizard__footer">
					<button
						v-if="stepIndex > 0"
						class="ui-btn ui-btn-light chart-wizard__button --back"
						@click="move('back')"
						data-test-id="hr-company-structure_chart-wizard__back-button"
					>
						<div class="ui-icon-set --chevron-left"></div>
						<span class="chart-wizard__back-button-text">
							{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_BACK_BTN') }}
						</span>
					</button>
					<button
						v-show="stepIndex < visibleSteps.length - 1 && !isEditMode"
						class="ui-btn ui-btn-primary ui-btn-round chart-wizard__button --next"
						:class="{ 'ui-btn-disabled': !isValidStep, 'ui-btn-light-border': isEditMode }"
						@click="move()"
						data-test-id="hr-company-structure_chart-wizard__next-button"
					>
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_NEXT_BTN') }}
					</button>
					<button
						v-show="isEditMode"
						class="ui-btn ui-btn-primary ui-btn-round chart-wizard__button --next"
						:class="{ 'ui-btn-light-border': isEditMode }"
						@click="close(true)"
						data-test-id="hr-company-structure_chart-wizard__discard-button"
					>
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_DISCARD_BTN') }}
					</button>
					<button
						v-show="!isEditMode && stepIndex === visibleSteps.length - 1"
						class="ui-btn ui-btn-primary ui-btn-round chart-wizard__button"
						:class="{ 'ui-btn-wait': waiting }"
						@click="create"
						data-test-id="hr-company-structure_chart-wizard__create-button"
					>
						{{ createButtonText }}
					</button>
					<button
						v-show="isEditMode"
						class="ui-btn ui-btn-primary ui-btn-round chart-wizard__button --save"
						:class="{ 'ui-btn-wait': waiting, 'ui-btn-disabled': !isValidStep, }"
						@click="save"
						data-test-id="hr-company-structure_chart-wizard__save-button"
					>
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_SAVE_BTN') }}
					</button>
				</div>
			</div>
			<div class="chart-wizard__overlay"></div>
		</div>
	`,
};
