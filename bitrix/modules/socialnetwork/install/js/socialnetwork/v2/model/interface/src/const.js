export const TYPES_PROJECT_WIZARD_ACTION = {
	CREATE: 'TYPE_PROJECT_WIZARD_ACTION_CREATE',
	UPDATE: 'TYPE_PROJECT_WIZARD_ACTION_UPDATE',
	COPY: 'TYPE_PROJECT_WIZARD_ACTION_COPY',
};

export function isCreateProjectWizardAction(action: ?string): boolean
{
	return action === TYPES_PROJECT_WIZARD_ACTION.CREATE || !action;
}
