/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_uploader_tileWidget) {
	'use strict';

	const MAX_UPLOAD_FILE_SIZE = 1024 * 1024 * 50; // 50M;

	class FileUploader {
		#container = null;
		#widget = null;
		constructor(params) {
			this.#assertValidParams(params);
			this.#widget = new ui_uploader_tileWidget.TileWidget({
				controller: 'crm.fileUploader.todoActivityUploaderController',
				controllerOptions: {
					entityId: params.ownerId,
					entityTypeId: params.ownerTypeId,
					activityId: params.activityId
				},
				files: main_core.Type.isArrayFilled(params.files) ? params.files : [],
				events: main_core.Type.isPlainObject(params.events) ? params.events : {},
				multiple: true,
				autoUpload: true,
				maxFileSize: MAX_UPLOAD_FILE_SIZE
			});
			if (main_core.Type.isDomNode(params.baseContainer)) {
				this.#container = main_core.Tag.render`<div class="crm-activity__todo-editor-file-uploader-wrapper"></div>`;
				const baseContainer = params.baseContainer;
				main_core.Dom.insertAfter(this.#container, baseContainer);
				this.#widget.renderTo(this.#container);
			}
		}
		getWidget() {
			return this.#widget;
		}
		getContainer() {
			return this.#container;
		}
		renderTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('FileUploader container must be a DOM Node');
			}
			this.#container = container;
			this.#widget.renderTo(container);
		}
		getFiles() {
			return this.#widget.getUploader().getFiles();
		}
		getServerFileIds() {
			const files = this.#widget.getUploader().getFiles();
			if (files.length === 0) {
				return [];
			}
			const completedFiles = files.filter(file => file.isComplete());
			if (completedFiles.length === 0) {
				return [];
			}
			return completedFiles.map(file => file.getServerId());
		}
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new Error('BX.Crm.Activity.FileUploader: The "params" argument must be object.');
			}
			if (!main_core.Type.isNumber(params.ownerId)) {
				throw new Error('BX.Crm.Activity.FileUploader: The "ownerId" argument must be set.');
			}
			if (!main_core.Type.isNumber(params.ownerTypeId)) {
				throw new Error('BX.Crm.Activity.FileUploader: The "ownerTypeId" argument must be set.');
			}
		}
	}

	exports.FileUploader = FileUploader;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX, BX.UI.Uploader);
//# sourceMappingURL=file-uploader.bundle.js.map
