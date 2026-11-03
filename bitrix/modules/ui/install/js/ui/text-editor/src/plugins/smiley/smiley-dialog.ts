import { Type, Runtime } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type PopupOptions } from 'main.popup';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { getAriaMessage } from '../../helpers/aria-message';
import { centerPopupOnTarget } from '../../helpers/center-popup-on-target';
import { BaseDialog } from '../base-dialog';

const POPUP_WIDTH = 332;

/**
 * The part of ui.vue3 and ui.vue3.components.smiles this dialog uses.
 *
 * Both extensions arrive through Runtime.loadExtension, so there is nothing to import at build
 * time -- only the two names taken out of the result are described, and only as far as they are
 * used here.
 */
type SmileyPickerApp = {
	mount: (container: HTMLElement) => void,
	unmount: () => void,
};

type SmileyPickerExports = {
	BitrixVue: {
		createApp: (options: BitrixVueComponentProps) => SmileyPickerApp,
	},
	Smiles: BitrixVueComponentProps,
};

export type SmileyDialogOptions = {
	targetNode?: HTMLElement;
	onlyEmoji?: boolean;
	events?: Record<string, (event: BaseEvent) => void>;
};

export class SmileyDialog extends BaseDialog
{
	#targetNode: HTMLElement | null = null;
	#targetNodeWidth: number = 0;
	#onlyEmoji: boolean = false;
	#app: SmileyPickerApp | null = null;
	#destroyed: boolean = false;

	constructor(dialogOptions?: SmileyDialogOptions)
	{
		super('BX.UI.TextEditor.SmileyDialog', dialogOptions);

		const options: SmileyDialogOptions = Type.isPlainObject(dialogOptions) ? dialogOptions : {};

		this.setTargetNode(options.targetNode!);
		this.#onlyEmoji = options.onlyEmoji === true;

		this.subscribe('onFirstShow', (): void => {
			this.#mountSmiles();
		});

		this.subscribe('onShow', (): void => {
			centerPopupOnTarget(this.getPopup(), this.#targetNodeWidth, POPUP_WIDTH);
		});
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#app?.unmount();
		this.#app = null;

		super.destroy();
	}

	setTargetNode(container: HTMLElement): void
	{
		if (Type.isElementNode(container))
		{
			this.#targetNode = container;
		}
	}

	getTargetNode(): HTMLElement | null
	{
		return this.#targetNode;
	}

	getPopupOptions(): PopupOptions
	{
		// measured while the popup is being built, the way the centering below expects it: the
		// target is the toolbar button that opened the dialog and it keeps its width
		this.#targetNodeWidth = this.getTargetNode()!.getBoundingClientRect().width;

		return {
			background: '#F7F9FA',
			ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_SMILEYS_ARIA') ?? undefined,
			width: POPUP_WIDTH,
			height: 360,
			bindElement: this.getTargetNode() ?? undefined,
		};
	}

	#mountSmiles(): void
	{
		// the Vue method below runs with the component as its `this`, so both values it needs are
		// taken here, where `this` is still the dialog
		const emitSelect = (text: string): void => {
			this.emit('onSelect', { smiley: text.trim() });
		};

		// Without a smiley set the component would sit on its loading spinner forever
		// (isLoading = isShowSmiles && smiles.length <= 0) and never reach the emoji
		// tab. In emoji-only mode it skips loading sets altogether.
		const onlyEmoji = this.#onlyEmoji;

		Runtime.loadExtension('ui.vue3', 'ui.vue3.components.smiles')
			.then((exports) => {
				// the picker can arrive after the dialog is gone: smiley-plugin destroys it when the
				// button it is bound to changes, and the editor destroys it with everything else
				if (this.#destroyed)
				{
					return;
				}

				// loadExtension() merges the namespaces into one object (see its reduce), but is
				// declared as returning an array of them -- hence the trip through unknown
				const { BitrixVue, Smiles } = exports as unknown as SmileyPickerExports;
				const app = BitrixVue.createApp({
					data()
					{
						return { onlyEmoji };
					},
					methods: {
						handleSelect(text: string)
						{
							emitSelect(text);
						},
					},
					components: {
						Smiles,
					},
					template: '<Smiles :isOnlyEmoji="onlyEmoji" @selectSmile="handleSelect($event.text)"/>',
				});

				this.#app = app;
				app.mount(this.getPopup().getContentContainer());
			})
			.catch(() => {
				this.hide();
			});
	}
}
