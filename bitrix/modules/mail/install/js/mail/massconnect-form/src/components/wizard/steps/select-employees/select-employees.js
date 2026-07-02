import { Loc, Text, Validation } from 'main.core';
import { UI } from 'ui.notification';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { Dialog, type Item } from 'ui.entity-selector';
import { Set as IconSet, Outline, BIcon } from 'ui.icon-set.api.vue';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';
import { SaveButton, CancelButton } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { sendData as analyticsSendData } from 'ui.analytics';
import { Api } from '../../../../api';
import { useWizardStore } from '../../../../store/wizard.js';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';
import { EmployeeListTable } from './employee-list-table';
import type { Employee } from '../../../../store/type';
import './select-employees.css';

const LIMIT_BLOCKED_USERS = 3;
const MAX_USERS_PER_LIMIT_REQUEST = 500;
const LIMIT_CHECK_NOTIFICATION_ID = 'mail_massconnect__limit_check_progress';

// @vue/component
export const SelectEmployees = {
	components: {
		UiButton,
		BIcon,
		BMenu,
		EmployeeListTable,
	},

	mixins: [LocalizationMixin],

	props: {
		validationAttempted: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:validity'],

	data(): Object
	{
		return {
			AirButtonStyle,
			actionsMenuActive: false,
			showAddedEmployees: false,
			usersBlockedByLimit: [],
		};
	},

	computed: {
		...mapState(
			useWizardStore,
			[
				'employees',
				'errorState',
				'addedEmployees',
				'isLoginColumnShown',
				'passwordlessMode',
				'isPasswordlessConnectAvailable',
				'analyticsSource',
				'permissions',
			],
		),
		set(): Set
		{
			return IconSet;
		},
		outline(): Outline
		{
			return Outline;
		},
		isEmployeeListEmpty(): boolean
		{
			return this.employees.length === 0;
		},
		areAllEmployeeFieldsValid(): boolean
		{
			return this.employees.every((employee) => {
				const email = (employee.email ?? '').trim();
				if (email.length === 0 || !Validation.isEmail(email))
				{
					return false;
				}

				if (!this.passwordlessMode)
				{
					const password = (employee.password ?? '').trim();
					if (password.length === 0)
					{
						return false;
					}
				}

				return true;
			});
		},
		isValid(): boolean
		{
			if (this.isEmployeeListEmpty)
			{
				return false;
			}

			if (!this.validationAttempted)
			{
				return true;
			}

			return this.areAllEmployeeFieldsValid;
		},
		menuOptions(): MenuOptions
		{
			const items = [];

			if (this.isPasswordlessConnectAvailable)
			{
				items.push({
					title: this.passwordlessMode
						? this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_PASSWORD_SHOW')
						: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_PASSWORD_HIDE'),
					icon: this.passwordlessMode ? this.set.OPENED_EYE : this.set.CROSSED_EYE_2,
					onClick: () => {
						this.togglePasswordlessMode();
					},
				});
			}

			items.push(
				{
					title: this.isLoginColumnShown
						? this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_LOGIN_HIDE')
						: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_LOGIN_SHOW'),
					icon: this.isLoginColumnShown ? this.set.CROSSED_EYE_2 : this.set.OPENED_EYE,
					onClick: () => {
						this.toggleLoginColumn();
					},
				},
				{
					title: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_DELETE_ALL'),
					icon: Outline.TRASHCAN,
					onClick: () => {
						this.actionsMenuActive = false;
						this.clearEmployees();
						this.usersBlockedByLimit = [];
						this.employeeDialog.deselectAll();
					},
				},
			);

			return {
				bindElement: this.$refs.actionsMenuActiveRef,
				items,
			};
		},
		fixingErrorsHintText(): string
		{
			return this.loc(
				'MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_HINT',
			);
		},
		isFixingErrorState(): boolean
		{
			return this.errorState.enabled && this.errorState.errorType === 'auth';
		},
		helpDescLink(): ?string
		{
			// ToDo: make a link when help article is ready
			return null;
		},
	},

	watch: {
		isValid: {
			handler(isValid: boolean): void
			{
				this.$emit('update:validity', isValid);
			},
			immediate: true,
		},
	},

	created(): void
	{
		this.employeeDialog = this.getEmployeeDialog();
	},

	methods: {
		...mapActions(
			useWizardStore,
			[
				'setEmployees',
				'toggleLoginColumn',
				'togglePasswordlessMode',
				'addEmployee',
				'clearEmployees',
			],
		),
		onStepComplete(): void
		{
			analyticsSendData({
				tool: 'mail',
				event: 'mailbox_mass_step2',
				category: 'mail_mass_ops',
				c_section: this.analyticsSource,
			});
		},
		getEmployeeDialog(): Dialog
		{
			const applyButton = new SaveButton({
				useAirDesign: true,
				text: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DIALOG_ADD_BUTTON_TEXT'),
				onclick: async (button) => {
					button.setWaiting(true);
					await this.handleSaveItems(this.employeeDialog.getSelectedItems());
					button.setWaiting(false);
				},
			});

			const cancelButton = new CancelButton({
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				onclick: () => {
					this.employeeDialog.hide();
				},
			});

			return new Dialog({
				width: 420,
				height: 400,
				multiple: true,
				showAvatars: true,
				enableSearch: true,
				context: 'MAIL_MASSCONNECT_EMPLOYEES',
				entities: [
					{
						id: 'structure-node',
						options: {
							selectMode: 'usersAndDepartments',
							forSearch: true,
							allowSelectRootDepartment: true,
							restricted: 'view',
							allowedPermissionLevels: this.permissions.allowedLevels,
						},
					},
				],
				events: {
					onDestroy: () => {
						this.employeeDialog = this.getEmployeeDialog();
					},
				},

				footer: [applyButton.render(), cancelButton.render()],
				footerOptions: {
					containerStyles: {
						display: 'flex',
						'justify-content': 'center',
						gap: '12px',
						'background-color': 'var(--ui-color-palette-white-base)',
					},
				},
			});
		},
		openEmployeeSelector(): void
		{
			const targetNode = this.$refs.addButton.button.getContainer();
			this.employeeDialog.setTargetNode(targetNode);

			if (!this.employeeDialog.isOpen())
			{
				this.employeeDialog.setPreselectedItems(
					this.employees.map((employee) => ['user', employee.id]),
				);

				this.employeeDialog.show();
			}
		},
		createDefaultEmployee(id: number, name: string, avatar: string): Employee
		{
			return {
				id,
				entityId: 'user',
				name,
				avatar,
				email: '',
				login: '',
				password: '',
			};
		},
		async handleSaveItems(items: Item[])
		{
			const selectedUsers = [];
			const departmentsToCheck = [];

			items.forEach((item) => {
				if (item.entityId === 'user')
				{
					selectedUsers.push(
						this.createDefaultEmployee(item.getId(), item.getTitle(), item.getAvatar()),
					);
				}
				else if (item.entityId === 'structure-node')
				{
					departmentsToCheck.push(item.id);
				}
			});

			let departmentUsers = [];
			try
			{
				if (departmentsToCheck.length > 0)
				{
					const rawDepartmentUsers = await Api.getDepartmentsUsers(departmentsToCheck);
					departmentUsers = rawDepartmentUsers.data?.map((user): Employee => {
						return this.createDefaultEmployee(user.id, user.name, user.avatar ?? '');
					});
				}
			}
			catch
			{
				UI.Notification.Center.notify({
					content: this.loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_SELECTOR_ADD_ERROR'),
				});

				return;
			}

			const allNewUsers = [...selectedUsers, ...departmentUsers];

			// Deduplicate against already added employees
			const existingIds = new Set(this.employees.map((e) => e.id));
			const trulyNewUsers = allNewUsers.filter((u) => !existingIds.has(u.id));

			if (trulyNewUsers.length === 0)
			{
				this.employeeDialog.deselectAll();
				this.employeeDialog.hide();

				return;
			}

			// Check limits for new users before adding them
			const newUserIds = trulyNewUsers.map((u) => u.id);
			const userIdsBlockedByLimit = await this.getUserIdsBlockedByLimit(newUserIds);

			const allowedUsers = trulyNewUsers.filter((u) => !userIdsBlockedByLimit.has(u.id));
			const usersBlockedByLimit = trulyNewUsers.filter((u) => userIdsBlockedByLimit.has(u.id));

			// Add only allowed users to the list
			allowedUsers.forEach((employee) => this.addEmployee(employee));

			this.employeeDialog.deselectAll();
			this.employeeDialog.hide();

			// Show popup for users who reached mailbox limit
			if (usersBlockedByLimit.length > 0)
			{
				this.usersBlockedByLimit = usersBlockedByLimit;
				this.showUsersBlockedByLimitPopup(usersBlockedByLimit);
			}
		},
		buildUserNamesHtml(users: Employee[]): string
		{
			return users.map((user) => {
				const userId = Number(user.id);

				return `<a href="/company/personal/user/${userId}/" target="_blank" class="mail_massconnect__limit-popup_link">${Text.encode(user.name)}</a>`;
			}).join(', ');
		},
		showUsersBlockedByLimitPopup(blockedUsers: Employee[]): void
		{
			let content = '';
			if (blockedUsers.length > LIMIT_BLOCKED_USERS)
			{
				const namesHtml = this.buildUserNamesHtml(blockedUsers.slice(0, LIMIT_BLOCKED_USERS));
				const extraCnt = blockedUsers.length - LIMIT_BLOCKED_USERS;
				content = this.loc(
					'MAIL_MASSCONNECT_FORM_LIMIT_POPUP_TEXT_EXTRA',
					{
						'#NAMES#': namesHtml,
						'#EXTRA_CNT#': String(extraCnt),
					},
				);
			}
			else
			{
				const namesHtml = this.buildUserNamesHtml(blockedUsers);
				content = Loc.getMessagePlural(
					'MAIL_MASSCONNECT_FORM_LIMIT_POPUP_TEXT',
					blockedUsers.length,
					{ '#NAMES#': namesHtml },
				);
			}

			MessageBox.show({
				title: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_TITLE'),
				useAirDesign: true,
				message: content,
				modal: true,
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_OPEN_SETTINGS'),
				cancelCaption: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_POPUP_SKIP'),
				onOk: (messageBox) => {
					this.openMailboxGridWithFilter();
					messageBox.close();
				},
			});
		},
		async getUserIdsBlockedByLimit(userIds: number[]): Promise<Set<number>>
		{
			if (userIds.length === 0)
			{
				return new Set();
			}

			const totalCount = userIds.length;
			let processedCount = 0;

			this.showLimitCheckProgress(processedCount, totalCount);

			const chunks = this.chunkUserIds(userIds, MAX_USERS_PER_LIMIT_REQUEST);

			try
			{
				const limitedUserIds = new Set();
				for (const chunk of chunks)
				{
					// eslint-disable-next-line no-await-in-loop
					const response = await Api.checkMailboxLimits(chunk);
					const limitsData = response?.data?.items ?? [];
					const processedChunkCount = Number(response?.data?.processedCount ?? chunk.length);

					processedCount = Math.min(processedCount + processedChunkCount, totalCount);

					this.showLimitCheckProgress(
						processedCount,
						totalCount,
						processedCount >= totalCount,
					);

					limitsData.forEach((item) => {
						if (!item.canConnectNew)
						{
							limitedUserIds.add(item.userId);
						}
					});
				}

				return limitedUserIds;
			}
			catch
			{
				// If limit check fails, allow all users through
				this.hideLimitCheckProgress();

				return new Set();
			}
		},
		showLimitCheckProgress(processedCount: number, totalCount: number, isFinal: boolean = false): void
		{
			UI.Notification.Center.notify({
				id: LIMIT_CHECK_NOTIFICATION_ID,
				content: this.loc('MAIL_MASSCONNECT_FORM_LIMIT_CHECK_PROGRESS', {
					'#PROCESSED#': String(processedCount),
					'#TOTAL#': String(totalCount),
				}),
				autoHide: isFinal,
				autoHideDelay: isFinal ? 2000 : 0,
				closeButton: true,
				blinkOnUpdate: false,
			});
		},
		hideLimitCheckProgress(): void
		{
			const balloon = UI.Notification.Center.getBalloonById(LIMIT_CHECK_NOTIFICATION_ID);
			if (balloon)
			{
				balloon.close();
			}
		},
		chunkUserIds(userIds: number[], chunkSize: number): number[][]
		{
			const chunks = [];
			for (let i = 0; i < userIds.length; i += chunkSize)
			{
				chunks.push(userIds.slice(i, i + chunkSize));
			}

			return chunks;
		},
		openMailboxGridWithFilter(): void
		{
			const params = new URLSearchParams();

			this.usersBlockedByLimit.forEach((u, index) => {
				params.append(`OWNER[${index}]`, `U${Number(u.id)}`);
			});

			params.set('apply_filter', 'Y');

			const url = `/mail/mailbox-list?${params.toString()}`;

			BX.SidePanel.Instance.open(url, {
				data: {
					resetFilterOnClose: true,
				},
			});
		},
	},

	template: `
		<div class="mail_massconnect__select-employees_form">
			<div class="mail_massconnect__employee-list_header">
				<div class="mail_massconnect__section-title_container">
					<span class="mail_massconnect__section-title">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_TITLE') }}
					</span>
					<span v-if="!isFixingErrorState" class="mail_massconnect__section-description">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DESCRIPTION') }}
					</span>
				</div>
				<div
					v-show="!isFixingErrorState"
					class="mail_massconnect__employee-list_header_buttons"
					data-test-id="mail_massconnect__employee-list_header_buttons"
				>
					<UiButton
						ref="addButton"
						:text="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ADD_BUTTON_TITLE')"
						:leftIcon="set.PLUS_IN_CIRCLE"
						:style="AirButtonStyle.TINTED"
						@click="openEmployeeSelector"
					/>
				</div>
			</div>

			<div v-show="!isEmployeeListEmpty" class="mail_massconnect__employee-list_container">
				<div 
					v-if="isFixingErrorState" 
					class="mail_massconnect__fixing-errors-hint_container"
					data-test-id="mail_massconnect__fixing-errors-hint_container"
				>
					<BIcon
						:name="outline.ALERT_ACCENT"
						:size="24"
						color="var(--ui-color-text-alert)"
					/>
					<div class="mail_massconnect__fixing-errors-hint_text">
						{{ fixingErrorsHintText }}
					</div>
					<div v-if="helpDescLink" class="mail_massconnect__fixing-errors-hint_link">
						{{ loc('MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_LINK') }}
					</div>
				</div>
				<div 
					v-else 
					class="mail_massconnect__utility-block_container"
					data-test-id="mail_massconnect__utility-block_container"
				>
					<div
						class="mail_massconnect__employee-list_info_actions"
						@click="actionsMenuActive = true"
						ref="actionsMenuActiveRef"
					>
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_ACTIONS_TITLE') }}
					</div>
					<div class="mail_massconnect__employee-list_info_actions-icon">
						<BIcon :name="outline.CHEVRON_DOWN_L"
							@click="actionsMenuActive = true"
							:size="18"
							color="var(--ui-color-palette-gray-50)"
						>
						</BIcon>
					</div>
					<BMenu v-if="actionsMenuActive" :options="menuOptions" @close="actionsMenuActive = false"/>
				</div>
				<EmployeeListTable
					:isLoginColumnShown="isLoginColumnShown"
					:isPasswordColumnHidden="passwordlessMode"
					:employees="employees"
					:showValidationErrors="validationAttempted"
				/>
			</div>
			<div 
				v-if="addedEmployees.length > 0" 
				class="mail_massconnect__employee-list_added-employees_container"
				data-test-id="mail_massconnect__employee-list_added-employees_container"
			>
				<div
					class="mail_massconnect__employee-list_added-employees_show-button"
					data-test-id="mail_massconnect__employee-list_added-employees_show-button"
					@click="showAddedEmployees = !showAddedEmployees"
				>
					<div class="mail_massconnect__employee-list_added-employees_show-button-text">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_SHOW_ADDED_TITLE') }}
					</div>
					<div class="mail_massconnect__employee-list_added-employees_show-button-icon">
						<BIcon :name="outline.CHEVRON_DOWN_L"
							@click="actionsMenuActive = true"
							:size="18"
							color="var(--ui-color-palette-gray-50)"
						>
						</BIcon>
					</div>
				</div>
				<EmployeeListTable
					v-if="showAddedEmployees"
					:isLoginColumnShown="isLoginColumnShown"
					:employees="addedEmployees"
					:readonlyMode="true"
				/>
			</div>
		</div>
	`,
};
