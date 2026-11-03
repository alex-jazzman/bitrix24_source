import { Loc, Type } from 'main.core';

import {
	isDeletedProjectField,
	syncDeletedProjectField,
	watchDeletedProjectField,
} from './project-field-state';

export const DeletedProjectFieldStateMixin = {
	data(): Object
	{
		return {
			deletedProjectSelectedFields: {},
		};
	},
	methods: {
		isDeletedProjectField(field: Object): boolean
		{
			return isDeletedProjectField(field);
		},

		isDeletedProjectSelected(field: Object): boolean
		{
			const fieldName = field?.fieldName;

			return Type.isStringFilled(fieldName) && this.deletedProjectSelectedFields[fieldName] === true;
		},

		setDeletedProjectSelected(field: Object, isSelected: boolean): void
		{
			const fieldName = field?.fieldName;
			if (Type.isStringFilled(fieldName))
			{
				this.deletedProjectSelectedFields[fieldName] = isSelected;
			}
		},

		getProjectDeletedTitle(): string
		{
			return Type.isFunction(this.getMessage)
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PROJECT_DELETED_VALUE')
				: (Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PROJECT_DELETED_VALUE') ?? '')
			;
		},

		getProjectDeletedHint(): string
		{
			return Type.isFunction(this.getMessage)
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PROJECT_DELETED_HINT')
				: (Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PROJECT_DELETED_HINT') ?? '')
			;
		},

		getFieldRow(field: Object): ?HTMLElement
		{
			if (!this.settingsForm || !Type.isStringFilled(field?.fieldName))
			{
				return null;
			}

			const row = [...this.settingsForm.querySelectorAll('.node-settings-edit-box')]
				.find((box) => box.id === `row_${field.fieldName}`)
			;

			return Type.isElementNode(row) ? row : null;
		},

		getFieldControl(field: Object): ?HTMLElement
		{
			const row = this.getFieldRow(field);
			const control = row?.querySelector('.field-row');

			return Type.isElementNode(control) ? control : null;
		},

		syncDeletedProjectFields(): void
		{
			this.disconnectProjectFieldStateObservers();
			this.deletedProjectSelectedFields = {};

			(this.nodeControls ?? []).forEach((field) => {
				if (!this.isDeletedProjectField(field))
				{
					return;
				}

				const control = this.getFieldControl(field);
				const sync = () => {
					this.setDeletedProjectSelected(
						field,
						syncDeletedProjectField(
							control,
							field,
							null,
							this.getProjectDeletedTitle(),
							(projectField) => this.shouldShowRequiredMark(projectField),
						),
					);
				};

				sync();

				const observer = watchDeletedProjectField(control, field, null, sync);
				if (observer)
				{
					this.projectFieldStateObservers.push(observer);
				}
			});
		},

		disconnectProjectFieldStateObservers(): void
		{
			this.projectFieldStateObservers.forEach((observer) => observer.disconnect());
			this.projectFieldStateObservers = [];
		},
	},
};
