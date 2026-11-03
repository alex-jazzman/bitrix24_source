/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_entitySelector, ui_vue3, ui_system_input_vue) {
	'use strict';

	const REQUEST_ACTION = 'documentgenerator.api.template.getTitlePatternData';
	const EMPTY_GROUPS = [];
	const SELECTION_EVENTS = ['input', 'keyup', 'mouseup', 'select', 'focus'];
	const INPUT_SELECTOR = 'input, textarea';
	const getMessage = (code, replacements = null) => main_core.Loc.getMessage(code, replacements) ?? '';
	const clampPosition = (position, length) => Math.min(Math.max(position, 0), length);
	const isCompleteContext = context => context !== null && context.fileId > 0 && context.moduleId !== '' && context.providers.length > 0;
	const getErrorMessages = errors => (errors ?? []).map(error => error.message).filter(message => main_core.Type.isStringFilled(message));
	const getRejectedErrors = error => {
		if (!main_core.Type.isObject(error)) {
			return [];
		}
		const response = error;
		if (!main_core.Type.isArray(response.errors)) {
			return [];
		}
		return response.errors.filter(item => main_core.Type.isObject(item));
	};
	const getEmptyGroupMessages = field => field.getEmptyGroups().map(group => ({
		id: group.id,
		text: getMessage('DOCGEN_TITLE_PATTERN_EMPTY_GROUP', {
			'#GROUP#': group.title
		}) || group.title
	}));
	const TitlePatternView = ui_vue3.defineComponent({
		name: 'DocumentGeneratorTitlePattern',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			field: {
				type: Object,
				required: true
			}
		},
		data() {
			const field = this.field;
			return {
				value: field.getValue() ?? '',
				state: field.getState(),
				errorMessages: field.getErrorMessages(),
				emptyGroupMessages: getEmptyGroupMessages(field),
				titlePatternLabel: getMessage('DOCGEN_TITLE_PATTERN_LABEL'),
				insertFieldLabel: getMessage('DOCGEN_TITLE_PATTERN_INSERT_FIELD'),
				loadingLabel: getMessage('DOCGEN_TITLE_PATTERN_LOADING'),
				unsubscribe: null
			};
		},
		computed: {
			hasError() {
				return this.state === 'request-error' || this.errorMessages.length > 0;
			},
			errorText() {
				return this.errorMessages.join('\n');
			},
			pickerLabel() {
				return this.insertFieldLabel || this.titlePatternLabel || null;
			}
		},
		mounted() {
			const field = this.field;
			this.unsubscribe = field.subscribe(() => {
				this.value = field.getValue() ?? '';
				this.state = field.getState();
				this.errorMessages = field.getErrorMessages();
				this.emptyGroupMessages = getEmptyGroupMessages(field);
			});
		},
		beforeUnmount() {
			this.unsubscribe?.();
		},
		methods: {
			handleInput(value) {
				this.field.setValue(value);
			},
			handleBlur(event) {
				const target = event.relatedTarget;
				if (target instanceof Element && target.closest('.documentgenerator-title-pattern__picker-button, #add-template-save-button')) {
					return;
				}
				this.field.validate();
			},
			handlePicker() {
				void this.field.openPicker();
			}
		},
		template: `
		<div class="documentgenerator-title-pattern">
			<div class="documentgenerator-title-pattern__control">
				<div class="documentgenerator-title-pattern__input">
					<BInput
						:model-value="value"
						:label="titlePatternLabel"
						:aria-label="titlePatternLabel"
						:stretched="true"
						@update:model-value="handleInput"
						@blur="handleBlur"
					/>
				</div>
				<button
					type="button"
					class="documentgenerator-title-pattern__picker-button"
					:disabled="state === 'loading'"
					:aria-label="pickerLabel"
					:title="pickerLabel"
					@click="handlePicker"
				></button>
			</div>
			<div v-if="state === 'loading'" class="documentgenerator-title-pattern__message">
				{{ loadingLabel }}
			</div>
			<template v-else>
				<div
					v-if="hasError"
					class="documentgenerator-title-pattern__message --error"
					role="alert"
				>
					{{ errorText }}
				</div>
				<div
					v-for="message in emptyGroupMessages"
					:key="message.id"
					class="documentgenerator-title-pattern__message --empty"
				>
					{{ message.text }}
				</div>
			</template>
		</div>
	`
	});
	class TitlePatternField {
		#ajax;
		#value;
		#context = null;
		#state = 'inactive';
		#groups = EMPTY_GROUPS;
		#maxLength = null;
		#errorMessages = [];
		#token = 0;
		#listeners = new Set();
		#dialog = null;
		#app = null;
		#node = null;
		#input = null;
		#selection = null;
		#captureSelection = () => {
			const input = this.#input;
			if (input === null || input.selectionStart === null || input.selectionEnd === null) {
				return;
			}
			this.#selection = {
				start: input.selectionStart,
				end: input.selectionEnd
			};
		};
		constructor(options = {}) {
			this.#ajax = options.ajax ?? main_core.ajax;
			this.#value = options.value ?? null;
			this.#context = options.context ?? null;
		}
		mount(node) {
			const app = ui_vue3.BitrixVue.createApp(TitlePatternView, {
				field: ui_vue3.markRaw(this)
			});
			app.mount(node);
			this.#app = app;
			this.#node = node;
			const input = node.querySelector(INPUT_SELECTOR);
			this.#input = input;
			if (input !== null) {
				SELECTION_EVENTS.forEach(eventName => main_core.Event.bind(input, eventName, this.#captureSelection));
			}
			return this;
		}
		destroy() {
			this.#token += 1;
			this.#destroyDialog();
			const input = this.#input;
			if (input !== null) {
				SELECTION_EVENTS.forEach(eventName => main_core.Event.unbind(input, eventName, this.#captureSelection));
			}
			this.#input = null;
			this.#selection = null;
			this.#app?.unmount();
			this.#app = null;
			this.#node = null;
			this.#listeners.clear();
		}
		setAjax(ajax) {
			this.#ajax = ajax;
		}
		setValue(value) {
			if (this.#value === value) {
				return;
			}
			this.#value = value;
			this.#token += 1;
			this.#errorMessages = [];
			if (!isCompleteContext(this.#context)) {
				this.#state = 'inactive';
				this.#notify();
				return;
			}
			this.#state = 'inactive';
			this.#notify();
		}
		validate() {
			if (!isCompleteContext(this.#context) || this.#state !== 'inactive' && this.#state !== 'request-error') {
				return;
			}
			this.#state = 'loading';
			this.#errorMessages = [];
			this.#notify();
			void this.#request(this.#token);
		}
		getValue() {
			return this.#value;
		}
		setContext(context) {
			this.#context = {
				...context,
				providers: [...context.providers]
			};
			this.#token += 1;
			this.#groups = EMPTY_GROUPS;
			this.#maxLength = null;
			this.#errorMessages = [];
			this.#destroyDialog();
			if (!isCompleteContext(this.#context)) {
				this.#state = 'inactive';
				this.#notify();
				return;
			}
			this.#state = 'inactive';
			this.#notify();
		}
		canSave() {
			return this.#state !== 'ready-invalid';
		}
		focusError() {
			(this.#input ?? this.#node?.querySelector(INPUT_SELECTOR))?.focus();
		}
		setSelection(start, end = start) {
			this.#selection = {
				start,
				end
			};
		}
		getState() {
			return this.#state;
		}
		isLoading() {
			return this.#state === 'loading';
		}
		getGroups() {
			return this.#groups;
		}
		getEmptyGroups() {
			return this.#groups.filter(group => group.items.length === 0);
		}
		getMaxLength() {
			return this.#maxLength;
		}
		getErrorMessages() {
			return [...this.#errorMessages];
		}
		subscribe(listener) {
			this.#listeners.add(listener);
			return () => this.#listeners.delete(listener);
		}
		insertPlaceholder(placeholder) {
			const value = this.#value ?? '';
			const start = clampPosition(this.#selection?.start ?? value.length, value.length);
			const end = clampPosition(this.#selection?.end ?? start, value.length);
			const caret = start + placeholder.length;
			this.setSelection(caret);
			this.setValue(`${value.slice(0, start)}${placeholder}${value.slice(Math.max(start, end))}`);
			this.#restoreCaret(caret);
		}
		async openPicker() {
			if (!isCompleteContext(this.#context) || this.#state === 'loading') {
				return;
			}
			if (this.#groups.length === 0 || this.#state === 'inactive') {
				this.#state = 'loading';
				this.#errorMessages = [];
				this.#notify();
				const token = this.#token;
				await this.#request(token);
				if (token !== this.#token || this.#groups.length === 0) {
					return;
				}
			}
			this.#dialog ??= this.#createDialog();
			this.#dialog.show();
		}
		#request(token) {
			if (!isCompleteContext(this.#context)) {
				return Promise.resolve();
			}
			const data = {
				...this.#context
			};
			if (this.#value !== null) {
				data.titlePattern = this.#value;
			}
			return Promise.resolve(this.#ajax.runAction(REQUEST_ACTION, {
				data
			})).then(response => {
				if (token !== this.#token) {
					return;
				}
				const responseData = response.data;
				this.#maxLength = responseData?.maxLength ?? null;
				this.#groups = responseData?.groups ?? EMPTY_GROUPS;
				this.#errorMessages = getErrorMessages(responseData?.validation?.errors);
				this.#state = responseData?.validation?.isValid === false ? 'ready-invalid' : 'ready-valid';
				this.#notify();
			}).catch(error => {
				if (token !== this.#token) {
					return;
				}
				this.#state = 'request-error';
				this.#errorMessages = getErrorMessages(getRejectedErrors(error));
				const fallbackMessage = getMessage('DOCGEN_TITLE_PATTERN_REQUEST_ERROR');
				if (this.#errorMessages.length === 0 && fallbackMessage !== '') {
					this.#errorMessages = [fallbackMessage];
				}
				this.#notify();
			});
		}
		#createDialog() {
			return new ui_entitySelector.Dialog({
				targetNode: this.#node?.querySelector('.documentgenerator-title-pattern__picker-button') ?? this.#node ?? document.body,
				entities: this.#groups.map(group => ({
					id: group.id,
					searchable: true
				})),
				items: this.#groups.filter(group => group.items.length > 0).map(group => ({
					id: `title-pattern-group-${group.id}`,
					title: group.title,
					entityId: group.id,
					tabs: 'recents',
					searchable: false,
					saveable: false,
					nodeOptions: {
						open: true
					},
					children: group.items.map(item => ({
						id: item.id,
						title: item.title,
						entityId: group.id,
						customData: {
							placeholder: item.placeholder
						}
					}))
				})),
				enableSearch: true,
				hideOnSelect: true,
				autoHide: true,
				dropdownMode: true,
				multiple: false,
				cacheable: true,
				events: {
					onDestroy: () => {
						this.#dialog = null;
					},
					'Item:onSelect': event => {
						const item = event.getData().item;
						const customData = item.getCustomData?.();
						const placeholder = customData?.get('placeholder');
						if (main_core.Type.isString(placeholder)) {
							this.insertPlaceholder(placeholder);
							item.deselect?.();
						}
					}
				}
			});
		}
		#restoreCaret(position) {
			const input = this.#input;
			if (input === null) {
				return;
			}
			void Promise.resolve().then(() => {
				input.focus();
				input.setSelectionRange(position, position);
				this.setSelection(position);
			});
		}
		#destroyDialog() {
			const dialog = this.#dialog;
			this.#dialog = null;
			if (main_core.Type.isFunction(dialog?.destroy)) {
				dialog.destroy();
			}
		}
		#notify() {
			this.#listeners.forEach(listener => listener());
		}
	}
	let activeField = null;
	function mount(node, options = {}) {
		activeField?.destroy();
		activeField = new TitlePatternField(options).mount(node);
		if (options.context) {
			activeField.setContext(options.context);
		}
		return activeField;
	}
	function setValue(value) {
		activeField?.setValue(value);
	}
	function getValue() {
		return activeField?.getValue() ?? null;
	}
	function setContext(context) {
		activeField?.setContext(context);
	}
	function canSave() {
		return activeField?.canSave() ?? true;
	}
	function focusError() {
		activeField?.focusError();
	}

	exports.TitlePatternField = TitlePatternField;
	exports.canSave = canSave;
	exports.focusError = focusError;
	exports.getValue = getValue;
	exports.mount = mount;
	exports.setContext = setContext;
	exports.setValue = setValue;

})(this.BX.DocumentGenerator = this.BX.DocumentGenerator || {}, BX, BX.UI.EntitySelector, BX.Vue3, BX.UI.System.Input.Vue);
//# sourceMappingURL=title-pattern.bundle.js.map
