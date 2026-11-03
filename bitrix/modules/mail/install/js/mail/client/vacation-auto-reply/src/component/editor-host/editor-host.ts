import { Dom, Event as CoreEvent, Loc, Type } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { EditorAdapter } from '../../infrastructure/adapter/editor-adapter';
import { type FieldErrorTarget } from '../../state';
import { type SignatureTransport } from '../../transport';
import { type VacationAutoReplySetting } from '../../types';

type EditorRefs = {
	alert?: Element,
	error?: Element,
	host?: Element,
};

const TestId = Object.freeze({
	alert: 'mail-vacation-auto-reply-alert',
	error: 'mail-vacation-auto-reply-error-body',
	host: 'mail-vacation-auto-reply-editor-host',
});

const FocusClass = '--focused';

type FocusBinding = {
	control: HTMLElement,
	iframeBody: HTMLElement | null,
	host: HTMLElement,
	showFocus: () => void,
	hideFocus: () => void,
};

function loc(phrase: string): string
{
	return Loc.getMessage(phrase) ?? '';
}

function resolveElement(element: Element | undefined): HTMLElement | null
{
	return Type.isElementNode(element) ? element as HTMLElement : null;
}

function resolveIframeBody(control: HTMLElement): HTMLElement | null
{
	if (!(control instanceof HTMLIFrameElement))
	{
		return null;
	}

	try
	{
		const body = control.contentDocument?.body;

		return body === undefined || body === null ? null : resolveElement(body);
	}
	catch
	{
		return null;
	}
}

function createFocusBinding(control: HTMLElement, host: HTMLElement): FocusBinding
{
	const showFocus = (): void => Dom.addClass(host, FocusClass);
	const hideFocus = (): void => Dom.removeClass(host, FocusClass);
	const iframeBody = resolveIframeBody(control);

	CoreEvent.bind(control, 'focusin', showFocus);
	CoreEvent.bind(control, 'focusout', hideFocus);
	if (iframeBody !== null)
	{
		CoreEvent.bind(iframeBody, 'focusin', showFocus);
		CoreEvent.bind(iframeBody, 'focusout', hideFocus);
	}

	return { control, iframeBody, host, showFocus, hideFocus };
}

function destroyFocusBinding(binding: FocusBinding): void
{
	CoreEvent.unbind(binding.control, 'focusin', binding.showFocus);
	CoreEvent.unbind(binding.control, 'focusout', binding.hideFocus);
	if (binding.iframeBody !== null)
	{
		CoreEvent.unbind(binding.iframeBody, 'focusin', binding.showFocus);
		CoreEvent.unbind(binding.iframeBody, 'focusout', binding.hideFocus);
	}
	Dom.removeClass(binding.host, FocusClass);
}

// @vue/component
export const EditorHost = defineComponent({
	name: 'MailVacationAutoReplyEditorHost',
	props: {
		editorId: {
			type: String,
			default: '',
		},
		editorNode: {
			type: Object as PropType<HTMLElement | null>,
			default: null,
		},
		transport: {
			type: Object as PropType<SignatureTransport | null>,
			default: null,
		},
		body: {
			type: String,
			default: '',
		},
		setting: {
			type: Object as PropType<VacationAutoReplySetting | null | undefined>,
			default: undefined,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		error: {
			type: String,
			default: '',
		},
	},
	setup()
	{
		let adapter: EditorAdapter | null = null;
		let focusBindings: FocusBinding[] = [];

		const clearFocusBindings = (): void => {
			focusBindings.forEach((binding: FocusBinding): void => destroyFocusBinding(binding));
			focusBindings = [];
		};

		return {
			testId: TestId,

			createAdapter(options: {
				editorInstanceId: string,
				editorNode: HTMLElement,
				host: HTMLElement,
				alertContainer: HTMLElement,
				toolbarLabel: string,
				transport: SignatureTransport,
			}): void
			{
				clearFocusBindings();
				adapter?.destroy();
				adapter = markRaw(new EditorAdapter(options));
			},

			destroyAdapter(): void
			{
				clearFocusBindings();
				adapter?.destroy();
				adapter = null;
			},

			hasAdapter(): boolean
			{
				return adapter !== null;
			},

			setAdapterBody(body: string | null | undefined): boolean
			{
				return adapter?.setBody(body) === true;
			},

			getAdapterBody(): string
			{
				return adapter?.getBody() ?? '';
			},

			saveAdapter(): boolean
			{
				if (adapter === null)
				{
					return false;
				}

				adapter.save();

				return true;
			},

			showAdapterError(text: string): boolean
			{
				if (adapter === null)
				{
					return false;
				}

				adapter.showError(text);

				return true;
			},

			clearAdapterError(): boolean
			{
				if (adapter === null)
				{
					return false;
				}

				adapter.clearError();

				return true;
			},

			focusAdapter(): boolean
			{
				return adapter?.focus() === true;
			},

			getAdapterControls(): HTMLElement[]
			{
				return adapter?.getControls() ?? [];
			},

			setAdapterDisabled(disabled: boolean): void
			{
				adapter?.setDisabled(disabled);
			},

			bindControlFocus(control: HTMLElement, host: HTMLElement): void
			{
				const alreadyBound = focusBindings.some((binding: FocusBinding): boolean => {
					return binding.control === control && binding.host === host;
				});

				if (alreadyBound)
				{
					return;
				}

				focusBindings.push(createFocusBinding(control, host));
			},
		};
	},
	computed: {
		bodyLabel(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_BODY_LABEL');
		},
	},
	watch: {
		body(value: string): void
		{
			if (this.setting === undefined)
			{
				this.setBody(value);
			}
		},

		setting(value: VacationAutoReplySetting | null | undefined): void
		{
			// Every server answer must replace values typed directly into the legacy editor.
			if (value !== null && value !== undefined)
			{
				this.setBody(value.body);
			}
		},

		readonly(value: boolean): void
		{
			this.setReadonly(value);
		},
	},
	mounted(): void
	{
		this.mountEditor();
	},
	beforeUnmount(): void
	{
		this.destroyAdapter();
	},
	methods: {
		mountEditor(): void
		{
			const refs = this.$refs as EditorRefs;
			const host = resolveElement(refs.host);
			const alert = resolveElement(refs.alert);
			if (
				this.editorId === ''
				|| this.editorNode === null
				|| this.transport === null
				|| host === null
				|| alert === null
			)
			{
				return;
			}

			this.createAdapter({
				editorInstanceId: this.editorId,
				editorNode: this.editorNode,
				host,
				alertContainer: alert,
				toolbarLabel: this.bodyLabel,
				transport: this.transport,
			});
			this.setBody(this.setting === undefined ? this.body : this.setting?.body ?? '');
			this.setReadonly(this.readonly);
		},

		setBody(body: string | null | undefined): boolean
		{
			const applied = this.setAdapterBody(body);
			this.nameControls();

			return applied;
		},

		getBody(): string
		{
			return this.getAdapterBody();
		},

		save(): boolean
		{
			if (this.saveAdapter())
			{
				return true;
			}

			this.showError(loc('MAIL_VACATION_AUTO_REPLY_LOAD_ERROR'));

			return false;
		},

		showError(text: string): void
		{
			if (this.showAdapterError(text))
			{
				return;
			}

			const refs = this.$refs as EditorRefs;
			const alert = resolveElement(refs.alert);
			if (alert !== null)
			{
				Dom.adjust(alert, { text });
			}
		},

		clearError(): void
		{
			if (this.clearAdapterError())
			{
				return;
			}

			const refs = this.$refs as EditorRefs;
			const alert = resolveElement(refs.alert);
			if (alert !== null)
			{
				Dom.clean(alert);
			}
		},

		focus(): boolean
		{
			return this.focusAdapter();
		},

		getControls(): HTMLElement[]
		{
			if (this.hasAdapter())
			{
				return this.getAdapterControls();
			}

			return this.editorNode === null
				? []
				: [...this.editorNode.querySelectorAll<HTMLElement>('iframe, textarea')]
			;
		},

		setReadonly(readonly: boolean): void
		{
			this.setAdapterDisabled(readonly);
		},

		nameControls(): void
		{
			if (this.bodyLabel === '')
			{
				return;
			}

			const refs = this.$refs as EditorRefs;
			const host = resolveElement(refs.host);
			this.getControls().forEach((control: HTMLElement): void => {
				Dom.attr(control, 'title', this.bodyLabel);
				if (host !== null)
				{
					this.bindControlFocus(control, host);
				}
			});
		},

		getErrorTarget(): FieldErrorTarget
		{
			const refs = this.$refs as EditorRefs;
			const message = resolveElement(refs.error);

			return {
				message: message ?? document.createElement('div'),
				controls: this.getControls(),
				focus: (): boolean => this.focus(),
			};
		},
	},
	template: `
		<div class="mail-vacation-auto-reply-form__editor-host">
			<div
				ref="alert"
				class="mail-vacation-auto-reply-form__alert"
				:data-testid="testId.alert"
				role="alert"
			></div>
			<div class="mail-vacation-auto-reply-form__row">
				<span class="mail-vacation-auto-reply-form__label">
					{{ bodyLabel }}
				</span>
				<div
					ref="error"
					:id="testId.error"
					class="mail-vacation-auto-reply-form__error"
					data-role="error-body"
					:data-testid="testId.error"
				>{{ error }}</div>
			</div>
			<div
				ref="host"
				class="mail-vacation-auto-reply-form__editor-slot"
				:data-testid="testId.host"
			></div>
		</div>
	`,
});
