import { Alert } from './alert/alert';
import { DownloadAlert } from './alert/alert-list/download-alert';
import { DownloadExampleAlert } from './alert/alert-list/download-example-alert';
import { ErrorAlert } from './alert/alert-list/error-alert';
import { WarningAlert } from './alert/alert-list/warning-alert';

import { ErrorMessage } from './error-message/error-message';
import { Delimiter } from './delimiter/delimiter';
import { Page } from './page/page';
import { RequiredMark } from './required-mark/required-mark';
import { SettingsSection } from './settings-section/settings-section';
import { Table } from './table/table';

import { Alert as TemporaryAlert, AlertDesign as TemporarySystemDesign } from './system/alert/alert';

export {
	Alert,
	DownloadAlert,
	DownloadExampleAlert,
	ErrorAlert,
	WarningAlert,
	Page,
	RequiredMark,
	SettingsSection,
	Table,
	ErrorMessage,
	Delimiter,
	TemporaryAlert,
	TemporarySystemDesign,
};

export * from './settings-control/index';
