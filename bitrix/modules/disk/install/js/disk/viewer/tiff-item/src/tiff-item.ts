import { ajax as Ajax, Dom, Event, Loc, Reflection, Tag, Text, Type } from 'main.core';

import './tiff-item.css';

type PreviewStatus = 'ready' | 'preparing' | 'error';

type PreviewData = {
	status: PreviewStatus,
	previewUrl: string | null,
	downloadUrl: string | null,
	errorCode: string | null,
	message: string | null,
};

type ViewerItemInstance = {
	setPropertiesByNode(node: HTMLElement): void,
	setDownloadUrl(url: string | null): void,
	getDownloadUrl(): string | null | undefined,
	getTitle(): string | null | undefined,
	destroy(): void,
};

type ViewerItemConstructor = new(options: Record<string, unknown>) => ViewerItemInstance;

const ViewerItem = Reflection.namespace('BX.UI.Viewer.Item') as ViewerItemConstructor;
const POLL_INTERVAL = 4000;
const MAX_POLL_ATTEMPTS = 15;

export class TiffItem extends ViewerItem
{
	private tiffPreviewUrl: string | null;
	private previewData: PreviewData | null;
	private contentNode: HTMLElement | null;
	private pollTimeoutId: number | null;
	private pollAttempts: number;
	private isActive: boolean;
	private isDestroyed: boolean;
	private isRequesting: boolean;
	private isVisibilityChangeBound: boolean;

	constructor(options: Record<string, unknown> = {})
	{
		super(options);

		this.tiffPreviewUrl = normalizeString(options.tiffPreviewUrl);
		this.previewData = null;
		this.contentNode = null;
		this.pollTimeoutId = null;
		this.pollAttempts = 0;
		this.isActive = false;
		this.isDestroyed = false;
		this.isRequesting = false;
		this.isVisibilityChangeBound = false;
	}

	setPropertiesByNode(node: HTMLElement): void
	{
		super.setPropertiesByNode(node);

		this.tiffPreviewUrl = normalizeString(node.dataset.tiffPreviewUrl);
	}

	listContainerModifiers(): string[]
	{
		return [
			'ui-viewer-document',
			'ui-viewer-document-tiff',
		];
	}

	loadData(): Promise<TiffItem>
	{
		if (!Type.isStringFilled(this.tiffPreviewUrl))
		{
			this.previewData = this.createNetworkErrorData();
		}

		return Promise.resolve(this);
	}

	private async requestPreview(isPolling: boolean = false): Promise<void>
	{
		if (this.isRequesting || this.isDestroyed || !Type.isStringFilled(this.tiffPreviewUrl))
		{
			return;
		}

		this.isRequesting = true;
		this.clearPollTimeout();
		if (isPolling)
		{
			this.pollAttempts++;
		}

		try
		{
			const response = await Ajax.promise({
				url: this.tiffPreviewUrl,
				method: 'GET',
				dataType: 'json',
			});

			this.previewData = this.normalizePreviewData(response?.data);
			if (this.previewData.status !== 'preparing')
			{
				this.pollAttempts = 0;
			}

			if (Type.isStringFilled(this.previewData.downloadUrl))
			{
				this.setDownloadUrl(this.previewData.downloadUrl);
			}
		}
		catch
		{
			this.pollAttempts = 0;
			this.previewData = this.createNetworkErrorData();
		}
		finally
		{
			this.isRequesting = false;
			this.renderCurrentState();
			this.schedulePoll();
		}
	}

	private normalizePreviewData(data: unknown): PreviewData
	{
		if (!Type.isPlainObject(data))
		{
			throw new TypeError('Invalid TIFF preview response');
		}
		const rawData = data as Record<string, unknown>;

		if (rawData.status === 'ready' && Type.isStringFilled(rawData.previewUrl))
		{
			return {
				status: 'ready',
				previewUrl: normalizeString(rawData.previewUrl),
				downloadUrl: null,
				errorCode: null,
				message: null,
			};
		}

		if (rawData.status === 'preparing')
		{
			return {
				status: 'preparing',
				previewUrl: null,
				downloadUrl: normalizeString(rawData.downloadUrl),
				errorCode: null,
				message: null,
			};
		}

		if (rawData.status === 'error')
		{
			return {
				status: 'error',
				previewUrl: null,
				downloadUrl: normalizeString(rawData.downloadUrl),
				errorCode: normalizeString(rawData.errorCode),
				message: normalizeString(rawData.message) ?? getMessage('DISK_TIFF_VIEWER_ERROR_MESSAGE'),
			};
		}

		throw new TypeError('Unknown TIFF preview status');
	}

	private createNetworkErrorData(): PreviewData
	{
		const downloadUrl = normalizeString(this.getDownloadUrl());

		return {
			status: 'error',
			previewUrl: null,
			downloadUrl,
			errorCode: null,
			message: getMessage('DISK_TIFF_VIEWER_NETWORK_ERROR_MESSAGE'),
		};
	}

	render(): HTMLElement
	{
		const rootNode = Tag.render`<div class="ui-viewer-item-document-content disk-viewer-tiff"></div>`;
		const contentNode = Tag.render`<div class="disk-viewer-tiff__content"></div>`;
		Dom.append(contentNode, rootNode);

		this.contentNode = contentNode;
		this.renderCurrentState();

		return rootNode;
	}

	private renderCurrentState(): void
	{
		if (!Type.isDomNode(this.contentNode) || this.previewData === null)
		{
			return;
		}

		Dom.clean(this.contentNode);

		if (this.previewData.status === 'ready')
		{
			Dom.append(this.renderImage(), this.contentNode);

			return;
		}

		if (this.previewData.status === 'preparing')
		{
			Dom.append(this.renderPreparing(), this.contentNode);

			return;
		}

		Dom.append(this.renderError(), this.contentNode);
	}

	private renderImage(): HTMLImageElement
	{
		const image = Tag.render`<img class="disk-viewer-tiff__image">` as HTMLImageElement;
		const title = normalizeString(this.getTitle()) ?? '';

		image.src = this.previewData?.previewUrl ?? '';
		image.alt = getMessage('DISK_TIFF_VIEWER_IMAGE_ALT', {
			'#FILE_NAME#': title,
		}) || title;
		Event.bind(image, 'error', () => {
			this.previewData = this.createNetworkErrorData();
			this.renderCurrentState();
		});

		return image;
	}

	private renderPreparing(): HTMLElement
	{
		const stateNode = Tag.render`
			<div class="disk-viewer-tiff__state" role="status" aria-live="polite">
				<div class="disk-viewer-tiff__spinner" aria-hidden="true"></div>
				<div class="disk-viewer-tiff__title">
					${Text.encode(getMessage('DISK_TIFF_VIEWER_PREPARING_TITLE'))}
				</div>
				<div class="disk-viewer-tiff__message">
					${Text.encode(getMessage('DISK_TIFF_VIEWER_PREPARING_MESSAGE'))}
				</div>
			</div>
		`;
		const downloadButton = this.renderDownloadButton();
		if (downloadButton !== null)
		{
			Dom.append(downloadButton, stateNode);
		}

		return stateNode;
	}

	private renderError(): HTMLElement
	{
		const message = normalizeString(this.previewData?.message)
			?? getMessage('DISK_TIFF_VIEWER_ERROR_MESSAGE');
		const title = getMessage(
			'DISK_TIFF_VIEWER_ERROR_TITLE',
			{},
			getMessage('JS_UI_VIEWER_ITEM_UNKNOWN_TITLE'),
		);
		const stateNode = Tag.render`
			<div class="ui-viewer-unsupported" role="alert" aria-live="assertive">
				<div class="ui-viewer-unsupported-title">
					${Text.encode(title)}
				</div>
				<div class="ui-viewer-unsupported-text">${Text.encode(message)}</div>
			</div>
		`;
		const downloadButton = this.renderDownloadButton();
		if (downloadButton !== null)
		{
			Dom.append(downloadButton, stateNode);
		}

		return stateNode;
	}

	private renderDownloadButton(): HTMLAnchorElement | null
	{
		const downloadUrl = normalizeString(this.previewData?.downloadUrl)
			?? normalizeString(this.getDownloadUrl());
		if (downloadUrl === null)
		{
			return null;
		}

		const label = getMessage(
			'DISK_TIFF_VIEWER_DOWNLOAD_BUTTON',
			{},
			getMessage('JS_UI_VIEWER_ITEM_UNKNOWN_DOWNLOAD_ACTION'),
		);
		const button = Tag.render`
			<a
				class="disk-viewer-tiff__download-link"
				target="_blank"
				rel="noopener"
				aria-label="${Text.encode(label)}"
			>
				${Text.encode(label)}
			</a>
		` as HTMLAnchorElement;
		button.href = downloadUrl;

		return button;
	}

	private schedulePoll(): void
	{
		if (
			!this.isActive
			|| this.isDestroyed
			|| this.isRequesting
			|| document.visibilityState === 'hidden'
			|| this.previewData?.status !== 'preparing'
		)
		{
			return;
		}

		if (this.pollAttempts >= MAX_POLL_ATTEMPTS)
		{
			this.previewData = {
				status: 'error',
				previewUrl: null,
				downloadUrl: normalizeString(this.getDownloadUrl()),
				errorCode: null,
				message: getMessage('DISK_TIFF_VIEWER_POLL_TIMEOUT_MESSAGE'),
			};
			this.renderCurrentState();

			return;
		}

		this.clearPollTimeout();
		this.pollTimeoutId = window.setTimeout(() => this.requestPreview(true), POLL_INTERVAL);
	}

	private clearPollTimeout(): void
	{
		if (this.pollTimeoutId !== null)
		{
			window.clearTimeout(this.pollTimeoutId);
			this.pollTimeoutId = null;
		}
	}

	afterRender(): void
	{
		this.isActive = true;
		this.bindVisibilityChange();
		if (this.previewData === null)
		{
			void this.requestPreview();

			return;
		}

		this.renderCurrentState();
		this.schedulePoll();
	}

	beforeHide(): void
	{
		this.isActive = false;
		this.clearPollTimeout();
	}

	destroy(): void
	{
		this.isDestroyed = true;
		this.unbindVisibilityChange();
		this.clearPollTimeout();
		super.destroy();
	}

	private bindVisibilityChange(): void
	{
		if (this.isVisibilityChangeBound)
		{
			return;
		}

		Event.bind(document, 'visibilitychange', this.handleVisibilityChange);
		this.isVisibilityChangeBound = true;
	}

	private unbindVisibilityChange(): void
	{
		if (!this.isVisibilityChangeBound)
		{
			return;
		}

		Event.unbind(document, 'visibilitychange', this.handleVisibilityChange);
		this.isVisibilityChangeBound = false;
	}

	private handleVisibilityChange = (): void => {
		if (document.visibilityState === 'hidden')
		{
			this.clearPollTimeout();

			return;
		}

		if (this.isActive)
		{
			this.schedulePoll();
		}
	};
}

function normalizeString(value: unknown): string | null
{
	return Type.isStringFilled(value) ? String(value) : null;
}

function getMessage(
	code: string,
	replacements: Record<string, string> = {},
	fallback: string = '',
): string
{
	const message = Loc.getMessage(code, replacements);

	return Type.isStringFilled(message) ? message : fallback;
}
