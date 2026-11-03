/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Fields = this.BX.Bizproc.Fields || {};
(function (exports, ui_designTokens, ui_iconSet_outline, main_core, bizproc_fields, ui_uploader_core, ui_uploader_tileWidget) {
	'use strict';

	const UPLOADER_CONTROLLER = 'bizproc.fileUploader.automationFieldUploaderController';
	const DROP_INPUT_SELECTOR = 'input.ui-tile-uploader-drop-input';
	const FileTileWidget = ui_uploader_tileWidget.TileWidget;
	class FileField extends bizproc_fields.BaseField {
		#widget = null;
		#releaseFlag = {
			released: false
		};
		#hiddenFieldsNode = null;
		#seededHiddenFields = new WeakMap();
		#filesInFlight = [];
		#restoringFilesInFlight = false;
		release() {
			super.release();
			this.#hiddenFieldsNode = null;
			const widget = this.#widget;
			if (main_core.Type.isNull(widget)) {
				return;
			}
			this.#releaseFlag.released = true;
			this.#retainFilesInFlight(widget);
			widget.getAdapter().setRemoveFilesFromServerWhenDestroy(false);
			if (!main_core.Type.isNull(widget.getRootComponent())) {
				widget.getVueApp().unmount();
			}
			widget.getAdapter().destroy();
			this.#widget = null;
		}
		rendersGroup() {
			return true;
		}
		renderControl(value) {
			const {
				expression,
				fileIds
			} = this.#splitValue(value);
			const hiddenFields = main_core.Tag.render`
			<fieldset class="bizproc-fields-file__hidden-fields" hidden></fieldset>
		`;
			const controlNode = main_core.Tag.render`
			<div
				class="bizproc-fields-file__control"
				data-testid="${main_core.Text.encode(`bizproc-field-control-${this.getFieldName()}`)}"
			></div>
		`;
			const root = main_core.Tag.render`
			<div class="bizproc-fields-file">
				${hiddenFields}
				${controlNode}
			</div>
		`;
			this.#hiddenFieldsNode = hiddenFields;
			this.#applySubmitState(this.getValueMode());
			this.#releaseFlag = {
				released: false
			};
			this.#widget = this.createWidget(this.#getUploaderOptions(hiddenFields, fileIds), this.#getWidgetOptions(), controlNode);
			this.#assignSeededHiddenFields();
			this.#restoreFilesInFlight();
			if (this.isRequired()) {
				this.#describeRequirement(root);
			}
			const expressionControl = this.renderExpressionControl({
				value: expression,
				writeOver: true
			});
			if (main_core.Type.isNull(expressionControl)) {
				return {
					root,
					valueNode: hiddenFields,
					namedNode: controlNode
				};
			}
			main_core.Dom.append(expressionControl.node, root);
			return {
				root,
				valueNode: hiddenFields,
				namedNode: controlNode,
				expressionNode: expressionControl.input,
				insertAnchor: expressionControl.input
			};
		}
		supportsExpressionMode() {
			return true;
		}
		getValueModeLabels() {
			return {
				...super.getValueModeLabels(),
				value: main_core.Loc.getMessage('BIZPROC_FIELDS_FILE_VALUE_MODE_FILE') ?? ''
			};
		}
		onValueModeChanged(mode) {
			this.#applySubmitState(mode);
		}
		setValueMode(mode) {
			super.setValueMode(mode);
			this.#applySubmitState(mode);
		}
		#applySubmitState(mode) {
			const hiddenFields = this.#hiddenFieldsNode;
			if (main_core.Type.isNull(hiddenFields)) {
				return;
			}
			hiddenFields.toggleAttribute('disabled', mode === bizproc_fields.ValueMode.Expression);
		}
		getGroupRequiredNodes(root) {
			return this.getExpressionNodes();
		}
		#describeRequirement(root) {
			const input = root.querySelector(DROP_INPUT_SELECTOR);
			const phrase = main_core.Loc.getMessage('BIZPROC_FIELDS_FILE_REQUIRED_DESCRIPTION');
			if (main_core.Type.isNull(input) || !main_core.Type.isStringFilled(phrase)) {
				return;
			}
			const descriptionId = `${this.getControlId()}-required`;
			const note = main_core.Tag.render`<span id="${descriptionId}" hidden>${main_core.Text.encode(phrase)}</span>`;
			main_core.Dom.attr(note, 'data-testid', `bizproc-field-required-note-${this.getFieldName()}`);
			main_core.Dom.append(note, root);
			const describedBy = input.getAttribute('aria-describedby');
			main_core.Dom.attr(input, 'aria-describedby', main_core.Type.isStringFilled(describedBy) ? `${describedBy} ${descriptionId}` : descriptionId);
		}
		createWidget(uploaderOptions, widgetOptions, node) {
			const widget = new FileTileWidget(uploaderOptions, widgetOptions);
			widget.renderTo(node);
			return widget;
		}
		getWidget() {
			return this.#widget;
		}
		getValue() {
			const fileIds = this.#getFileIds();
			return this.isMultiple() ? fileIds : fileIds[0] ?? '';
		}
		applyValue(value) {}
		#splitValue(value) {
			const items = main_core.Type.isArray(value) ? value : [value ?? ''];
			const fileIds = items.filter(item => item !== '' && !main_core.Type.isNil(item) && !bizproc_fields.isExpressionValue(item));
			if (fileIds.length > 0) {
				return {
					expression: '',
					fileIds
				};
			}
			return {
				expression: items.find(item => bizproc_fields.isExpressionValue(item)) ?? '',
				fileIds
			};
		}
		#getFileIds() {
			const uploader = this.getWidget()?.getUploader();
			if (!uploader) {
				return [];
			}
			const ids = uploader.getFiles().filter(file => FileField.#belongsToValue(file)).map(file => file.getServerFileId());
			return ids.filter(id => main_core.Type.isStringFilled(id) || main_core.Type.isNumber(id)).map(id => String(id));
		}
		static #belongsToValue(file) {
			return file.getOrigin() === ui_uploader_core.FileOrigin.SERVER || file.isComplete();
		}
		#retainFilesInFlight(widget) {
			const files = widget.getUploader()?.getFiles() ?? [];
			this.#filesInFlight = files.filter(file => FileField.#isUploadInFlight(file)).map(file => file.getBinary()).filter(binary => !main_core.Type.isNull(binary));
		}
		static #isUploadInFlight(file) {
			return !FileField.#belongsToValue(file) && !file.isFailed();
		}
		#restoreFilesInFlight() {
			const files = this.isMultiple() ? this.#filesInFlight : this.#filesInFlight.slice(0, 1);
			this.#filesInFlight = [];
			if (files.length === 0) {
				return;
			}
			this.#restoringFilesInFlight = true;
			try {
				this.getWidget()?.getUploader()?.addFiles(files);
			} finally {
				this.#restoringFilesInFlight = false;
			}
		}
		#getUploaderOptions(hiddenFieldsContainer, fileIds) {
			const seedIds = this.#toSeedIds(fileIds);
			const limits = FileField.#toSeedLimits(this.#getLimits(), seedIds.length + this.#filesInFlight.length);
			const releaseFlag = this.#releaseFlag;
			return {
				controller: UPLOADER_CONTROLLER,
				controllerOptions: this.#getControllerOptions(),
				multiple: this.isMultiple(),
				autoUpload: true,
				assignServerFile: false,
				hiddenFieldsContainer,
				hiddenFieldName: this.getFieldName(),
				files: FileField.#toFileList(seedIds),
				...limits,
				events: {
					[ui_uploader_core.UploaderEvent.FILE_COMPLETE]: event => this.#handleFileComplete(event, releaseFlag),
					[ui_uploader_core.UploaderEvent.FILE_REMOVE]: event => this.#handleFileRemove(event, releaseFlag)
				}
			};
		}
		#getWidgetOptions() {
			const readOnly = this.isReadOnly();
			return {
				readonly: readOnly,
				hideDropArea: readOnly
			};
		}
		#handleFileComplete(event, releaseFlag) {
			const file = event.getData()?.file;
			if (file?.getOrigin() === ui_uploader_core.FileOrigin.SERVER) {
				return;
			}
			this.#emitChangeWhenHiddenFieldsSettled(releaseFlag);
		}
		#handleFileRemove(event, releaseFlag) {
			const file = event.getData()?.file;
			if (!main_core.Type.isUndefined(file)) {
				this.#dropSeededHiddenField(file);
			}
			if (releaseFlag.released || this.#restoringFilesInFlight) {
				return;
			}
			this.#emitChangeWhenHiddenFieldsSettled(releaseFlag);
		}
		#assignSeededHiddenFields() {
			const container = this.#hiddenFieldsNode;
			if (main_core.Type.isNull(container)) {
				return;
			}
			const files = this.getWidget()?.getUploader()?.getFiles() ?? [];
			const name = this.getFieldName() + (this.isMultiple() ? '[]' : '');
			files.forEach(file => {
				if (file.getOrigin() !== ui_uploader_core.FileOrigin.SERVER) {
					return;
				}
				const fileId = file.getServerFileId();
				if (!main_core.Type.isStringFilled(fileId) && !main_core.Type.isNumber(fileId)) {
					return;
				}
				const input = main_core.Tag.render`<input type="hidden">`;
				input.name = name;
				input.value = String(fileId);
				main_core.Dom.append(input, container);
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
		#emitChangeWhenHiddenFieldsSettled(releaseFlag) {
			void Promise.resolve().then(() => {
				if (releaseFlag.released) {
					return;
				}
				this.emitChange();
			});
		}
		#getLimits() {
			const settings = this.getProperty().Settings ?? {};
			const limits = {};
			const maxFileSize = FileField.#toLimitNumber(settings.MaxFileSize);
			if (!main_core.Type.isNull(maxFileSize)) {
				limits.maxFileSize = maxFileSize;
			}
			const acceptedFileTypes = FileField.#toFileTypeList(settings.AcceptedFileTypes);
			if (!main_core.Type.isNull(acceptedFileTypes)) {
				limits.acceptedFileTypes = acceptedFileTypes;
			}
			const maxFileCount = FileField.#toLimitNumber(settings.MaxFileCount);
			if (!main_core.Type.isNull(maxFileCount)) {
				limits.maxFileCount = maxFileCount;
			}
			return limits;
		}
		static #toLimitNumber(value) {
			const number = main_core.Type.isStringFilled(value) ? Number(value.trim()) : value;
			if (!main_core.Type.isNumber(number) || !Number.isFinite(number)) {
				return null;
			}
			const limit = Math.trunc(number);
			return limit > 0 ? limit : null;
		}
		static #toFileTypeList(value) {
			if (!main_core.Type.isArray(value)) {
				return null;
			}
			const fileTypes = value.filter(fileType => main_core.Type.isStringFilled(fileType) && fileType.trim() !== '');
			return fileTypes.length > 0 ? fileTypes : null;
		}
		#getControllerOptions() {
			const {
				documentType
			} = this.getSelectionContext();
			return main_core.Type.isArrayFilled(documentType) ? {
				documentType
			} : {};
		}
		#toSeedIds(fileIds) {
			return this.isMultiple() ? fileIds : fileIds.slice(0, 1);
		}
		static #toSeedLimits(limits, startingCount) {
			if (!main_core.Type.isNumber(limits.maxFileCount) || limits.maxFileCount >= startingCount) {
				return limits;
			}
			return {
				...limits,
				maxFileCount: startingCount
			};
		}
		static #toFileList(fileIds) {
			return fileIds.map(id => ({
				serverFileId: id
			}));
		}
	}
	bizproc_fields.FieldRegistry.register('file', FileField);

	exports.FileField = FileField;

})(this.BX.Bizproc.Fields.File = this.BX.Bizproc.Fields.File || {}, window, window, BX, BX.Bizproc.Fields, BX.UI.Uploader, BX.UI.Uploader);
//# sourceMappingURL=file.bundle.js.map
