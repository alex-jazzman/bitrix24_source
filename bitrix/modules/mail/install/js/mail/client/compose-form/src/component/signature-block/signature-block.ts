import { Dom, Event, Tag, Type } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { LabelSize, LabelStyle } from 'ui.system.label';
import { Label as UiLabel } from 'ui.system.label.vue';
import { BMenu, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu.vue';
import { TextSm } from 'ui.system.typography.vue';
import { defineComponent, nextTick } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

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

import './signature-block.css';

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

const ControlTestId = 'mail-compose-signature-name';

/** Space for the Vue control drawn over the editor; the stylesheet stays outside the message body. */
const SignatureControlSpace = 68;

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
	style.textContent = `#${nodeId} { margin-top: ${SignatureControlSpace}px; }`;
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
		BIcon,
		BMenu,
		TextSm,
		UiButton,
		UiLabel,
	},

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			// The editor adapter is shared and outlives this component, so its subscriptions are dropped here.
			subscriptions: [] as EditorUnsubscribe[],
			iconName: Outline.DOCUMENT_SIGN,
			controlStyle: AirButtonStyle.PLAIN,
			controlSize: ButtonSize.SMALL,
			controlTestId: ControlTestId,
			menuId: MenuId,
			labelStyle: LabelStyle.TINTED,
			labelSize: LabelSize.SM,
		};
	},

	data()
	{
		return {
			isMenuShown: false,
			rowTop: null as number | null,
			rowLeft: 0,
			rowWidth: 0,
			editorBody: null as HTMLElement | null,
			editorWindow: null as Window | null,
			contentScroll: null as HTMLElement | null,
			positionFrame: null as number | null,
		};
	},

	computed: {
		sender(): SenderDto | null
		{
			return getSelectedSender(this.state);
		},

		/** Watch trigger for a changed sender. */
		senderKey(): string
		{
			return this.state.selectedSender ?? '';
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

		/** With no signature and no settings path the control would lead nowhere. */
		isShown(): boolean
		{
			return this.signatures.length > 0 || this.settingsPath !== '';
		},

		settingsPath(): string
		{
			return this.state.signatures.settingsPath;
		},

		controlText(): string
		{
			const name = this.selectedSignature ? signatureName(this.selectedSignature) : '';

			return name === '' ? loc(Phrase.SignatureNone) : name;
		},

		signatureLabel(): string
		{
			return loc(Phrase.SignatureButton);
		},

		/** Only a shared signature gets a label next to the name. */
		kindLabel(): string
		{
			return this.selectedSignature?.isShared === true ? loc(Phrase.SignatureShared) : '';
		},

		rowPosition(): Record<string, string>
		{
			return this.rowTop === null
				? {}
				: { top: `${this.rowTop}px`, left: `${this.rowLeft}px`, width: `${this.rowWidth}px` };
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
			this.syncSignatureNode();
		},

		selectedSignatureId(): void
		{
			this.syncSignatureNode();
		},

		draftLoading(loading: boolean): void
		{
			if (!loading)
			{
				void this.$nextTick(this.schedulePositionControl);
			}
		},
	},

	mounted(): void
	{
		this.applyDefaultSignature();
		// The body has to exist before the signature goes in, and the adapter writes the initial body ahead
		// of this handler.
		this.subscriptions.push(this.editor.subscribeReady(this.handleEditorReady));
		Event.bind(window, 'resize', this.schedulePositionControl);
	},

	beforeUnmount(): void
	{
		Event.unbind(window, 'resize', this.schedulePositionControl);
		this.cancelPositionControl();
		this.unbindPositionListeners();
		this.subscriptions.forEach((unsubscribe: EditorUnsubscribe): void => {
			unsubscribe();
		});
		this.subscriptions.length = 0;
	},

	methods: {
		handleEditorReady(): void
		{
			this.syncSignatureNode();
			this.unbindPositionListeners();

			const signature = this.editor.getBodyNode(this.editor.bodyNodes.signature);
			const editorFrame = this.editor.getHostNode()?.querySelector<HTMLIFrameElement>('iframe');
			this.editorBody = signature?.ownerDocument.body ?? editorFrame?.contentDocument?.body ?? null;
			this.editorWindow = this.editorBody?.ownerDocument.defaultView ?? null;
			this.contentScroll = (this.$refs.row as HTMLElement | undefined)
				?.closest<HTMLElement>('.mail-compose-form__content') ?? null;
			if (this.editorBody)
			{
				Event.bind(this.editorBody, 'input', this.schedulePositionControl);
				Event.bind(this.editorBody, 'scroll', this.schedulePositionControl);
			}

			if (this.editorWindow)
			{
				Event.bind(this.editorWindow, 'scroll', this.schedulePositionControl);
				Event.bind(this.editorWindow, 'resize', this.schedulePositionControl);
			}

			if (this.contentScroll)
			{
				Event.bind(this.contentScroll, 'scroll', this.schedulePositionControl);
			}
			this.positionControl();
		},

		unbindPositionListeners(): void
		{
			if (this.editorBody)
			{
				Event.unbind(this.editorBody, 'input', this.schedulePositionControl);
				Event.unbind(this.editorBody, 'scroll', this.schedulePositionControl);
			}

			if (this.editorWindow)
			{
				Event.unbind(this.editorWindow, 'scroll', this.schedulePositionControl);
				Event.unbind(this.editorWindow, 'resize', this.schedulePositionControl);
			}

			if (this.contentScroll)
			{
				Event.unbind(this.contentScroll, 'scroll', this.schedulePositionControl);
			}
			this.editorBody = null;
			this.editorWindow = null;
			this.contentScroll = null;
		},

		schedulePositionControl(): void
		{
			if (this.positionFrame !== null)
			{
				return;
			}

			this.positionFrame = window.requestAnimationFrame((): void => {
				this.positionFrame = null;
				this.positionControl();
			});
		},

		cancelPositionControl(): void
		{
			if (this.positionFrame !== null)
			{
				window.cancelAnimationFrame(this.positionFrame);
				this.positionFrame = null;
			}
		},

		/** The control stays in Vue but is drawn directly above the signature that lives in the editor iframe. */
		positionControl(): void
		{
			const signature = this.editor.getBodyNode(this.editor.bodyNodes.signature);
			const row = this.$refs.row as HTMLElement | undefined;
			const content = row?.closest<HTMLElement>('.mail-compose-form__content');
			const editorDocument = signature?.ownerDocument ?? this.editorBody?.ownerDocument;
			const frame = editorDocument?.defaultView?.frameElement as HTMLElement | null | undefined;
			if (!row || !content || !frame || !this.editorBody)
			{
				this.rowTop = null;

				return;
			}

			const frameRect = frame.getBoundingClientRect();
			const contentRect = content.getBoundingClientRect();

			if (signature)
			{
				const signatureRect = signature.getBoundingClientRect();
				this.rowTop = content.scrollTop + frameRect.top + signatureRect.top - contentRect.top - row.offsetHeight
					- parseFloat(getComputedStyle(row).gap || '0');
			}
			else
			{
				const bodyRect = this.editorBody.getBoundingClientRect();
				const lastContent = [...this.editorBody.children]
					.findLast((node) => node.id !== this.editor.bodyNodes.quote) as HTMLElement | undefined;
				const contentBottom = Math.max(
					lastContent?.getBoundingClientRect().bottom ?? bodyRect.top,
					bodyRect.top + 24,
				);
				this.rowTop = content.scrollTop + frameRect.top + contentBottom - contentRect.top + 24;
			}
			this.rowLeft = frameRect.left - contentRect.left;
			this.rowWidth = frameRect.width;
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

		/**
		 * A repeated write touches the signature node alone: the text around it belongs to the user. The body
		 * of a signature is rich HTML built by the module, so it goes in as markup rather than as text.
		 */
		syncSignatureNode(): void
		{
			const node = this.editor.getBodyNode(this.editor.bodyNodes.signature);

			if (!this.selectedSignature)
			{
				this.removeSignatureNode(node);
				this.positionControl();

				return;
			}

			const html = SignatureMark + this.selectedSignature.full;
			if (node)
			{
				node.innerHTML = html;
				applySignatureLayout(node, this.editor.bodyNodes.signature);
				this.positionControl();

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
				this.positionControl();
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
			const row = this.$refs.row as HTMLElement | undefined;

			return row?.querySelector<HTMLElement>(`[data-testid="${ControlTestId}"]`) ?? null;
		},
	},

	template: `
		<div
			v-if="isShown"
			ref="row"
			class="mail-compose-signature-block"
			:class="{ '--unplaced': rowTop === null }"
			:style="rowPosition"
			data-testid="mail-compose-signature-block"
		>
			<BIcon
				class="mail-compose-signature-block__icon"
				:name="iconName"
				:size="20"
				data-testid="mail-compose-signature-icon"
			/>
			<TextSm class-name="mail-compose-signature-block__label">{{ signatureLabel }}:</TextSm>
			<UiButton
				:text="controlText"
				:style="controlStyle"
				:size="controlSize"
				dropdown
				:dataset="{ testid: controlTestId }"
				@click="handleControlClick"
			/>
			<UiLabel
				v-if="kindLabel !== ''"
				:value="kindLabel"
				:style="labelStyle"
				:size="labelSize"
				data-testid="mail-compose-signature-kind"
			/>
			<BMenu
				v-if="isMenuShown"
				:id="menuId"
				:options="menuOptions"
				@close="isMenuShown = false"
			/>
		</div>
	`,
});
