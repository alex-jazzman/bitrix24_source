/**
 * @module tasks/layout/fields/template
 */
jn.define('tasks/layout/fields/template', (require, exports, module) => {
	const { TaskTemplateSelector } = require('selector/widget/entity/tasks/task-template');

	class TemplateField extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.fieldContainerRef = null;
		}

		render()
		{
			if (this.props.ThemeComponent)
			{
				return this.props.ThemeComponent(this);
			}

			return null;
		}

		/**
		 * @public
		 * @returns {string}
		 */
		getId()
		{
			return this.props.id;
		}

		/**
		 * @public
		 * @returns {string}
		 */
		get testId()
		{
			return this.props.testId;
		}

		/**
		 * @public
		 * @returns {integer}
		 */
		get taskId()
		{
			return this.props.taskId;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isEmpty()
		{
			return !this.props.templateId;
		}

		/**
		 * @public
		 * @returns {string}
		 */
		getTitleText()
		{
			return this.props.templateTitle;
		}

		/**
		 * @public
		 * @return {(function(): void)|null}
		 */
		getContentClickHandler()
		{
			return this.openTemplateSelector();
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isReadOnly()
		{
			return this.props.readOnly;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isRequired()
		{
			return false;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isValid()
		{
			return true;
		}

		/**
		 * @public
		 * @return {(function(): void)|null}
		 */
		openTemplateSelector()
		{
			if (this.isReadOnly())
			{
				return null;
			}

			return this.openSelector;
		}

		/**
		 * @public
		 * @param ref
		 */
		bindContainerRef = (ref) => {
			this.fieldContainerRef = ref;
		};

		openSelector = () => {
			if (this.isReadOnly())
			{
				return;
			}

			TaskTemplateSelector.make({
				allowMultipleSelection: false,
				closeOnSelect: true,
				events: {
					onItemSelected: ({ item, widgetEntity }) => {
						const templateId = Number(item.params?.id ?? item.id);
						const recentEntityId = item.params?.type;
						if (templateId > 0 && recentEntityId)
						{
							void widgetEntity?.getProvider?.().addRecentItems?.([
								{
									id: templateId,
									entityId: recentEntityId,
								},
							])?.catch?.(() => {});
						}

						if (templateId > 0)
						{
							this.onSave(templateId, item.shortTitle ?? item.title);
						}
					},
				},
				widgetParams: {
					backdrop: {
						mediumPositionPercent: 80,
						horizontalSwipeAllowed: false,
					},
				},
			}).show({}, this.props.parentWidget);
		};

		onSave = (id, title) => {
			if (this.props.onChange)
			{
				this.props.onChange({ id, title });
			}
		};
	}
	module.exports = { TemplateField };
});
