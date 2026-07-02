import { Event, Loc } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { Menu } from 'ui.system.menu';
import { NoteThemeContext } from 'note.ui.theme-context';
import { SOURCE_TYPES } from '../constants';
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

export function createConnectionScreen(handlers: ConnectionScreenHandlers): ConnectionScreenHandle
{
	const element = document.createElement('div');
	element.className = 'note-import-screen note-import-screen-connection';

	let sourceMenu: Menu | null = null;
	const ConnectionForm = {
		name: 'NoteImportConnectionForm',
		components: { BInput },
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
				labels: {
					source: Loc.getMessage('NOTE_IMPORT_SOURCE_LABEL'),
					sourcePlaceholder: Loc.getMessage('NOTE_IMPORT_SOURCE_PLACEHOLDER'),
					url: Loc.getMessage('NOTE_IMPORT_URL_LABEL'),
					urlPlaceholder: Loc.getMessage('NOTE_IMPORT_CONNECTION_PLACEHOLDER'),
					token: Loc.getMessage('NOTE_IMPORT_TOKEN_LABEL'),
					tokenPlaceholder: Loc.getMessage('NOTE_IMPORT_TOKEN_PLACEHOLDER'),
				},
				inputSize: InputSize.Lg,
				inputDesign: InputDesign.Grey,
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
			handleSourceClick(): void
			{
				const enabled = SOURCE_TYPES.filter((source) => source.enabled);
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
		},
		template: `
			<div class="note-import-connection-form">
				<BInput
					ref="sourceInput"
					:modelValue="sourceLabel"
					:label="labels.source"
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
				<BInput
					ref="urlInput"
					:modelValue="url"
					@update:modelValue="handleUrlUpdate"
					:label="labels.url"
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
					ref="tokenInput"
					:modelValue="token"
					@update:modelValue="handleTokenUpdate"
					:label="labels.token"
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
	const vm = app.mount(element);

	function applyState(state: ConnectionFormState): void
	{
		const sourceType = state.sourceType ?? '';
		const source = SOURCE_TYPES.find((item) => item.id === sourceType);

		vm.sourceType = sourceType;
		vm.sourceLabel = source ? source.label : '';

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
