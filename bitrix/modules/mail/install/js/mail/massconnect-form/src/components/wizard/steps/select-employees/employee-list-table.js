import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';
import { useWizardStore } from '../../../../store/wizard.js';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';

// @vue/component
export const EmployeeListTable = {
	components: {
		UiButton,
		BIcon,
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
		readonlyMode: {
			type: Boolean,
			default: false,
		},
	},

	data(): Object {
		return {
			AirButtonStyle,
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
	},

	template: `
		<div 
			class="mail_massconnect__employee-list_table" 
			:class="{ '--login-hidden': !isLoginColumnShown }"
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
					v-if="!readonlyMode" 
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
						<img
							class="mail_massconnect__employee-list_table_employee-avatar"
							:src="encodeURI(employee.avatar)"
							alt=""
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
					<input
						type="email"
						class="mail_massconnect__employee-list_table_input"
						v-model="employee.email"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_EMAIL_COLUMN_PLACEHOLDER')"
						:readonly="readonlyMode"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_email-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_email-input'"
					/>
				</div>
				<div class="mail_massconnect__employee-list_table_cell --login">
					<input
						type="text"
						class="mail_massconnect__employee-list_table_input"
						v-model="employee.login"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_LOGIN_COLUMN_PLACEHOLDER')"
						:readonly="readonlyMode"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_login-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
					/>
				</div>
				<div v-if="!readonlyMode" class="mail_massconnect__employee-list_table_cell --password">
					<input
						type="password"
						class="mail_massconnect__employee-list_table_input"
						v-model="employee.password"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_SELECT_EMPLOYEE_TABLE_PASSWORD_COLUMN_PLACEHOLDER')"
						:data-test-id="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
						:name="'mail_massconnect__employee-list_table_row-' + index + '_password-input'"
					/>
				</div>
			</div>
		</div>
	`,
};
