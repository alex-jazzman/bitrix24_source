import { Dom, Tag, Type } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { BMenu, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu.vue';
import { defineComponent, nextTick } from 'ui.vue3';

import { Phrase } from '../../const';
import {
	collectSignatures,
	loadSignatures,
	rememberSignatureChoice,
	resolveDefaultSignature,
} from '../../feature/resolve-default-signature/resolve-default-signature';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { type EditorUnsubscribe } from '../../infrastructure/adapter/editor/types';
import { loc } from '../../lib/loc/loc';
import { getSelectedSender, useComposeState } from '../../model/compose/compose';
import { type SenderDto, type SignatureItem } from '../../model/compose/types';

const MenuWidth = 300;

/**
 * `ui.system.menu` forwards no `dataset` to its popup and would otherwise give the container a random id, so
 * the picker is located by this one — the native anchor of a `main.popup` container.
 */
const MenuId = 'mail-compose-signature-menu';

/** Picker sections: the signatures under a title, the rest behind a separator. */
const MenuSection = Object.freeze({
	Signatures: 'signatures',
	Actions: 'actions',
});

const KindColor = Object.freeze({
	Shared: 'var(--ui-color-accent-main-primary)',
	Own: 'var(--ui-color-base-3)',
});

/** The control of the picker: the signature action of the form footer. */
const FooterControlTestId = 'mail-compose-signature-action';

/** The editor puts this in place of a `<style>` block; in the signature of the user it is noise. */
const SurrogateClass = 'bxhtmled-surrogate';

/** Signatures have no name of their own, so their first line stands in for one and is cut to this length. */
const NameMaxLength = 40;

/** The signature opens with a two-dash line, the way the previous form wrote it. */
const SignatureMark = '--<br>';

/** `MenuItemOptions` requires every option, so only the ones filled here are picked. */
type SignatureMenuItem =
	Pick<MenuItemOptions, 'title' | 'sectionCode' | 'onClick'>
	& Partial<Pick<MenuItemOptions, 'badgeText' | 'isSelected'>>;

type SignatureMenuSection = Pick<MenuSectionOptions, 'code'> & Partial<Pick<MenuSectionOptions, 'title'>>;

type SignatureMenuOptions = Partial<Omit<MenuOptions, 'items' | 'sections'>> & {
	items: SignatureMenuItem[],
	sections: SignatureMenuSection[],
};

type GraphemeSegmenter = {
	segment(value: string): Iterable<{ segment: string }>,
};

type GraphemeSegmenterClass = new (
	locales?: string | string[],
	options?: { granularity: 'grapheme' },
) => GraphemeSegmenter;

const GraphemeExtendPattern = /^[\p{M}\p{Emoji_Modifier}\u{0E33}\u{0EB3}]$/u;
const RegionalIndicatorPattern = /^\p{Regional_Indicator}$/u;
const ExtendedPictographicPattern = /^\p{Extended_Pictographic}$/u;
const DevanagariConsonantPattern = /^[\u{0915}-\u{0939}]$/u;
const EmojiTagPattern = /^[\u{E0020}-\u{E007F}]$/u;
const DevanagariVirama = '\u{094D}';
const ZeroWidthJoiner = '\u{200D}';

function isEmojiZwjContinuation(grapheme: string, current: string): boolean
{
	if (!ExtendedPictographicPattern.test(current))
	{
		return false;
	}

	const symbols = [...grapheme];
	for (let index = symbols.length - 2; index >= 0; index--)
	{
		const symbol = symbols[index];
		if (GraphemeExtendPattern.test(symbol) || EmojiTagPattern.test(symbol))
		{
			continue;
		}

		return ExtendedPictographicPattern.test(symbol);
	}

	return false;
}

function isViramaContinuation(grapheme: string, previous: string, current: string): boolean
{
	if (previous !== DevanagariVirama || !DevanagariConsonantPattern.test(current))
	{
		return false;
	}

	const symbols = [...grapheme];
	for (let index = symbols.length - 2; index >= 0; index--)
	{
		const symbol = symbols[index];
		if (GraphemeExtendPattern.test(symbol) || EmojiTagPattern.test(symbol) || symbol === ZeroWidthJoiner)
		{
			continue;
		}

		return DevanagariConsonantPattern.test(symbol);
	}

	return false;
}

function isHangulL(codePoint: number): boolean
{
	return (codePoint >= 0x1100 && codePoint <= 0x115F)
		|| (codePoint >= 0xA960 && codePoint <= 0xA97C);
}

function isHangulV(codePoint: number): boolean
{
	return (codePoint >= 0x1160 && codePoint <= 0x11A7)
		|| (codePoint >= 0xD7B0 && codePoint <= 0xD7C6);
}

function isHangulT(codePoint: number): boolean
{
	return (codePoint >= 0x11A8 && codePoint <= 0x11FF)
		|| (codePoint >= 0xD7CB && codePoint <= 0xD7FB);
}

function isHangulSyllable(codePoint: number): boolean
{
	return codePoint >= 0xAC00 && codePoint <= 0xD7A3;
}

function isHangulContinuation(previous: string, current: string): boolean
{
	const previousCodePoint = previous.codePointAt(0) ?? 0;
	const currentCodePoint = current.codePointAt(0) ?? 0;
	const isPreviousSyllable = isHangulSyllable(previousCodePoint);
	const isPreviousLv = isPreviousSyllable && (previousCodePoint - 0xAC00) % 28 === 0;
	const isPreviousLvt = isPreviousSyllable && !isPreviousLv;

	return (isHangulL(previousCodePoint) && (
		isHangulL(currentCodePoint)
		|| isHangulV(currentCodePoint)
		|| isHangulSyllable(currentCodePoint)
	))
		|| ((isPreviousLv || isHangulV(previousCodePoint)) && (
			isHangulV(currentCodePoint)
			|| isHangulT(currentCodePoint)
		))
		|| ((isPreviousLvt || isHangulT(previousCodePoint)) && isHangulT(currentCodePoint));
}

function splitFallbackGraphemes(value: string): string[]
{
	const graphemes: string[] = [];
	let previous = '';
	let regionalIndicatorCount = 0;

	for (const symbol of value)
	{
		const isRegionalIndicator = RegionalIndicatorPattern.test(symbol);
		const currentGrapheme = graphemes.at(-1) ?? '';
		const shouldJoinPrevious = graphemes.length > 0 && (
			GraphemeExtendPattern.test(symbol)
			|| EmojiTagPattern.test(symbol)
			|| symbol === ZeroWidthJoiner
			|| (previous === ZeroWidthJoiner && isEmojiZwjContinuation(currentGrapheme, symbol))
			|| isViramaContinuation(currentGrapheme, previous, symbol)
			|| isHangulContinuation(previous, symbol)
			|| (isRegionalIndicator && regionalIndicatorCount % 2 === 1)
		);

		if (shouldJoinPrevious)
		{
			graphemes[graphemes.length - 1] += symbol;
		}
		else
		{
			graphemes.push(symbol);
		}

		regionalIndicatorCount = isRegionalIndicator ? regionalIndicatorCount + 1 : 0;
		previous = symbol;
	}

	return graphemes;
}

function createGraphemeSegmenter(): GraphemeSegmenter | null
{
	const Segmenter = Reflect.get(Intl, 'Segmenter') as GraphemeSegmenterClass | undefined;

	return Type.isFunction(Segmenter) ? new Segmenter(undefined, { granularity: 'grapheme' }) : null;
}

const graphemeSegmenter = createGraphemeSegmenter();

export function shortenName(name: string, segmenter: GraphemeSegmenter | null = graphemeSegmenter): string
{
	const graphemes = segmenter
		? [...segmenter.segment(name)].map(({ segment }) => segment)
		: splitFallbackGraphemes(name);

	return graphemes.length > NameMaxLength
		? `${graphemes.slice(0, NameMaxLength).join('').trim()}...`
		: name;
}

/** The legacy preview keeps line boundaries, so its first meaningful line names the selected signature. */
function signatureName(item: SignatureItem): string
{
	const name = item.preview
		.split('\n')
		.map((line) => line.trim())
		.find((line) => line !== '' && !/^-+$/.test(line)) ?? '';

	return shortenName(name);
}

/** New servers send a dedicated single-line menu preview; old ones fall back to the legacy name. */
function signatureMenuTitle(item: SignatureItem): string
{
	return item.menuPreview === undefined ? signatureName(item) : shortenName(item.menuPreview.trim());
}

function applySignatureLayout(node: HTMLElement, nodeId: string): void
{
	const editorDocument = node.ownerDocument;
	if (editorDocument.head.querySelector('[data-mail-compose-signature-layout]'))
	{
		return;
	}

	const style = editorDocument.createElement('style');
	style.dataset.mailComposeSignatureLayout = '';
	// The structural tokens are there: the editor loads `ui.design-tokens` into the document of the letter.
	style.textContent = [
		`#${nodeId} { margin-top: var(--ui-space-stack-xl); }`,
		// The editor shows every surrogate with `display: inline-block !important`, so hiding it takes the same weight.
		`#${nodeId} .${SurrogateClass} { display: none !important; }`,
	].join('\n');
	Dom.append(style, editorDocument.head);
}

/**
 * The signature node lives in the editor document, which Vue does not own, so it is built by hand and goes
 * in through the adapter. It is rewritten only when the selected signature or the sender changes: the user
 * edits the signature in the body like the rest of the text, and a redraw would take those edits away.
 */
// @vue/component
export const SignatureBlock = defineComponent({
	name: 'MailComposeSignatureBlock',

	components: {
		BMenu,
	},

	setup()
	{
		const state = useComposeState();

		return {
			state,
			editor: useComposeEditor(),
			/**
			 * A scheduled message is edited with the body it was saved with, the signature inside it
			 * included, so this form neither resolves a default one nor writes over the one already there.
			 */
			isBodyRestored: state.scheduledMessage.id > 0,
			// The editor adapter is shared and outlives this component, so its subscriptions are dropped here.
			subscriptions: [] as EditorUnsubscribe[],
			menuId: MenuId,
		};
	},

	data()
	{
		return {
			isMenuShown: false,
			isSignatureSyncScheduled: false,
		};
	},

	computed: {
		sender(): SenderDto | null
		{
			return getSelectedSender(this.state);
		},

		/**
		 * Watch trigger for a changed sender. Two connections of one address share the formatted string,
		 * so the identifier of the chosen one takes part in the key.
		 */
		senderKey(): string
		{
			const sender = this.sender;
			const identity = sender ? `${sender.mailboxId ?? ''}:${sender.id ?? ''}` : '';

			return `${this.state.selectedSender ?? ''}|${identity}`;
		},

		/** Signatures of the selected sender, in the order the server sent them. */
		signatures(): SignatureItem[]
		{
			return this.sender ? collectSignatures(this.state.signatures.bySender, this.sender) : [];
		},

		selectedSignatureId(): number | null
		{
			return this.state.selectedSignatureId;
		},

		draftLoading(): boolean
		{
			return this.state.draft.isLoading;
		},

		selectedSignature(): SignatureItem | null
		{
			const id = this.state.selectedSignatureId;

			return this.signatures.find((item) => item.signatureId === id) ?? null;
		},

		settingsPath(): string
		{
			return this.state.signatures.settingsPath;
		},

		menuItems(): SignatureMenuItem[]
		{
			const items: SignatureMenuItem[] = this.signatures
				.filter((item) => item.full !== '')
				.map((item) => this.buildSignatureItem(item));

			items.push({
				title: loc(Phrase.SignatureNone),
				sectionCode: MenuSection.Actions,
				isSelected: this.state.selectedSignatureId === null,
				onClick: (): void => {
					this.handleSelect(null);
				},
			});

			if (this.settingsPath !== '')
			{
				items.push({
					title: loc(Phrase.SignatureConfigure),
					sectionCode: MenuSection.Actions,
					onClick: (): void => {
						this.openSettings();
					},
				});
			}

			return items;
		},

		menuOptions(): SignatureMenuOptions
		{
			return {
				bindElement: this.getControlNode(),
				width: MenuWidth,
				sections: [
					{ code: MenuSection.Signatures, title: loc(Phrase.SignatureMenuTitle) },
					{ code: MenuSection.Actions },
				],
				items: this.menuItems,
			};
		},
	},

	watch: {
		senderKey(): void
		{
			// Another sender has signatures of its own, so the default is resolved anew.
			this.applyDefaultSignature();
			this.scheduleSignatureSync();
		},

		selectedSignatureId(): void
		{
			this.scheduleSignatureSync();
		},
	},

	mounted(): void
	{
		if (!this.isBodyRestored)
		{
			this.applyDefaultSignature();
		}
		// The body has to exist before the signature goes in, and the adapter writes the initial body ahead
		// of this handler.
		this.subscriptions.push(this.editor.subscribeReady(this.handleEditorReady));
	},

	beforeUnmount(): void
	{
		this.isSignatureSyncScheduled = false;
		this.subscriptions.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.subscriptions.length = 0;
	},

	methods: {
		handleEditorReady(): void
		{
			if (this.isBodyRestored)
			{
				this.layoutSignatureNode();
			}
			else
			{
				this.syncSignatureNode();
			}
		},

		buildSignatureItem(item: SignatureItem): SignatureMenuItem
		{
			return {
				title: signatureMenuTitle(item) || loc(Phrase.SignatureButton),
				sectionCode: MenuSection.Signatures,
				badgeText: {
					title: loc(item.isShared ? Phrase.SignatureShared : Phrase.SignaturePersonal),
					color: item.isShared ? KindColor.Shared : KindColor.Own,
				},
				isSelected: item.signatureId === this.state.selectedSignatureId,
				onClick: (): void => {
					this.handleSelect(item);
				},
			};
		},

		applyDefaultSignature(): void
		{
			this.state.selectedSignatureId = this.sender
				? resolveDefaultSignature(this.signatures, this.state.signatures.choices, this.sender)
				: null;
		},

		/**
		 * The choice is remembered for this sender, and the state dictionary follows the store at once:
		 * switching the sender back and forth has to apply the fresh choice.
		 */
		handleSelect(item: SignatureItem | null): void
		{
			this.isMenuShown = false;
			this.state.selectedSignatureId = item?.signatureId ?? null;
			this.notifyBodyChanged();

			if (!item || !this.sender)
			{
				return;
			}

			const record = rememberSignatureChoice(this.sender, item.signatureId);
			if (record)
			{
				this.state.signatures.choices[record.senderKey] = record.value;
			}
		},

		/** With nothing to choose from the control opens the settings instead of the picker. */
		handleControlClick(): void
		{
			if (this.signatures.length === 0)
			{
				this.openSettings();

				return;
			}

			this.isMenuShown = true;
		},

		openSettings(): void
		{
			if (this.settingsPath === '')
			{
				return;
			}

			this.isMenuShown = false;
			SidePanel.Instance.open(this.settingsPath, {
				cacheable: false,
				events: {
					onCloseComplete: this.handleSettingsClosed,
				},
			});
		},

		/**
		 * The slider can create, edit or remove a signature, so the list is reloaded; a failed request leaves
		 * the form on the list it already has.
		 */
		handleSettingsClosed(): void
		{
			void loadSignatures(this.settingsPath).then(
				(signatures) => {
					this.state.signatures = signatures;
					this.applyDefaultSignature();
					this.syncSignatureNode();
					this.notifyBodyChanged();
				},
				() => {
					this.syncSignatureNode();
					this.notifyBodyChanged();
				},
			);
		},

		notifyBodyChanged(): void
		{
			void nextTick((): void => {
				(this.$el as HTMLElement | undefined)?.dispatchEvent(new window.Event('input', { bubbles: true }));
			});
		},

		/** Apply spacing without overwriting the restored signature. */
		layoutSignatureNode(): void
		{
			const node = this.editor.getBodyNode(this.editor.bodyNodes.signature);
			if (node)
			{
				applySignatureLayout(node, this.editor.bodyNodes.signature);
			}
		},

		/**
		 * A sender switch resolves the default anew, so both watchers ask for a write of the same node; every
		 * write syncs the whole body with the editor, and that costs the size of the message with its quote.
		 * The node is written once a tick, and a sender switch that kept the same signature still gets it.
		 */
		scheduleSignatureSync(): void
		{
			if (this.isSignatureSyncScheduled)
			{
				return;
			}

			this.isSignatureSyncScheduled = true;
			void nextTick((): void => {
				if (this.isSignatureSyncScheduled)
				{
					this.syncSignatureNode();
				}
			});
		},

		/**
		 * A repeated write touches the signature node alone: the text around it belongs to the user. The body
		 * of a signature is rich HTML built by the module, so it goes in as markup rather than as text.
		 */
		syncSignatureNode(): void
		{
			this.isSignatureSyncScheduled = false;
			const node = this.editor.getBodyNode(this.editor.bodyNodes.signature);

			if (!this.selectedSignature)
			{
				this.removeSignatureNode(node);

				return;
			}

			const markup = SignatureMark + this.selectedSignature.full;
			// A `<style>` block of the signature would rule the document the user writes in, so the markup
			// goes in through the parser of the editor. With no editor there is nothing to write into
			// anyway, and writing the signature as it came is better than losing it.
			const html = this.editor.parseForBody(markup) ?? markup;
			if (node)
			{
				node.innerHTML = html;
				applySignatureLayout(node, this.editor.bodyNodes.signature);
				// The node is written into the document directly, so the editor learns of the new body here.
				this.editor.syncBodyFromDocument();

				return;
			}

			this.insertSignatureNode(html);
		},

		/** The signature goes before the quote, or at the end without one; the `<br>` leaves room to type. */
		insertSignatureNode(html: string): void
		{
			const node = Tag.render`<div id="${this.editor.bodyNodes.signature}"></div>`;
			node.innerHTML = html;

			const quote = this.editor.getBodyNode(this.editor.bodyNodes.quote);
			const position = quote ? { at: 'before', anchor: quote } as const : { at: 'end' } as const;

			if (this.editor.insertNode(node, position))
			{
				this.editor.insertNode(Tag.render`<br>`, { at: 'before', anchor: node });
				applySignatureLayout(node, this.editor.bodyNodes.signature);
			}
		},

		/** A quote left first in the body has no room to type above it, so a `<br>` takes the place. */
		removeSignatureNode(node: HTMLElement | null): void
		{
			Dom.remove(node);

			const quote = this.editor.getBodyNode(this.editor.bodyNodes.quote);
			if (quote && !quote.previousSibling)
			{
				this.editor.insertNode(Tag.render`<br>`, { at: 'before', anchor: quote });
			}
		},

		/**
		 * The rendered button stands next to the placeholder of its Vue wrapper rather than inside it, so the
		 * picker binds to the node found by `data-testid`.
		 */
		getControlNode(): HTMLElement | null
		{
			return document.querySelector<HTMLElement>(`[data-testid="${FooterControlTestId}"]`);
		},
	},

	template: `
		<BMenu
			v-if="isMenuShown"
			:id="menuId"
			:options="menuOptions"
			@close="isMenuShown = false"
		/>
	`,
});
