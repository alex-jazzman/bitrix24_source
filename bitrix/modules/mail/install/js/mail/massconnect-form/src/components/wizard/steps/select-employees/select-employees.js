import { UI } from 'ui.notification';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { Dialog, Item } from 'ui.entity-selector';
import { Set, Outline, BIcon } from 'ui.icon-set.api.vue';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';
import { SaveButton, CancelButton } from 'ui.buttons';
import { Loc } from 'main.core';
import { Api } from '../../../../api';
import { useWizardStore } from '../../../../store/wizard.js';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';
import { EmployeeListTable } from './employee-list-table';
import type { Employee } from '../../../../store/type';
import { sendData as analyticsSendData } from 'ui.analytics';
import './select-employees.css';

// @vue/component
export const SelectEmployees = {
	components: {
		UiButton,
		BIcon,
		BMenu,
		EmployeeListTable,
	},

	mixins: [LocalizationMixin],

	emits: ['update:validity'],

	data(): Object
	{
		return {
			AirButtonStyle,
			actionsMenuActive: false,
			showAddedEmployees: false,
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
				'analyticsSource',
				'permissions',
			],
		),
		set(): Set
		{
			return Set;
		},
		outline(): Outline
		{
			return Outline;
		},
		isEmployeeListEmpty(): boolean
		{
			return this.employees.length === 0;
		},
		isValid(): boolean
		{
			return !this.isEmployeeListEmpty;
		},
		menuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.actionsMenuActiveRef,
				items: [
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
							this.employeeDialog.deselectAll();
						},
					},
				],
			};
		},
		isFixingErrorsHintText(): string
		{
			return Loc.getMessagePlural(
				'MAIL_MASSCONNECT_FORM_UTILITY_BLOCK_IS_FIXING_ERRORS_HINT',
				this.errorState.errorCnt,
				{ '#ERROR_CNT#': this.errorState.errorCnt },
			);
		},
		helpDescLink(): ?string
		{
			// ToDo: make a link when help article is ready
			return null;
		},
	},

	watch: {
		isValid: {
			handler(isValid)
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
		async handleSaveItems(items: Item[])
		{
			const selectedUsers = [];
			const departmentsToCheck = [];

			items.forEach((item) => {
				if (item.entityId === 'user')
				{
					selectedUsers.push({
						id: item.getId(),
						entityId: 'user',
						name: item.getTitle(),
						avatar: item.getAvatar(),
						email: '',
						login: '',
						password: '',
					});
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
						return {
							id: user.id,
							entityId: 'user',
							name: user.name,
							avatar: (user.avatar === null || user.avatar === '')
								? this.employeeDialog.getEntity('user').getItemOption('avatar', 'user')
								: user.avatar,
							email: '',
							login: '',
							password: '',
						};
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

			[...selectedUsers, ...departmentUsers].forEach((employee) => this.addEmployee(employee));
			this.employeeDialog.deselectAll();
			this.employeeDialog.hide();
		},
	},

	template: `
		<div class="mail_massconnect__select-employees_form">
			<div class="mail_massconnect__employee-list_header">
				<div class="mail_massconnect__section-title_container">
					<span class="mail_massconnect__section-title">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_TITLE') }}
					</span>
					<span v-if="!errorState.enabled" class="mail_massconnect__section-description">
						{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_CARD_DESCRIPTION') }}
					</span>
				</div>
				<div 
					v-show="!errorState.enabled" 
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
					v-if="errorState.enabled" 
					class="mail_massconnect__fixing-errors-hint_container"
					data-test-id="mail_massconnect__fixing-errors-hint_container"
				>
					<div class="mail_massconnect__fixing-errors-hint_image"/>
					<div class="mail_massconnect__fixing-errors-hint_text">
						{{ isFixingErrorsHintText }}
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
					:employees="employees"
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
