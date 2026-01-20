// @vue/component
export const AddBlockBtn = {
	name: 'AddBlockBtn',
	template: `
		<button
			class="ui-btn --air --wide --style-outline-no-accent ui-btn-no-caps --with-icon"
			type="button"
		>
			<div class="ui-icon-set --plus-l"/>
			<span class="ui-btn-text">
				{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ADD_BLOCK') }}
			</span>
		</button>
	`,
};
