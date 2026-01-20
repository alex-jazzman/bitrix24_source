import './error-hint.css';

// @vue/component
export const ErrorHint = {
	props: {
		errorMessage: {
			type: String,
			default: '',
		},
		errorLink: {
			type: String,
			default: null,
		},
	},
	template: `
		<div class="tasks-field-replication-hint">
			<div>{{ errorMessage.replace('#LINK#', '') }}</div>
			<a v-if="errorLink" :href="errorLink">
				{{ loc('TASKS_V2_REPLICATION_NO_ACCESS_MORE') }}
			</a>
		</div>
	`,
};
