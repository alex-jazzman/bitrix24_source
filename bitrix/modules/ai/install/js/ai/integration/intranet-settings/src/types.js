import { type SettingsRow } from 'ui.form-elements.field';
import { type BaseField } from 'ui.form-elements.view';

export type AiSettingsGroup = {
	code: string,
	title: string,
	description: ?string,
	helpdesk: ?number|string,
	icon: ?{
		set: string,
		code: string,
	},
	items: {[string]: AiSettingsItem},
	relations?: [AiSettingsItemRelations],
};

export type AiSettingsItem = {
	code: string,
	title: string,
	type: 'boolean' | 'list',
	header: string,
	value: any,
	restriction?: AiSettingsItemRestriction,
	options: ?{[string]: string},
	recommended: ?[string],
	onSave: ?{
		title: string,
		callback: string,
	},
};

export type AiSettingsItemRestriction = {
	bannerCode: string,
	helpMessage: string,
}

export type AiSettingsItemField = {
	code: string,
	field: BaseField,
	row: SettingsRow,
};

export type AiSettingsItemRelations = {
	parent: string,
	children: [string],
};

export type ScenarioDisableFeedbackForm = {
	zones: Array<string>,
	id: number,
	lang: string,
	sec: string,
};

export type ScenarioDisableFeedbackSettings = {
	enabled: boolean,
	idPrefix: string,
	forms: Array<ScenarioDisableFeedbackForm>,
};
