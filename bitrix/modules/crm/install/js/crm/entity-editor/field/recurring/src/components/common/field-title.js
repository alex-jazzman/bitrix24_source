export const FieldTitle = {
	props: {
		title: {
			type: String,
			required: true,
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
			<label class="ui-entity-editor-block-title-text">{{title}}</label>
		</div>
	`,
};
