import { Event, Loc } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { Menu } from 'ui.system.menu';
import { Alert } from 'ui.system.alert.vue';
import { AlertDesign } from 'ui.system.alert';
import { NoteThemeContext } from 'note.ui.theme-context';
import { SOURCE_TYPE_LANDING, SOURCE_TYPE_WIKI } from '../constants';
import type { ConnectionFormState } from '../type';

type ConnectionScreenHandlers = {
	onSourceChange: (value: string) => void,
	onUrlInput: (value: string) => void,
	onUrlBlur: () => void,
	onTokenInput: (value: string) => void,
	onTokenBlur: () => void,
	onSubmit: () => void,
};

export type ConnectionScreenHandle = {
	element: HTMLElement,
	applyState: (state: ConnectionFormState) => void,
	syncErrors: (state: ConnectionFormState) => void,
	focusField: (field: string) => void,
	destroy: () => void,
};

export function createConnectionScreen(
	handlers: ConnectionScreenHandlers,
	sources: Array<{ id: string, label: string, enabled: boolean }>,
): ConnectionScreenHandle
{
	const element = document.createElement('div');
	element.className = 'note-import-screen note-import-screen-connection';

	const vueRoot = document.createElement('div');
	element.append(vueRoot);

	let sourceMenu: Menu | null = null;

	const ConnectionForm = {
		name: 'NoteImportConnectionForm',
		components: { BInput, Alert },
		data(): Object
		{
			return {
				sourceType: '',
				sourceLabel: '',
				url: '',
				token: '',
				sourceError: '',
				urlError: '',
				tokenError: '',
				formError: '',
				isWiki: false,
				isLanding: false,
				noticeDesign: AlertDesign.tintedWarning,
				formErrorDesign: AlertDesign.tintedAlert,
				labels: {
					source: Loc.getMessage('NOTE_IMPORT_SOURCE_LABEL'),
					sourcePlaceholder: Loc.getMessage('NOTE_IMPORT_SOURCE_PLACEHOLDER'),
					url: Loc.getMessage('NOTE_IMPORT_URL_LABEL'),
					urlPlaceholder: Loc.getMessage('NOTE_IMPORT_CONNECTION_PLACEHOLDER'),
					token: Loc.getMessage('NOTE_IMPORT_TOKEN_LABEL'),
					tokenPlaceholder: Loc.getMessage('NOTE_IMPORT_TOKEN_PLACEHOLDER'),
					wikiNotice: Loc.getMessage('NOTE_IMPORT_WIKI_LOSS_NOTICE'),
				},
				inputSize: InputSize.Lg,
				inputDesign: InputDesign.Grey,
				SOURCE_TYPE_LANDING,
			};
		},
		methods: {
			handleUrlUpdate(value: string): void
			{
				this.url = value;
				handlers.onUrlInput(value);
			},
			handleUrlBlur(): void
			{
				handlers.onUrlBlur();
			},
			handleTokenUpdate(value: string): void
			{
				this.token = value;
				handlers.onTokenInput(value);
			},
			handleTokenBlur(): void
			{
				handlers.onTokenBlur();
			},
			// The source is picked from a menu hung on the field, and the field is a div whose only
			// focusable child drops focus by design (`clickable` blurs it on focus). Left as it is,
			// the picker answers the mouse alone - and the landing source, which has no other way
			// in, goes with it. Making the field itself the control also legalises the aria the
			// menu stamps on it: aria-haspopup and aria-expanded need a role to sit on.
			makeSourceFieldOperable(): void
			{
				const field = this.$refs.sourceInput?.$el;
				if (!field)
				{
					return;
				}

				field.setAttribute('role', 'button');
				field.setAttribute('tabindex', '0');

				const input = field.querySelector('input');
				if (input)
				{
					// The box would otherwise be what a tab lands on, only to be blurred onto <body>,
					// and a textbox inside a button is not a control anyone can reach anyway. The
					// field holds the focus and carries the value in its own name instead.
					input.setAttribute('tabindex', '-1');
					input.setAttribute('aria-hidden', 'true');
				}

				this.syncSourceFieldName();

				Event.bind(field, 'keydown', (event) => {
					if (event.key !== 'Enter' && event.key !== ' ')
					{
						return;
					}

					event.preventDefault();
					this.handleSourceClick();
				});
			},
			// The name of the field is the question and the answer to it, because the box that shows
			// the answer is out of the tree.
			syncSourceFieldName(): void
			{
				const field = this.$refs.sourceInput?.$el;
				if (!field)
				{
					return;
				}

				field.setAttribute(
					'aria-label',
					[this.labels.source, this.sourceLabel].filter((part) => part !== '').join(': '),
				);
			},
			handleSourceClick(): void
			{
				const enabled = sources.filter((source) => source.enabled);
				if (enabled.length === 0)
				{
					return;
				}

				const bindElement = this.$refs.sourceInput?.$el ?? this.$el;
				const width = bindElement?.offsetWidth ?? 0;

				sourceMenu?.destroy();
				sourceMenu = new Menu({
					minWidth: width,
					width,
					designSystemContext: NoteThemeContext.getDesignSystemContext(),
					className: 'note-import-source-menu',
					items: enabled.map((source) => ({
						id: source.id,
						title: source.label,
						isSelected: source.id === this.sourceType,
						onClick: () => {
							handlers.onSourceChange(source.id);
							sourceMenu?.close();
						},
					})),
				});

				sourceMenu.show(bindElement);
			},
		},
		watch: {
			sourceLabel(): void
			{
				this.syncSourceFieldName();
			},
		},
		mounted(): void
		{
			const bindEnter = (refName) => {
				const inputEl = this.$refs[refName]?.$el?.querySelector('input');
				if (inputEl)
				{
					Event.bind(inputEl, 'keydown', (event) => {
						if (event.key === 'Enter')
						{
							handlers.onSubmit();
						}
					});
				}
			};

			bindEnter('urlInput');
			bindEnter('tokenInput');

			this.makeSourceFieldOperable();
		},
		template: `
			<div class="note-import-connection-form">
				<!-- The source answers a submit the user already made, so the message appears long
					 after the screen was built and has to speak for itself when it does. -->
				<Alert v-if="formError" role="alert" :design="formErrorDesign" data-testid="note-import-source-error">
					{{ formError }}
				</Alert>
				<BInput
					ref="sourceInput"
					:modelValue="sourceLabel"
					:label="labels.source"
					:ariaLabel="labels.source"
					:placeholder="labels.sourcePlaceholder"
					:error="sourceError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					clickable
					dropdown
					readonly
					@click="handleSourceClick"
				/>
				<Alert v-if="isWiki" :design="noticeDesign">
					{{ labels.wikiNotice }}
				</Alert>
				<BInput
					v-if="!isWiki && !isLanding"
					ref="urlInput"
					:modelValue="url"
					@update:modelValue="handleUrlUpdate"
					:label="labels.url"
					:ariaLabel="labels.url"
					:placeholder="labels.urlPlaceholder"
					:error="urlError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					type="text"
					@blur="handleUrlBlur"
				/>
				<BInput
					v-if="!isWiki && !isLanding"
					ref="tokenInput"
					:modelValue="token"
					@update:modelValue="handleTokenUpdate"
					:label="labels.token"
					:ariaLabel="labels.token"
					:placeholder="labels.tokenPlaceholder"
					:error="tokenError"
					:size="inputSize"
					:design="inputDesign"
					required
					stretched
					type="password"
					@blur="handleTokenBlur"
				/>
			</div>
		`,
	};

	const app = BitrixVue.createApp(ConnectionForm);
	const vm = app.mount(vueRoot);

	function applyState(state: ConnectionFormState): void
	{
		const sourceType = state.sourceType ?? '';
		const source = sources.find((item) => item.id === sourceType);

		vm.sourceType = sourceType;
		vm.sourceLabel = source ? source.label : '';
		vm.isWiki = sourceType === SOURCE_TYPE_WIKI;
		vm.isLanding = sourceType === SOURCE_TYPE_LANDING;

		const nextUrl = String(state.url ?? '');
		if (vm.url !== nextUrl)
		{
			vm.url = nextUrl;
		}

		const nextToken = String(state.token ?? '');
		if (vm.token !== nextToken)
		{
			vm.token = nextToken;
		}

		syncErrors(state);
	}

	function syncErrors(state: ConnectionFormState): void
	{
		const errors = state.errors ?? { sourceType: '', url: '', token: '' };
		const touched = state.touched ?? { sourceType: false, url: false, token: false };

		vm.sourceError = touched.sourceType ? (errors.sourceType ?? '') : '';
		vm.urlError = touched.url ? (errors.url ?? '') : '';
		vm.tokenError = touched.token ? (errors.token ?? '') : '';
		// A source-level error is not tied to a field, so no `touched` gate applies: it is a
		// server answer to a submit the user already made.
		vm.formError = String(state.errorMessage ?? '');
	}

	function focusField(field: string): void
	{
		const refName = field === 'url' ? 'urlInput' : (field === 'token' ? 'tokenInput' : null);
		if (refName)
		{
			vm.$refs[refName]?.focus?.();

			return;
		}

		if (field === 'sourceType')
		{
			vm.handleSourceClick();
		}
	}

	function destroy(): void
	{
		sourceMenu?.destroy();
		sourceMenu = null;
		app.unmount();
	}

	return { element, applyState, syncErrors, focusField, destroy };
}
