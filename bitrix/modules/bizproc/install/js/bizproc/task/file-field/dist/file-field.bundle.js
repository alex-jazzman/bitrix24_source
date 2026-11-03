/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, ui_designTokens, main_core, ui_uploader_core, ui_uploader_tileWidget) {
	'use strict';

	const DROP_INPUT_SELECTOR = 'input.ui-tile-uploader-drop-input';
	const TaskFileTileWidget = ui_uploader_tileWidget.TileWidget;
	class TaskFileControl {
		#node;
		#config;
		#options;
		#hiddenFields;
		#controlNode;
		#seededHiddenFields = new WeakMap();
		#widget = null;
		#requirementNote = null;
		#released = false;
		#uploading = false;
		constructor(node, config, options = {}) {
			this.#node = node;
			this.#config = config;
			this.#options = options;
			this.#hiddenFields = main_core.Tag.render`
			<fieldset
				class="bizproc-task-file-field__hidden-fields"
				data-testid="task-file-field-values"
				hidden
			></fieldset>
		`;
			this.#controlNode = main_core.Tag.render`<div class="bizproc-task-file-field__control"></div>`;
			main_core.Dom.append(this.#hiddenFields, node);
			main_core.Dom.append(this.#controlNode, node);
			this.#widget = this.createWidget(this.#getUploaderOptions(),
			{
				autoCollapse: true,
				compact: true,
				removeFromServer: false
			}, this.#controlNode);
			this.#assignSeededHiddenFields();
			this.#uploading = this.isUploading();
			if (config.required) {
				this.#describeRequirement();
			}
		}
		createWidget(uploaderOptions, widgetOptions, node) {
			const widget = new TaskFileTileWidget(uploaderOptions, widgetOptions);
			widget.renderTo(node);
			return widget;
		}
		getValue() {
			return this.#getFiles().filter(file => TaskFileControl.#belongsToValue(file)).map(file => file.getServerFileId()).filter(id => TaskFileControl.#isFileIdentifier(id)).map(id => String(id));
		}
		isUploading() {
			return this.#getFiles().some(file => TaskFileControl.#isUploadInFlight(file));
		}
		destroy() {
			const widget = this.#widget;
			if (main_core.Type.isNull(widget)) {
				return;
			}
			this.#released = true;
			this.#widget = null;
			widget.getAdapter().setRemoveFilesFromServerWhenDestroy(false);
			if (!main_core.Type.isNull(widget.getRootComponent())) {
				widget.getVueApp().unmount();
			}
			widget.getAdapter().destroy();
			main_core.Dom.remove(this.#controlNode);
			main_core.Dom.remove(this.#hiddenFields);
			main_core.Dom.remove(this.#requirementNote);
			this.#requirementNote = null;
		}
		#getFiles() {
			return this.#widget?.getUploader()?.getFiles() ?? [];
		}
		#getUploaderOptions() {
			return {
				controller: this.#config.controller,
				controllerOptions: this.#config.controllerOptions,
				multiple: this.#config.multiple,
				autoUpload: true,
				assignServerFile: false,
				hiddenFieldsContainer: this.#hiddenFields,
				hiddenFieldName: this.#config.hiddenFieldName,
				files: this.#getSeedFiles(),
				events: {
					[ui_uploader_core.UploaderEvent.FILE_COMPLETE]: this.#handleFileComplete,
					[ui_uploader_core.UploaderEvent.FILE_REMOVE]: this.#handleFileRemove,
					[ui_uploader_core.UploaderEvent.FILE_STATUS_CHANGE]: this.#handleFileStatusChange
				}
			};
		}
		#getSeedFiles() {
			const seeded = this.#config.files.filter(file => {
				return main_core.Type.isPlainObject(file) && TaskFileControl.#isFileIdentifier(file.serverFileId);
			});
			return this.#config.multiple ? seeded : seeded.slice(0, 1);
		}
		#assignSeededHiddenFields() {
			const name = this.#config.hiddenFieldName + (this.#config.multiple ? '[]' : '');
			this.#getFiles().forEach(file => {
				const fileId = file.getServerFileId();
				if (file.getOrigin() !== ui_uploader_core.FileOrigin.SERVER || !TaskFileControl.#isFileIdentifier(fileId)) {
					return;
				}
				const input = main_core.Tag.render`<input type="hidden">`;
				input.name = name;
				input.value = String(fileId);
				main_core.Dom.append(input, this.#hiddenFields);
				this.#seededHiddenFields.set(file, input);
			});
		}
		#dropSeededHiddenField(file) {
			const input = this.#seededHiddenFields.get(file);
			if (main_core.Type.isUndefined(input)) {
				return;
			}
			this.#seededHiddenFields.delete(file);
			main_core.Dom.remove(input);
		}
		#handleFileComplete = event => {
			const file = event.getData()?.file;
			this.#syncUploading();
			if (file?.getOrigin() === ui_uploader_core.FileOrigin.SERVER) {
				return;
			}
			this.#scheduleChange();
		};
		#handleFileRemove = event => {
			const file = event.getData()?.file;
			if (!main_core.Type.isUndefined(file)) {
				this.#dropSeededHiddenField(file);
			}
			this.#syncUploading();
			if (this.#released) {
				return;
			}
			this.#scheduleChange();
		};
		#handleFileStatusChange = () => {
			this.#syncUploading();
		};
		#scheduleChange() {
			void Promise.resolve().then(() => {
				if (this.#released) {
					return;
				}
				this.#options.onChange?.();
			});
		}
		#syncUploading() {
			if (this.#released) {
				return;
			}
			const uploading = this.isUploading();
			if (uploading === this.#uploading) {
				return;
			}
			this.#uploading = uploading;
			this.#options.onUploadingChange?.(uploading);
		}
		#describeRequirement() {
			const input = this.#node.querySelector(DROP_INPUT_SELECTOR);
			if (main_core.Type.isNull(input)) {
				console.error(`bizproc.task.file-field: no ${DROP_INPUT_SELECTOR} to describe as required`, this.#node);
				return;
			}
			const phrase = main_core.Loc.getMessage('BIZPROC_TASK_FILE_FIELD_REQUIRED');
			if (!main_core.Type.isStringFilled(phrase)) {
				return;
			}
			const noteId = `bizproc-task-file-required-${main_core.Text.getRandom().toLowerCase()}`;
			const note = main_core.Tag.render`<span id="${noteId}" hidden>${main_core.Text.encode(phrase)}</span>`;
			main_core.Dom.append(note, this.#node);
			this.#requirementNote = note;
			const describedBy = input.getAttribute('aria-describedby');
			main_core.Dom.attr(input, 'aria-describedby', main_core.Type.isStringFilled(describedBy) ? `${describedBy} ${noteId}` : noteId);
		}
		static #belongsToValue(file) {
			return file.getOrigin() === ui_uploader_core.FileOrigin.SERVER || file.isComplete();
		}
		static #isFileIdentifier(fileId) {
			return main_core.Type.isStringFilled(fileId) || main_core.Type.isNumber(fileId);
		}
		static #isUploadInFlight(file) {
			return !TaskFileControl.#belongsToValue(file) && !file.isFailed();
		}
	}
	const readConfig = node => {
		let parsed = null;
		try {
			parsed = JSON.parse(node.dataset.config ?? '');
		} catch {
			return null;
		}
		if (!main_core.Type.isPlainObject(parsed)) {
			return null;
		}
		const config = parsed;
		if (!main_core.Type.isStringFilled(config.controller) || !main_core.Type.isStringFilled(config.hiddenFieldName)) {
			return null;
		}
		return {
			controller: config.controller,
			controllerOptions: main_core.Type.isPlainObject(config.controllerOptions) ? config.controllerOptions : {},
			hiddenFieldName: config.hiddenFieldName,
			multiple: config.multiple === true,
			required: config.required === true,
			files: main_core.Type.isArray(config.files) ? config.files : []
		};
	};
	const mountTaskFileControl = (node, options = {}) => {
		const config = readConfig(node);
		return main_core.Type.isNull(config) ? null : new TaskFileControl(node, config, options);
	};

	exports.TaskFileControl = TaskFileControl;
	exports.mountTaskFileControl = mountTaskFileControl;

})(this.BX.Bizproc.Task = this.BX.Bizproc.Task || {}, window, BX, BX.UI.Uploader, BX.UI.Uploader);
//# sourceMappingURL=file-field.bundle.js.map
