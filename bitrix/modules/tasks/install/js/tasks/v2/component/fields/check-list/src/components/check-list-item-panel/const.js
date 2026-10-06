import { PanelAction } from './check-list-item-panel-meta';

export const FormattingActions = Object.freeze([
	PanelAction.Bold,
	PanelAction.Italic,
	PanelAction.Underline,
	PanelAction.Strikethrough,
	PanelAction.Link,
]);

export const DefaultActions = Object.freeze([
	PanelAction.SetImportant,
	PanelAction.MoveRight,
	PanelAction.MoveLeft,
	PanelAction.AssignAccomplice,
	PanelAction.AssignAuditor,
	PanelAction.Forward,
	PanelAction.Delete,
]);

export const RootItemActions = Object.freeze([
	PanelAction.AssignAccomplice,
	PanelAction.AssignAuditor,
]);

export const StakeholderActions = Object.freeze([
	PanelAction.AssignAccomplice,
	PanelAction.AssignAuditor,
]);
