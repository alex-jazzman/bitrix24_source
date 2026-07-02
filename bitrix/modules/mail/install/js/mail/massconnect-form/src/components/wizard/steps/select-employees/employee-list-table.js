import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { Validation } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';
import { InputDesign, InputSize } from 'ui.system.input';
import { BInput } from 'ui.system.input.vue';
import { Avatar } from 'ui.vue3.components.avatar';
import { useWizardStore } from '../../../../store/wizard.js';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';

const AVATAR_SIZE = 22;

// @vue/component
export const EmployeeListTable = {
	components: {
		UiButton,
		BIcon,
		BInput,
		Avatar,
	},

	mixins: [LocalizationMixin],

	props: {
		isLoginColumnShown: {
			type: Boolean,
			default: true,
		},
		/** @type {Employee[]} */
		employees: {
			type: Array,
			required: true,
		},
		isPasswordColumnHidden: {
			type: Boolean,
			default: false,
		},
		readonlyMode: {
			type: Boolean,
			default: false,
		},
		showValidationErrors: {
			type: Boolean,
			default: false,
		},
	},

	data(): Object {
		return {
			AirButtonStyle,
			InputDesign,
			InputSize,
			touchedFields: new Set(),
		};
	},

	computed: {
		outline(): Outline
		{
			return Outline;
		},
	},

	methods: {
		...mapActions(useWizardStore, ['removeEmployeeById']),
		getAvatarOptions(employee: Object): Object
		{
			return {
				size: AVATAR_SIZE,
				userName: employee.avatar ? employee.name : null,
				userpicPath: employee.avatar || '',
			};
		},
		markTouched(employeeId: number, field: string): void
		{
			this.touchedFields.add(`${employeeId}_${field}`);
		},
		shouldShowError(employeeId: number, field: string): boolean
		{
			return this.showValidationErrors || this.touchedFields.has(`${employeeId}_${field}`);
		},
		getEmailError(employee: Object): string
		{
			if (!this.shouldShowError(employee.id, 'email'))
			{
				return '';
			}

			const email = (employee.email ?? '').trim();
			if (email.length === 0)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_EMAIL_EMPTY_ERROR');
			}

			if (!Validation.isEmail(email))
			{
				return this.loc('MAIL_MASSCONNECT_FORM_EMAIL_VALIDATION_ERROR');
			}

			return '';
		},
		getPasswordError(employee: Object): string
		{
			if (!this.shouldShowError(employee.id, 'password'))
			{
				return '';
			}

			const password = (employee.password ?? '').trim();
			if (password.length === 0)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_PASSWORD_EMPTY_ERROR');
			}

			return '';
		},
	},

	template: `
		<div 
			class="mail_massconnect__employee-list_table"
			:class="{ '--login-hidden': !isLoginColumnShown, '--password-hidden': isPasswordColumnHidden }"
			data-test-id="mail_massconnect__employee-list_table"
		>
			<div class="mail_massconnect__employee-list_table_header">
				<div class="mail_massconnect__employee-list_table_cell --name">
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_NAME_COLUMN_TITLE') }}
				</div>
				<div class="mail_massconnect__employee-list_table_cell --email">
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_TITLE') }}
				</div>
				<div 
					v-if="isLoginColumnShown" 
					class="mail_massconnect__employee-list_table_cell --login"
					data-test-id="mail_massconnect__employee-list_table_login-header"
				>
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_TITLE') }}
				</div>
				<div
					v-if="!readonlyMode && !isPasswordColumnHidden"
					class="mail_massconnect__employee-list_table_cell --password"
					data-test-id="mail_massconnect__employee-list_table_password-header"
				>
					{{ loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_TITLE') }}
				</div>
			</div>
			<div v-for="(employee, index) in employees"
				:key="employee.id"
				class="mail_massconnect__employee-list_table_row"
				:data-test-id="'mail_massconnect__employee-list_table_row-' + index"
			>
				<div class="mail_massconnect__employee-list_table_cell --name">
					<div class="mail_massconnect__employee-list_table_employee-info">
						<Avatar
							:options="getAvatarOptions(employee)"
							:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_avatar'"
						/>
						<span 
							class="mail_massconnect__employee-list_table_employee-name"
							:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_name'"
						>
							{{ employee.name }}
						</span>
						<div 
							class="mail_massconnect__employee-list_table_delete-btn-container"
							:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_delete-btn-container'"
						>
							<UiButton
								v-if="!readonlyMode"
								:style="AirButtonStyle.OUTLINE"
								:leftIcon="outline.CROSS_M"
								class="mail_massconnect__employee-list_table_delete-employee"
								@click="removeEmployeeById(employee.id)"
							/>
						</div>
					</div>
				</div>
				<div class="mail_massconnect__employee-list_table_cell --email">
					<BInput
						v-model="employee.email"
						:size="InputSize.Lg"
						:design="readonlyMode ? InputDesign.Disabled : InputDesign.Naked"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_PLACEHOLDER')"
						:error="getEmailError(employee)"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_email-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_email-input'"
						@blur="markTouched(employee.id, 'email')"
					/>
				</div>
				<div class="mail_massconnect__employee-list_table_cell --login">
					<BInput
						v-model="employee.login"
						:size="InputSize.Lg"
						:design="readonlyMode ? InputDesign.Disabled : InputDesign.Naked"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_PLACEHOLDER')"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_login-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_login-input'"
					/>
				</div>
				<div v-if="!readonlyMode && !isPasswordColumnHidden" class="mail_massconnect__employee-list_table_cell --password">
					<BInput
						v-model="employee.password"
						type="password"
						:size="InputSize.Lg"
						:design="InputDesign.Naked"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_PLACEHOLDER')"
						:error="getPasswordError(employee)"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
						@blur="markTouched(employee.id, 'password')"
					/>
				</div>
			</div>
		</div>
	`,
};
