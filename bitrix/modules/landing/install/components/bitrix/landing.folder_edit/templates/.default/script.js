/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core) {
	'use strict';

	const controlSelector = '[data-landing-edit-control]';
	const targetAttribute = 'data-landing-edit-target';
	const textSelector = '[data-landing-edit-text]';
	const inputWrapperSelector = '[data-landing-edit-input]';
	const inputSelector = '.ui-ctl-element';
	const showNode = node => {
		main_core.Dom.style(node, 'display', 'flex');
	};
	const hideNode = node => {
		main_core.Dom.style(node, 'display', 'none');
	};

	// the markup hides the input wrapper with !important, restore the same declaration
	const hideInputWrapper = node => {
		main_core.Dom.attr(node, 'style', 'display: none !important');
	};
	class EditableField {
		#button;
		#text;
		#inputWrapper;
		#input;
		#active = false;
		#originalValue = '';
		#onKeyDown;
		#onBlur;
		#onClick;
		static bindAll() {
			const fields = [];
			[...document.querySelectorAll(controlSelector)].forEach(button => {
				const container = document.getElementById(button.getAttribute(targetAttribute));
				if (!container) {
					return;
				}
				const text = container.querySelector(textSelector);
				const inputWrapper = container.querySelector(inputWrapperSelector);
				const input = inputWrapper ? inputWrapper.querySelector(inputSelector) : null;
				if (text && input) {
					fields.push(new EditableField({
						button,
						text,
						inputWrapper,
						input
					}));
				}
			});
			return fields;
		}
		constructor(options) {
			this.#button = options.button;
			this.#text = options.text;
			this.#inputWrapper = options.inputWrapper;
			this.#input = options.input;
			this.#onKeyDown = this.#handleKeyDown.bind(this);
			this.#onBlur = this.#handleBlur.bind(this);
			this.#onClick = this.#enter.bind(this);
			main_core.Event.bind(this.#button, 'click', this.#onClick);
		}
		#enter() {
			if (this.#active) {
				return;
			}
			this.#originalValue = this.#text.innerText;
			this.#input.value = this.#originalValue;
			hideNode(this.#text);
			hideNode(this.#button);
			showNode(this.#inputWrapper);
			main_core.Event.bind(this.#input, 'keydown', this.#onKeyDown);
			main_core.Event.bind(this.#input, 'blur', this.#onBlur);
			this.#active = true;
			this.#input.focus();
		}

		// listeners go off before the focus moves: focusing the button blurs the input
		#leave(applyValue, returnFocus) {
			if (!this.#active) {
				return;
			}
			this.#active = false;
			main_core.Event.unbind(this.#input, 'keydown', this.#onKeyDown);
			main_core.Event.unbind(this.#input, 'blur', this.#onBlur);
			showNode(this.#text);
			showNode(this.#button);
			hideInputWrapper(this.#inputWrapper);
			if (applyValue) {
				this.#text.innerText = this.#input.value;
			} else {
				this.#input.value = this.#originalValue;
			}
			if (returnFocus) {
				this.#button.focus();
			}
		}

		// the keyboard has nowhere else to go, so the focus is handed back to the button; a pointer
		// leaving the field has already chosen where the focus goes and must not be pulled away
		#handleKeyDown(ev) {
			if (ev.key === 'Escape') {
				this.#leave(false, true);
				ev.stopPropagation();
				return;
			}
			if (ev.key === 'Enter') {
				this.#leave(true, true);
				ev.stopPropagation();
				ev.preventDefault();
			}
		}
		#handleBlur() {
			this.#leave(true, false);
		}
	}

	class FolderEdit {
		#siteId;
		#siteType;
		#folderId;
		#selectorCreateIndex;
		#selectorIndexMetaBlock;
		#selectorSelect;
		#selectorPageLink;
		#selectorFieldId;
		#selectorPreviewBlock;
		#selectorPreviewTitle;
		#selectorPreviewDescription;
		#selectorPreviewPicture;
		#selectorPreviewSrcPicture;
		#selectorPreviewPictureWrapper;
		#pathToLandingEdit;
		#pathToLandingCreate;
		#isUseNewMarket;
		#linkUrlSelector;
		#linkPictureSelector;
		#ajaxPathLoadPreview = '/bitrix/services/main/ajax.php?action=landing.api.landing.getById&landingId=#id#';
		constructor(options) {
			this.#siteId = options.siteId;
			this.#siteType = options.siteType;
			this.#folderId = options.folderId;
			this.#selectorCreateIndex = options.selectorCreateIndex;
			this.#selectorIndexMetaBlock = options.selectorIndexMetaBlock;
			this.#selectorSelect = options.selectorSelect;
			this.#selectorPageLink = options.selectorPageLink;
			this.#selectorFieldId = options.selectorFieldId;
			this.#selectorPreviewBlock = options.selectorPreviewBlock;
			this.#selectorPreviewTitle = options.selectorPreviewTitle;
			this.#selectorPreviewDescription = options.selectorPreviewDescription;
			this.#selectorPreviewPicture = options.selectorPreviewPicture;
			this.#selectorPreviewSrcPicture = options.selectorPreviewSrcPicture;
			this.#selectorPreviewPictureWrapper = options.selectorPreviewPictureWrapper;
			this.#pathToLandingEdit = options.pathToLandingEdit;
			this.#pathToLandingCreate = options.pathToLandingCreate;
			this.#isUseNewMarket = options.isUseNewMarket;
			this.#initSelector();
			this.#initPicture();
			main_core.Event.bind(this.#selectorSelect, 'click', this.#onClickSelect.bind(this));
			if (this.#selectorCreateIndex) {
				main_core.Event.bind(this.#selectorCreateIndex, 'click', this.#onClickIndexCreate.bind(this));
			}
		}
		#initSelector() {
			this.#linkUrlSelector = new BX.Landing.UI.Field.LinkUrl({
				title: null,
				content: null,
				allowedTypes: [BX.Landing.UI.Field.LinkUrl.TYPE_PAGE],
				options: {
					siteId: this.#siteId,
					currentSiteOnly: true,
					disableAddPage: true,
					landingId: -1,
					filter: {
						'ID': this.#siteId,
						'=TYPE': this.#siteType
					},
					filterLanding: {
						'FOLDER_ID': this.#folderId
					}
				},
				onInput: this.#onSelect.bind(this)
			});
		}
		#initPicture() {
			if (!this.#selectorPreviewSrcPicture) {
				return;
			}
			this.#linkPictureSelector = new BX.Landing.UI.Field.Image({
				id: 'folderPicture',
				disableLink: true,
				disableAltField: true,
				allowClear: true,
				content: {
					src: this.#selectorPreviewSrcPicture.getAttribute('value'),
					id: this.#selectorPreviewPicture.getAttribute('value')
				},
				uploadParams: {
					action: 'Site::uploadFile',
					id: this.#siteId
				},
				dimensions: {
					width: 1200,
					height: 1200
				}
			});
			main_core.Dom.clean(this.#selectorPreviewPictureWrapper);
			main_core.Dom.append(this.#linkPictureSelector['layout'], this.#selectorPreviewPictureWrapper);
			this.#linkPictureSelector['layout'].addEventListener('input', () => {
				const file = this.#linkPictureSelector.getValue();
				this.#selectorPreviewPicture.setAttribute('value', file['id2x']);
			});
		}
		#onSelect(title) {
			let id;
			const linkUrlSelectorValue = this.#linkUrlSelector.getValue();
			if (linkUrlSelectorValue.startsWith('page:')) {
				id = linkUrlSelectorValue.substr(13);
			} else {
				id = linkUrlSelectorValue.substr(8);
			}
			const path = this.#pathToLandingEdit.replace('#landing_edit#', id);
			main_core.Dom.clean(this.#selectorPageLink);
			main_core.Dom.append(main_core.Dom.create('span', {
				attrs: {
					id: 'landing-folder-index-link-text',
					class: 'landing-folder-index-link-text'
				},
				text: title
			}), this.#selectorPageLink);
			this.#selectorPageLink.setAttribute('href', path);
			this.#selectorPageLink.removeAttribute('hidden');
			this.#selectorFieldId.setAttribute('value', id);
			this.#loadPreview(id);
		}
		#onClickSelect() {
			this.#linkUrlSelector.onSelectButtonClick();
		}
		#onClickIndexCreate(e) {
			const options = {
				allowChangeHistory: false,
				events: {
					onClose: function () {
						window.location.reload();
					}
				}
			};
			if (this.#isUseNewMarket) {
				options.cacheable = false;
				options.customLeftBoundary = 0;
			}
			BX.SidePanel.Instance.open(this.#pathToLandingCreate, options);
			BX.PreventDefault(e);
		}
		#loadPreview(landingId) {
			this.#selectorPreviewBlock.style.display = 'block';
			this.#selectorIndexMetaBlock.style.display = 'flex';
			BX.ajax({
				url: this.#ajaxPathLoadPreview.replace('#id#', landingId),
				method: 'GET',
				dataType: 'json',
				onsuccess: result => {
					const data = result.data;
					if (!data['ADDITIONAL_FIELDS']) {
						return;
					}
					const title = data['ADDITIONAL_FIELDS']['METAOG_TITLE'] || data['TITLE'];
					const description = data['ADDITIONAL_FIELDS']['METAOG_DESCRIPTION'] || data['DESCRIPTION'] || '';
					this.#selectorPreviewTitle.setAttribute('value', title);
					this.#selectorPreviewDescription.setAttribute('value', description);
					this.#selectorPreviewPicture.setAttribute('value', '');
					this.#selectorPreviewPicture.setAttribute('value', data['ADDITIONAL_FIELDS']['~METAOG_IMAGE'] || '');
					this.#selectorPreviewSrcPicture.setAttribute('value', data['ADDITIONAL_FIELDS']['METAOG_IMAGE'] || '');
					this.#linkPictureSelector.setValue({
						src: data['ADDITIONAL_FIELDS']['METAOG_IMAGE'] || '',
						id: data['ADDITIONAL_FIELDS']['~METAOG_IMAGE'] || -1
					});
				}
			});
		}
	}

	exports.EditableField = EditableField;
	exports.FolderEdit = FolderEdit;

})(this.BX.Landing.Component = this.BX.Landing.Component || {}, BX);
//# sourceMappingURL=script.js.map
