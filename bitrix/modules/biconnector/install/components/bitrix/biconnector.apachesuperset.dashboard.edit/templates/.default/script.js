/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, biconnector_dashboardParametersSelector, biconnector_apacheSupersetAnalytics, biconnector_ahaMoment, ui_buttons, ui_entitySelector, main_popup, ui_textEditor, main_loader, ui_uploader_core, ui_uploader_tileWidget) {
	'use strict';

	class TitleField {
		#defaultValue;
		#fieldNode;
		#labelNode;
		#hintNode;
		constructor(defaultValue = '') {
			this.#defaultValue = main_core.Type.isString(defaultValue) ? defaultValue : '';
			this.#fieldNode = null;
			this.#labelNode = null;
			this.#hintNode = null;
		}
		render() {
			return main_core.Tag.render`
			<div>
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_NAME')}
					</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 dashboard-title-wrapper">
					<input
						type="text"
						class="ui-ctl-element"
						id="dashboard-title-field"
					>
				</div>
			</div>
		`;
		}
		bind(rootNode) {
			if (!main_core.Type.isDomNode(rootNode)) {
				return;
			}
			this.#fieldNode = rootNode.querySelector('#dashboard-title-field');
			if (main_core.Type.isDomNode(this.#fieldNode)) {
				this.#fieldNode.value = this.#defaultValue;
			}
			this.#labelNode = rootNode.querySelector('.dashboard-params-title');
		}
		setHintVisible(visible) {
			if (visible) {
				this.#showHint();
			} else {
				this.#hideHint();
			}
		}
		#showHint() {
			if (this.#hintNode || !main_core.Type.isDomNode(this.#labelNode)) {
				return;
			}
			if (!BX?.UI?.Hint || !main_core.Type.isFunction(BX.UI.Hint.createNode)) {
				return;
			}
			const hintText = main_core.Loc.getMessage('DASHBOARD_EDIT_TITLE_ATTACH_HINT') ?? '';
			this.#hintNode = BX.UI.Hint.createNode(hintText);
			main_core.Dom.addClass(this.#hintNode, 'dashboard-title-hint');
			main_core.Dom.append(this.#hintNode, this.#labelNode);
		}
		#hideHint() {
			if (!this.#hintNode) {
				return;
			}
			main_core.Dom.remove(this.#hintNode);
			this.#hintNode = null;
		}
		getValue() {
			return this.#fieldNode?.value ?? '';
		}
		setValue(value) {
			if (this.#fieldNode) {
				this.#fieldNode.value = value;
			}
		}
	}

	class DescriptionField {
		#defaultValue;
		#fieldNode;
		#editor;
		constructor(defaultValue = '') {
			this.#defaultValue = main_core.Type.isString(defaultValue) ? defaultValue : '';
			this.#fieldNode = null;
			this.#editor = null;
		}
		render() {
			return main_core.Tag.render`
			<div
				class="dashboard-description-wrapper dashboard-description-editor"
				id="dashboard-description-field"
			>
			</div>
		`;
		}
		bind(rootNode) {
			if (!main_core.Type.isDomNode(rootNode)) {
				return;
			}
			this.#fieldNode = rootNode.querySelector('#dashboard-description-field');
			if (!main_core.Type.isDomNode(this.#fieldNode)) {
				return;
			}
			this.#editor = new ui_textEditor.BasicEditor({
				content: this.#defaultValue,
				minHeight: 120,
				maxHeight: 360,
				removePlugins: ['BlockToolbar'],
				toolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', 'link', 'copilot']
			});
			this.#editor.renderTo(this.#fieldNode);
		}
		getValue() {
			return this.#editor?.getText() ?? '';
		}
	}

	class GroupsField {
		#defaultValues;
		constructor(defaultValues = {}) {
			this.#defaultValues = main_core.Type.isPlainObject(defaultValues) ? defaultValues : {};
		}
		getDefaultValue() {
			const groupIds = this.#defaultValues?.groups;
			if (!main_core.Type.isArray(groupIds)) {
				return [];
			}
			return this.#normalize(groupIds);
		}
		getValue(selectorValues) {
			const groups = selectorValues?.groups;
			if (!(groups instanceof Set)) {
				return [];
			}
			return this.#normalize([...groups]);
		}
		hasValue(selectorValues) {
			return this.getValue(selectorValues).length > 0;
		}
		#normalize(groupIds) {
			return groupIds.map(groupId => Number(groupId)).filter(groupId => Number.isInteger(groupId) && groupId > 0);
		}
	}

	class ParametersField {
		#defaultValues;
		constructor(defaultValues = {}) {
			this.#defaultValues = main_core.Type.isPlainObject(defaultValues) ? defaultValues : {};
		}
		getDefaultScopes() {
			return this.#normalize(this.#defaultValues?.scopes);
		}
		getDefaultParams() {
			return this.#normalize(this.#defaultValues?.params);
		}
		getValue(selectorValues) {
			const scopes = selectorValues?.scopes;
			const params = selectorValues?.params;
			return {
				scopes: this.#normalize(scopes instanceof Set ? [...scopes] : []),
				params: this.#normalize(params instanceof Set ? [...params] : [])
			};
		}
		#normalize(items) {
			if (!main_core.Type.isArray(items)) {
				return [];
			}
			return items.filter(item => main_core.Type.isStringFilled(item));
		}
	}

	class PeriodField {
		static PERIOD_DEFAULT = 'default';
		static PERIOD_RANGE = 'range';
		static PERIOD_MENU_ID = 'dashboard-filter-period-menu';
		#periodList;
		#defaultValues;
		#periodFieldNode;
		#periodSelectorNode;
		#periodSelectorContainerNode;
		#dateFilterStartFieldNode;
		#dateFilterEndFieldNode;
		#dateRangeContainerNode;
		#isMenuOpened;
		constructor(options) {
			this.#periodList = main_core.Type.isArray(options?.periodList) ? options.periodList : [];
			this.#defaultValues = main_core.Type.isPlainObject(options?.defaultValues) ? options.defaultValues : {};
			this.#periodFieldNode = null;
			this.#periodSelectorNode = null;
			this.#periodSelectorContainerNode = null;
			this.#dateFilterStartFieldNode = null;
			this.#dateFilterEndFieldNode = null;
			this.#dateRangeContainerNode = null;
			this.#isMenuOpened = false;
		}
		render() {
			const selectedPeriodItem = this.#getSelectedPeriodItem();
			return main_core.Tag.render`
			<div>
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_PERIOD')}
					</div>
				</div>
				<input
					type="hidden"
					id="dashboard-filter-period-field"
				>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 dashboard-period-wrapper"
					id="dashboard-filter-period-selector-container"
				>
					<div class="ui-ctl-element" id="dashboard-filter-period-selector">
						${this.#renderSelectedPeriodContent(selectedPeriodItem)}
					</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
				<div class="dashboard-period-range" id="dashboard-period-range">
					<div class="dashboard-period-range-item">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">${main_core.Loc.getMessage('DASHBOARD_EDIT_PERIOD_FROM')}</div>
						</div>
						<div class="ui-ctl ui-ctl-before-icon ui-ctl-datetime ui-ctl-w100">
							<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
							<input
								type="text"
								class="ui-ctl-element"
								id="dashboard-filter-period-start"
							>
						</div>
					</div>
					<div class="dashboard-period-range-item">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">${main_core.Loc.getMessage('DASHBOARD_EDIT_PERIOD_TO')}</div>
						</div>
						<div class="ui-ctl ui-ctl-before-icon ui-ctl-datetime ui-ctl-w100">
							<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
							<input
								type="text"
								class="ui-ctl-element"
								id="dashboard-filter-period-end"
							>
						</div>
					</div>
				</div>
			</div>
		`;
		}
		bind(rootNode) {
			if (!main_core.Type.isDomNode(rootNode)) {
				return;
			}
			this.#periodFieldNode = rootNode.querySelector('#dashboard-filter-period-field');
			this.#periodSelectorNode = rootNode.querySelector('#dashboard-filter-period-selector');
			this.#periodSelectorContainerNode = rootNode.querySelector('#dashboard-filter-period-selector-container');
			this.#dateFilterStartFieldNode = rootNode.querySelector('#dashboard-filter-period-start');
			this.#dateFilterEndFieldNode = rootNode.querySelector('#dashboard-filter-period-end');
			this.#dateRangeContainerNode = rootNode.querySelector('#dashboard-period-range');
			this.#setDefaultInputValues();
			if (main_core.Type.isDomNode(this.#periodSelectorContainerNode)) {
				main_core.Event.bind(this.#periodSelectorContainerNode, 'click', this.#toggleMenu.bind(this));
			}
			if (main_core.Type.isDomNode(this.#dateFilterStartFieldNode)) {
				main_core.Event.bind(this.#dateFilterStartFieldNode, 'click', () => {
					PeriodField.showCalendar(this.#dateFilterStartFieldNode);
				});
			}
			if (main_core.Type.isDomNode(this.#dateFilterEndFieldNode)) {
				main_core.Event.bind(this.#dateFilterEndFieldNode, 'click', () => {
					PeriodField.showCalendar(this.#dateFilterEndFieldNode);
				});
			}
			this.#toggleRangeFields();
		}
		#setDefaultInputValues() {
			const selectedPeriodItem = this.#getSelectedPeriodItem();
			if (main_core.Type.isDomNode(this.#periodFieldNode)) {
				this.#periodFieldNode.value = selectedPeriodItem?.value ?? PeriodField.PERIOD_DEFAULT;
			}
			if (main_core.Type.isDomNode(this.#dateFilterStartFieldNode)) {
				this.#dateFilterStartFieldNode.value = this.#getDefaultDateFilterStart();
			}
			if (main_core.Type.isDomNode(this.#dateFilterEndFieldNode)) {
				this.#dateFilterEndFieldNode.value = this.#getDefaultDateFilterEnd();
			}
		}
		getValue() {
			return {
				filterPeriod: this.#periodFieldNode?.value ?? PeriodField.PERIOD_DEFAULT,
				dateFilterStart: this.#dateFilterStartFieldNode?.value ?? '',
				dateFilterEnd: this.#dateFilterEndFieldNode?.value ?? ''
			};
		}
		#getSelectedPeriodItem(value = null) {
			const selectedValue = main_core.Type.isStringFilled(value) ? value : this.#getDefaultFilterPeriod();
			return this.#periodList.find(item => item.value === selectedValue) ?? this.#periodList[0] ?? null;
		}
		#getDefaultFilterPeriod() {
			const period = this.#defaultValues?.filterPeriod;
			if (!main_core.Type.isStringFilled(period)) {
				return PeriodField.PERIOD_DEFAULT;
			}
			return period;
		}
		#getDefaultDateFilterStart() {
			const dateStart = this.#defaultValues?.dateFilterStart;
			if (!main_core.Type.isStringFilled(dateStart)) {
				return '';
			}
			return dateStart;
		}
		#getDefaultDateFilterEnd() {
			const dateEnd = this.#defaultValues?.dateFilterEnd;
			if (!main_core.Type.isStringFilled(dateEnd)) {
				return '';
			}
			return dateEnd;
		}
		#toggleMenu() {
			if (this.#isMenuOpened) {
				this.#closeMenu();
				return;
			}
			this.#openMenu();
		}
		#openMenu() {
			if (!main_core.Type.isDomNode(this.#periodSelectorContainerNode) || this.#periodList.length === 0) {
				return;
			}
			const menuItems = this.#periodList.map(item => {
				const menuItem = {
					text: item.name,
					value: item.value,
					onclick: () => {
						this.#selectPeriod(item.value);
					}
				};
				if (item?.isDefault === true) {
					return {
						...menuItem,
						html: this.#renderSelectedPeriodContent(item)
					};
				}
				return menuItem;
			});
			const selectorPositionY = BX.Dom.getPosition(this.#periodSelectorContainerNode).y;
			const distanceToTop = selectorPositionY - window.pageYOffset;
			const distanceToBottom = document.documentElement.clientHeight + window.pageYOffset - selectorPositionY;
			const popupMaxHeight = distanceToTop > distanceToBottom ? distanceToTop - 50 : distanceToBottom - 100;
			BX.PopupMenu.show(PeriodField.PERIOD_MENU_ID, this.#periodSelectorContainerNode, menuItems, {
				angle: false,
				width: `${this.#periodSelectorContainerNode.offsetWidth}px`,
				maxHeight: popupMaxHeight,
				events: {
					onPopupShow: this.#onMenuShow.bind(this),
					onPopupClose: this.#onMenuClose.bind(this)
				}
			});
			if (BX.PopupMenu.currentItem && BX.PopupMenu.currentItem.popupWindow) {
				BX.PopupMenu.currentItem.popupWindow.setWidth(BX.pos(this.#periodSelectorContainerNode).width);
			}
		}
		#closeMenu() {
			const menu = BX.PopupMenu.getMenuById(PeriodField.PERIOD_MENU_ID);
			if (menu) {
				menu.popupWindow.close();
			}
		}
		#onMenuShow() {
			if (main_core.Type.isDomNode(this.#periodSelectorContainerNode)) {
				main_core.Dom.addClass(this.#periodSelectorContainerNode, 'ui-ctl-active');
			}
			this.#isMenuOpened = true;
		}
		#onMenuClose() {
			BX.PopupMenu.destroy(PeriodField.PERIOD_MENU_ID);
			if (main_core.Type.isDomNode(this.#periodSelectorContainerNode)) {
				main_core.Dom.removeClass(this.#periodSelectorContainerNode, 'ui-ctl-active');
			}
			this.#isMenuOpened = false;
		}
		#selectPeriod(value) {
			if (main_core.Type.isDomNode(this.#periodFieldNode)) {
				this.#periodFieldNode.value = value;
			}
			const selectedPeriodItem = this.#getSelectedPeriodItem(value);
			if (main_core.Type.isDomNode(this.#periodSelectorNode)) {
				main_core.Dom.clean(this.#periodSelectorNode);
				main_core.Dom.append(this.#renderSelectedPeriodContent(selectedPeriodItem), this.#periodSelectorNode);
			}
			this.#toggleRangeFields();
			this.#closeMenu();
		}
		#toggleRangeFields() {
			if (!main_core.Type.isDomNode(this.#dateRangeContainerNode)) {
				return;
			}
			const isRangePeriod = this.#periodFieldNode?.value === PeriodField.PERIOD_RANGE;
			main_core.Dom.style(this.#dateRangeContainerNode, 'display', isRangePeriod ? 'flex' : 'none');
		}
		#renderSelectedPeriodContent(selectedPeriodItem) {
			const container = document.createElement('span');
			if (selectedPeriodItem?.isDefault !== true || !main_core.Type.isStringFilled(selectedPeriodItem?.valueText)) {
				container.textContent = selectedPeriodItem?.name ?? '';
				return container;
			}
			const prefixNode = document.createElement('span');
			prefixNode.textContent = selectedPeriodItem?.prefixText ?? '';
			const valueNode = document.createElement('span');
			valueNode.className = 'ui-color-light';
			valueNode.textContent = selectedPeriodItem.valueText;
			const suffixNode = document.createElement('span');
			suffixNode.textContent = selectedPeriodItem?.suffixText ?? '';
			main_core.Dom.append(prefixNode, container);
			main_core.Dom.append(valueNode, container);
			main_core.Dom.append(suffixNode, container);
			return container;
		}
		static showCalendar(input) {
			const showCalendar = main_core.Reflection.getClass('BX.calendar');
			if (!main_core.Type.isDomNode(input) || !main_core.Type.isFunction(showCalendar)) {
				return;
			}
			const getCalendar = main_core.Reflection.getClass('BX.calendar.get');
			if (main_core.Type.isFunction(getCalendar)) {
				getCalendar().Close();
			}
			showCalendar({
				node: input,
				field: input,
				bTime: false,
				bSetFocus: false
			});
		}
	}

	class CoverField {
		static MAX_FILE_SIZE = 10_485_760; // 10 * 1024 * 1024;
		static UPLOADER_CONTROLLER = 'biconnector.integration.ui.fileUploaderController.dashboardInfoUploaderController';
		#coverImageId;
		#coverImageTempFileId;
		#coverImageSrc;
		#emptyIconPath;
		#dashboardId;
		#fieldNode;
		#previewWrapperNode;
		#previewNode;
		#emptyNode;
		#changeButtonNode;
		#removeButtonNode;
		#loader;
		#uploader;
		#isUploading;
		constructor(defaultValues = {}, dashboardId = 0) {
			this.#coverImageId = this.#normalizeImageId(defaultValues?.coverImageId);
			this.#coverImageTempFileId = null;
			this.#coverImageSrc = main_core.Type.isStringFilled(defaultValues?.coverImageSrc) ? defaultValues.coverImageSrc : '';
			this.#emptyIconPath = main_core.Type.isStringFilled(defaultValues?.emptyIconPath) ? defaultValues.emptyIconPath : '';
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
		render() {
			const safeEmptyIconPath = main_core.Text.encode(this.#emptyIconPath);
			return main_core.Tag.render`
			<div class="dashboard-cover-field" id="dashboard-cover-field">
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_COVER')}
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
								<span>${main_core.Loc.getMessage('DASHBOARD_EDIT_COVER_CHANGE')}</span>
							</button>
							<button
								type="button"
								class="ui-btn ui-btn-md --air ui-btn-no-caps --style-outline-no-accent dashboard-cover-remove-btn"
								data-role="dashboard-cover-remove-btn"
								aria-label="${main_core.Loc.getMessage('DASHBOARD_EDIT_COVER_REMOVE')}"
							>
								<span class="ui-icon-set --o-trashcan dashboard-cover-remove-btn-icon"></span>
							</button>
						</div>
						<div class="dashboard-cover-hint">
							${main_core.Loc.getMessage('DASHBOARD_EDIT_COVER_HINT')}
						</div>
					</div>
				</div>
			</div>
		`;
		}
		bind(rootNode) {
			if (!main_core.Type.isDomNode(rootNode)) {
				return;
			}
			this.#fieldNode = rootNode.querySelector('#dashboard-cover-field');
			if (!main_core.Type.isDomNode(this.#fieldNode)) {
				return;
			}
			this.#previewNode = this.#fieldNode.querySelector('[data-role="dashboard-cover-preview-image"]');
			this.#previewWrapperNode = this.#fieldNode.querySelector('.dashboard-cover-preview-wrapper');
			this.#emptyNode = this.#fieldNode.querySelector('[data-role="dashboard-cover-preview-empty"]');
			this.#changeButtonNode = this.#fieldNode.querySelector('.dashboard-cover-change-btn');
			this.#removeButtonNode = this.#fieldNode.querySelector('[data-role="dashboard-cover-remove-btn"]');
			if (main_core.Type.isDomNode(this.#removeButtonNode)) {
				main_core.Event.bind(this.#removeButtonNode, 'click', this.#handleRemoveClick.bind(this));
			}
			this.#initUploader();
			this.#renderState();
		}
		getValue() {
			return this.#coverImageId;
		}
		getTempFileId() {
			return this.#coverImageTempFileId;
		}
		#initUploader() {
			if (!main_core.Type.isDomNode(this.#changeButtonNode)) {
				return;
			}
			this.#uploader = new ui_uploader_core.Uploader({
				controller: CoverField.UPLOADER_CONTROLLER,
				controllerOptions: {
					dashboardId: this.#dashboardId
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
					'File:onError': this.#handleUploadError.bind(this)
				}
			});
			const browseElements = [this.#changeButtonNode];
			if (main_core.Type.isDomNode(this.#emptyNode)) {
				browseElements.push(this.#emptyNode);
			}
			this.#uploader.assignBrowse(browseElements);
			if (main_core.Type.isDomNode(this.#previewWrapperNode)) {
				this.#uploader.assignDropzone(this.#previewWrapperNode);
			}
		}
		#handleUploadStart() {
			this.#setUploading(true);
		}
		#handleUploadComplete() {
			this.#setUploading(false);
			const file = this.#uploader?.getFiles()?.[0];
			if (!file || !file.isComplete()) {
				return;
			}
			const realFileId = this.#normalizeImageId(file.getCustomData('realFileId'));
			if (realFileId === null) {
				this.#showUploadError();
				return;
			}
			this.#coverImageId = realFileId;
			this.#coverImageTempFileId = this.#resolveTempFileId(file);
			this.#coverImageSrc = main_core.Type.isStringFilled(file.getPreviewUrl()) ? file.getPreviewUrl() : '';
			this.#renderState();
		}
		#handleUploadError(event) {
			this.#setUploading(false);
			const message = event?.getData?.()?.error?.getMessage?.();
			this.#showUploadError(message);
		}
		#handleRemoveClick(event) {
			event.preventDefault();
			if (this.#isUploading) {
				return;
			}
			const file = this.#uploader?.getFiles()?.[0];
			if (file) {
				this.#uploader?.removeFile(file);
			}
			this.#coverImageId = null;
			this.#coverImageTempFileId = null;
			this.#coverImageSrc = '';
			this.#renderState();
		}
		#renderState() {
			const hasCover = this.#coverImageId !== null;
			const hasPreview = hasCover && main_core.Type.isStringFilled(this.#coverImageSrc);
			if (main_core.Type.isDomNode(this.#previewNode)) {
				if (hasPreview) {
					this.#previewNode.src = this.#coverImageSrc;
					main_core.Dom.style(this.#previewNode, 'display', 'block');
				} else {
					this.#previewNode.removeAttribute('src');
					main_core.Dom.style(this.#previewNode, 'display', 'none');
				}
			}
			if (main_core.Type.isDomNode(this.#emptyNode)) {
				main_core.Dom.style(this.#emptyNode, 'display', hasPreview ? 'none' : 'flex');
			}
			if (main_core.Type.isDomNode(this.#removeButtonNode)) {
				this.#removeButtonNode.disabled = !hasCover || this.#isUploading;
				main_core.Dom.toggleClass(this.#removeButtonNode, 'ui-btn-disabled', this.#removeButtonNode.disabled);
			}
		}
		#setUploading(isUploading) {
			this.#isUploading = isUploading;
			if (main_core.Type.isDomNode(this.#fieldNode)) {
				main_core.Dom.toggleClass(this.#fieldNode, 'dashboard-cover-field-uploading', isUploading);
			}
			if (main_core.Type.isDomNode(this.#changeButtonNode)) {
				this.#changeButtonNode.disabled = isUploading;
				main_core.Dom.toggleClass(this.#changeButtonNode, 'ui-btn-disabled', isUploading);
			}
			if (isUploading) {
				this.#getLoader()?.show();
			} else if (this.#loader?.isShown()) {
				this.#loader.hide();
			}
			this.#renderState();
		}
		#getLoader() {
			if (!main_core.Type.isDomNode(this.#previewWrapperNode)) {
				return null;
			}
			if (!(this.#loader instanceof main_loader.Loader)) {
				this.#loader = new main_loader.Loader({
					target: this.#previewWrapperNode,
					size: 48,
					strokeWidth: 3,
					color: 'rgba(255, 255, 255, 0.92)'
				});
			}
			return this.#loader;
		}
		#normalizeImageId(value) {
			const imageId = Number(value);
			return Number.isInteger(imageId) && imageId > 0 ? imageId : null;
		}
		#resolveTempFileId(file) {
			const tempFileId = file?.getServerFileId?.() ?? file?.getServerId?.();
			if (!main_core.Type.isStringFilled(tempFileId)) {
				return null;
			}
			return tempFileId.includes('.') ? tempFileId : null;
		}
		#showUploadError(message = null) {
			const errorMessage = main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('DASHBOARD_EDIT_COVER_UPLOAD_ERROR');
			BX.UI.Notification.Center.notify({
				content: main_core.Text.encode(errorMessage)
			});
		}
	}

	class GalleryField {
		static MAX_FILE_SIZE = 10_485_760; // 10 * 1024 * 1024;
		static MAX_FILE_COUNT = 20;
		static UPLOADER_CONTROLLER = 'biconnector.integration.ui.fileUploaderController.dashboardInfoUploaderController';
		#dashboardId;
		#defaultImageIds;
		#defaultFiles;
		#fieldNode;
		#widgetContainerNode;
		#widget;
		constructor(defaultValues = {}, dashboardId = 0) {
			this.#dashboardId = Number.isInteger(dashboardId) ? dashboardId : 0;
			this.#defaultImageIds = this.#normalizeImageIds(defaultValues?.galleryImageIds);
			this.#defaultFiles = this.#normalizeInitialFiles(defaultValues?.galleryImages);
			this.#fieldNode = null;
			this.#widgetContainerNode = null;
			this.#widget = null;
		}
		render() {
			return main_core.Tag.render`
			<div class="dashboard-gallery-field" id="dashboard-gallery-field">
				<div class="dashboard-gallery-field-widget" data-role="dashboard-gallery-widget"></div>
			</div>
		`;
		}
		bind(rootNode) {
			if (!main_core.Type.isDomNode(rootNode)) {
				return;
			}
			this.#fieldNode = rootNode.querySelector('#dashboard-gallery-field');
			if (!main_core.Type.isDomNode(this.#fieldNode)) {
				return;
			}
			this.#widgetContainerNode = this.#fieldNode.querySelector('[data-role="dashboard-gallery-widget"]');
			if (!main_core.Type.isDomNode(this.#widgetContainerNode)) {
				return;
			}
			this.#initWidget();
			this.#customizeDropAreaLabel();
		}
		getValue() {
			const files = this.#widget?.getUploader()?.getFiles();
			if (!main_core.Type.isArray(files)) {
				return [];
			}
			const imageIds = [];
			files.forEach(file => {
				const imageId = this.#resolveImageId(file);
				if (imageId !== null) {
					imageIds.push(imageId);
				}
			});
			return this.#normalizeImageIds(imageIds);
		}
		getTempFileIds() {
			const files = this.#widget?.getUploader()?.getFiles();
			if (!main_core.Type.isArray(files)) {
				return [];
			}
			const tempFileIds = [];
			files.forEach(file => {
				const tempFileId = this.#resolveTempFileId(file);
				if (tempFileId !== null) {
					tempFileIds.push(tempFileId);
				}
			});
			return [...new Set(tempFileIds)];
		}
		hasPendingUploads() {
			const files = this.#widget?.getUploader()?.getFiles();
			if (!main_core.Type.isArray(files)) {
				return false;
			}
			return files.some(file => {
				const isClientFile = file?.getOrigin?.() === ui_uploader_core.FileOrigin.CLIENT;
				const isCompleted = file?.isComplete?.() === true;
				const isFailed = file?.isFailed?.() === true;
				return isClientFile && !isCompleted && !isFailed;
			});
		}
		#initWidget() {
			if (!main_core.Type.isDomNode(this.#widgetContainerNode)) {
				return;
			}
			this.#widget = new ui_uploader_tileWidget.TileWidget({
				controller: GalleryField.UPLOADER_CONTROLLER,
				controllerOptions: {
					dashboardId: this.#dashboardId
				},
				files: main_core.Type.isArrayFilled(this.#defaultFiles) ? this.#defaultFiles : this.#defaultImageIds,
				multiple: true,
				autoUpload: true,
				acceptOnlyImages: true,
				maxFileSize: GalleryField.MAX_FILE_SIZE,
				maxFileCount: GalleryField.MAX_FILE_COUNT,
				events: {
					onError: this.#handleUploadError.bind(this),
					'File:onError': this.#handleUploadError.bind(this)
				}
			}, {
				showSettingsButton: false,
				showItemMenuButton: true,
				removeFromServer: false
			});
			this.#widget.renderTo(this.#widgetContainerNode);
			this.#widget.getAdapter().subscribe('Item:onAdd', this.#customizeDropAreaLabel.bind(this));
			this.#widget.getAdapter().subscribe('Item:onRemove', this.#customizeDropAreaLabel.bind(this));
		}
		#customizeDropAreaLabel() {
			const dropLabelNode = this.#fieldNode?.querySelector('.ui-tile-uploader-drop-label');
			if (!main_core.Type.isDomNode(dropLabelNode)) {
				return;
			}
			const message = main_core.Loc.getMessage('DASHBOARD_EDIT_GALLERY_DROP_TEXT') ?? '';
			dropLabelNode.innerHTML = main_core.Text.encode(message).replace('#LINK_START#', '<a href="#" class="dashboard-gallery-upload-link">').replace('#LINK_END#', '</a>');
			const linkNode = dropLabelNode.querySelector('.dashboard-gallery-upload-link');
			if (main_core.Type.isDomNode(linkNode)) {
				main_core.Event.bind(linkNode, 'click', event => {
					event.preventDefault();
				});
			}
		}
		#resolveImageId(file) {
			const realFileId = this.#normalizeImageId(file?.getCustomData?.('realFileId'));
			if (realFileId !== null) {
				return realFileId;
			}
			const serverFileId = this.#normalizeImageId(file?.getServerFileId?.() ?? file?.getServerId?.());
			if (serverFileId !== null) {
				return serverFileId;
			}
			return null;
		}
		#resolveTempFileId(file) {
			const tempFileId = file?.getServerFileId?.() ?? file?.getServerId?.();
			if (!main_core.Type.isStringFilled(tempFileId)) {
				return null;
			}
			return tempFileId.includes('.') ? tempFileId : null;
		}
		#normalizeImageIds(values) {
			if (!main_core.Type.isArray(values)) {
				return [];
			}
			const unique = new Set();
			values.forEach(value => {
				const imageId = Number(value);
				if (Number.isInteger(imageId) && imageId > 0) {
					unique.add(imageId);
				}
			});
			return [...unique];
		}
		#normalizeInitialFiles(values) {
			if (!main_core.Type.isArray(values)) {
				return [];
			}
			return values.filter(item => main_core.Type.isPlainObject(item)).map(item => {
				const imageId = this.#normalizeImageId(item.serverFileId ?? item.serverId ?? item.id ?? item?.customData?.realFileId);
				if (imageId === null) {
					return null;
				}
				const file = {
					serverFileId: imageId,
					name: main_core.Type.isStringFilled(item.name) ? item.name : `${imageId}.jpg`,
					customData: {
						...(main_core.Type.isPlainObject(item.customData) ? item.customData : {}),
						realFileId: imageId
					}
				};
				if (main_core.Type.isStringFilled(item.type)) {
					file.type = item.type;
				}
				if (main_core.Type.isNumber(item.size) && item.size >= 0) {
					file.size = item.size;
				}
				if (main_core.Type.isStringFilled(item.serverPreviewUrl)) {
					file.serverPreviewUrl = item.serverPreviewUrl;
				}
				if (main_core.Type.isStringFilled(item.downloadUrl)) {
					file.downloadUrl = item.downloadUrl;
				}
				if (main_core.Type.isNumber(item.width) && item.width > 0) {
					file.width = item.width;
					file.serverPreviewWidth = item.width;
				}
				if (main_core.Type.isNumber(item.height) && item.height > 0) {
					file.height = item.height;
					file.serverPreviewHeight = item.height;
				}
				return file;
			}).filter(item => item !== null);
		}
		#normalizeImageId(value) {
			if (main_core.Type.isNumber(value) && Number.isInteger(value) && value > 0) {
				return value;
			}
			if (!main_core.Type.isString(value)) {
				return null;
			}
			const normalizedValue = value.trim();
			if (!/^\d+$/.test(normalizedValue)) {
				return null;
			}
			const imageId = Number(normalizedValue);
			return Number.isInteger(imageId) && imageId > 0 ? imageId : null;
		}
		#handleUploadError(event) {
			const message = event?.getData?.()?.error?.getMessage?.();
			const errorMessage = main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('DASHBOARD_EDIT_GALLERY_UPLOAD_ERROR');
			BX.UI.Notification.Center.notify({
				content: main_core.Text.encode(errorMessage)
			});
		}
	}

	class SupersetDashboardEditManager {
		#props;
		#node;
		#paramsSelector;
		#saveButton;
		#attachedExternalId = null;
		#attachedPublished = null;
		#snapshotTitle = null;
		#attachedCardNode = null;
		#attachAhaMomentShown = false;
		#titleField;
		#descriptionField;
		#groupsField;
		#parametersField;
		#periodField;
		#coverField;
		#galleryField;
		constructor(props) {
			this.#props = props;
			this.#node = document.querySelector(`#${this.#props.nodeId}`);
			this.#paramsSelector = null;
			this.#saveButton = null;
			this.#titleField = new TitleField(this.#props?.defaultValues?.title ?? '');
			this.#descriptionField = new DescriptionField(this.#props?.defaultValues?.description ?? '');
			this.#groupsField = new GroupsField(this.#props?.defaultValues ?? {});
			this.#parametersField = new ParametersField(this.#props?.defaultValues ?? {});
			this.#periodField = new PeriodField({
				periodList: this.#props?.periodList ?? [],
				defaultValues: this.#props?.defaultValues ?? {}
			});
			this.#coverField = new CoverField({
				...(this.#props?.defaultValues ?? {}),
				emptyIconPath: this.#props?.emptyCoverIconPath ?? ''
			}, this.#props?.dashboardId ?? 0);
			this.#galleryField = new GalleryField(this.#props?.defaultValues ?? {}, this.#props?.dashboardId ?? 0);
			if (!main_core.Type.isDomNode(this.#node)) {
				return;
			}
			this.#render();
			this.#saveButton = ui_buttons.ButtonManager.createFromNode(document.querySelector('#dashboard-button-save'));
			this.#saveButton?.setDisabled(true);
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardParamsSelector:initCompleted', this.#onParamSelectorInit.bind(this));
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardParamsSelector:onChange', this.#onSelectorChange.bind(this));
		}
		#render() {
			const mainSection = this.#getMainSection();
			main_core.Dom.append(mainSection, this.#node);
			this.#titleField.bind(this.#node);
			this.#periodField.bind(this.#node);
			this.#coverField.bind(this.#node);
			this.#paramsSelector = new biconnector_dashboardParametersSelector.DashboardParametersSelector({
				groups: new Set(this.#groupsField.getDefaultValue()),
				scopes: new Set(this.#parametersField.getDefaultScopes()),
				params: new Set(this.#parametersField.getDefaultParams()),
				paramList: this.#props.paramList,
				requiredParamList: this.#props.requiredParamList,
				activeUrlParamsSelector: this.#props.activeUrlParamsSelector,
				isAllowedClearGroups: this.#props.isAllowedClearGroups,
				isNewDashboard: !this.#props.isEditMode
			});
			const parametersContainer = mainSection.querySelector('[data-role="dashboard-main-parameters"]');
			if (main_core.Type.isDomNode(parametersContainer)) {
				main_core.Dom.append(this.#paramsSelector.getLayout(), parametersContainer);
			}
			main_core.Dom.append(this.#getDescriptionSection(), this.#node);
			this.#descriptionField.bind(this.#node);
			main_core.Dom.append(this.#getGallerySection(), this.#node);
			this.#galleryField.bind(this.#node);
		}
		#getTopBlock() {
			return main_core.Tag.render`
			<div class="dashboard-edit-top-block">
				<div class="dashboard-edit-top-block-text">
					${main_core.Loc.getMessage('DASHBOARD_EDIT_TOP_BLOCK')}
				</div>
			</div>
		`;
		}
		onMoreButtonClick() {
			const button = document.querySelector('.dashboard-edit-more-btn');
			if (!button) {
				return;
			}
			const menuId = 'dashboard-edit-more-menu';
			const openedMenu = main_popup.MenuManager.getMenuById(menuId);
			if (openedMenu) {
				openedMenu.close();
				return;
			}
			const angleOffset = Math.round(button.offsetWidth / 2 + main_popup.Popup.getOption('angleMinTop'));
			const menu = main_popup.MenuManager.create({
				id: menuId,
				closeByEsc: true,
				cacheable: false,
				angle: {
					offset: angleOffset
				},
				autoHide: true,
				bindElement: button,
				items: [{
					text: main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACH_MENU_ITEM'),
					onclick: () => {
						menu.close();
						this.#openAttachPopup();
					}
				}]
			});
			menu.show();
		}
		#openAttachPopup() {
			let selectedItem = null;
			const attachButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACH_CONFIRM'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				size: ui_buttons.ButtonSize.LARGE,
				onclick: () => this.#handleAttachConfirm(selectedItem, dialog)
			});
			attachButton.setDisabled(true);
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACH_CANCEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN,
				size: ui_buttons.ButtonSize.LARGE,
				onclick: () => {
					dialog.hide();
					dialog.destroy();
				}
			});
			const buttonsContainer = main_core.Tag.render`
			<div class="dashboard-attach-popup-buttons"></div>
		`;
			main_core.Dom.append(attachButton.getContainer(), buttonsContainer);
			main_core.Dom.append(cancelButton.getContainer(), buttonsContainer);
			const closeButton = main_core.Tag.render`
			<div class="ui-icon-set --cross-l dashboard-attach-popup-close"></div>
		`;
			const headerContent = main_core.Tag.render`
			<div class="dashboard-attach-popup-header">
				<div class="dashboard-attach-popup-header-text">
					<div class="dashboard-attach-popup-header-title">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACH_DIALOG_TITLE')}
					</div>
					<div class="dashboard-attach-popup-header-subtitle">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACH_DIALOG_SUBTITLE')}
					</div>
				</div>
				${closeButton}
			</div>
		`;
			main_core.Event.bind(closeButton, 'click', () => {
				dialog.hide();
				dialog.destroy();
			});
			const dialog = new ui_entitySelector.Dialog({
				id: 'biconnector-attach-superset-dashboard',
				multiple: false,
				hideOnSelect: false,
				hideOnDeselect: false,
				enableSearch: true,
				showAvatars: true,
				compactView: false,
				dynamicLoad: true,
				width: 512,
				height: 470,
				entities: [{
					id: 'biconnector-superset-unlinked-dashboard',
					dynamicLoad: true
				}],
				recentTabOptions: {
					stub: true,
					stubOptions: {
						title: main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACH_EMPTY_TITLE')
					}
				},
				header: headerContent,
				headerOptions: {
					containerClass: 'dashboard-attach-popup-header-container'
				},
				footer: buttonsContainer,
				footerOptions: {
					containerClass: 'dashboard-attach-popup-footer-container'
				},
				popupOptions: {
					overlay: true,
					closeIcon: true,
					autoHide: false,
					animation: 'fading-slide',
					className: 'dashboard-attach-popup'
				},
				events: {
					'Item:onSelect': event => {
						selectedItem = event.getData().item;
						attachButton.setDisabled(false);
					},
					'Item:onDeselect': () => {
						selectedItem = null;
						attachButton.setDisabled(true);
					}
				}
			});
			dialog.show();
		}
		#handleAttachConfirm(selectedItem, dialog) {
			if (!selectedItem) {
				return;
			}
			const customData = selectedItem.getCustomData();
			const externalId = Number(customData.get('externalId'));
			const published = Boolean(customData.get('published'));
			const title = String(customData.get('title') ?? '');
			dialog.hide();
			dialog.destroy();
			if (this.#attachedExternalId === null) {
				this.#snapshotTitle = this.#titleField.getValue();
			}
			this.#attachedExternalId = externalId;
			this.#attachedPublished = published;
			this.#titleField.setValue(title);
			this.#titleField.setHintVisible(true);
			this.#renderAttachedCard(title);
			this.#showAttachAhaMoment();
		}
		#renderAttachedCard(title) {
			this.#removeAttachedCard();
			const container = this.#node;
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			const detachButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACHED_CARD_DETACH'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.MEDIUM,
				onclick: () => this.#detachDashboard()
			});
			this.#attachedCardNode = main_core.Tag.render`
			<div class="dashboard-edit-attached-card">
				<div class="dashboard-edit-attached-card-text">
					<div class="dashboard-edit-attached-card-title">${main_core.Loc.getMessage('DASHBOARD_EDIT_ATTACHED_CARD_TITLE')}</div>
					<div class="dashboard-edit-attached-card-subtitle">${main_core.Text.encode(title ?? '')}</div>
				</div>
			</div>
		`;
			main_core.Dom.append(detachButton.getContainer(), this.#attachedCardNode);
			main_core.Dom.prepend(this.#attachedCardNode, container);
		}
		#removeAttachedCard() {
			if (this.#attachedCardNode) {
				main_core.Dom.remove(this.#attachedCardNode);
				this.#attachedCardNode = null;
			}
		}
		#showAttachAhaMoment() {
			if (this.#attachAhaMomentShown) {
				return;
			}
			const options = this.#props.attachAhaMoment;
			if (!main_core.Type.isPlainObject(options) || options.canShow !== true) {
				return;
			}
			const bindElement = this.#attachedCardNode?.querySelector('.dashboard-edit-attached-card-subtitle');
			if (!main_core.Type.isDomNode(bindElement)) {
				return;
			}
			this.#attachAhaMomentShown = true;
			const ahaMoment = new biconnector_ahaMoment.AhaMoment({
				...options,
				compact: true,
				title: main_core.Loc.getMessage('DASHBOARD_EDIT_AHA_TITLE'),
				description: main_core.Loc.getMessage('DASHBOARD_EDIT_AHA_TEXT'),
				bindElement,
				popupAlignment: 'start'
			});
			ahaMoment.show();
		}
		#detachDashboard() {
			if (this.#snapshotTitle !== null) {
				this.#titleField.setValue(this.#snapshotTitle);
				this.#snapshotTitle = null;
			}
			this.#attachedExternalId = null;
			this.#attachedPublished = null;
			this.#titleField.setHintVisible(false);
			this.#removeAttachedCard();
		}
		#getDescriptionSection() {
			return main_core.Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-section dashboard-edit-description-section">
				<div class="ui-entity-editor-section-header">
					<div class="ui-entity-editor-header-title">
						<div class="ui-entity-editor-header-title-text dashboard-edit-section-title">
							<span class="ui-icon-set --o-info-circle dashboard-edit-section-title-icon"></span>
							<span>${main_core.Loc.getMessage('DASHBOARD_EDIT_DESCRIPTION_SECTION_TITLE') ?? ''}</span>
						</div>
					</div>
				</div>
				<div class="ui-entity-editor-section-content">
					<div class="dashboard-edit-description-alert">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_DESCRIPTION_SECTION_HINT') ?? ''}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#descriptionField.render()}
					</div>
				</div>
			</div>
		`;
		}
		#getMainSection() {
			return main_core.Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-section dashboard-edit-main-section">
				<div class="ui-entity-editor-section-header">
					<div class="ui-entity-editor-header-title">
						<div class="ui-entity-editor-header-title-text dashboard-edit-section-title">
							<span class="ui-icon-set --o-file dashboard-edit-section-title-icon"></span>
							<span>${main_core.Loc.getMessage('DASHBOARD_EDIT_MAIN_SECTION_TITLE') ?? ''}</span>
						</div>
					</div>
				</div>
				<div class="ui-entity-editor-section-content">
					<div class="ui-entity-editor-content-block dashboard-edit-main-top-block">
						${this.#getTopBlock()}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#titleField.render()}
					</div>
					<div class="ui-entity-editor-content-block" data-role="dashboard-main-parameters"></div>
					<div class="ui-entity-editor-content-block">
						${this.#periodField.render()}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#coverField.render()}
					</div>
				</div>
			</div>
		`;
		}
		#getGallerySection() {
			return main_core.Tag.render`
			<div class="ui-entity-editor-section-edit dashboard-edit-section dashboard-edit-gallery-section">
				<div class="ui-entity-editor-section-header">
					<div class="ui-entity-editor-header-title">
						<div class="ui-entity-editor-header-title-text dashboard-edit-section-title">
							<span class="ui-icon-set --o-image dashboard-edit-section-title-icon"></span>
							<span>${main_core.Loc.getMessage('DASHBOARD_EDIT_GALLERY_SECTION_TITLE') ?? ''}</span>
						</div>
					</div>
				</div>
				<div class="ui-entity-editor-section-content">
					<div class="dashboard-edit-gallery-alert">
						${main_core.Loc.getMessage('DASHBOARD_EDIT_GALLERY_SECTION_HINT') ?? ''}
					</div>
					<div class="ui-entity-editor-content-block">
						${this.#galleryField.render()}
					</div>
				</div>
			</div>
		`;
		}
		#onParamSelectorInit() {
			this.#updateSaveButtonState();
		}
		#onSelectorChange() {
			this.#updateSaveButtonState();
		}
		#updateSaveButtonState() {
			if (!this.#saveButton) {
				return;
			}
			const selectorData = this.#paramsSelector?.getValues();
			const hasGroups = this.#groupsField.hasValue(selectorData);
			const isDisabled = !hasGroups && (!this.#props.isEditMode || !this.#props.isAllowedClearGroups);
			this.#saveButton.setDisabled(isDisabled);
		}

		// noinspection JSUnusedGlobalSymbols
		onClickSave() {
			if (!this.#saveButton) {
				return;
			}
			const selectorData = this.#paramsSelector?.getValues() ?? {
				groups: new Set(),
				scopes: new Set(),
				params: new Set()
			};
			if (this.#galleryField.hasPendingUploads()) {
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(main_core.Loc.getMessage('DASHBOARD_EDIT_GALLERY_UPLOAD_IN_PROGRESS') ?? '')
				});
				return;
			}
			const currentTitle = this.#titleField.getValue();
			const currentDescription = this.#descriptionField.getValue();
			const currentGroups = this.#groupsField.getValue(selectorData);
			const currentPeriod = this.#periodField.getValue();
			const currentGalleryIds = this.#galleryField.getValue();
			const saveData = {
				title: currentTitle,
				description: currentDescription,
				coverImage: {
					id: this.#coverField.getValue(),
					tempFileId: this.#coverField.getTempFileId()
				},
				galleryImage: {
					ids: currentGalleryIds,
					tempFileIds: this.#galleryField.getTempFileIds()
				},
				period: currentPeriod,
				groups: currentGroups,
				...this.#parametersField.getValue(selectorData)
			};
			if (this.#attachedExternalId !== null) {
				saveData.externalId = this.#attachedExternalId;
				saveData.externalPublished = this.#attachedPublished;
			}
			this.#saveButton.setWaiting(true);
			main_core.ajax.runComponentAction(this.#props.componentName, 'save', {
				mode: 'class',
				signedParameters: this.#props.signedParameters,
				data: {
					data: saveData
				}
			}).then(response => {
				const dashboard = response?.data?.dashboard;
				if (!dashboard) {
					BX.UI.Notification.Center.notify({
						content: main_core.Text.encode(main_core.Loc.getMessage('DASHBOARD_EDIT_SAVE_RESPONSE_ERROR') ?? '')
					});
					this.#saveButton?.setWaiting(false);
					return;
				}
				if (!this.#props.isEditMode) {
					biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('new', 'report_new', {
						type: 'custom',
						c_element: 'new_button'
					});
					window.open(dashboard.detailUrl, '_blank')?.focus();
				} else {
					this.#sendEditAnalytics(currentTitle, currentDescription, currentGroups, currentPeriod, currentGalleryIds);
				}
				parent.BX.Event.EventEmitter.emit('BIConnector.CreateForm:onDashboardCreated', {
					dashboard
				});
				parent.BX.Event.EventEmitter.emit('BIConnector.CreateForm:onDashboardSaved', {
					dashboard,
					isEditMode: this.#props.isEditMode
				});
				BX.SidePanel.Instance.getTopSlider().close();
			}).catch(response => {
				const message = main_core.Type.isStringFilled(response?.errors?.[0]?.message) ? response.errors[0].message : main_core.Type.isStringFilled(response?.message) ? response.message : main_core.Loc.getMessage('DASHBOARD_EDIT_SAVE_RESPONSE_ERROR');
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(message)
				});
				this.#saveButton?.setWaiting(false);
			});
		}
		#sendEditAnalytics(currentTitle, currentDescription, currentGroups, currentPeriod, currentGalleryIds) {
			const defaults = this.#props.defaultValues ?? {};
			const analyticsBase = {
				type: 'custom',
				c_element: 'edit_card_report'
			};
			if (currentTitle !== (defaults.title ?? '')) {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'change_name', {
					...analyticsBase,
					status: 'success'
				});
			}
			const defaultGroups = (defaults.groups ?? []).map(Number).sort().join(',');
			const newGroups = currentGroups.map(Number).sort().join(',');
			if (newGroups !== defaultGroups) {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'change_group', {
					...analyticsBase,
					status: 'success'
				});
			}
			const defaultPeriod = defaults.filterPeriod ?? 'default';
			const defaultDateStart = defaults.dateFilterStart ?? '';
			const defaultDateEnd = defaults.dateFilterEnd ?? '';
			if ((currentPeriod.filterPeriod ?? 'default') !== defaultPeriod || (currentPeriod.dateFilterStart ?? '') !== defaultDateStart || (currentPeriod.dateFilterEnd ?? '') !== defaultDateEnd) {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'change_period', {
					...analyticsBase,
					status: 'success'
				});
			}
			if (currentDescription !== (defaults.description ?? '')) {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'change_description', {
					...analyticsBase,
					status: 'success'
				});
			}
			const defaultGalleryIds = (defaults.galleryImageIds ?? []).map(Number).sort().join(',');
			const newGalleryIds = currentGalleryIds.map(Number).sort().join(',');
			if (newGalleryIds !== defaultGalleryIds) {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'change_files', {
					...analyticsBase,
					status: 'success'
				});
			}
		}
	}

	main_core.Reflection.namespace('BX.BIConnector').SupersetDashboardEditManager = SupersetDashboardEditManager;

	exports.SupersetDashboardEditManager = SupersetDashboardEditManager;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX.BIConnector, BX.BIConnector, BX.BIConnector, BX.UI, BX.UI.EntitySelector, BX.Main, BX.UI.TextEditor, BX, BX.UI.Uploader, BX.UI.Uploader);
