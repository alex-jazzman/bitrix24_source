import { ajax, Loc, Text } from 'main.core';
import { Popup } from 'main.popup';
import { Tag } from 'main.core';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';
import type { ButtonOptions } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';
import { FileExport } from 'biconnector.file-export';
import type { Store } from 'ui.vue3.vuex';
import type { RootState } from '../types/state';
import { Analytics } from './analytics';
import { showDeleteFileConfirm } from './delete-file-confirm';
import { showErrorPopup } from './error-popup';

type CheckFileError = { lineNumber: string, columnName: string, errorMessage: string, value: string };

const SAVE_EVENT = 'biconnector:dataset-import-v2:save';
const MAX_DISPLAYED_ERRORS = 200;
const ERRORS_HELP_ARTICLE = '23779844';

export type SaveControllerOptions = {
	sourceCode: string,
	isSupersetReady?: boolean,
};

const STEP_BY_MUTATION: Record<string, string> = {
	setFileProperties: 'step_1',
	setDatasetProperties: 'step_2',
	setFieldRowSettings: 'step_3',
	setFieldsSettings: 'step_3',
	toggleRowVisibility: 'step_3',
	setAllRowsVisible: 'step_3',
	setAllRowsInvisible: 'step_3',
	setDataFormats: 'step_3',
};

export class SaveController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private readonly isSupersetReady: boolean;

	private readonly analytics: Analytics;

	private isChanged: boolean = false;

	private isSaved: boolean = false;

	private isConfirmedClose: boolean = false;

	private lastReportedStep: string = '';

	private ignoreFileErrors: boolean = false;

	private fileErrorsPopup: { close: () => void, destroy: () => void } | null = null;

	private reportDownloadLink: string | null = null;

	private mutationUnsubscribe: (() => void) | null = null;

	private sliderCloseHandler: ((event: { denyAction: () => void }) => void) | null = null;

	constructor(store: Store<RootState>, options: SaveControllerOptions)
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
		this.isSupersetReady = Boolean(options.isSupersetReady);
		this.analytics = new Analytics(this.sourceCode);
	}

	attach(): void
	{
		this.mutationUnsubscribe = (this.store as any).subscribe((mutation: { type: string }) => {
			if (mutation.type === 'setSectionsConfig' || mutation.type === 'resetSectionsConfig')
			{
				return;
			}
			this.isChanged = true;
			this.resetErrorLog();
			this.reportStepChange(mutation.type);
		});

		const slider = (SidePanel as any)?.Instance?.getTopSlider?.();
		if (slider)
		{
			this.sliderCloseHandler = (event: any) => {
				const sliderEvent = event?.getData?.()?.[0] ?? event;
				this.onSliderClose(sliderEvent);
			};
			EventEmitter.subscribe(slider as any, 'SidePanel.Slider:onClose', this.sliderCloseHandler);
		}
	}

	detach(): void
	{
		if (this.mutationUnsubscribe)
		{
			this.mutationUnsubscribe();
			this.mutationUnsubscribe = null;
		}

		const slider = (SidePanel as any)?.Instance?.getTopSlider?.();
		if (slider && this.sliderCloseHandler)
		{
			EventEmitter.unsubscribe(slider as any, 'SidePanel.Slider:onClose', this.sliderCloseHandler);
			this.sliderCloseHandler = null;
		}

		this.closeFileErrorsPopup();
		this.resetErrorLog();
	}

	private resetErrorLog(): void
	{
		if (this.reportDownloadLink)
		{
			window.URL.revokeObjectURL(this.reportDownloadLink);
			this.reportDownloadLink = null;
		}
	}

	canSave(): boolean
	{
		return this.getSaveBlockReason() === null;
	}

	getSaveBlockReason(): string | null
	{
		const state = this.store.state.config;
		const hasConnectionSource = Boolean(
			state.connectionProperties?.connectionId
			&& state.connectionProperties?.tableName,
		);
		if (!state.fileProperties.fileToken && !state.datasetProperties.id && !hasConnectionSource)
		{
			return Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_FILE') ?? '';
		}

		if (state.fieldsSettings.length === 0)
		{
			return Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_FIELDS') ?? '';
		}

		if (state.fieldsSettings.every((row) => !row.visible))
		{
			return Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_VISIBLE_FIELDS') ?? '';
		}

		if (!state.datasetProperties.name || state.datasetProperties.name.length === 0)
		{
			return Loc.getMessage('DATASET_IMPORT_V2_SAVE_BLOCKED_NO_NAME') ?? '';
		}

		return null;
	}

	async checkFile(): Promise<void>
	{
		const state = this.store.state.config;
		try
		{
			const response = await ajax.runAction('biconnector.externalsource.dataset.checkFile', {
				data: {
					type: this.sourceCode,
					fields: {
						fileProperties: state.fileProperties,
						datasetProperties: state.datasetProperties,
						fieldsSettings: state.fieldsSettings,
						dataFormats: state.dataFormats,
					},
				},
			});

			const errors = this.normalizeCheckErrors(response.data?.checkFileErrors);
			if (errors.length === 0)
			{
				this.showInfoPopup(
					Loc.getMessage('DATASET_IMPORT_V2_CHECK_OK_TITLE') ?? '',
					Loc.getMessage('DATASET_IMPORT_V2_CHECK_OK_TEXT') ?? '',
				);
			}
			else
			{
				this.showCheckErrorsPopup(errors);
			}
		}
		catch (error)
		{
			showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_CHECK'));
		}
	}

	async exportFile(): Promise<void>
	{
		const datasetId = this.store.state.config.datasetProperties.id;
		const title = this.store.state.config.datasetProperties.name || 'dataset';
		if (!datasetId)
		{
			return;
		}

		try
		{
			await FileExport.getInstance().download({ id: datasetId, title });
		}
		catch (error)
		{
			showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_EXPORT'));
		}
	}

	async save(): Promise<void>
	{
		const blockReason = this.getSaveBlockReason();
		if (blockReason !== null)
		{
			this.notify(blockReason);

			return;
		}

		const ignoreFileErrors = this.ignoreFileErrors;
		this.ignoreFileErrors = false;

		if (this.sourceCode === 'csv' && this.store.state.config.fileProperties.fileToken && !ignoreFileErrors)
		{
			const fileErrors = await this.collectFileErrors();
			if (fileErrors === null)
			{
				return;
			}

			if (fileErrors.length > 0)
			{
				this.showFileErrorsPopup(fileErrors);

				return;
			}
		}

		const isEditMode = this.store.getters.isEditMode;
		const action = isEditMode
			? 'biconnector.externalsource.dataset.update'
			: 'biconnector.externalsource.dataset.add'
		;

		const payload: Record<string, unknown> = {
			fileProperties: this.store.state.config.fileProperties,
			datasetProperties: this.store.state.config.datasetProperties,
			fieldsSettings: this.store.state.config.fieldsSettings,
			dataFormats: this.store.state.config.dataFormats,
		};

		const connection = this.store.state.config.connectionProperties;
		if (connection)
		{
			payload.connectionSettings = connection;
		}

		const sourceType = connection?.connectionType || this.sourceCode;

		const data: Record<string, unknown> = {
			type: sourceType,
			fields: payload,
		};
		if (isEditMode)
		{
			data.id = this.store.state.config.datasetProperties.id;
		}

		try
		{
			const response = await ajax.runAction(action, { data }) as { data?: { id?: number, name?: string } };
			this.isSaved = true;
			this.isChanged = false;
			this.isConfirmedClose = true;
			this.analytics.send({
				event: isEditMode ? 'edit_end' : 'creation_end',
				status: 'success',
				p1: `datasetName_${(this.store.state.config.datasetProperties.name || '').replaceAll('_', '')}`,
			});
			(SidePanel as any)?.Instance?.postMessage(window, 'BIConnector.dataset-import:onDatasetCreated', {});

			if (isEditMode)
			{
				this.closeSlider();

				return;
			}

			const datasetId = Number(response?.data?.id ?? this.store.state.config.datasetProperties.id);
			const title = response?.data?.name ?? this.store.state.config.datasetProperties.name ?? '';
			const fileName = this.store.state.config.fileProperties.fileName ?? '';
			this.showSuccessPopup(datasetId, title, fileName);
		}
		catch (error)
		{
			this.analytics.send({
				event: isEditMode ? 'edit_end' : 'creation_end',
				status: 'error',
			});
			showErrorPopup(
				error,
				isEditMode ? Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_EDIT') : undefined,
			);
		}
	}

	private notify(message: string): void
	{
		const center = (window as { BX?: { UI?: { Notification?: { Center?: { notify: (params: Record<string, unknown>) => void } } } } })
			.BX?.UI?.Notification?.Center;
		if (center)
		{
			center.notify({ content: message });
		}
	}

	private reportStepChange(mutationType: string): void
	{
		const step = STEP_BY_MUTATION[mutationType];
		if (!step || step === this.lastReportedStep)
		{
			return;
		}

		this.lastReportedStep = step;
		const isEditMode = this.store.getters.isEditMode;
		const params: { event: string, c_element: string, p1?: string } = {
			event: isEditMode ? 'edit_start' : 'creation_start',
			c_element: step,
		};
		if (isEditMode)
		{
			const name = this.store.state.config.datasetProperties.name || '';
			params.p1 = `datasetName_${name.replaceAll('_', '')}`;
		}
		this.analytics.send(params);
	}

	private onSliderClose(event: { denyAction?: () => void }): void
	{
		if (this.isConfirmedClose || this.isSaved || this.store.getters.isEditMode)
		{
			return;
		}

		const fileName = this.store.state.config.fileProperties.fileName || '';
		if (!fileName)
		{
			this.analytics.send({
				event: this.store.getters.isEditMode ? 'edit_end' : 'creation_end',
				status: 'error',
			});

			return;
		}

		event.denyAction?.();

		showDeleteFileConfirm({
			fileName,
			onConfirm: () => {
				this.isConfirmedClose = true;
				this.isChanged = false;
				this.analytics.send({
					event: this.store.getters.isEditMode ? 'edit_end' : 'creation_end',
					status: 'error',
				});
				this.closeSlider();
			},
		});
	}

	private closeSlider(): void
	{
		const slider = (SidePanel as any)?.Instance?.getTopSlider?.();
		if (slider)
		{
			slider.close(true);
		}
	}

	private normalizeCheckErrors(raw: unknown): Array<CheckFileError>
	{
		if (!raw || typeof raw !== 'object')
		{
			return [];
		}

		const fields = this.store.state.config.fieldsSettings;
		const result: Array<CheckFileError> = [];
		Object.entries(raw as Record<string, Array<{ message?: string, customData?: { field?: number, value?: string } }>>)
			.forEach(([lineNumber, errs]) => {
				(errs || []).forEach((e) => {
					const fieldIdx = e?.customData?.field ?? -1;
					result.push({
						lineNumber,
						columnName: fields[fieldIdx]?.name ?? '',
						errorMessage: e?.message ?? '',
						value: e?.customData?.value ?? '',
					});
				});
			});

		return result;
	}

	private async collectFileErrors(): Promise<Array<CheckFileError> | null>
	{
		const state = this.store.state.config;
		try
		{
			const response = await ajax.runAction('biconnector.externalsource.dataset.checkFile', {
				data: {
					type: this.sourceCode,
					fields: {
						fileProperties: state.fileProperties,
						datasetProperties: state.datasetProperties,
						fieldsSettings: state.fieldsSettings,
						dataFormats: state.dataFormats,
					},
				},
			});

			return this.normalizeCheckErrors(response.data?.checkFileErrors);
		}
		catch (error)
		{
			showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_CHECK'));

			return null;
		}
	}

	private continueSaveIgnoringErrors(): void
	{
		this.ignoreFileErrors = true;
		this.closeFileErrorsPopup();
		EventEmitter.emit(SAVE_EVENT, {});
	}

	private closeFileErrorsPopup(): void
	{
		if (this.fileErrorsPopup)
		{
			this.fileErrorsPopup.destroy();
			this.fileErrorsPopup = null;
		}
	}

	private downloadErrorLog(button: Button): void
	{
		if (this.reportDownloadLink)
		{
			this.triggerLogDownload();

			return;
		}

		button.setWaiting(true);
		const state = this.store.state.config;
		ajax.runAction('biconnector.externalsource.dataset.logErrorsIntoFile', {
			data: {
				type: this.sourceCode,
				fields: state,
			},
		})
			.then((response: { data?: string }) => {
				button.setWaiting(false);
				const blob = new Blob([response?.data ?? ''], { type: 'text/html' });
				this.reportDownloadLink = window.URL.createObjectURL(blob);
				this.triggerLogDownload();
			})
			.catch(() => {
				button.setWaiting(false);
			});
	}

	private triggerLogDownload(): void
	{
		if (!this.reportDownloadLink)
		{
			return;
		}
		const link = document.createElement('a');
		link.href = this.reportDownloadLink;
		link.download = `${this.store.state.config.datasetProperties.name || 'csv_table'}_errors.html`;
		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	private showFileErrorsPopup(errors: Array<CheckFileError>): void
	{
		this.closeFileErrorsPopup();

		const displayed = errors.slice(0, MAX_DISPLAYED_ERRORS);
		const countText = errors.length > MAX_DISPLAYED_ERRORS
			? `${MAX_DISPLAYED_ERRORS}+`
			: String(errors.length)
		;
		const title = (Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_TITLE') ?? '').replace('#COUNT#', countText);

		const content = Tag.render`
			<div class="biconnector-dataset-import-v2-file-errors" data-testid="dataset-import-file-errors-popup">
				<div class="biconnector-dataset-import-v2-file-errors__header">
					<div class="biconnector-dataset-import-v2-file-errors__graphic"></div>
					<div class="biconnector-dataset-import-v2-file-errors__header-body">
						<h3 class="biconnector-dataset-import-v2-file-errors__title" id="biconnector-dataset-import-v2-file-errors-title">${title}</h3>
						<div class="biconnector-dataset-import-v2-file-errors__description">
							<span class="biconnector-dataset-import-v2-file-errors__description-text">${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_DESCRIPTION')}</span>
							<a
								class="biconnector-dataset-import-v2-file-errors__more"
								href="#"
								aria-label="${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_MORE_LABEL')}"
								data-testid="dataset-import-file-errors-help-link"
							>${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_MORE')}</a>
						</div>
					</div>
				</div>
				<div class="biconnector-dataset-import-v2-file-errors__table" data-testid="dataset-import-file-errors-table">
					<div
						class="biconnector-dataset-import-v2-file-errors__scroll"
						role="table"
						aria-label="${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_TABLE_LABEL')}"
					>
						<div class="biconnector-dataset-import-v2-file-errors__row biconnector-dataset-import-v2-file-errors__row--head" role="row">
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_PROBLEM')}</span>
							</div>
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_VALUE')}</span>
							</div>
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_ROW')}</span>
							</div>
							<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--head" role="columnheader">
								<span class="biconnector-dataset-import-v2-file-errors__cell-text">${Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_COL_COLUMN')}</span>
							</div>
						</div>
						<div class="biconnector-dataset-import-v2-file-errors__tbody" role="rowgroup"></div>
					</div>
				</div>
				<div class="biconnector-dataset-import-v2-file-errors__actions"></div>
			</div>
		`;

		const tbody = content.querySelector('.biconnector-dataset-import-v2-file-errors__tbody');
		displayed.forEach((error) => {
			tbody?.appendChild(Tag.render`
				<div class="biconnector-dataset-import-v2-file-errors__row" role="row">
					<div class="biconnector-dataset-import-v2-file-errors__cell" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text">${Text.encode(error.errorMessage)}</span>
					</div>
					<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--value" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text">${error.value ? Text.encode(error.value) : '—'}</span>
					</div>
					<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--muted" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text">${Text.encode(error.lineNumber)}</span>
					</div>
					<div class="biconnector-dataset-import-v2-file-errors__cell biconnector-dataset-import-v2-file-errors__cell--muted" role="cell">
						<span class="biconnector-dataset-import-v2-file-errors__cell-text" title="${Text.encode(error.columnName)}">${Text.encode(error.columnName)}</span>
					</div>
				</div>
			`);
		});

		content.querySelector('.biconnector-dataset-import-v2-file-errors__more')
			?.addEventListener('click', (event: Event) => {
				event.preventDefault();
				(window.top as any)?.BX?.Helper?.show(`redirect=detail&code=${ERRORS_HELP_ARTICLE}`);
			});

		const closeButton = Tag.render`
			<button
				type="button"
				class="biconnector-dataset-import-v2-file-errors__close"
				aria-label="${Loc.getMessage('DATASET_IMPORT_V2_POPUP_CLOSE')}"
				data-testid="dataset-import-file-errors-close-btn"
			></button>
		`;
		const closeIcon = new Icon({ icon: Outline.CROSS_L, size: 28 }).render();
		closeIcon.setAttribute('aria-hidden', 'true');
		closeButton.append(closeIcon);
		closeButton.addEventListener('click', () => this.closeFileErrorsPopup());
		content.querySelector('.biconnector-dataset-import-v2-file-errors__header')?.append(closeButton);

		const downloadButtonOptions: Partial<ButtonOptions> = {
			useAirDesign: true,
			text: Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_DOWNLOAD') ?? '',
			style: AirButtonStyle.PLAIN,
			size: ButtonSize.LARGE,
			onclick: (): {} => {
				this.downloadErrorLog(downloadButton);

				return {};
			},
		};
		const downloadButton: Button = new Button(downloadButtonOptions as ButtonOptions);
		downloadButton.render().dataset.testid = 'dataset-import-file-errors-download-btn';

		const continueButtonOptions: Partial<ButtonOptions> = {
			useAirDesign: true,
			text: Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_CONTINUE') ?? '',
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.LARGE,
			onclick: (): {} => {
				this.continueSaveIgnoringErrors();

				return {};
			},
		};
		const continueButton = new Button(continueButtonOptions as ButtonOptions);
		continueButton.render().dataset.testid = 'dataset-import-file-errors-continue-btn';

		const stopButtonOptions: Partial<ButtonOptions> = {
			useAirDesign: true,
			text: Loc.getMessage('DATASET_IMPORT_V2_FILE_ERRORS_STOP') ?? '',
			style: AirButtonStyle.FILLED,
			size: ButtonSize.LARGE,
			onclick: (): {} => {
				this.closeFileErrorsPopup();

				return {};
			},
		};
		const stopButton = new Button(stopButtonOptions as ButtonOptions);
		stopButton.render().dataset.testid = 'dataset-import-file-errors-stop-btn';

		const actions = content.querySelector('.biconnector-dataset-import-v2-file-errors__actions');
		actions?.append(downloadButton.render(), continueButton.render(), stopButton.render());

		const popup = new Popup({
			id: 'biconnector-import-v2-file-errors',
			content,
			className: 'biconnector-dataset-import-v2-file-errors-popup',
			width: 1072,
			padding: 0,
			autoHide: false,
			fixed: true,
			overlay: true,
			closeIcon: false,
			closeByEsc: true,
			cacheable: false,
			ariaLabelledBy: 'biconnector-dataset-import-v2-file-errors-title',
			focusTrap: {
				initialFocus: 'first-tabbable',
			},
			events: {
				onPopupClose: () => {
					this.fileErrorsPopup = null;
				},
			},
		} as any);

		this.fileErrorsPopup = popup as unknown as { close: () => void, destroy: () => void };
		popup.show();
	}

	private showSuccessPopup(datasetId: number, title: string, fileName: string): void
	{
		const header = (Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_TITLE') ?? '').replace('#NAME#', Text.encode(title));
		const description = (Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_DESCRIPTION') ?? '').replace('#FILE_NAME#', Text.encode(fileName));

		const content = Tag.render`
			<div class="biconnector-dataset-import-v2-success">
				<div class="biconnector-dataset-import-v2-success__body">
					<div class="biconnector-dataset-import-v2-success__mascot"></div>
					<div class="biconnector-dataset-import-v2-success__text">
						<h3 class="biconnector-dataset-import-v2-success__title">${header}</h3>
						<div class="biconnector-dataset-import-v2-success__description">${description}</div>
					</div>
				</div>
				<div class="biconnector-dataset-import-v2-success__actions"></div>
			</div>
		`;
		const actions = content.querySelector('.biconnector-dataset-import-v2-success__actions');

		const popup: any = new Popup({
			id: 'biconnector-import-v2-success',
			content,
			className: 'biconnector-dataset-import-v2-success-popup',
			width: 400,
			padding: 0,
			autoHide: false,
			fixed: true,
			overlay: true,
			closeIcon: true,
			events: {
				onPopupClose: () => this.closeSlider(),
			},
		} as any);

		const createMoreBtn = Tag.render`
			<button
				type="button"
				class="biconnector-dataset-import-v2-success__btn biconnector-dataset-import-v2-success__btn--secondary"
			>
				${Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_CREATE_MORE')}
			</button>
		`;
		createMoreBtn.addEventListener('click', () => {
			window.location.reload();
		});
		actions?.append(createMoreBtn);

		if (this.isSupersetReady)
		{
			const createDatasetBtn = Tag.render`
				<button
					type="button"
					class="biconnector-dataset-import-v2-success__btn biconnector-dataset-import-v2-success__btn--primary"
				>
					${Loc.getMessage('DATASET_IMPORT_V2_SUCCESS_CREATE_DATASET')}
				</button>
			`;
			createDatasetBtn.addEventListener('click', () => {
				(createDatasetBtn as HTMLButtonElement).disabled = true;
				ajax.runAction('biconnector.externalsource.dataset.getCreateUrl', {
					data: { id: datasetId },
				})
					.then((response: { data?: string }) => {
						const link = response?.data;
						if (link)
						{
							window.open(link, '_blank')?.focus();
						}
						popup.close();
					})
					.catch(() => {
						(createDatasetBtn as HTMLButtonElement).disabled = false;
						popup.close();
					});
			});
			actions?.append(createDatasetBtn);
		}

		popup.show();
	}

	private showInfoPopup(title: string, text: string): void
	{
		const popup = new Popup({
			id: 'biconnector-import-v2-info',
			content: Tag.render`
				<div class="biconnector-dataset-import-v2-popup">
					<h3 class="biconnector-dataset-import-v2-popup__header">${Text.encode(title)}</h3>
					<div class="biconnector-dataset-import-v2-popup__content">${Text.encode(text)}</div>
				</div>
			`,
			width: 440,
			autoHide: true,
			fixed: true,
			overlay: false,
			closeIcon: true,
		} as any);

		popup.show();
	}

	private showCheckErrorsPopup(errors: Array<CheckFileError>): void
	{
		const list = errors.map((e) => Tag.render`
			<li class="biconnector-dataset-import-v2-popup__error-item">
				<span class="biconnector-dataset-import-v2-popup__error-line">#${Text.encode(e.lineNumber)}</span>
				<span class="biconnector-dataset-import-v2-popup__error-col">${Text.encode(e.columnName)}</span>
				<span class="biconnector-dataset-import-v2-popup__error-msg">${Text.encode(e.errorMessage)}</span>
			</li>
		`);

		const wrapper = Tag.render`
			<div class="biconnector-dataset-import-v2-popup">
				<h3 class="biconnector-dataset-import-v2-popup__header">
					${Loc.getMessage('DATASET_IMPORT_V2_CHECK_ERRORS_TITLE')}
				</h3>
				<ul class="biconnector-dataset-import-v2-popup__error-list"></ul>
			</div>
		`;
		const ulNode = wrapper.querySelector('.biconnector-dataset-import-v2-popup__error-list');
		list.forEach((li) => ulNode?.appendChild(li));

		const popup = new Popup({
			id: 'biconnector-import-v2-check-errors',
			content: wrapper,
			width: 520,
			autoHide: true,
			fixed: true,
			overlay: false,
			closeIcon: true,
		} as any);

		popup.show();
	}
}
