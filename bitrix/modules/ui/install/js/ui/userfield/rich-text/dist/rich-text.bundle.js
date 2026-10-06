/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core) {
	'use strict';

	const INPUT_SELECTOR = '.ui-field-rich-text__input';
	const CONTAINER_SELECTOR = '.ui-field-rich-text__editor';
	const EDITABLE_SELECTOR = '.ui-text-editor-editable';
	const ITEM_SELECTOR = '.ui-field-rich-text-item';
	const USER_TYPE_ID = 'rich_text';
	const READY_FLAG = 'richTextReady';
	const EDITOR_MIN_HEIGHT = 100;
	const initialized = new WeakSet();
	const observedWraps = new WeakSet();
	class RichTextControl {
		static #libraryPromise = null;
		static loadLibrary() {
			RichTextControl.#libraryPromise ??= main_core.Runtime.loadExtension('ui.text-editor').then(exports => exports);
			return RichTextControl.#libraryPromise;
		}
		static createEditor = async options => {
			const {
				RichText
			} = await RichTextControl.loadLibrary();
			return new RichText(options);
		};
		#textarea;
		#container;
		#editor = null;
		constructor(textarea) {
			this.#textarea = textarea;
			this.#container = textarea.parentElement ? textarea.parentElement.querySelector(CONTAINER_SELECTOR) : null;
		}
		async init() {
			const config = this.#readConfig();
			if (config === null || !main_core.Type.isElementNode(this.#container)) {
				return false;
			}
			const options = {
				toolbar: main_core.Type.isArray(config.toolbar) ? config.toolbar : [],
				placeholder: main_core.Type.isStringFilled(config.placeholder) ? config.placeholder : '',
				minHeight: EDITOR_MIN_HEIGHT
			};
			if (main_core.Type.isPlainObject(config.copilot)) {
				options.copilot = config.copilot;
			}
			const editor = await RichTextControl.createEditor(options);
			this.#editor = editor;
			main_core.Dom.clean(this.#container);
			editor.renderTo(this.#container);
			if (main_core.Type.isStringFilled(options.placeholder)) {
				const editable = this.#container.querySelector(EDITABLE_SELECTOR);
				if (main_core.Type.isElementNode(editable)) {
					editable.setAttribute('aria-label', options.placeholder);
				}
			}
			if (main_core.Type.isStringFilled(this.#textarea.value)) {
				editor.setText(this.#textarea.value);
			}
			main_core.Dom.style(this.#textarea, 'display', 'none');
			this.#textarea.dataset[READY_FLAG] = 'true';
			this.#bindSync(editor);
			return true;
		}
		#readConfig() {
			const raw = this.#textarea.dataset.config;
			if (!main_core.Type.isStringFilled(raw)) {
				return null;
			}
			try {
				const parsed = JSON.parse(raw);
				return main_core.Type.isPlainObject(parsed) ? parsed : null;
			} catch (error) {
				return null;
			}
		}
		#bindSync(editor) {
			editor.subscribe('onChange', this.#sync);
			const form = this.#textarea.closest('form');
			if (main_core.Type.isElementNode(form)) {
				main_core.Event.bind(form, 'submit', this.#sync);
			}
		}
		#sync = () => {
			if (this.#editor) {
				this.#textarea.value = this.#editor.getText();
				this.#textarea.dispatchEvent(new window.Event('change', {
					bubbles: true,
					cancelable: true
				}));
			}
		};
		static boot() {
			RichTextControl.#registerCloneHandler();
			RichTextControl.#initExisting(document);
		}
		static initWrap(wrap) {
			if (!main_core.Type.isElementNode(wrap)) {
				return Promise.resolve();
			}
			RichTextControl.#registerCloneHandler();
			RichTextControl.#observeWrap(wrap);
			return RichTextControl.#initExisting(wrap);
		}
		static initField(textarea) {
			if (initialized.has(textarea)) {
				return Promise.resolve(false);
			}
			initialized.add(textarea);
			try {
				return new RichTextControl(textarea).init().catch(() => false);
			} catch (error) {
				return Promise.resolve(false);
			}
		}
		static #initExisting(root) {
			const jobs = [];
			root.querySelectorAll(INPUT_SELECTOR).forEach(input => {
				if (input instanceof HTMLTextAreaElement) {
					jobs.push(RichTextControl.initField(input));
				}
			});
			return Promise.all(jobs).then(() => {});
		}
		static #observeWrap(wrap) {
			if (observedWraps.has(wrap)) {
				return;
			}
			observedWraps.add(wrap);
			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					mutation.addedNodes.forEach(node => {
						if (!main_core.Type.isElementNode(node)) {
							return;
						}
						if (node instanceof HTMLTextAreaElement && node.matches(INPUT_SELECTOR)) {
							RichTextControl.initField(node);
						}
						node.querySelectorAll(INPUT_SELECTOR).forEach(input => {
							if (input instanceof HTMLTextAreaElement) {
								RichTextControl.initField(input);
							}
						});
					});
				});
			});
			observer.observe(wrap, {
				childList: true,
				subtree: true
			});
		}
		static #registerCloneHandler() {
			const namespace = main_core.Reflection.getClass('BX.Main.UF');
			const factory = namespace ? namespace.Factory : null;
			const baseType = namespace ? namespace.BaseType : null;
			if (!factory || !main_core.Type.isFunction(factory.setTypeHandler) || !main_core.Type.isFunction(baseType)) {
				return;
			}
			factory.setTypeHandler(USER_TYPE_ID, RichTextControl.#createCloneHandler(baseType));
		}
		static #createCloneHandler(baseType) {
			const CloneHandler = function () {};
			CloneHandler.prototype = Object.create(baseType.prototype);
			CloneHandler.prototype.constructor = CloneHandler;
			CloneHandler.prototype.getClone = function (node) {
				const item = main_core.Type.isElementNode(node) ? node.closest(ITEM_SELECTOR) : null;
				const source = item || node;
				const clone = source.cloneNode(true);
				const textarea = clone.querySelector(INPUT_SELECTOR);
				if (textarea instanceof HTMLTextAreaElement) {
					textarea.value = '';
					main_core.Dom.style(textarea, 'display', null);
					delete textarea.dataset[READY_FLAG];
				}
				const container = clone.querySelector(CONTAINER_SELECTOR);
				if (main_core.Type.isElementNode(container)) {
					main_core.Dom.clean(container);
				}
				return clone;
			};
			return CloneHandler;
		}
	}

	main_core.Event.ready(() => {
		RichTextControl.boot();
	});

	exports.RichTextControl = RichTextControl;

})(this.BX.UI.UserField = this.BX.UI.UserField || {}, BX);
//# sourceMappingURL=rich-text.bundle.js.map
