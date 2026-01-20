import { Type } from 'main.core';

export type Error = {
	MESSAGE: ?string,
	TYPE: ?string,
	CODE: ?number | string,
	LINK: ?string,
};

// @vue/component
export const ErrorsList = {
	props: {
		errors: {
			type: String,
			required: true,
		},
	},
	computed: {
		parsedErrors(): ?Error[]
		{
			return JSON.parse(this.errors);
		},
		isEmpty(): boolean
		{
			return Type.isNil(this.parsedErrors) || this.parsedErrors.length === 0;
		},
	},
	template: `
		<ul v-if="!isEmpty">
			<li v-for="(error, errorIndex) in parsedErrors" :key="errorIndex">
				{{ (error.MESSAGE ?? '').replace('#LINK#', '') }}
				<a
					v-if="error.LINK"
					:href="error.LINK"
				>
					{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_ACCESS_RIGHTS_MORE_LINK') }}
				</a>
			</li>
		</ul>
		<span v-else>{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_NO_ERRORS_PLACEHOLDER') }}</span>
	`,
};
