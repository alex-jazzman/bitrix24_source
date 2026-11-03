/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core, sign_v2_api, main_core_events) {
	'use strict';

	const buttonClassList = ['ui-btn', 'ui-btn-sm', 'ui-btn-light-border', 'ui-btn-round'];
	class DocumentSummary extends main_core_events.EventEmitter {
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Sign.V2.DocumentSummary');
			this.subscribeFromOptions(options.events);
		}
		#createDocumentDetails(item) {
			const title = main_core.Text.encode(item.title ?? '');
			return main_core.Tag.render`
			<div class="sign-document-summary__details">
				<div class="sign-document-summary__details_title">
					<span
						class="sign-document-summary__details_title-text"
						title="${title}"
					>
						${title}
					</span>
					<span
						class="sign-document-summary__details_edit-title-btn"
						onclick="${({
			target: button
		}) => {
			this.#toggleTitleEditor(item, button, true);
		}}"
					>
					</span>
				</div>
				${this.#createNumber(item.externalId)}
			</div>
		`;
		}
		addItem(uid, itemDetails) {
			if (!this.items) {
				this.items = {};
			}
			this.items[uid] = itemDetails;
		}
		deleteItem(uid) {
			if (!this.items || !this.items[uid]) {
				return;
			}
			delete this.items[uid];
		}
		setItems(documentObject) {
			this.items = {};
			Object.keys(documentObject).forEach(uid => {
				this.items[uid] = documentObject[uid];
			});
		}
		#createNumber(number) {
			if (!number) {
				return null;
			}
			const title = main_core.Loc.getMessage('SIGN_DOCUMENT_SUMMARY_REG_NUMBER', {
				'#NUMBER#': main_core.Text.encode(number)
			});
			return main_core.Tag.render`
			<div class="sign-document-summary__reg_number" title="${title}">
				${title}
			</div>
		`;
		}
		#createTitleEditor(item) {
			const okButtonClassName = [...buttonClassList.slice(0, 2), 'ui-btn-primary', 'sign-document-summary__title-editor_ok-btn'].join(' ');
			const discardButtonClassName = [...buttonClassList.slice(0, 3), 'sign-document-summary__title-editor_discard-btn'].join(' ');
			const input = main_core.Tag.render`<input type="text" class="ui-ctl-element" maxlength="255" />`;
			input.value = item.title ?? '';
			this.#focusInput(input);
			return main_core.Tag.render`
			<div class="sign-document-summary__title-editor">
				<div class="sign-document-summary__title-editor_controls">
					<span class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						${input}
					</span>
					<span
						class="${okButtonClassName}"
						onclick="${async ({
			target
		}) => {
			main_core.Dom.addClass(target, 'ui-btn-wait');
			await this.#modifyDocumentTitle(item, input.value);
			main_core.Dom.removeClass(target, 'ui-btn-wait');
			this.#toggleTitleEditor(item, target, false);
		}}"
					>
					</span>
					<span
						class="${discardButtonClassName}"
						onclick="${({
			target
		}) => {
			this.#toggleTitleEditor(item, target, false);
		}}"
					>
					</span>
				</div>
			</div>
		`;
		}
		#toggleTitleEditor(item, button, shouldShow) {
			const summaryNode = button.closest('.sign-document-summary');
			if (shouldShow) {
				main_core.Dom.clean(summaryNode);
				main_core.Dom.append(this.#createTitleEditor(item), summaryNode);
				return;
			}
			main_core.Dom.replace(summaryNode.firstElementChild, this.#createDocumentDetails(item));
			main_core.Dom.append(this.#createEditDocumentBtn(item), summaryNode);
		}
		#focusInput(input) {
			const observer = new MutationObserver(() => {
				if (input.isConnected) {
					input.focus();
					observer.disconnect();
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
		async #modifyDocumentTitle(item, newValue) {
			if (item.title === newValue) {
				return;
			}
			try {
				const api = new sign_v2_api.Api();
				const titleData = await api.modifyTitle(item.uid, newValue);
				this.items[item.uid].title = newValue;
				this.emit('changeTitle', {
					uid: item.uid,
					title: newValue,
					blankTitle: titleData.blankTitle
				});
			} catch (ex) {
				console.error(ex);
			}
		}
		setNumber(uid, number) {
			this.items[uid].number = number;
		}
		#createEditDocumentBtn(item) {
			const id = item.id;
			const uid = item.uid;
			const eventName = item.hasPlaceholders ? 'showPlaceholderEditor' : 'showEditor';
			return main_core.Tag.render`
			<span
				class="${buttonClassList.join(' ')}" data-id="${id}"
				onclick="${() => this.emit(eventName, {
			uid
		})}"
			>
				${main_core.Loc.getMessage('SIGN_DOCUMENT_SUMMARY_EDIT')}
			</span>
		`;
		}
		getLayout() {
			const container = main_core.Tag.render`
			<div class="sign-document-summary-wrapper"></div>
		`;
			for (const item of Object.values(this.items)) {
				const itemBlock = main_core.Tag.render`
				<div class="sign-document-summary">
					${this.#createDocumentDetails(item)}
					${this.#createEditDocumentBtn(item)}
				</div>
			`;
				main_core.Dom.append(itemBlock, container);
			}
			return container;
		}
	}

	exports.DocumentSummary = DocumentSummary;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX, BX.Sign.V2, BX.Event);
//# sourceMappingURL=document-summary.bundle.js.map
