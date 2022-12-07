/**
 * @module layout/ui/entity-editor/control/combined/base
 */
jn.define('layout/ui/entity-editor/control/combined/base', (require, exports, module) => {

	const { MultipleCombinedType } = require('layout/ui/fields/multiple-combined');

	/**
	 * @class EntityEditorCombined
	 */
	class EntityEditorCombinedBase extends EntityEditorField
	{
		constructor(props)
		{
			super(props);
			this.type = MultipleCombinedType;
			this.state.isEditable = false;
			this.onEdit = this.onEdit.bind(this);
		}

		componentWillReceiveProps(props)
		{
			super.componentWillReceiveProps(props);
			this.type = MultipleCombinedType;
			this.state.isEditable = false;
		}

		prepareFieldProps()
		{
			return {
				...super.prepareFieldProps(),
				enableToEdit: this.parent.isInEditMode() || this.state.isEditable,
				onEdit: this.onEdit,
			};
		}

		onEdit()
		{
			return new Promise((resolve) => {
				this.setState({
					isEditable: true,
				}, resolve);
			});
		}
	}

	module.exports = { EntityEditorCombinedBase };
});
