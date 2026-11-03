import { ajax as Ajax, Event, Loc, Type } from 'main.core';
import { Dialog } from 'ui.entity-selector';
import { BitrixVue, defineComponent, markRaw } from 'ui.vue3';
import { BInput } from 'ui.system.input.vue';

import './title-pattern.css';

export type TitlePatternContext = {
	fileId: number,
	providers: string[],
	moduleId: string,
	templateId?: number,
};

export type TitlePatternState = 'inactive' | 'loading' | 'ready-valid' | 'ready-invalid' | 'request-error';

type TitlePatternItem = {
	id: string,
	title: string,
	placeholder: string,
};

type TitlePatternGroup = {
	id: string,
	title: string,
	items: TitlePatternItem[],
};

type TitlePatternValidationError = {
	message?: string,
	code?: string,
};

type TitlePatternResponseData = {
	maxLength?: number,
	groups?: TitlePatternGroup[],
	validation?: {
		checked?: boolean,
		isValid?: boolean | null,
		errors?: TitlePatternValidationError[],
	},
};

type TitlePatternResponse = {
	status: string,
	data: TitlePatternResponseData | null,
	errors: TitlePatternValidationError[],
};

type AjaxClient = {
	runAction(action: string, options: { data: Record<string, unknown> }): Promise<TitlePatternResponse>,
};

type SelectorItem = {
	id?: string,
	getId?: () => string,
	getCustomData?: () => { get(key: string): unknown },
	deselect?: () => void,
};

type SelectorEvent = {
	getData(): { item: SelectorItem },
};

export type TitlePatternFieldOptions = {
	ajax?: AjaxClient,
	value?: string | null,
	context?: TitlePatternContext,
};

type StateListener = () => void;

type TextSelection = {
	start: number,
	end: number,
};

type EmptyGroupMessage = {
	id: string,
	text: string,
};

const REQUEST_ACTION = 'documentgenerator.api.template.getTitlePatternData';
const EMPTY_GROUPS: TitlePatternGroup[] = [];
const SELECTION_EVENTS = ['input', 'keyup', 'mouseup', 'select', 'focus'];
const INPUT_SELECTOR = 'input, textarea';

const getMessage = (code: string, replacements: Record<string, string> | null = null): string => (
	Loc.getMessage(code, replacements) ?? ''
);

const clampPosition = (position: number, length: number): number => Math.min(Math.max(position, 0), length);

const isCompleteContext = (context: TitlePatternContext | null): context is TitlePatternContext => (
	context !== null
	&& context.fileId > 0
	&& context.moduleId !== ''
	&& context.providers.length > 0
);

const getErrorMessages = (errors: TitlePatternValidationError[] | undefined): string[] => (
	(errors ?? [])
		.map((error) => error.message)
		.filter((message): message is string => Type.isStringFilled(message))
);

const getRejectedErrors = (error: unknown): TitlePatternValidationError[] => {
	if (!Type.isObject(error))
	{
		return [];
	}

	const response = error as { errors?: unknown };
	if (!Type.isArray(response.errors))
	{
		return [];
	}

	return response.errors.filter((item): item is TitlePatternValidationError => Type.isObject(item));
};

const getEmptyGroupMessages = (field: TitlePatternField): EmptyGroupMessage[] => field
	.getEmptyGroups()
	.map((group) => ({
		id: group.id,
		// the server title keeps the message readable when the phrase is missing in the current language
		text: getMessage('DOCGEN_TITLE_PATTERN_EMPTY_GROUP', { '#GROUP#': group.title }) || group.title,
	}));

const TitlePatternView = defineComponent({
	name: 'DocumentGeneratorTitlePattern',
	components: {
		BInput,
	},
	props: {
		field: {
			type: Object,
			required: true,
		},
	},
	data(): {
		value: string,
		state: TitlePatternState,
		errorMessages: string[],
		emptyGroupMessages: EmptyGroupMessage[],
		titlePatternLabel: string,
		insertFieldLabel: string,
		loadingLabel: string,
		unsubscribe: (() => void) | null,
		}
	{
		const field = this.field as unknown as TitlePatternField;

		return {
			value: field.getValue() ?? '',
			state: field.getState(),
			errorMessages: field.getErrorMessages(),
			emptyGroupMessages: getEmptyGroupMessages(field),
			titlePatternLabel: getMessage('DOCGEN_TITLE_PATTERN_LABEL'),
			insertFieldLabel: getMessage('DOCGEN_TITLE_PATTERN_INSERT_FIELD'),
			loadingLabel: getMessage('DOCGEN_TITLE_PATTERN_LOADING'),
			unsubscribe: null,
		};
	},
	computed: {
		hasError(): boolean
		{
			return this.state === 'request-error' || this.errorMessages.length > 0;
		},
		errorText(): string
		{
			return this.errorMessages.join('\n');
		},
		pickerLabel(): string | null
		{
			return this.insertFieldLabel || this.titlePatternLabel || null;
		},
	},
	mounted(): void
	{
		const field = this.field as unknown as TitlePatternField;
		this.unsubscribe = field.subscribe(() => {
			this.value = field.getValue() ?? '';
			this.state = field.getState();
			this.errorMessages = field.getErrorMessages();
			this.emptyGroupMessages = getEmptyGroupMessages(field);
		});
	},
	beforeUnmount(): void
	{
		this.unsubscribe?.();
	},
	methods: {
		handleInput(value: string): void
		{
			(this.field as unknown as TitlePatternField).setValue(value);
		},
		handleBlur(event: FocusEvent): void
		{
			const target = event.relatedTarget;
			if (target instanceof Element && target.closest('.documentgenerator-title-pattern__picker-button, #add-template-save-button'))
			{
				return;
			}

			(this.field as unknown as TitlePatternField).validate();
		},
		handlePicker(): void
		{
			void (this.field as unknown as TitlePatternField).openPicker();
		},
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
	`,
});

export class TitlePatternField
{
	#ajax: AjaxClient;
	#value: string | null;
	#context: TitlePatternContext | null = null;
	#state: TitlePatternState = 'inactive';
	#groups: TitlePatternGroup[] = EMPTY_GROUPS;
	#maxLength: number | null = null;
	#errorMessages: string[] = [];
	#token = 0;
	#listeners = new Set<StateListener>();
	#dialog: Dialog | null = null;
	#app: { unmount(): void } | null = null;
	#node: HTMLElement | null = null;
	#input: HTMLInputElement | HTMLTextAreaElement | null = null;
	#selection: TextSelection | null = null;
	#captureSelection = (): void => {
		const input = this.#input;
		if (input === null || input.selectionStart === null || input.selectionEnd === null)
		{
			return;
		}

		this.#selection = { start: input.selectionStart, end: input.selectionEnd };
	};

	constructor(options: TitlePatternFieldOptions = {})
	{
		this.#ajax = options.ajax ?? (Ajax as unknown as AjaxClient);
		this.#value = options.value ?? null;
		this.#context = options.context ?? null;
	}

	mount(node: HTMLElement): this
	{
		const app = BitrixVue.createApp(TitlePatternView, { field: markRaw(this) });
		app.mount(node);
		this.#app = app;
		this.#node = node;
		const input = node.querySelector<HTMLInputElement | HTMLTextAreaElement>(INPUT_SELECTOR);
		this.#input = input;
		if (input !== null)
		{
			SELECTION_EVENTS.forEach((eventName) => Event.bind(input, eventName, this.#captureSelection));
		}

		return this;
	}

	destroy(): void
	{
		this.#token += 1;
		this.#destroyDialog();
		const input = this.#input;
		if (input !== null)
		{
			SELECTION_EVENTS.forEach((eventName) => Event.unbind(input, eventName, this.#captureSelection));
		}
		this.#input = null;
		this.#selection = null;
		this.#app?.unmount();
		this.#app = null;
		this.#node = null;
		this.#listeners.clear();
	}

	setAjax(ajax: AjaxClient): void
	{
		this.#ajax = ajax;
	}

	setValue(value: string | null): void
	{
		if (this.#value === value)
		{
			return;
		}

		this.#value = value;
		this.#token += 1;
		this.#errorMessages = [];
		if (!isCompleteContext(this.#context))
		{
			this.#state = 'inactive';
			this.#notify();

			return;
		}

		this.#state = 'inactive';
		this.#notify();
	}

	validate(): void
	{
		if (!isCompleteContext(this.#context) || (this.#state !== 'inactive' && this.#state !== 'request-error'))
		{
			return;
		}

		this.#state = 'loading';
		this.#errorMessages = [];
		this.#notify();
		void this.#request(this.#token);
	}

	getValue(): string | null
	{
		return this.#value;
	}

	setContext(context: TitlePatternContext): void
	{
		this.#context = {
			...context,
			providers: [...context.providers],
		};
		this.#token += 1;
		this.#groups = EMPTY_GROUPS;
		this.#maxLength = null;
		this.#errorMessages = [];
		this.#destroyDialog();

		if (!isCompleteContext(this.#context))
		{
			this.#state = 'inactive';
			this.#notify();

			return;
		}

		this.#state = 'inactive';
		this.#notify();
	}

	canSave(): boolean
	{
		return this.#state !== 'ready-invalid';
	}

	focusError(): void
	{
		(this.#input ?? this.#node?.querySelector<HTMLInputElement | HTMLTextAreaElement>(INPUT_SELECTOR))?.focus();
	}

	setSelection(start: number, end: number = start): void
	{
		this.#selection = { start, end };
	}

	getState(): TitlePatternState
	{
		return this.#state;
	}

	isLoading(): boolean
	{
		return this.#state === 'loading';
	}

	getGroups(): TitlePatternGroup[]
	{
		return this.#groups;
	}

	getEmptyGroups(): TitlePatternGroup[]
	{
		return this.#groups.filter((group) => group.items.length === 0);
	}

	getMaxLength(): number | null
	{
		return this.#maxLength;
	}

	getErrorMessages(): string[]
	{
		return [...this.#errorMessages];
	}

	subscribe(listener: StateListener): () => void
	{
		this.#listeners.add(listener);

		return () => this.#listeners.delete(listener);
	}

	insertPlaceholder(placeholder: string): void
	{
		const value = this.#value ?? '';
		const start = clampPosition(this.#selection?.start ?? value.length, value.length);
		const end = clampPosition(this.#selection?.end ?? start, value.length);
		const caret = start + placeholder.length;

		this.setSelection(caret);
		this.setValue(`${value.slice(0, start)}${placeholder}${value.slice(Math.max(start, end))}`);
		this.#restoreCaret(caret);
	}

	async openPicker(): Promise<void>
	{
		if (!isCompleteContext(this.#context) || this.#state === 'loading')
		{
			return;
		}

		if (this.#groups.length === 0 || this.#state === 'inactive')
		{
			this.#state = 'loading';
			this.#errorMessages = [];
			this.#notify();
			const token = this.#token;
			await this.#request(token);
			if (token !== this.#token || this.#groups.length === 0)
			{
				return;
			}
		}

		this.#dialog ??= this.#createDialog();
		this.#dialog.show();
	}

	#request(token: number): Promise<void>
	{
		if (!isCompleteContext(this.#context))
		{
			return Promise.resolve();
		}

		const data: Record<string, unknown> = {
			...this.#context,
		};
		if (this.#value !== null)
		{
			data.titlePattern = this.#value;
		}

		return Promise.resolve(this.#ajax.runAction(REQUEST_ACTION, { data }))
			.then((response) => {
				if (token !== this.#token)
				{
					return;
				}

				const responseData = response.data;
				this.#maxLength = responseData?.maxLength ?? null;
				this.#groups = responseData?.groups ?? EMPTY_GROUPS;
				this.#errorMessages = getErrorMessages(responseData?.validation?.errors);
				this.#state = responseData?.validation?.isValid === false ? 'ready-invalid' : 'ready-valid';
				this.#notify();
			})
			.catch((error: unknown) => {
				if (token !== this.#token)
				{
					return;
				}

				this.#state = 'request-error';
				this.#errorMessages = getErrorMessages(getRejectedErrors(error));
				const fallbackMessage = getMessage('DOCGEN_TITLE_PATTERN_REQUEST_ERROR');
				if (this.#errorMessages.length === 0 && fallbackMessage !== '')
				{
					this.#errorMessages = [fallbackMessage];
				}
				this.#notify();
			});
	}

	#createDialog(): Dialog
	{
		return new Dialog({
			targetNode: this.#node?.querySelector('.documentgenerator-title-pattern__picker-button') ?? this.#node ?? document.body,
			entities: this.#groups.map((group) => ({
				id: group.id,
				searchable: true,
			})),
			items: this.#groups.filter((group) => group.items.length > 0).map((group) => ({
				id: `title-pattern-group-${group.id}`,
				title: group.title,
				entityId: group.id,
				tabs: 'recents',
				searchable: false,
				saveable: false,
				nodeOptions: { open: true },
				children: group.items.map((item) => ({
					id: item.id,
					title: item.title,
					entityId: group.id,
					customData: { placeholder: item.placeholder },
				})),
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
				'Item:onSelect': (event: SelectorEvent) => {
					const item = event.getData().item;
					const customData = item.getCustomData?.();
					const placeholder = customData?.get('placeholder');
					if (Type.isString(placeholder))
					{
						this.insertPlaceholder(placeholder);
						item.deselect?.();
					}
				},
			},
		});
	}

	#restoreCaret(position: number): void
	{
		const input = this.#input;
		if (input === null)
		{
			return;
		}

		// the new value reaches the DOM on the Vue flush microtask, so the caret is set after it
		void Promise.resolve().then(() => {
			input.focus();
			input.setSelectionRange(position, position);
			// focus fired by the restore itself captures the stale caret of the just replaced value
			this.setSelection(position);
		});
	}

	#destroyDialog(): void
	{
		const dialog = this.#dialog;
		this.#dialog = null;
		if (Type.isFunction(dialog?.destroy))
		{
			dialog.destroy();
		}
	}

	#notify(): void
	{
		this.#listeners.forEach((listener) => listener());
	}
}

let activeField: TitlePatternField | null = null;

export function mount(node: HTMLElement, options: TitlePatternFieldOptions = {}): TitlePatternField
{
	activeField?.destroy();
	activeField = new TitlePatternField(options).mount(node);
	if (options.context)
	{
		activeField.setContext(options.context);
	}

	return activeField;
}

export function setValue(value: string | null): void
{
	activeField?.setValue(value);
}

export function getValue(): string | null
{
	return activeField?.getValue() ?? null;
}

export function setContext(context: TitlePatternContext): void
{
	activeField?.setContext(context);
}

export function canSave(): boolean
{
	return activeField?.canSave() ?? true;
}

export function focusError(): void
{
	activeField?.focusError();
}
