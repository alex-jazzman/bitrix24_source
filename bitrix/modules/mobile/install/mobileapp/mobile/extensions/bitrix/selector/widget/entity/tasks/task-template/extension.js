/**
 * @module selector/widget/entity/tasks/task-template
 */
jn.define('selector/widget/entity/tasks/task-template', (require, exports, module) => {
	const { BaseSelectorEntity } = require('selector/widget/entity');
	const { Icon } = require('ui-system/blocks/icon');
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	class TaskTemplateSelector extends BaseSelectorEntity
	{
		static getEntityId()
		{
			return 'task-template-with-id';
		}

		static getContext()
		{
			return 'mobile-task';
		}

		static getStartTypingText()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_TASK_TEMPLATE_START_TYPING');
		}

		static isCreationEnabled()
		{
			return false;
		}

		static getTitle()
		{
			return Loc.getMessage('SELECTOR_COMPONENT_TASK_TEMPLATE_TITLE');
		}

		static prepareItemForDrawing(template)
		{
			return {
				title: template.title,
				type: 'info',
				sectionCode: 'common',
				height: 64,
				disabled: false,
				useLetterImage: false,
				avatar: {
					hideOutline: true,
					placeholder: {
						type: 'svg',
						backgroundColor: Color.accentSoftBlue3.toHex(),
						svg: {
							named: Icon.TEMPLATE_TASK.getIconName(),
							tintColor: Color.accentMainPrimary.toHex(),
						},
					},
				},
			};
		};
	}

	module.exports = { TaskTemplateSelector };
});