/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_designTokens, main_core, bizproc_fields) {
	'use strict';

	const EXPRESSION_OPTION_ROLE = 'expression';
	function declaresWriteOver(target) {
		return target.getAttribute('data-select-mode') === 'replace';
	}
	function insertAtCaret(target, value) {
		if (target instanceof HTMLSelectElement) {
			selectExpression(target, value);
			return;
		}
		const end = target.selectionEnd ?? target.value.length;
		const start = target.selectionStart ?? end;
		const before = target.value.slice(0, start);
		const after = target.value.slice(end);
		write(target, before + value + after, before.length + value.length);
	}
	function writeOver(target, value) {
		if (target instanceof HTMLSelectElement) {
			selectExpression(target, value);
			return;
		}
		write(target, value, value.length);
	}
	function write(target, value, caret) {
		target.value = value;
		target.selectionEnd = caret;
		announce(target);
	}
	function selectExpression(target, value) {
		const option = expressionOption(target);
		option.value = value;
		option.textContent = value;
		option.selected = true;
		announce(target);
	}
	function expressionOption(target) {
		const found = target.querySelector(`option[data-role="${EXPRESSION_OPTION_ROLE}"]`);
		if (!main_core.Type.isNull(found)) {
			return found;
		}
		const option = main_core.Tag.render`<option data-role="${EXPRESSION_OPTION_ROLE}"></option>`;
		main_core.Dom.append(option, target);
		return option;
	}
	function announce(target) {
		target.focus();
		target.dispatchEvent(new globalThis.Event('change', {
			bubbles: true
		}));
	}

	const WRAPPER_CLASS = 'bizprocdesigner-fields-selection';
	const WRAPPER_TESTID = 'bizprocdesigner-fields-selection-wrap';
	const INSERT_BUTTON_CLASS = 'bizprocdesigner-fields-selection__insert';
	const INSERT_BUTTON_TESTID = 'bizprocdesigner-fields-selection-insert';
	const BUILDER_EXTENSION = 'bizprocdesigner.expression-builder';
	const VUE_EXTENSION = 'ui.vue3';
	function resolveFieldName(context, target, property) {
		const {
			fieldName
		} = context;
		if (main_core.Type.isStringFilled(fieldName)) {
			return fieldName;
		}
		const {
			Id: id
		} = property;
		if (main_core.Type.isStringFilled(id)) {
			return id;
		}
		if (main_core.Type.isNull(target)) {
			return '';
		}
		return target.name.endsWith('[]') ? target.name.slice(0, -2) : target.name;
	}
	function buildBuilderProps(params) {
		const {
			bindElement,
			target,
			sourcesProvider,
			close
		} = params;
		return {
			bindElement,
			initialValue: !main_core.Type.isNull(target) && bizproc_fields.isExpressionValue(target.value) ? target.value : '',
			sourcesProvider,
			onApply: value => {
				if (!main_core.Type.isNull(target) && target.isConnected) {
					writeApplied(target, value);
				}
				close();
			},
			onClose: close
		};
	}
	function writeApplied(target, value) {
		if (declaresWriteOver(target)) {
			writeOver(target, value);
			return;
		}
		insertAtCaret(target, value);
	}
	class DesignerSelectionProvider {
		#sourcesProvider;
		#window = null;
		#openRequest = 0;
		constructor(options) {
			this.#sourcesProvider = options.sourcesProvider;
		}
		isAvailable() {
			return true;
		}
		supports(_property) {
			return true;
		}
		decorate(controlNode, property, context) {
			const target = context.writeTarget ?? null;
			const fieldName = resolveFieldName(context, target, property);
			if (main_core.Type.isNull(target)) {
				return controlNode;
			}
			const button = this.#renderInsertButton(fieldName);
			const wrapper = main_core.Tag.render`
			<div class="${WRAPPER_CLASS}" data-testid="${WRAPPER_TESTID}"></div>
		`;
			main_core.Dom.append(controlNode, wrapper);
			main_core.Dom.append(button, wrapper);
			main_core.Event.bind(button, 'click', () => {
				this.#showWindow(button, target, property, context).catch(error => {
					console.error('[bizprocdesigner.fields-selection] the value constructor could not be loaded, ' + 'the click opened nothing', error);
				});
			});
			return wrapper;
		}
		decorateByRole(_role, controlNode, property, context) {
			return this.decorate(controlNode, property, context);
		}
		release() {
			this.#cancelOpening();
			this.#closeWindow();
		}
		async #showWindow(bindElement, target, property, context) {
			const request = this.#cancelOpening();
			this.#closeWindow();
			const loaded = await main_core.Runtime.loadExtension([BUILDER_EXTENSION, VUE_EXTENSION]);
			const builder = loaded;
			if (request !== this.#openRequest || !bindElement.isConnected) {
				return;
			}
			const container = document.createElement('div');
			main_core.Dom.append(container, document.body);
			const app = builder.BitrixVue.createApp(builder.ExpressionBuilder, buildBuilderProps({
				bindElement,
				target,
				sourcesProvider: () => this.#sourcesProvider(property, context),
				close: () => {
					this.#closeWindow();
				}
			}));
			app.mount(container);
			main_core.Dom.attr(bindElement, 'aria-expanded', 'true');
			const observer = new MutationObserver(() => {
				if (!bindElement.isConnected) {
					this.#closeWindow();
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			this.#window = {
				app,
				container,
				bindElement,
				observer
			};
		}
		#cancelOpening() {
			this.#openRequest += 1;
			return this.#openRequest;
		}
		#closeWindow() {
			if (main_core.Type.isNull(this.#window)) {
				return;
			}
			const {
				app,
				container,
				bindElement,
				observer
			} = this.#window;
			this.#window = null;
			observer.disconnect();
			main_core.Dom.attr(bindElement, 'aria-expanded', 'false');
			app.unmount();
			main_core.Dom.remove(container);
		}
		#renderInsertButton(fieldName) {
			const testId = fieldName === '' ? INSERT_BUTTON_TESTID : `${INSERT_BUTTON_TESTID}-${fieldName}`;
			const button = main_core.Tag.render`
			<button
				type="button"
				class="${INSERT_BUTTON_CLASS}"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('BIZPROCDESIGNER_FIELDS_SELECTION_INSERT_VALUE') ?? '')}"
				aria-haspopup="dialog"
				aria-expanded="false"
				data-testid="${main_core.Text.encode(testId)}"
			>
				<div class="ui-icon-set --more-l" aria-hidden="true"></div>
			</button>
		`;
			return button;
		}
	}

	exports.DesignerSelectionProvider = DesignerSelectionProvider;

})(this.BX.Bizprocdesigner = this.BX.Bizprocdesigner || {}, window, BX, BX.Bizproc.Fields);
//# sourceMappingURL=fields-selection.bundle.js.map
