import { Event, Loc, Tag, Text, Type } from 'main.core';
import { TileWidget } from 'ui.uploader.tile-widget';
import { FileOrigin } from 'ui.uploader.core';

type DefaultValues = {
	galleryImageIds: number[],
	galleryImages: Object[],
};

export class GalleryField
{
	static MAX_FILE_SIZE = 10_485_760; // 10 * 1024 * 1024;
	static MAX_FILE_COUNT = 20;
	static UPLOADER_CONTROLLER = 'biconnector.integration.ui.fileUploaderController.dashboardInfoUploaderController';

	#dashboardId: number;
	#defaultImageIds: number[];
	#defaultFiles: Object[];
	#fieldNode: ?HTMLElement;
	#widgetContainerNode: ?HTMLElement;
	#widget: ?TileWidget;

	constructor(defaultValues: DefaultValues = {}, dashboardId: number = 0)
	{
		this.#dashboardId = Number.isInteger(dashboardId) ? dashboardId : 0;
		this.#defaultImageIds = this.#normalizeImageIds(defaultValues?.galleryImageIds);
		this.#defaultFiles = this.#normalizeInitialFiles(defaultValues?.galleryImages);
		this.#fieldNode = null;
		this.#widgetContainerNode = null;
		this.#widget = null;
	}

	render(): HTMLElement
	{
		return Tag.render`
			<div class="dashboard-gallery-field" id="dashboard-gallery-field">
				<div class="dashboard-gallery-field-widget" data-role="dashboard-gallery-widget"></div>
			</div>
		`;
	}

	bind(rootNode: HTMLElement): void
	{
		if (!Type.isDomNode(rootNode))
		{
			return;
		}

		this.#fieldNode = rootNode.querySelector('#dashboard-gallery-field');
		if (!Type.isDomNode(this.#fieldNode))
		{
			return;
		}

		this.#widgetContainerNode = this.#fieldNode.querySelector('[data-role="dashboard-gallery-widget"]');
		if (!Type.isDomNode(this.#widgetContainerNode))
		{
			return;
		}

		this.#initWidget();
		this.#customizeDropAreaLabel();
	}

	getValue(): number[]
	{
		const files = this.#widget?.getUploader()?.getFiles();
		if (!Type.isArray(files))
		{
			return [];
		}

		const imageIds = [];
		files.forEach((file) => {
			const imageId = this.#resolveImageId(file);
			if (imageId !== null)
			{
				imageIds.push(imageId);
			}
		});

		return this.#normalizeImageIds(imageIds);
	}

	getTempFileIds(): string[]
	{
		const files = this.#widget?.getUploader()?.getFiles();
		if (!Type.isArray(files))
		{
			return [];
		}

		const tempFileIds = [];
		files.forEach((file) => {
			const tempFileId = this.#resolveTempFileId(file);
			if (tempFileId !== null)
			{
				tempFileIds.push(tempFileId);
			}
		});

		return [...new Set(tempFileIds)];
	}

	hasPendingUploads(): boolean
	{
		const files = this.#widget?.getUploader()?.getFiles();
		if (!Type.isArray(files))
		{
			return false;
		}

		return files.some((file) => {
			const isClientFile = file?.getOrigin?.() === FileOrigin.CLIENT;
			const isCompleted = file?.isComplete?.() === true;
			const isFailed = file?.isFailed?.() === true;

			return isClientFile && !isCompleted && !isFailed;
		});
	}

	#initWidget(): void
	{
		if (!Type.isDomNode(this.#widgetContainerNode))
		{
			return;
		}

		this.#widget = new TileWidget(
			{
				controller: GalleryField.UPLOADER_CONTROLLER,
				controllerOptions: {
					dashboardId: this.#dashboardId,
				},
				files: Type.isArrayFilled(this.#defaultFiles) ? this.#defaultFiles : this.#defaultImageIds,
				multiple: true,
				autoUpload: true,
				acceptOnlyImages: true,
				maxFileSize: GalleryField.MAX_FILE_SIZE,
				maxFileCount: GalleryField.MAX_FILE_COUNT,
				events: {
					onError: this.#handleUploadError.bind(this),
					'File:onError': this.#handleUploadError.bind(this),
				},
			},
			{
				showSettingsButton: false,
				showItemMenuButton: true,
				removeFromServer: false,
			},
		);

		this.#widget.renderTo(this.#widgetContainerNode);
		this.#widget.getAdapter().subscribe('Item:onAdd', this.#customizeDropAreaLabel.bind(this));
		this.#widget.getAdapter().subscribe('Item:onRemove', this.#customizeDropAreaLabel.bind(this));
	}

	#customizeDropAreaLabel(): void
	{
		const dropLabelNode = this.#fieldNode?.querySelector('.ui-tile-uploader-drop-label');
		if (!Type.isDomNode(dropLabelNode))
		{
			return;
		}

		const message = Loc.getMessage('DASHBOARD_EDIT_GALLERY_DROP_TEXT') ?? '';
		dropLabelNode.innerHTML = Text.encode(message)
			.replace(
				'#LINK_START#',
				'<a href="#" class="dashboard-gallery-upload-link">'
			)
			.replace('#LINK_END#', '</a>')
		;

		const linkNode = dropLabelNode.querySelector('.dashboard-gallery-upload-link');
		if (Type.isDomNode(linkNode))
		{
			Event.bind(linkNode, 'click', (event) => {
				event.preventDefault();
			});
		}
	}

	#resolveImageId(file: mixed): ?number
	{
		const realFileId = this.#normalizeImageId(file?.getCustomData?.('realFileId'));
		if (realFileId !== null)
		{
			return realFileId;
		}

		const serverFileId = this.#normalizeImageId(file?.getServerFileId?.() ?? file?.getServerId?.());
		if (serverFileId !== null)
		{
			return serverFileId;
		}

		return null;
	}

	#resolveTempFileId(file: mixed): ?string
	{
		const tempFileId = file?.getServerFileId?.() ?? file?.getServerId?.();
		if (!Type.isStringFilled(tempFileId))
		{
			return null;
		}

		return tempFileId.includes('.') ? tempFileId : null;
	}

	#normalizeImageIds(values: mixed): number[]
	{
		if (!Type.isArray(values))
		{
			return [];
		}

		const unique = new Set();
		values.forEach((value) => {
			const imageId = Number(value);
			if (Number.isInteger(imageId) && imageId > 0)
			{
				unique.add(imageId);
			}
		});

		return [...unique];
	}

	#normalizeInitialFiles(values: mixed): Object[]
	{
		if (!Type.isArray(values))
		{
			return [];
		}

		return values
			.filter((item) => Type.isPlainObject(item))
			.map((item) => {
				const imageId = this.#normalizeImageId(
					item.serverFileId
					?? item.serverId
					?? item.id
					?? item?.customData?.realFileId,
				);
				if (imageId === null)
				{
					return null;
				}

				const file: Object = {
					serverFileId: imageId,
					name: Type.isStringFilled(item.name) ? item.name : `${imageId}.jpg`,
					customData: {
						...(Type.isPlainObject(item.customData) ? item.customData : {}),
						realFileId: imageId,
					},
				};

				if (Type.isStringFilled(item.type))
				{
					file.type = item.type;
				}

				if (Type.isNumber(item.size) && item.size >= 0)
				{
					file.size = item.size;
				}

				if (Type.isStringFilled(item.serverPreviewUrl))
				{
					file.serverPreviewUrl = item.serverPreviewUrl;
				}

				if (Type.isStringFilled(item.downloadUrl))
				{
					file.downloadUrl = item.downloadUrl;
				}

				if (Type.isNumber(item.width) && item.width > 0)
				{
					file.width = item.width;
					file.serverPreviewWidth = item.width;
				}

				if (Type.isNumber(item.height) && item.height > 0)
				{
					file.height = item.height;
					file.serverPreviewHeight = item.height;
				}

				return file;
			})
			.filter((item) => item !== null)
		;
	}

	#normalizeImageId(value: mixed): ?number
	{
		if (Type.isNumber(value) && Number.isInteger(value) && value > 0)
		{
			return value;
		}

		if (!Type.isString(value))
		{
			return null;
		}

		const normalizedValue = value.trim();
		if (!/^\d+$/.test(normalizedValue))
		{
			return null;
		}

		const imageId = Number(normalizedValue);

		return Number.isInteger(imageId) && imageId > 0 ? imageId : null;
	}

	#handleUploadError(event: ?Object): void
	{
		const message = event?.getData?.()?.error?.getMessage?.();
		const errorMessage = Type.isStringFilled(message)
			? message
			: Loc.getMessage('DASHBOARD_EDIT_GALLERY_UPLOAD_ERROR')
		;

		BX.UI.Notification.Center.notify({
			content: Text.encode(errorMessage),
		});
	}
}
