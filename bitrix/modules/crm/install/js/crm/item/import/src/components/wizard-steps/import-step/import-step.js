import { sendData } from 'ui.analytics';
import { BitrixVueComponentProps } from 'ui.vue3';
import { Loc, Type } from 'main.core';
import { ProgressBar } from 'ui.progressbar';
import 'ui.notification';
import { Builder } from 'crm.integration.analytics';

import { ImportSettings } from '../../../lib/model/import-settings';
import type { ImportResponse } from '../../../lib/response/import-response';
import { ServiceLocator } from '../../../lib/service-locator';
import { WizardController } from '../../../lib/service/wizard-controller';

import { SettingsSection, Table, DownloadAlert } from '../../layout';

import { StepEventId } from '../../../lib/constant/step-event-id';

import './import-step.css';

export const ImportStep: BitrixVueComponentProps = {
	name: 'ImportStep',

	eventId: StepEventId.ImportStep,
	title: Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_IMPORT_STEP'),

	startProgressBar: null,
	isStartProgressBarShown: false,
	progressBar: null,

	props: {
		importSettings: {
			type: ImportSettings,
			required: true,
		},
		wizardController: {
			type: WizardController,
			required: false,
		},
	},

	components: {
		SettingsSection,
		Table,
		DownloadAlert,
	},

	data(): Object
	{
		return {
			currentLine: 0,
			processedBytes: 0,
			successImportCount: 0,
			failImportCount: 0,
			duplicateImportCount: 0,
			isFinished: false,
			errorsPreviewTable: {
				headers: [],
				rows: [],
			},
			downloadFailImportFileUrl: null,
			downloadDuplicateImportFileUrl: null,
		};
	},

	mounted(): void
	{
		this.getStartProgressBar().renderTo(this.$refs.progressBar);
		this.isStartProgressBarShown = true;
		this.wizardController.isBottomNavigationHidden = true;

		void this.startImport();
	},

	computed: {
		isShowErrorsPreviewTable(): boolean
		{
			return this.errorsPreviewTable
				&& this.errorsPreviewTable.rows.length > 0
				&& this.errorsPreviewTable.headers.length > 0
			;
		},
		successInfo(): string
		{
			return this.loc('CRM_ITEM_IMPORT_IMPORT_STEP_SUCCESS_IMPORT_COUNT', {
				'#COUNT#': this.successImportCount,
			});
		},
		failInfo(): ?string
		{
			if (this.failImportCount <= 0)
			{
				return null;
			}

			return this.loc('CRM_ITEM_IMPORT_IMPORT_STEP_FAIL_IMPORT_COUNT', {
				'#COUNT#': this.failImportCount,
			});
		},
		duplicateInfo(): ?string
		{
			if (this.duplicateImportCount <= 0)
			{
				return null;
			}

			return this.loc('CRM_ITEM_IMPORT_IMPORT_STEP_DUPLICATE_COUNT', {
				'#COUNT#': this.duplicateImportCount,
			});
		},
	},

	methods: {
		async beforeNext(): Promise<boolean>
		{
			// eslint-disable-next-line no-console
			console.warn('BX.Crm.Item.Import: ImportStep must be last step');

			return false;
		},

		async startImport(): void
		{
			while (!this.isFinished)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					const importResponse = await this.executeImportStep();

					this.adjustProgressbar(importResponse);
					this.updateImportStats(importResponse);
					this.updateImportResults(importResponse);

					if (importResponse.isFinished)
					{
						this.finishImport();

						return;
					}
				}
				catch (error)
				{
					this.handleImportError(error);
				}
			}
		},

		async executeImportStep(): ImportResponse
		{
			return ServiceLocator
				.instance()
				.getController()
				.import({
					importSettings: this.importSettings,
					currentLine: this.currentLine,
				});
		},

		adjustProgressbar(importResponse: ImportResponse): void
		{
			if (this.isStartProgressBarShown)
			{
				this.getStartProgressBar().destroy();
				this.getProgressBar().renderTo(this.$refs.progressBar);

				this.isStartProgressBarShown = false;
			}

			this.processedBytes += importResponse.progressedBytes;
			this.getProgressBar().update(this.processedBytes);
		},

		updateImportStats(importResponse: ImportResponse): void
		{
			this.currentLine = importResponse.currentLine;

			this.successImportCount += importResponse.successImportCount;
			this.failImportCount += importResponse.failImportCount;
			this.duplicateImportCount += importResponse.duplicateImportCount;
		},

		updateImportResults(importResponse: ImportResponse): void
		{
			if (importResponse.errorsPreviewTable)
			{
				this.errorsPreviewTable.headers = importResponse.errorsPreviewTable.headers;
				this.errorsPreviewTable.rows.push(...importResponse.errorsPreviewTable.rows);
			}

			if (importResponse.downloadFailImportFileUrl)
			{
				this.downloadFailImportFileUrl = importResponse.downloadFailImportFileUrl;
			}

			if (importResponse.downloadDuplicateImportFileUrl)
			{
				this.downloadDuplicateImportFileUrl = importResponse.downloadDuplicateImportFileUrl;
			}
		},

		finishImport(): void
		{
			this.isFinished = true;

			const hasDownloadFiles = Type.isStringFilled(this.downloadFailImportFileUrl)
				|| Type.isStringFilled(this.downloadDuplicateImportFileUrl);

			this.wizardController.enableCompleteConfirmation = hasDownloadFiles;
			this.wizardController.enableCancelConfirmation = hasDownloadFiles;
			this.wizardController.enableAgainConfirmation = hasDownloadFiles;

			this.wizardController.isBottomNavigationHidden = false;
			this.wizardController.isFinish = true;

			this.finishProgressBar();

			this.sendFinishAnalytics('success');
		},

		handleImportError(error): void
		{
			this.finishProgressBar();

			this.isFinished = true;

			this.wizardController.enableCompleteConfirmation = false;
			this.wizardController.enableCancelConfirmation = false;
			this.wizardController.enableAgainConfirmation = false;

			this.wizardController.isBottomNavigationHidden = false;
			this.wizardController.isFinish = true;

			this.sendFinishAnalytics('error');

			void console.error(error);

			BX.UI.Notification.Center.notify({
				content: error.errors[0]?.message,
			});
		},

		getProgressBar(): ProgressBar
		{
			if (this.progressBar)
			{
				return this.progressBar;
			}

			this.progressBar = new ProgressBar({
				statusType: 'PERCENT',
				maxValue: this.importSettings.getFilesize(),
			});

			return this.progressBar;
		},

		getStartProgressBar(): ProgressBar
		{
			if (this.startProgressBar)
			{
				return this.startProgressBar;
			}

			this.startProgressBar = new ProgressBar({
				maxValue: 100,
				value: 30,
				infiniteLoading: true,
			});

			return this.startProgressBar;
		},

		finishProgressBar(): void
		{
			if (this.isStartProgressBarShown)
			{
				this.getStartProgressBar().destroy();
				this.getProgressBar().renderTo(this.$refs.progressBar);
			}

			this.getProgressBar().finish();
		},

		sendFinishAnalytics(status: string): void
		{
			sendData(
				Builder
					.Import
					.CreateEvent
					.createDefault(this.importSettings.get('entityTypeId'))
					.setOrigin(this.importSettings.get('origin'))
					.setImportCompleteButton(null)
					.setStatus(status)
					.setSuccessCount(this.successImportCount)
					.setErrorCount(this.failImportCount)
					.setDuplicateCount(this.duplicateImportCount)
					.buildData()
				,
			);
		},

		loc(phrase: string, replace: Object = {}): ?string
		{
			return this.$Bitrix.Loc.getMessage(phrase, replace);
		},
	},

	template: `
		<div class="crm-item-import__wizard-step__import-step">
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_IMPORT_STEP_SECTION_TITLE')">
				<div class="crm-item-import__import-step__progressbar">
					<div ref="progressBar"></div>
				</div>
				<div class="crm-item-import__import-step-statistics">
					<span class="crm-item-import__import-step-statistic-item" v-html="successInfo" />
					<span class="crm-item-import__import-step-statistic-item" v-if="failInfo" v-html="failInfo" />
					<span class="crm-item-import__import-step-statistic-item" v-if="duplicateInfo" v-html="duplicateInfo" />
				</div>
				<div class="crm-item-import__import-step-alerts">
					<DownloadAlert
						v-if="isFinished && downloadFailImportFileUrl"
						phrase="CRM_ITEM_IMPORT_DOWNLOAD_FAIL_IMPORT"
						:download-url="downloadFailImportFileUrl"
					/>
					<DownloadAlert
						v-if="isFinished && downloadDuplicateImportFileUrl"
						phrase="CRM_ITEM_IMPORT_DOWNLOAD_DUPLICATE_IMPORT"
						:download-url="downloadDuplicateImportFileUrl"
					/>
				</div>
				<div class="crm-item-import__import-step-fail-preview" v-if="isShowErrorsPreviewTable">
					<Table v-bind="errorsPreviewTable" />
				</div>
			</SettingsSection>
		</div>
	`,
};
