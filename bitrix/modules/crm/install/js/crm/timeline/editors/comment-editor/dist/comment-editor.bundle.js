/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Timeline = this.BX.Crm.Timeline || {};
(function (exports, main_core, main_loader, ui_notification) {
	'use strict';

	class CommentEditor {
		#commentId = null;
		#editorName = null;
		#editorContainer = null;
		#editor = null;
		#postForm = null;
		#commentMessage = '';
		#loader;
		constructor(commentId) {
			if (commentId <= 0) {
				throw new Error('Comment ID must be specified');
			}
			this.#commentId = main_core.Text.toInteger(commentId);
			this.#editorName = `CrmTimeLineComment${this.#commentId}${main_core.Text.getRandom(4)}`;
		}
		show(editorContainer) {
			this.#editorContainer = main_core.Type.isDomNode(editorContainer) ? editorContainer : null;
			if (!this.#editorContainer) {
				throw new Error('Editor container must be specified');
			}
			if (this.#postForm) {
				this.#postForm.oEditor.SetContent(this.#commentMessage);
				this.#editor.ReInitIframe();
				return;
			}
			this.#showLoader(true);
			main_core.ajax.runAction('crm.api.timeline.loadEditor', {
				data: {
					id: this.#commentId,
					name: this.#editorName
				}
			}).then(result => {
				const assets = result.data.assets;
				const assetsToLoad = [...(Object.prototype.hasOwnProperty.call(assets, 'css') ? assets.css : []), ...(Object.prototype.hasOwnProperty.call(assets, 'js') ? assets.js : [])];

				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.load(assetsToLoad, () => {
					if (Object.prototype.hasOwnProperty.call(assets, 'string')) {
						void Promise.all(assets.string.map(stringValue => main_core.Runtime.html(null, stringValue))).then(() => {
							this.#onEditorHtmlLoad(result);
						});
					} else {
						this.#onEditorHtmlLoad(result);
					}
				});
			}).catch(result => this.#onRunRequestError(result));
		}
		getContent() {
			let content = '';
			if (this.#postForm) {
				content = this.#postForm.oEditor.GetContent().trim();
				this.#commentMessage = content;
			}
			if (!main_core.Type.isStringFilled(content)) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_TIMELINE_EMPTY_COMMENT_MESSAGE')
				});
			}
			return content;
		}
		getHtmlContent() {
			let content = '';
			if (this.#postForm) {
				content = this.#postForm.oEditor.currentViewName === 'wysiwyg' ? this.#postForm.oEditor.iframeView.GetValue() : this.#postForm.oEditor.content;
			}
			return content;
		}
		getAttachments() {
			const attachmentList = [];
			if (this.#postForm) {
				this.#postForm.eventNode.querySelectorAll('input[name="UF_CRM_COMMENT_FILES[]"]').forEach(input => attachmentList.push(input.value));
			}
			return attachmentList;
		}
		getAttachmentsAllowEditOptions(attachmentList) {
			if (!main_core.Type.isArrayFilled(attachmentList)) {
				return {};
			}
			const options = {};
			if (this.#postForm) {
				attachmentList.forEach(id => {
					const selectorName = `input[name="CRM_TIMELINE_DISK_ATTACHED_OBJECT_ALLOW_EDIT[${id}]"`;
					const selector = this.#postForm.eventNode.querySelector(selectorName);
					if (selector) {
						options[id] = selector.value;
					}
				});
			}
			return options;
		}
		#onEditorHtmlLoad(result) {
			if (main_core.Type.isObject(result) && main_core.Type.isObject(result.data) && main_core.Type.isStringFilled(result.data.html)) {
				this.#showLoader(false);
				void main_core.Runtime.html(this.#editorContainer, result.data.html).then(() => {
					// eslint-disable-next-line no-undef
					if (LHEPostForm) {
						setTimeout(this.#showEditor.bind(this), 0);
					}
				});
			} else {
				this.#onRunRequestError(result);
			}
		}
		#onRunRequestError(result) {
			this.#showLoader(false);
			if (main_core.Type.isObject(result) && main_core.Type.isArray(result.errors) && result.errors.length > 0) {
				ui_notification.UI.Notification.Center.notify({
					content: result.errors[0].message,
					autoHideDelay: 5000
				});
			}
			if (result.status !== 'success') {
				throw new Error('Unable to load editor component');
			}
		}
		#showEditor() {
			// eslint-disable-next-line no-undef
			this.#postForm = LHEPostForm.getHandler(this.#editorName);
			// eslint-disable-next-line no-undef
			this.#editor = BXHtmlEditor.Get(this.#editorName);

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.onCustomEvent(this.#postForm.eventNode, 'OnShowLHE', [true]);
			this.#commentMessage = this.#postForm.oEditor.GetContent();
			if (this.#editor.dom) {
				main_core.Dom.style(this.#editor.dom.textareaCont, {
					opacity: 1
				});
				main_core.Dom.style(this.#editor.dom.iframeCont, {
					opacity: 1
				});
			}
			setTimeout(() => {
				this.#editor.Focus(true);
			}, 100);
		}
		#showLoader(showLoader) {
			if (showLoader) {
				if (!this.#loader && main_loader.Loader) {
					this.#loader = new main_loader.Loader({
						size: 45,
						offset: {
							top: '1%'
						}
					});
				}
				this.#loader.show(this.#editorContainer);
			} else if (!this.#loader && main_loader.Loader) {
				this.#loader.hide();
			}
		}
	}

	exports.CommentEditor = CommentEditor;

})(this.BX.Crm.Timeline.Editors = this.BX.Crm.Timeline.Editors || {}, BX, BX, BX);
//# sourceMappingURL=comment-editor.bundle.js.map
