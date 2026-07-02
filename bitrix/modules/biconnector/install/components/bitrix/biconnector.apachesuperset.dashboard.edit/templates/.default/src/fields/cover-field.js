import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { Loader } from 'main.loader';
import { Uploader } from 'ui.uploader.core';

type DefaultValues = {
	coverImageId: ?number,
	coverImageSrc: ?string,
	emptyIconPath: ?string,
};

export class CoverField
{
	static MAX_FILE_SIZE = 10_485_760; // 10 * 1024 * 1024;
	static UPLOADER_CONTROLLER = 'biconnector.integration.ui.fileUploaderController.dashboardInfoUploaderController';

	#coverImageId: ?number;
	#coverImageTempFileId: ?string;
	#coverImageSrc: string;
	#emptyIconPath: string;
	#dashboardId: number;
	#fieldNode: ?HTMLElement;
	#previewWrapperNode: ?HTMLElement;
	#previewNode: ?HTMLImageElement;
	#emptyNode: ?HTMLElement;
	#changeButtonNode: ?HTMLButtonElement;
	#removeButtonNode: ?HTMLButtonElement;
	#loader: ?Loader;
	#uploader: ?Uploader;
	#isUploading: boolean;

	constructor(defaultValues: DefaultValues = {}, dashboardId: number = 0)
	{
		this.#coverImageId = this.#normalizeImageId(defaultValues?.coverImageId);
		this.#coverImageTempFileId = null;
		this.#coverImageSrc = Type.isStringFilled(defaultValues?.coverImageSrc) ? defaultValues.coverImageSrc : '';
		this.#emptyIconPath = Type.isStringFilled(defaultValues?.emptyIconPath) ? defaultValues.emptyIconPath : '';
		this.#dashboardId = Number.isInteger(dashboardId) ? dashboardId : 0;
		this.#fieldNode = null;
		this.#previewWrapperNode = null;
		this.#previewNode = null;
		this.#emptyNode = null;
		this.#changeButtonNode = null;
		this.#removeButtonNode = null;
		this.#loader = null;
		this.#uploader = null;
		this.#isUploading = false;
	}

	render(): HTMLElement
	{
		const safeEmptyIconPath = Text.encode(this.#emptyIconPath);

		return Tag.render`
			<div class="dashboard-cover-field" id="dashboard-cover-field">
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${Loc.getMessage('DASHBOARD_EDIT_COVER')}
					</div>
				</div>
				<div class="dashboard-cover-field-body">
					<div class="dashboard-cover-preview-wrapper">
						<img
							class="dashboard-cover-preview-image"
							data-role="dashboard-cover-preview-image"
							alt=""
						>
						<div class="dashboard-cover-preview-empty" data-role="dashboard-cover-preview-empty">
							<img class="dashboard-cover-preview-empty-image" src="${safeEmptyIconPath}" alt="">
						</div>
					</div>
					<div class="dashboard-cover-actions">
						<div class="dashboard-cover-actions-row">
							<button
								type="button"
								class="ui-btn ui-btn-md --air ui-btn-no-caps --style-outline-accent-2 --with-left-icon dashboard-cover-change-btn"
							>
								<span class="ui-icon-set --o-image dashboard-cover-change-btn-icon"></span>
								<span>${Loc.getMessage('DASHBOARD_EDIT_COVER_CHANGE')}</span>
							</button>
							<button
								type="button"
								class="ui-btn ui-btn-md --air ui-btn-no-caps --style-outline-no-accent dashboard-cover-remove-btn"
								data-role="dashboard-cover-remove-btn"
								aria-label="${Loc.getMessage('DASHBOARD_EDIT_COVER_REMOVE')}"
							>
								<span class="ui-icon-set --o-trashcan dashboard-cover-remove-btn-icon"></span>
							</button>
						</div>
						<div class="dashboard-cover-hint">
							${Loc.getMessage('DASHBOARD_EDIT_COVER_HINT')}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	bind(rootNode: HTMLElement): void
	{
		if (!Type.isDomNode(rootNode))
		{
			return;
		}

		this.#fieldNode = rootNode.querySelector('#dashboard-cover-field');
		if (!Type.isDomNode(this.#fieldNode))
		{
			return;
		}

		this.#previewNode = this.#fieldNode.querySelector('[data-role="dashboard-cover-preview-image"]');
		this.#previewWrapperNode = this.#fieldNode.querySelector('.dashboard-cover-preview-wrapper');
		this.#emptyNode = this.#fieldNode.querySelector('[data-role="dashboard-cover-preview-empty"]');
		this.#changeButtonNode = this.#fieldNode.querySelector('.dashboard-cover-change-btn');
		this.#removeButtonNode = this.#fieldNode.querySelector('[data-role="dashboard-cover-remove-btn"]');

		if (Type.isDomNode(this.#removeButtonNode))
		{
			Event.bind(this.#removeButtonNode, 'click', this.#handleRemoveClick.bind(this));
		}

		this.#initUploader();
		this.#renderState();
	}

	getValue(): ?number
	{
		return this.#coverImageId;
	}

	getTempFileId(): ?string
	{
		return this.#coverImageTempFileId;
	}

	#initUploader(): void
	{
		if (!Type.isDomNode(this.#changeButtonNode))
		{
			return;
		}

		this.#uploader = new Uploader({
			controller: CoverField.UPLOADER_CONTROLLER,
			controllerOptions: {
				dashboardId: this.#dashboardId,
			},
			multiple: false,
			allowReplaceSingle: true,
			autoUpload: true,
			acceptOnlyImages: true,
			maxFileSize: CoverField.MAX_FILE_SIZE,
			events: {
				onUploadStart: this.#handleUploadStart.bind(this),
				onUploadComplete: this.#handleUploadComplete.bind(this),
				onError: this.#handleUploadError.bind(this),
				'File:onError': this.#handleUploadError.bind(this),
			},
		});

		const browseElements = [this.#changeButtonNode];
		if (Type.isDomNode(this.#emptyNode))
		{
			browseElements.push(this.#emptyNode);
		}

		this.#uploader.assignBrowse(browseElements);

		if (Type.isDomNode(this.#previewWrapperNode))
		{
			this.#uploader.assignDropzone(this.#previewWrapperNode);
		}
	}

	#handleUploadStart(): void
	{
		this.#setUploading(true);
	}

	#handleUploadComplete(): void
	{
		this.#setUploading(false);

		const file = this.#uploader?.getFiles()?.[0];
		if (!file || !file.isComplete())
		{
			return;
		}

		const realFileId = this.#normalizeImageId(file.getCustomData('realFileId'));
		if (realFileId === null)
		{
			this.#showUploadError();

			return;
		}

		this.#coverImageId = realFileId;
		this.#coverImageTempFileId = this.#resolveTempFileId(file);
		this.#coverImageSrc = Type.isStringFilled(file.getPreviewUrl()) ? file.getPreviewUrl() : '';
		this.#renderState();
	}

	#handleUploadError(event: ?Object): void
	{
		this.#setUploading(false);

		const message = event?.getData?.()?.error?.getMessage?.();
		this.#showUploadError(message);
	}

	#handleRemoveClick(event: MouseEvent): void
	{
		event.preventDefault();
		if (this.#isUploading)
		{
			return;
		}

		const file = this.#uploader?.getFiles()?.[0];
		if (file)
		{
			this.#uploader?.removeFile(file);
		}

		this.#coverImageId = null;
		this.#coverImageTempFileId = null;
		this.#coverImageSrc = '';
		this.#renderState();
	}

	#renderState(): void
	{
		const hasCover = this.#coverImageId !== null;
		const hasPreview = hasCover && Type.isStringFilled(this.#coverImageSrc);
		if (Type.isDomNode(this.#previewNode))
		{
			if (hasPreview)
			{
				this.#previewNode.src = this.#coverImageSrc;
				Dom.style(this.#previewNode, 'display', 'block');
			}
			else
			{
				this.#previewNode.removeAttribute('src');
				Dom.style(this.#previewNode, 'display', 'none');
			}
		}

		if (Type.isDomNode(this.#emptyNode))
		{
			Dom.style(this.#emptyNode, 'display', hasPreview ? 'none' : 'flex');
		}

		if (Type.isDomNode(this.#removeButtonNode))
		{
			this.#removeButtonNode.disabled = !hasCover || this.#isUploading;
			Dom.toggleClass(this.#removeButtonNode, 'ui-btn-disabled', this.#removeButtonNode.disabled);
		}
	}

	#setUploading(isUploading: boolean): void
	{
		this.#isUploading = isUploading;

		if (Type.isDomNode(this.#fieldNode))
		{
			Dom.toggleClass(this.#fieldNode, 'dashboard-cover-field-uploading', isUploading);
		}

		if (Type.isDomNode(this.#changeButtonNode))
		{
			this.#changeButtonNode.disabled = isUploading;
			Dom.toggleClass(this.#changeButtonNode, 'ui-btn-disabled', isUploading);
		}

		if (isUploading)
		{
			this.#getLoader()?.show();
		}
		else if (this.#loader?.isShown())
		{
			this.#loader.hide();
		}

		this.#renderState();
	}

	#getLoader(): ?Loader
	{
		if (!Type.isDomNode(this.#previewWrapperNode))
		{
			return null;
		}

		if (!(this.#loader instanceof Loader))
		{
			this.#loader = new Loader({
				target: this.#previewWrapperNode,
				size: 48,
				strokeWidth: 3,
				color: 'rgba(255, 255, 255, 0.92)',
			});
		}

		return this.#loader;
	}

	#normalizeImageId(value: mixed): ?number
	{
		const imageId = Number(value);

		return Number.isInteger(imageId) && imageId > 0 ? imageId : null;
	}

	#resolveTempFileId(file: ?Object): ?string
	{
		const tempFileId = file?.getServerFileId?.() ?? file?.getServerId?.();
		if (!Type.isStringFilled(tempFileId))
		{
			return null;
		}

		return tempFileId.includes('.') ? tempFileId : null;
	}

	#showUploadError(message: ?string = null): void
	{
		const errorMessage = Type.isStringFilled(message)
			? message
			: Loc.getMessage('DASHBOARD_EDIT_COVER_UPLOAD_ERROR')
		;

		BX.UI.Notification.Center.notify({
			content: Text.encode(errorMessage),
		});
	}
}
