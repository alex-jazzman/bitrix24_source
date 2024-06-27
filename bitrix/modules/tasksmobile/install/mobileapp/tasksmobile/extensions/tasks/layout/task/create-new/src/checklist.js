/**
 * @module tasks/layout/task/create-new/checklist
 */
jn.define('tasks/layout/task/create-new/checklist', (require, exports, module) => {
	const { ChecklistController } = require('tasks/checklist');
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	class Checklist extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.initChecklist(props);

			this.onChange = this.onChange.bind(this);
		}

		componentWillReceiveProps(props)
		{
			this.initChecklist(props);
		}

		initChecklist(props)
		{
			this.controller = new ChecklistController({ ...props, onChange: this.onChange });

			this.state = {
				checklist: props.checklist,
				checklistsIds: this.controller.getChecklistsIds(),
			};
		}

		render()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 10,
						borderWidth: 1,
						borderColor: this.getBorderColor(),
						borderRadius: 8,
						...this.props.style,
					},
					onClick: () => {
						let [checklist] = this.controller.getChecklists().values();
						checklist = (checklist || this.controller.createChecklist());

						void this.controller.openChecklist({
							checklist,
							parentWidget: this.props.parentWidget,
						});
					},
				},
				Image({
					style: {
						width: 20,
						height: 20,
						marginRight: 4,
					},
					svg: {
						content: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 3.5H4C2.89543 3.5 2 4.39543 2 5.5V15.5C2 16.6046 2.89543 17.5 4 17.5H16C17.1046 17.5 18 16.6046 18 15.5V8L17 9V15.5C17 16.0523 16.5523 16.5 16 16.5H4C3.44772 16.5 3 16.0523 3 15.5V5.5C3 4.94772 3.44772 4.5 4 4.5H13L14 3.5ZM9.35355 7.21751C9.15829 7.02225 9.15829 6.70566 9.35355 6.5104C9.54882 6.31514 9.8654 6.31514 10.0607 6.5104L12.5355 8.98528L17.8388 3.68198C18.0341 3.48671 18.3507 3.48671 18.5459 3.68198C18.7412 3.87724 18.7412 4.19382 18.5459 4.38908L13.2426 9.69238L12.5355 10.3995L11.8284 9.69238L9.35355 7.21751ZM6 10C6 9.72386 6.22386 9.5 6.5 9.5H8.5C8.77614 9.5 9 9.72386 9 10C9 10.2761 8.77614 10.5 8.5 10.5H6.5C6.22386 10.5 6 10.2761 6 10ZM6 13C6 12.7239 6.22386 12.5 6.5 12.5H13.5C13.7761 12.5 14 12.7239 14 13C14 13.2761 13.7761 13.5 13.5 13.5H6.5C6.22386 13.5 6 13.2761 6 13Z" fill="${this.getTextColor()}"/></svg>`,
					},
				}),
				Text({
					style: {
						fontSize: 14,
						fontWeight: '400',
						color: this.getTextColor(),
					},
					text: Loc.getMessage('TASKSMOBILE_TASK_CREATE_FIELD_CHECKLIST_PLACEHOLDER'),
				}),
			);
		}

		onChange(checklist)
		{
			if (this.props.onChange)
			{
				this.props.onChange(checklist);
			}
			this.setState({ checklist });
		}

		getBorderColor()
		{
			return (this.state.checklist.isEmpty() ? Color.base6 : Color.accentMainPrimary);
		}

		getTextColor()
		{
			return (this.state.checklist.isEmpty() ? Color.base3 : Color.accentMainPrimary);
		}
	}

	module.exports = { Checklist };
});
