/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core) {
	'use strict';

	const ViewerItem = main_core.Reflection.namespace('BX.UI.Viewer.Item');
	const POLL_INTERVAL = 4000;
	const MAX_POLL_ATTEMPTS = 15;
	class TiffItem extends ViewerItem {
		tiffPreviewUrl;
		previewData;
		contentNode;
		pollTimeoutId;
		pollAttempts;
		isActive;
		isDestroyed;
		isRequesting;
		isVisibilityChangeBound;
		constructor(options = {}) {
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
		setPropertiesByNode(node) {
			super.setPropertiesByNode(node);
			this.tiffPreviewUrl = normalizeString(node.dataset.tiffPreviewUrl);
		}
		listContainerModifiers() {
			return ['ui-viewer-document', 'ui-viewer-document-tiff'];
		}
		loadData() {
			if (!main_core.Type.isStringFilled(this.tiffPreviewUrl)) {
				this.previewData = this.createNetworkErrorData();
			}
			return Promise.resolve(this);
		}
		async requestPreview(isPolling = false) {
			if (this.isRequesting || this.isDestroyed || !main_core.Type.isStringFilled(this.tiffPreviewUrl)) {
				return;
			}
			this.isRequesting = true;
			this.clearPollTimeout();
			if (isPolling) {
				this.pollAttempts++;
			}
			try {
				const response = await main_core.ajax.promise({
					url: this.tiffPreviewUrl,
					method: 'GET',
					dataType: 'json'
				});
				this.previewData = this.normalizePreviewData(response?.data);
				if (this.previewData.status !== 'preparing') {
					this.pollAttempts = 0;
				}
				if (main_core.Type.isStringFilled(this.previewData.downloadUrl)) {
					this.setDownloadUrl(this.previewData.downloadUrl);
				}
			} catch {
				this.pollAttempts = 0;
				this.previewData = this.createNetworkErrorData();
			} finally {
				this.isRequesting = false;
				this.renderCurrentState();
				this.schedulePoll();
			}
		}
		normalizePreviewData(data) {
			if (!main_core.Type.isPlainObject(data)) {
				throw new TypeError('Invalid TIFF preview response');
			}
			const rawData = data;
			if (rawData.status === 'ready' && main_core.Type.isStringFilled(rawData.previewUrl)) {
				return {
					status: 'ready',
					previewUrl: normalizeString(rawData.previewUrl),
					downloadUrl: null,
					errorCode: null,
					message: null
				};
			}
			if (rawData.status === 'preparing') {
				return {
					status: 'preparing',
					previewUrl: null,
					downloadUrl: normalizeString(rawData.downloadUrl),
					errorCode: null,
					message: null
				};
			}
			if (rawData.status === 'error') {
				return {
					status: 'error',
					previewUrl: null,
					downloadUrl: normalizeString(rawData.downloadUrl),
					errorCode: normalizeString(rawData.errorCode),
					message: normalizeString(rawData.message) ?? getMessage('DISK_TIFF_VIEWER_ERROR_MESSAGE')
				};
			}
			throw new TypeError('Unknown TIFF preview status');
		}
		createNetworkErrorData() {
			const downloadUrl = normalizeString(this.getDownloadUrl());
			return {
				status: 'error',
				previewUrl: null,
				downloadUrl,
				errorCode: null,
				message: getMessage('DISK_TIFF_VIEWER_NETWORK_ERROR_MESSAGE')
			};
		}
		render() {
			const rootNode = main_core.Tag.render`<div class="ui-viewer-item-document-content disk-viewer-tiff"></div>`;
			const contentNode = main_core.Tag.render`<div class="disk-viewer-tiff__content"></div>`;
			main_core.Dom.append(contentNode, rootNode);
			this.contentNode = contentNode;
			this.renderCurrentState();
			return rootNode;
		}
		renderCurrentState() {
			if (!main_core.Type.isDomNode(this.contentNode) || this.previewData === null) {
				return;
			}
			main_core.Dom.clean(this.contentNode);
			if (this.previewData.status === 'ready') {
				main_core.Dom.append(this.renderImage(), this.contentNode);
				return;
			}
			if (this.previewData.status === 'preparing') {
				main_core.Dom.append(this.renderPreparing(), this.contentNode);
				return;
			}
			main_core.Dom.append(this.renderError(), this.contentNode);
		}
		renderImage() {
			const image = main_core.Tag.render`<img class="disk-viewer-tiff__image">`;
			const title = normalizeString(this.getTitle()) ?? '';
			image.src = this.previewData?.previewUrl ?? '';
			image.alt = getMessage('DISK_TIFF_VIEWER_IMAGE_ALT', {
				'#FILE_NAME#': title
			}) || title;
			main_core.Event.bind(image, 'error', () => {
				this.previewData = this.createNetworkErrorData();
				this.renderCurrentState();
			});
			return image;
		}
		renderPreparing() {
			const stateNode = main_core.Tag.render`
			<div class="disk-viewer-tiff__state" role="status" aria-live="polite">
				<div class="disk-viewer-tiff__spinner" aria-hidden="true"></div>
				<div class="disk-viewer-tiff__title">
					${main_core.Text.encode(getMessage('DISK_TIFF_VIEWER_PREPARING_TITLE'))}
				</div>
				<div class="disk-viewer-tiff__message">
					${main_core.Text.encode(getMessage('DISK_TIFF_VIEWER_PREPARING_MESSAGE'))}
				</div>
			</div>
		`;
			const downloadButton = this.renderDownloadButton();
			if (downloadButton !== null) {
				main_core.Dom.append(downloadButton, stateNode);
			}
			return stateNode;
		}
		renderError() {
			const message = normalizeString(this.previewData?.message) ?? getMessage('DISK_TIFF_VIEWER_ERROR_MESSAGE');
			const title = getMessage('DISK_TIFF_VIEWER_ERROR_TITLE', {}, getMessage('JS_UI_VIEWER_ITEM_UNKNOWN_TITLE'));
			const stateNode = main_core.Tag.render`
			<div class="ui-viewer-unsupported" role="alert" aria-live="assertive">
				<div class="ui-viewer-unsupported-title">
					${main_core.Text.encode(title)}
				</div>
				<div class="ui-viewer-unsupported-text">${main_core.Text.encode(message)}</div>
			</div>
		`;
			const downloadButton = this.renderDownloadButton();
			if (downloadButton !== null) {
				main_core.Dom.append(downloadButton, stateNode);
			}
			return stateNode;
		}
		renderDownloadButton() {
			const downloadUrl = normalizeString(this.previewData?.downloadUrl) ?? normalizeString(this.getDownloadUrl());
			if (downloadUrl === null) {
				return null;
			}
			const label = getMessage('DISK_TIFF_VIEWER_DOWNLOAD_BUTTON', {}, getMessage('JS_UI_VIEWER_ITEM_UNKNOWN_DOWNLOAD_ACTION'));
			const button = main_core.Tag.render`
			<a
				class="disk-viewer-tiff__download-link"
				target="_blank"
				rel="noopener"
				aria-label="${main_core.Text.encode(label)}"
			>
				${main_core.Text.encode(label)}
			</a>
		`;
			button.href = downloadUrl;
			return button;
		}
		schedulePoll() {
			if (!this.isActive || this.isDestroyed || this.isRequesting || document.visibilityState === 'hidden' || this.previewData?.status !== 'preparing') {
				return;
			}
			if (this.pollAttempts >= MAX_POLL_ATTEMPTS) {
				this.previewData = {
					status: 'error',
					previewUrl: null,
					downloadUrl: normalizeString(this.getDownloadUrl()),
					errorCode: null,
					message: getMessage('DISK_TIFF_VIEWER_POLL_TIMEOUT_MESSAGE')
				};
				this.renderCurrentState();
				return;
			}
			this.clearPollTimeout();
			this.pollTimeoutId = window.setTimeout(() => this.requestPreview(true), POLL_INTERVAL);
		}
		clearPollTimeout() {
			if (this.pollTimeoutId !== null) {
				window.clearTimeout(this.pollTimeoutId);
				this.pollTimeoutId = null;
			}
		}
		afterRender() {
			this.isActive = true;
			this.bindVisibilityChange();
			if (this.previewData === null) {
				void this.requestPreview();
				return;
			}
			this.renderCurrentState();
			this.schedulePoll();
		}
		beforeHide() {
			this.isActive = false;
			this.clearPollTimeout();
		}
		destroy() {
			this.isDestroyed = true;
			this.unbindVisibilityChange();
			this.clearPollTimeout();
			super.destroy();
		}
		bindVisibilityChange() {
			if (this.isVisibilityChangeBound) {
				return;
			}
			main_core.Event.bind(document, 'visibilitychange', this.handleVisibilityChange);
			this.isVisibilityChangeBound = true;
		}
		unbindVisibilityChange() {
			if (!this.isVisibilityChangeBound) {
				return;
			}
			main_core.Event.unbind(document, 'visibilitychange', this.handleVisibilityChange);
			this.isVisibilityChangeBound = false;
		}
		handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				this.clearPollTimeout();
				return;
			}
			if (this.isActive) {
				this.schedulePoll();
			}
		};
	}
	function normalizeString(value) {
		return main_core.Type.isStringFilled(value) ? String(value) : null;
	}
	function getMessage(code, replacements = {}, fallback = '') {
		const message = main_core.Loc.getMessage(code, replacements);
		return main_core.Type.isStringFilled(message) ? message : fallback;
	}

	exports.TiffItem = TiffItem;

})(this.BX.Disk.Viewer = this.BX.Disk.Viewer || {}, BX);
//# sourceMappingURL=disk.tiff-item.bundle.js.map
