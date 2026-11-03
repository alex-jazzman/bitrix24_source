export const FieldTitle = {
	props: {
		title: {
			type: String,
			required: true,
		},

		/*
			The selectors below the title are plain divs turned into buttons; they borrow this label
			for their accessible name through aria-labelledby, which needs something to point at.
		*/
		labelId: {
			type: String,
			default: '',
		},
	},

	// language=Vue
	template: `
		<div class="ui-entity-editor-block-title ui-entity-widget-content-block-title-edit">
			<label class="ui-entity-editor-block-title-text" :id="labelId || null">{{title}}</label>
		</div>
	`,
};
