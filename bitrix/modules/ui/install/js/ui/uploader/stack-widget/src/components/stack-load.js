import { Loc } from 'main.core';

export const StackLoad = {
	name: 'StackLoad',
	props: {
		isPopupShown: {
			type: Boolean,
			default: false,
		},
		// id of the hidden error text of the widget, null while there is no error
		errorId: {
			type: String,
			default: null,
		},
	},
	emits: ['showPopup'],
	computed: {
		stackLabel(): string
		{
			return Loc.getMessage('STACK_WIDGET_STACK_LABEL_LOADING');
		},
	},
	// language=Vue
	template: `
		<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
		<button
			type="button"
			class="ui-uploader-stack-load"
			data-testid="ui-uploader-stack-load-btn"
			tabindex="0"
			:aria-label="stackLabel"
			aria-haspopup="dialog"
			:aria-expanded="isPopupShown ? 'true' : 'false'"
			:aria-describedby="errorId"
			@click="$emit('showPopup')"
		>
			<div class="ui-uploader-stack-load-icon" aria-hidden="true"></div>
		</button>
	`,
};
