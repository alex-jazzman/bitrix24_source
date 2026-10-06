export const AJAX_REQUEST_TYPE = {
	COMPONENT: 'component',
	CONTROLLER: 'controller',
};

export const ACTION_TYPE = {
	DELETE: 'delete',
	GROUP_DELETE: 'group-delete',
	EDIT: 'edit',
	RESTART: 'restart',
	UPGRADE: 'upgrade',
};

export const UPGRADE_STATUS = {
	UPDATED: 'updated',
	NEEDS_REVIEW: 'needs_review',
};

export const TEMPLATE_SETUP_EVENT_NAME = {
	SUCCESS: 'Bizproc.AiAgentsGrid.TemplateSetup:success',
};

export const USER_MINI_PROFILE_ATTRIBUTES = {
	USER_ID: 'bx-tooltip-user-id',
	CONTEXT: 'bx-tooltip-context',
};

export const USER_MINI_PROFILE_CONTEXT = {
	B24: 'b24',
};

export const GRID_API_ACTION = {
	START_TEMPLATE: 'Integration.AiAgent.Template.start',
	COPY_AND_START_TEMPLATE: 'Integration.AiAgent.Template.copyAndStart',
	FETCH_ROW: 'Integration.AiAgent.Template.fetchRow',
	DELETE: 'Integration.AiAgent.Template.delete',
	RESTART: 'Integration.AiAgent.Template.start',
	UPGRADE: 'Integration.AiAgent.Template.upgrade',
	CHECK_EXISTING_RUNS: 'Integration.AiAgent.Template.checkExistingRuns',
};

export const EXISTING_RUNS_WARNING_OUTCOME = {
	VIEW_LAUNCHED: 'view-launched',
	LAUNCH_NEW: 'launch-new',
	CANCELLED: 'cancelled',
};

// The toolbar container of the grid filter: main.ui.filter builds its id from the filter id, which
// is the grid id here. Both the focus target after a narrowing and the hint anchor resolve through it.
export const FILTER_SEARCH_CONTAINER_ID_SUFFIX = '_search_container';

// none: never scheduled, pending: scheduled but not closed yet, shown: the hint was closed by the user.
export const FILTER_HINT_STATE = {
	NONE: 'none',
	PENDING: 'pending',
	SHOWN: 'shown',
};
