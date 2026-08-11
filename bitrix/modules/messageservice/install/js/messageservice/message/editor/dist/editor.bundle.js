/* eslint-disable */
this.BX = this.BX || {};
this.BX.MessageService = this.BX.MessageService || {};
this.BX.MessageService.Message = this.BX.MessageService.Message || {};
(function (exports, ui_designTokens, ui_designTokens_air, main_core, main_core_events, ui_vue3, ui_vue3_vuex, messageservice_message_editor_skeleton, ui_textEditor, ui_lexical_core, ui_bbcode_model, ui_lexical_clipboard, ui_iconSet_api_vue, ui_vue3_components_button, ui_system_typography_vue, messageservice_template_editor, ui_vue3_directives_hint, ui_system_skeleton_vue, ui_alerts, ui_entitySelector, ui_iconSet_outline, ui_iconSet_social, messageservice_channel_selector, ui_system_chip_vue, ui_analytics) {
	'use strict';

	/**
	 * @abstract
	 */
	class ContentProvider {
		#id;
		#customData;
		constructor(serverData) {
			this.#id = serverData.id;
			this.#customData = serverData.customData ?? {};
		}
		getId() {
			return this.#id;
		}
		getCustomData() {
			return this.#customData;
		}

		/**
		 * Update server-controlled data (customData) without recreating the provider.
		 * Called by ContentProviderFactory.reconcile() for existing providers.
		 */
		updateServerData(serverData) {
			this.#customData = serverData.customData ?? this.#customData;
		}

		/**
		 * Override in subclasses that hold resources (dialogs, subscriptions, etc.).
		 */
		destroy() {}

		/**
		 * @abstract
		 */
		getMenuItems(context) {
			throw new Error(`${this.constructor.name}.getMenuItems() must be implemented`);
		}
	}

	class ContentProviderFactory {
		#resolvers = new Map();
		#instances = new Map();

		/**
		 * Register a resolver for a provider ID.
		 * @param {string} id
		 * @param {function(Object): ContentProvider} resolver
		 */
		registerResolver(id, resolver) {
			this.#resolvers.set(id, resolver);
		}
		removeResolver(id) {
			this.#resolvers.delete(id);
		}

		/**
		 * Diff-based reconciliation: creates new, keeps existing, destroys removed.
		 * @param {Object} serverProvidersMap - { [id]: { id, isLocked, customData } }
		 */
		reconcile(serverProvidersMap) {
			const newIds = new Set(Object.keys(serverProvidersMap));
			const oldIds = new Set(this.#instances.keys());

			// Remove providers that are no longer in server data
			for (const id of oldIds) {
				if (!newIds.has(id)) {
					this.#instances.get(id)?.destroy?.();
					this.#instances.delete(id);
				}
			}
			for (const id of newIds) {
				if (oldIds.has(id)) {
					// Update server-controlled data on existing providers
					this.#instances.get(id).updateServerData(serverProvidersMap[id]);
				} else {
					// Create new providers
					const resolver = this.#resolvers.get(id);
					if (resolver) {
						this.#instances.set(id, resolver(serverProvidersMap[id]));
					}
				}
			}
		}
		getProviders() {
			return [...this.#instances.values()];
		}
		getProvider(id) {
			return this.#instances.get(id) ?? null;
		}
		destroy() {
			for (const provider of this.#instances.values()) {
				provider.destroy?.();
			}
			this.#instances.clear();
			this.#resolvers.clear();
		}
	}

	const PLACEHOLDER_TAG_NAME = 'placeholder';

	// The negative lookahead `(?!\s*\[/placeholder\])` after the opening `]`
	// rejects both empty and whitespace-only captions in one step.
	const PLACEHOLDER_RE = new RegExp(`\\[${PLACEHOLDER_TAG_NAME}\\s+(?=[^\\]]*\\bcode=(?:"[^"]+"|[^\\s"\\]]+))([^\\]]*)\\](?!\\s*\\[\\/${PLACEHOLDER_TAG_NAME}\\])(.+?)\\[\\/${PLACEHOLDER_TAG_NAME}\\]`, 'gs');
	const ATTR_RE = /(\w+)(?:=(?:"([^"]*)"|([^\s"\]]+)))?/g;
	class PlaceholderService {
		scan(text) {
			const tokens = [];
			let lastIndex = 0;
			for (const match of text.matchAll(PLACEHOLDER_RE)) {
				if (match.index > lastIndex) {
					tokens.push(...this.#splitLinebreaks(text.slice(lastIndex, match.index)));
				}
				tokens.push({
					type: 'placeholder',
					attrs: this.#parseAttrs(match[1] ?? ''),
					caption: match[2] ?? ''
				});
				lastIndex = match.index + match[0].length;
			}
			if (lastIndex < text.length) {
				tokens.push(...this.#splitLinebreaks(text.slice(lastIndex)));
			}
			return tokens;
		}
		serializePlaceholder(code, caption, attrs = {}) {
			if (!main_core.Type.isStringFilled(code)) {
				throw new Error('PlaceholderService: argument "code" is required and must be a non-empty string');
			}
			if (!main_core.Type.isStringFilled(caption)) {
				throw new Error('PlaceholderService: argument "caption" is required and must be a non-empty string');
			}

			// strip code from attrs so the explicit argument always wins
			const {
				code: _ignoredCode,
				...restAttrs
			} = attrs;
			const attrPairs = Object.entries({
				code,
				...restAttrs
			}).map(([key, value]) => {
				if (value === '') {
					return key;
				}
				if (/["\]]/.test(value)) {
					throw new Error(`PlaceholderService: attribute "${key}" value contains forbidden character (] or "): ${value}`);
				}
				return /\s/.test(value) ? `${key}="${value}"` : `${key}=${value}`;
			});
			return `[${PLACEHOLDER_TAG_NAME} ${attrPairs.join(' ')}]${caption}[/${PLACEHOLDER_TAG_NAME}]`;
		}
		replace(template, replacer) {
			return this.scan(template).map(token => {
				if (token.type === 'placeholder') {
					const {
						code = '',
						...customData
					} = token.attrs;
					const result = replacer(code, customData);
					return result === null ? this.serializePlaceholder(code, token.caption, customData) : result;
				}
				return token.type === 'linebreak' ? '\n' : token.content;
			}).join('');
		}
		toDisplayText(text) {
			return this.scan(text).map(token => {
				if (token.type === 'placeholder') {
					return token.caption;
				}
				return token.type === 'linebreak' ? '\n' : token.content;
			}).join('');
		}
		#splitLinebreaks(text) {
			if (text === '') {
				return [];
			}
			const parts = text.split('\n');
			const tokens = [];
			parts.forEach((part, i) => {
				if (part !== '') {
					tokens.push({
						type: 'text',
						content: part
					});
				}
				if (i < parts.length - 1) {
					tokens.push({
						type: 'linebreak'
					});
				}
			});
			return tokens;
		}
		#parseAttrs(str) {
			const attrs = {};
			for (const match of str.matchAll(ATTR_RE)) {
				const [, key, quoted, unquoted] = match;
				attrs[key] = quoted ?? unquoted ?? '';
			}
			return attrs;
		}
	}
	const placeholderService = new PlaceholderService();

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	class PlaceholderNode extends ui_lexical_core.DecoratorNode {
		__removable = true;
		__copyable = true;
		__customData = {};
		static getType() {
			return PLACEHOLDER_TAG_NAME;
		}
		static clone(node) {
			return new PlaceholderNode(node.__code, node.__caption, node.__removable, node.__copyable, node.__customData, node.__key);
		}
		constructor(code, caption, removable, copyable, customData, key) {
			super(key);
			this.__code = code;
			this.__caption = caption;
			if (!main_core.Type.isNil(removable)) {
				this.__removable = main_core.Text.toBoolean(removable);
			}
			if (!main_core.Type.isNil(copyable)) {
				this.__copyable = main_core.Text.toBoolean(copyable);
			}
			if (main_core.Type.isPlainObject(customData)) {
				// Strip reserved keys so they cannot hijack serialization attributes.
				const {
					code: _omitCode,
					removable: _omitRemovable,
					copyable: _omitCopyable,
					...filtered
				} = customData;
				this.__customData = filtered;
			}
		}
		getCode() {
			return this.getLatest().__code;
		}
		getCaption() {
			return this.getLatest().__caption;
		}
		isRemovable() {
			return this.getLatest().__removable;
		}
		isCopyable() {
			return this.getLatest().__copyable;
		}
		getCustomData() {
			return {
				...this.getLatest().__customData
			};
		}
		createDOM(config, editor) {
			const span = document.createElement('span');
			span.className = 'messageservice-message-editor__placeholder-pill';
			span.textContent = this.__caption;
			return span;
		}
		updateDOM(prevNode, dom, config) {
			return false;
		}
		exportDOM(editor) {
			const span = document.createElement('span');
			span.setAttribute('data-placeholder-code', this.__code);
			span.setAttribute('data-placeholder-caption', this.__caption);
			if (!this.__removable) {
				span.setAttribute('data-placeholder-removable', 'false');
			}
			if (!this.__copyable) {
				span.setAttribute('data-placeholder-copyable', 'false');
			}
			span.setAttribute('data-placeholder-custom-data', JSON.stringify(this.__customData));
			span.textContent = this.__caption;
			return {
				element: span
			};
		}
		static importDOM() {
			return {
				span: domNode => {
					if (!domNode.hasAttribute('data-placeholder-code')) {
						return null;
					}
					return {
						conversion: element => {
							const code = element.getAttribute('data-placeholder-code') ?? '';
							const caption = element.getAttribute('data-placeholder-caption') ?? code;
							const removable = element.getAttribute('data-placeholder-removable');
							const copyable = element.getAttribute('data-placeholder-copyable');
							const raw = element.getAttribute('data-placeholder-custom-data');
							let customData = {};
							if (raw) {
								try {
									customData = JSON.parse(raw);
								} catch {
									// invalid JSON — fall back to empty custom data
								}
							}
							return {
								node: $createPlaceholderNode({
									code,
									caption,
									removable,
									copyable,
									customData
								})
							};
						},
						priority: 1
					};
				}
			};
		}
		static importJSON(serializedNode) {
			return $createPlaceholderNode({
				code: serializedNode.code,
				caption: serializedNode.caption,
				removable: serializedNode.removable,
				copyable: serializedNode.copyable,
				customData: serializedNode.customData
			});
		}
		exportJSON() {
			return {
				type: PLACEHOLDER_TAG_NAME,
				version: 1,
				code: this.__code,
				caption: this.__caption,
				removable: this.__removable,
				copyable: this.__copyable,
				customData: this.__customData
			};
		}
		getTextContent(includeDirectionless) {
			return this.__caption;
		}
		isInline() {
			return true;
		}
		isKeyboardSelectable() {
			return this.__removable;
		}
		isIsolated() {
			return true;
		}
		decorate(editor, config) {
			return null;
		}
		remove(preserveEmptyParent) {
			if (!this.__removable) {
				return;
			}
			super.remove(preserveEmptyParent);
		}
		replace(replaceWith) {
			if (!this.__removable) {
				return replaceWith;
			}
			return super.replace(replaceWith);
		}
	}
	function $createPlaceholderNode({
		code,
		caption,
		removable,
		copyable,
		customData,
		key
	} = {}) {
		return ui_lexical_core.$applyNodeReplacement(new PlaceholderNode(code, caption, removable, copyable, customData, key));
	}
	function $isPlaceholderNode(node) {
		return node instanceof PlaceholderNode;
	}

	class LexicalService {
		#placeholderService;
		constructor(service) {
			this.#placeholderService = service;
		}
		$importToInlineNodes(text) {
			const tokens = this.#placeholderService.scan(text);
			const nodes = [];
			for (const token of tokens) {
				switch (token.type) {
					case 'text':
						nodes.push(ui_lexical_core.$createTextNode(token.content));
						break;
					case 'linebreak':
						nodes.push(ui_lexical_core.$createLineBreakNode());
						break;
					case 'placeholder':
						{
							const {
								code = '',
								removable,
								copyable,
								...customData
							} = token.attrs;
							nodes.push($createPlaceholderNode({
								code,
								caption: token.caption,
								removable,
								copyable,
								customData
							}));
							break;
						}

					// no default
				}
			}
			return nodes;
		}
		$importToLexicalNodes(text) {
			const inline = this.$importToInlineNodes(text);
			const paragraph = ui_lexical_core.$createParagraphNode();
			paragraph.append(...inline);
			return [paragraph];
		}
		$exportFromLexical(root) {
			return root.getChildren().map(paragraph => this.#serializeParagraph(paragraph)).join('\n');
		}
		#serializeParagraph(paragraph) {
			if (!ui_lexical_core.$isParagraphNode(paragraph)) {
				// LINE_BREAK mode with the current plugin set should never produce
				// non-paragraph root children. Fall back to getTextContent() if it
				// happens, so we at least keep the text instead of silently dropping.
				return paragraph.getTextContent?.() ?? '';
			}
			return paragraph.getChildren().map(node => {
				if (ui_lexical_core.$isLineBreakNode(node)) {
					return '\n';
				}
				if ($isPlaceholderNode(node)) {
					const attrs = {
						...(node.isRemovable() ? {} : {
							removable: 'false'
						}),
						...(node.isCopyable() ? {} : {
							copyable: 'false'
						}),
						...node.getCustomData()
					};
					return this.#placeholderService.serializePlaceholder(node.getCode(), node.getCaption(), attrs);
				}
				return node.getTextContent();
			}).join('');
		}
	}
	const lexicalService = new LexicalService(placeholderService);

	const LEXICAL_CLIPBOARD_FORMAT = 'application/x-lexical-editor';
	const INSERT_TEXT_COMMAND = ui_lexical_core.createCommand('INSERT_TEXT_COMMAND');
	const INSERT_PLACEHOLDER_COMMAND = ui_lexical_core.createCommand('INSERT_PLACEHOLDER_COMMAND');
	const INSERT_PLACEHOLDER_TEXT_COMMAND = ui_lexical_core.createCommand('INSERT_PLACEHOLDER_TEXT_COMMAND');
	class PlaceholderPlugin extends ui_textEditor.BasePlugin {
		#savedSelection = null;
		static getName() {
			return 'TemplatePlaceholder';
		}
		static getNodes(editor) {
			return [PlaceholderNode];
		}
		afterInit() {
			this.cleanUpRegister(this.getLexicalEditor().registerUpdateListener(({
				editorState
			}) => {
				editorState.read(() => {
					const selection = ui_lexical_core.$getSelection();
					if (ui_lexical_core.$isRangeSelection(selection)) {
						this.#savedSelection = selection.clone();
					}
				});
			}), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, event => {
				const {
					clipboardData
				} = event;
				if (clipboardData === null || !clipboardData.getData(LEXICAL_CLIPBOARD_FORMAT)) {
					return false;
				}
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				event.preventDefault();
				ui_lexical_clipboard.$insertDataTransferForRichText(clipboardData, selection, this.getLexicalEditor());
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_HIGH), this.getEditor().registerCommand(ui_lexical_core.SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, payload => this.#handleClipboardInsert(payload), ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_TEXT_COMMAND, ({
				text
			}) => {
				this.#insertNodes([ui_lexical_core.$createTextNode(text)]);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_PLACEHOLDER_COMMAND, ({
				code,
				caption,
				removable,
				copyable,
				customData
			}) => {
				this.#insertNodes([$createPlaceholderNode({
					code,
					caption,
					removable,
					copyable,
					customData
				})]);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_PLACEHOLDER_TEXT_COMMAND, ({
				text
			}) => {
				const nodes = lexicalService.$importToInlineNodes(text);
				if (nodes.length > 0) {
					this.#insertNodes(nodes);
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
		}
		#handleClipboardInsert({
			nodes,
			selection
		}) {
			// Recursively replace non-copyable placeholders nested inside element
			// nodes (e.g. inside a pasted paragraph). In-place .replace() is safe
			// because nested children are attached to their parent element.
			const replaceInChildren = element => {
				let changed = false;
				// Snapshot the children list — .replace() mutates it during iteration.
				const children = [...element.getChildren()];
				for (const child of children) {
					if ($isPlaceholderNode(child) && !child.isCopyable()) {
						child.replace(ui_lexical_core.$createTextNode(child.getTextContent()));
						changed = true;
					} else if (ui_lexical_core.$isElementNode(child) && replaceInChildren(child)) {
						changed = true;
					}
				}
				return changed;
			};
			let replaced = false;
			// Top-level nodes from the command payload are detached — .replace()
			// cannot be used on them, so we rebuild the top-level array.
			const filteredNodes = nodes.map(node => {
				if ($isPlaceholderNode(node) && !node.isCopyable()) {
					replaced = true;
					return ui_lexical_core.$createTextNode(node.getTextContent());
				}
				if (ui_lexical_core.$isElementNode(node) && replaceInChildren(node)) {
					replaced = true;
				}
				return node;
			});
			if (!replaced) {
				return false;
			}
			selection.insertNodes(filteredNodes);
			return true;
		}
		#insertNodes(nodes) {
			if (!ui_lexical_core.$isRangeSelection(ui_lexical_core.$getSelection()) && this.#savedSelection) {
				const anchorExists = ui_lexical_core.$getNodeByKey(this.#savedSelection.anchor.key) !== null;
				const focusExists = ui_lexical_core.$getNodeByKey(this.#savedSelection.focus.key) !== null;
				if (anchorExists && focusExists) {
					ui_lexical_core.$setSelection(this.#savedSelection.clone());
				}
			}
			if (!ui_lexical_core.$isRangeSelection(ui_lexical_core.$getSelection())) {
				ui_lexical_core.$getRoot().selectEnd();
			}
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return;
			}
			ui_lexical_core.$insertNodes(this.#padNodes(selection, nodes));
		}
		#padNodes(selection, nodes) {
			const {
				padBefore,
				padAfter
			} = this.#analyzeNeighbors(selection.anchor);
			const nodesToInsert = [];
			if (padBefore) {
				nodesToInsert.push(ui_lexical_core.$createTextNode(' '));
			}
			nodesToInsert.push(...nodes);
			if (padAfter) {
				nodesToInsert.push(ui_lexical_core.$createTextNode(' '));
			}
			return nodesToInsert;
		}
		#analyzeNeighbors(anchor) {
			if (anchor.type === 'text') {
				const node = anchor.getNode();
				const text = node.getTextContent();
				return {
					padBefore: anchor.offset > 0 ? this.#isPaddingNeededForChar(text[anchor.offset - 1]) : this.#needsPaddingAgainst(node.getPreviousSibling(), 'end'),
					padAfter: anchor.offset < text.length ? this.#isPaddingNeededForChar(text[anchor.offset]) : this.#needsPaddingAgainst(node.getNextSibling(), 'start')
				};
			}
			if (anchor.type === 'element') {
				const parent = anchor.getNode();
				return {
					padBefore: this.#needsPaddingAgainst(parent.getChildAtIndex(anchor.offset - 1), 'end'),
					padAfter: this.#needsPaddingAgainst(parent.getChildAtIndex(anchor.offset), 'start')
				};
			}
			return {
				padBefore: false,
				padAfter: false
			};
		}
		#needsPaddingAgainst(sibling, edge) {
			if (!sibling) {
				return false;
			}
			if (ui_lexical_core.$isLineBreakNode(sibling)) {
				// A linebreak is already a separator — no extra space needed.
				return false;
			}
			if (ui_lexical_core.$isTextNode(sibling)) {
				const text = sibling.getTextContent();
				const edgeChar = edge === 'end' ? text.slice(-1) : text[0] ?? '';
				return this.#isPaddingNeededForChar(edgeChar);
			}

			// Decorator / generic element — treat as a hard boundary, always pad.
			return true;
		}
		#isPaddingNeededForChar(char) {
			return char !== '' && char !== ' ';
		}
		importBBCode() {
			return {
				[PLACEHOLDER_TAG_NAME]: () => ({
					conversion: bbcodeNode => {
						const {
							code = '',
							removable,
							copyable,
							...customData
						} = bbcodeNode.getAttributes();
						const textChildren = bbcodeNode.getChildren().filter(child => child instanceof ui_bbcode_model.BBCodeTextNode);
						const caption = textChildren.map(child => child.getContent()).join('') || code;
						return {
							node: $createPlaceholderNode({
								code,
								caption,
								removable,
								copyable,
								customData
							})
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				[PLACEHOLDER_TAG_NAME]: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					const attributes = {
						code: lexicalNode.getCode(),
						...(lexicalNode.isRemovable() ? {} : {
							removable: 'false'
						}),
						...(lexicalNode.isCopyable() ? {} : {
							copyable: 'false'
						}),
						...lexicalNode.getCustomData()
					};
					return {
						node: scheme.createElement({
							name: PLACEHOLDER_TAG_NAME,
							attributes,
							children: [scheme.createText(lexicalNode.getCaption())]
						})
					};
				}
			};
		}
		validateScheme() {
			this.getEditor().getBBCodeScheme().setTagScheme(new ui_bbcode_model.BBCodeTagScheme({
				name: PLACEHOLDER_TAG_NAME,
				group: ['#inline'],
				allowedChildren: ['#text']
			}));
			return {
				nodes: [{
					nodeClass: PlaceholderNode
				}],
				bbcodeMap: {
					[PLACEHOLDER_TAG_NAME]: PLACEHOLDER_TAG_NAME
				}
			};
		}
	}

	// @vue/component
	const BodyActions = {
		name: 'BodyActions',
		components: {
			BButton: ui_vue3_components_button.Button,
			BMenu: ui_vue3.BitrixVue.defineAsyncComponent('ui.system.menu.vue', 'BMenu'),
			Popup: ui_vue3.BitrixVue.defineAsyncComponent('ui.vue3.components.popup', 'Popup'),
			Smiles: ui_vue3.BitrixVue.defineAsyncComponent('ui.vue3.components.smiles', 'Smiles')
		},
		props: {
			providerInstances: {
				type: Array,
				required: true,
				validator: value => value.every(x => x instanceof ContentProvider)
			},
			insertContext: {
				type: Object,
				required: true
			}
		},
		emits: ['showCopilot'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isAddMenuShown: false,
				isSmilesShown: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type boolean */
				isProgress: 'application/isProgress'
			}),
			...ui_vue3_vuex.mapState({
				/** @type {Layout} */
				layout: state => state.application.layout
			}),
			isShowActionsButton() {
				return this.layout.isContentProvidersShown && this.menuItems.length > 0;
			},
			isShowCopilot() {
				return this.layout.isContentProvidersShown && this.providerInstances.some(p => p.getId() === 'copilot');
			},
			menuItems() {
				if (!this.layout.isContentProvidersShown) {
					return [];
				}
				const items = [];
				for (const provider of this.providerInstances) {
					const providerItems = provider.getMenuItems(this.insertContext);
					const providerId = provider.getId();
					for (let i = 0; i < providerItems.length; i++) {
						const item = providerItems[i];
						if (!item.id) {
							item.id = providerItems.length === 1 ? providerId : `${providerId}~${i}`;
						} else if (item.id !== providerId) {
							item.id = `${providerId}~${item.id}`;
						}
					}
					items.push(...providerItems);
				}
				return items;
			},
			menuOptions() {
				const sections = [];
				const seenCodes = new Set();
				for (const item of this.menuItems) {
					if (item.sectionCode && !seenCodes.has(item.sectionCode)) {
						seenCodes.add(item.sectionCode);
						sections.push({
							code: item.sectionCode
						});
					}
				}
				return {
					bindElement: this.$refs.actions,
					sections,
					items: this.menuItems
				};
			}
		},
		methods: {
			async showCopilot() {
				const copilotProvider = this.providerInstances.find(p => p.getId() === 'copilot');
				if (!copilotProvider) {
					return;
				}
				if (copilotProvider.getCustomData().isLocked) {
					/** @see BX.UI.FeaturePromotersRegistry */
					const {
						FeaturePromotersRegistry
					} = await main_core.Runtime.loadExtension('ui.info-helper');
					FeaturePromotersRegistry.getPromoter({
						code: copilotProvider.getCustomData().sliderCode
					}).show();
					return;
				}
				this.getAnalyticsService().onAddCopilot();
				this.$emit('showCopilot');
			},
			toggleSmiles() {
				if (this.isProgress) {
					return;
				}
				this.isSmilesShown = !this.isSmilesShown;
			},
			getAnalyticsService() {
				return this.$Bitrix.Data.get('locator').getAnalyticsService();
			}
		},
		template: `
		<div ref="actions" v-if="isShowActionsButton || isShowCopilot || layout.isEmojiButtonShown" class="messageservice-message-editor__content__body__actions">
			<div class="messageservice-message-editor__content__body__actions__left">
				<BButton
					v-if="isShowActionsButton"
					:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_BUTTON_ADD')"
					:style="AirButtonStyle.PLAIN"
					:leftIcon="Outline.PLUS_M"
					:disabled="isProgress || layout.isMessageTextReadOnly"
					@click="isAddMenuShown = true"
				/>
				<BMenu v-if="isAddMenuShown && !isProgress" :options="menuOptions" @close="isAddMenuShown = false"/>
				<BButton
					v-if="isShowCopilot"
					@click="showCopilot"
					:style="AirButtonStyle.PLAIN"
					:leftIcon="Outline.COPILOT"
					:disabled="isProgress || layout.isMessageTextReadOnly"
					class="messageservice-message-editor__content__body__actions__copilot"
				/>
			</div>
			<div ref="buttons-right">
				<BButton
					v-if="layout.isEmojiButtonShown"
					:style="AirButtonStyle.PLAIN"
					:leftIcon="Outline.SMILE"
					@click="toggleSmiles"
					:disabled="isProgress || layout.isMessageTextReadOnly"
				/>
				<Popup
					v-if="isSmilesShown && !isProgress"
					:options="{
						bindElement: $refs['buttons-right'],
						width: 332,
						height: 360,
						offsetLeft: -133,
						padding: 0,
						background: '#F7F9FA',
					}"
					@close="isSmilesShown = false"
				>
					<Smiles :isOnlyEmoji="true" @selectSmile="insertContext.insertText($event.text.trim())"/>
				</Popup>
			</div>
		</div>
	`
	};

	// @vue/component
	const LengthCounter = {
		name: 'LengthCounter',
		components: {
			BText: ui_system_typography_vue.Text
		},
		computed: {
			...ui_vue3_vuex.mapState({
				rawText: state => state.message.text
			}),
			message() {
				return this.$Bitrix.Data.get('locator').getPlaceholderService().toDisplayText(this.rawText);
			},
			messageLengthCounter() {
				const colorStart = this.isOverflow ? '<span style="color: #d0011b;">' : '<span>';
				const colorEnd = '</span>';
				return main_core.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_COUNTER', {
					'[color]': colorStart,
					'#COUNT#': main_core.Text.toInteger(this.message.length),
					'[/color]': colorEnd,
					'#MAX#': this.recommendedMaxMessageLength
				});
			},
			isOverflow() {
				return this.message.length > this.recommendedMaxMessageLength;
			},
			recommendedMaxMessageLength() {
				return main_core.Text.toInteger(main_core.Extension.getSettings('messageservice.message.editor').get('recommendedMaxMessageLength'));
			}
		},
		template: `
		<BText 
			size="sm"
			tag="div"
			className="messageservice-message-editor__content__footer__text"
		><span v-html="messageLengthCounter"></span></BText>
	`
	};

	// @vue/component
	const ContentBody = {
		name: 'ContentBody',
		props: {
			bgColor: {
				type: String,
				default: null
			},
			padding: {
				type: String,
				default: 'var(--ui-space-inset-md)'
			}
		},
		template: `
		<div
			class="messageservice-message-editor__content__body"
			:style="{
				backgroundColor: bgColor,
				padding: padding,
			}"
		>
			<slot/>
		</div>
	`
	};

	// @vue/component
	const ContentFooter = {
		name: 'ContentFooter',
		template: `
		<div class="messageservice-message-editor__content__footer">
			<slot/>
		</div>
	`
	};

	// @vue/component
	const MessagePreview = {
		name: 'MessagePreview',
		components: {
			BText: ui_system_typography_vue.Text
		},
		placeholdersPreviewer: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type boolean */
				isProgress: 'application/isProgress',
				/** @type string */
				messageBody: 'message/body'
			})
		},
		beforeUnmount() {
			this.placeholdersPreviewer?.destroy();
		},
		methods: {
			togglePreviewer() {
				if (this.isProgress || this.messageBody.trim().length === 0) {
					return;
				}
				this.placeholdersPreviewer ??= new messageservice_template_editor.Previewer({
					bindElement: this.$refs.preview.$el,
					events: {
						onLoadPreview: async event => {
							const eventResults = await this.$Bitrix.Data.get('locator').getEventEmitter().emitAsync('onLoadPreview', event.getData());
							return eventResults.shift();
						}
					}
				});
				if (this.placeholdersPreviewer.isShown()) {
					this.placeholdersPreviewer.close();
				} else {
					this.$Bitrix.Data.get('locator').getAnalyticsService().onPreviewShow();
					this.placeholdersPreviewer.preview(this.messageBody);
				}
			}
		},
		template: `
		<BText
			ref="preview"
			size="sm"
			tag="div"
			:className="{
				'messageservice-message-editor__content__footer__text': true, 
				'--pointer': !isProgress && messageBody.trim().length > 0,
				'--disabled': isProgress || messageBody.trim().length <= 0,
			}"
			data-test-role="preview"
			@click="togglePreviewer"
		>{{ $Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_PREVIEW') }}</BText>
	`
	};

	const {
		INSERT_COPILOT_DIALOG_COMMAND
	} = ui_textEditor.Plugins.Copilot;

	// @vue/component
	const CustomMessageContent = {
		name: 'CustomMessageContent',
		components: {
			TextEditorComponent: ui_textEditor.TextEditorComponent,
			MessagePreview,
			ContentBody,
			ContentFooter,
			LengthCounter,
			BodyActions
		},
		setup() {
			const providerInstances = ui_vue3.shallowRef([]);
			return {
				providerInstances
			};
		},
		data() {
			return {
				pendingEditorUpdates: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type boolean */
				isProgress: 'application/isProgress'
			}),
			...ui_vue3_vuex.mapState({
				contentProviders: state => state.application.contentProviders,
				/** @type {Layout} */
				layout: state => state.application.layout
			}),
			bgColor() {
				return this.layout.isMessageTextReadOnly ? 'var(--ui-color-accent-soft-blue-3)' : undefined;
			},
			editorOptions() {
				const copilotProvider = this.providerInstances.find(p => p.getId() === 'copilot');
				const plugins = ['RichText', 'Paragraph', 'Clipboard', 'History', 'Placeholder'];
				const options = {
					plugins,
					extraPlugins: [PlaceholderPlugin],
					toolbar: [],
					newLineMode: ui_textEditor.Constants.NewLineMode.LINE_BREAK,
					minHeight: 50,
					maxHeight: 150,
					editorState: () => {
						const nodes = this.getLexicalService().$importToLexicalNodes(this.$store.state.message.text);
						ui_lexical_core.$getRoot().append(...nodes);
					},
					placeholder: this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_PLACEHOLDER')
				};
				if (copilotProvider && !copilotProvider.getCustomData().isLocked) {
					plugins.push('Copilot');
					options.copilot = {
						copilotOptions: copilotProvider.getCustomData(),
						triggerBySpace: false
					};
				}
				return options;
			},
			editorEvents() {
				return {
					onChange: () => {
						const text = this.textEditor.getEditorState().read(() => this.getLexicalService().$exportFromLexical(ui_lexical_core.$getRoot()));
						this.pendingEditorUpdates++;
						void this.$store.dispatch('message/setText', {
							text
						}).finally(() => {
							this.pendingEditorUpdates--;
						});
					}
				};
			}
		},
		watch: {
			contentProviders(newVal) {
				const factory = this.getProviderFactory();
				factory.reconcile(newVal);
				this.providerInstances = factory.getProviders();
			},
			'$store.state.message.text': function (newText) {
				if (this.pendingEditorUpdates > 0) {
					return;
				}
				this.textEditor.update(() => {
					const root = ui_lexical_core.$getRoot();
					root.clear();
					root.append(...this.getLexicalService().$importToLexicalNodes(newText));
					ui_lexical_core.$setSelection(null);
				});
			}
		},
		created() {
			const factory = this.getProviderFactory();
			factory.reconcile(this.contentProviders);
			this.providerInstances = factory.getProviders();
			this.textEditor = new ui_textEditor.TextEditor(this.editorOptions);
			this.insertContext = Object.freeze({
				insertText: text => {
					this.textEditor.dispatchCommand(INSERT_TEXT_COMMAND, {
						text
					});
				},
				insertPlaceholderText: text => {
					this.textEditor.dispatchCommand(INSERT_PLACEHOLDER_TEXT_COMMAND, {
						text
					});
				},
				insertPlaceholder: (code, caption, options) => {
					this.textEditor.dispatchCommand(INSERT_PLACEHOLDER_COMMAND, {
						code,
						caption,
						removable: options?.removable,
						copyable: options?.copyable,
						customData: options?.customData ?? {}
					});
				},
				getBindElement: () => {
					return this.$refs.actions.$el;
				},
				trackAction: element => {
					this.$Bitrix.Data.get('locator').getAnalyticsService().onContentProviderAction(element);
				},
				setLoading: isLoading => {
					void this.$store.dispatch('application/setProgress', {
						isLoading
					});
				}
			});
		},
		unmounted() {
			this.textEditor.destroy();
			this.textEditor = null;
			this.insertContext = null;
		},
		methods: {
			showCopilot() {
				this.textEditor.focus();
				this.textEditor.dispatchCommand(INSERT_COPILOT_DIALOG_COMMAND, {});
			},
			getProviderFactory() {
				return this.$Bitrix.Data.get('locator').getProviderFactory();
			},
			getLexicalService() {
				return this.$Bitrix.Data.get('locator').getLexicalService();
			}
		},
		template: `
		<ContentBody
			padding="0"
			:bgColor="bgColor"
			data-test-role="message-text-input"
		>
			<TextEditorComponent
				ref="textEditorComponent"
				:editorInstance="textEditor"
				:events="editorEvents"
				:editable="!isProgress && !layout.isMessageTextReadOnly"
			>
				<template #footer>
					<BodyActions
						ref="actions"
						:providerInstances="providerInstances"
						:insertContext="insertContext"
						@showCopilot="showCopilot"
					/>
				</template>
			</TextEditorComponent>
		</ContentBody>
		<ContentFooter v-if="layout.isMessagePreviewShown || layout.isMessageLengthCounterShown">
			<MessagePreview v-if="layout.isMessagePreviewShown"/>
			<div v-else></div>
			<LengthCounter v-if="layout.isMessageLengthCounterShown"/>
			<div v-else></div>
		</ContentFooter>
	`
	};

	// @vue/component
	const ContentContainer = {
		name: 'ContentContainer',
		template: `
		<div class="messageservice-message-editor__content" data-role="content-container">
			<slot/>
		</div>
	`
	};

	// @vue/component
	const NotificationMessageContent = {
		name: 'NotificationMessageContent',
		components: {
			BText: ui_system_typography_vue.Text,
			ContentBody
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		editor: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				notificationTemplate: 'notificationTemplates/current'
			}),
			title() {
				return this.notificationTemplate?.translation?.TITLE || '';
			},
			placeholders() {
				return this.notificationTemplate?.placeholders ?? [];
			},
			previewPlaceholders() {
				return this.placeholders.map(placeholder => this.makeTranslationPlaceholderName(placeholder.name));
			},
			filledPlaceholders() {
				return this.placeholders.map(placeholder => {
					return {
						PLACEHOLDER_ID: this.makeTranslationPlaceholderName(placeholder.name),
						FIELD_VALUE: placeholder.value ?? placeholder.caption ?? ''
					};
				});
			},
			hasNotFilledPlaceholders() {
				return this.placeholders.some(placeholder => main_core.Type.isNil(placeholder.value));
			},
			hint() {
				if (!this.hasNotFilledPlaceholders) {
					return null;
				}
				return {
					text: this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_PLACEHOLDER_FILLED_LATER_HINT'),
					position: 'top'
				};
			}
		},
		watch: {
			notificationTemplate() {
				if (!this.editor || !this.notificationTemplate) {
					return;
				}
				this.adjustEditor();
			}
		},
		mounted() {
			this.editor = new messageservice_template_editor.Editor({
				target: this.$refs.body,
				canUsePreview: false,
				isReadOnly: true
			});
			this.adjustEditor();
		},
		beforeUnmount() {
			this.editor?.destroy();
		},
		methods: {
			makeTranslationPlaceholderName(placeholderName) {
				return `#${placeholderName}#`;
			},
			adjustEditor() {
				this.editor.setPlaceholders({
					PREVIEW: this.previewPlaceholders
				}).setFilledPlaceholders(this.filledPlaceholders).setBody(this.notificationTemplate?.translation?.TEXT || this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_TEMPLATE_MESSAGE'));
			}
		},
		template: `
		<ContentBody bgColor="var(--ui-color-accent-soft-blue-3)">
			<BText
				v-if="title"
				tag="div"
				size="md"
				style="
					color: var(--ui-color-base-4);
					margin-bottom: 8px;
				"
			>{{ title }}</BText>
			<div
				ref="body"
				v-hint="hint"
			></div>
		</ContentBody>
	`
	};

	// @vue/component
	const TemplateSkeleton = {
		name: 'TemplateSkeleton',
		components: {
			BLine: ui_system_skeleton_vue.BLine
		},
		computed: {
			height() {
				return 24;
			},
			radius() {
				return 8;
			}
		},
		template: `
		<div class="messageservice-message-editor__flex-column" style="gap: 6px;">
			<BLine :width="104" :height="height" :radius="radius"/>
			<BLine :width="548" :height="height" :radius="radius"/>
		</div>
	`
	};

	// @vue/component
	const TemplateMessageContent = {
		name: 'TemplateMessageContent',
		components: {
			BText: ui_system_typography_vue.Text,
			ContentBody,
			ContentFooter,
			MessagePreview,
			TemplateSkeleton
		},
		editor: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current',
				/** @type ?Template */
				template: 'templates/current'
			}),
			...ui_vue3_vuex.mapState({
				isLoadingTemplates: state => state.application.progress.isLoadingTemplates,
				isMessagePreviewShown: state => state.application.layout.isMessagePreviewShown,
				templateMessages: state => state.application.messages?.template
			}),
			templateTitle() {
				if (main_core.Type.isNil(this.template)) {
					return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_NO_TEMPLATE_TITLE');
				}
				return this.template.TITLE ?? '';
			},
			templateBody() {
				if (main_core.Type.isNil(this.template)) {
					return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_NO_TEMPLATE_BODY');
				}
				return this.template.PREVIEW.replaceAll('\n', '<br>') ?? '';
			},
			bodyColor() {
				return this.isLoadingTemplates ? '#F9F9F9' : 'var(--ui-color-accent-soft-blue-3)';
			}
		},
		watch: {
			'currentChannel.id': function () {
				this.ensureTemplatesLoaded();
			},
			template() {
				this.adjustEditor();
			}
		},
		beforeCreate() {
			// start preloading the extension while the component is mounting
			void main_core.Runtime.loadExtension('messageservice.template.editor');
		},
		created() {
			this.ensureTemplatesLoaded();
		},
		mounted() {
			void main_core.Runtime.loadExtension('messageservice.template.editor').then(exports => {
				this.editor = new exports.Editor({
					target: this.$refs.body,
					canUsePreview: false,
					// we render it ourselves
					canUseFieldsDialog: true,
					canUseFieldValueInput: true,
					messages: this.templateMessages,
					events: {
						onShowFieldsDialog: event => {
							const proxyEvent = new main_core_events.BaseEvent({
								data: {
									...event.getData(),
									updatePlaceholder: this.editor.updatePlaceholder.bind(this.editor)
								}
							});
							this.$Bitrix.Data.get('locator').getEventEmitter().emit('Template:onShowFieldsDialog', proxyEvent);
						},
						onUpdatePlaceholder: event => {
							const {
								filledPlaceholder
							} = event.getData();
							this.createOrUpdatePlaceholder(filledPlaceholder);
							this.$store.dispatch('templates/setFilledPlaceholder', {
								filledPlaceholder
							});
						}
					}
				});
				this.adjustEditor();
			});
		},
		beforeUnmount() {
			this.editor?.destroy();
		},
		methods: {
			/**
			 * load templates only when we start working with the specific channel
			 */
			ensureTemplatesLoaded() {
				void this.$Bitrix.Data.get('locator').getTemplateService().loadTemplates();
			},
			createOrUpdatePlaceholder(filledPlaceholder) {
				this.$Bitrix.Data.get('locator').getTemplateService().createOrUpdatePlaceholder(filledPlaceholder);
			},
			adjustEditor() {
				this.editor.setPlaceholders(main_core.Runtime.clone(this.template?.PLACEHOLDERS ?? [])).setFilledPlaceholders(main_core.Runtime.clone(this.template?.FILLED_PLACEHOLDERS ?? [])).setBody(this.templateBody);
			}
		},
		template: `
		<ContentBody :bgColor="bodyColor">
			<TemplateSkeleton v-show="isLoadingTemplates"/>
			<div v-show="!isLoadingTemplates" class="messageservice-message-editor__flex-column">
				<BText
					tag="div"
					size="md"
					style="color: var(--ui-color-base-4);"
				>{{ templateTitle }}</BText>
				<div ref="body"></div>
			</div>
		</ContentBody>
		<ContentFooter>
			<MessagePreview v-if="isMessagePreviewShown"/>
		</ContentFooter>
	`
	};

	// @vue/component
	const EditorAlert = {
		name: 'EditorAlert',
		alertInstance: null,
		data() {
			return {
				isAlertRendered: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapState({
				/** @type AlertState */
				alert: state => state.application.alert
			}),
			isAlertShown() {
				return main_core.Type.isStringFilled(this.alert?.error);
			}
		},
		watch: {
			alert(newAlert, oldAlert) {
				if (!main_core.Type.isStringFilled(newAlert?.error)) {
					this.alertInstance?.hide();
					this.isAlertRendered = false;
					return;
				}
				if (!this.alertInstance) {
					this.alertInstance = new ui_alerts.Alert({
						color: ui_alerts.AlertColor.DANGER,
						icon: ui_alerts.AlertIcon.DANGER,
						// closeBtn: true,
						animated: false
					});

					// Event.bind(this.alertInstance.getCloseBtn(), 'click', () => {
					// 	this.$store.dispatch('application/resetAlert');
					// });
				}
				if (newAlert.error !== oldAlert.error) {
					this.alertInstance.setText(main_core.Text.encode(newAlert.error));
				}
				if (!this.isAlertRendered) {
					this.alertInstance.show();
					this.alertInstance.renderTo(this.$el);
					this.isAlertRendered = true;
				}
			}
		},
		beforeUnmount() {
			this.alertInstance?.destroy();
		},
		template: `
		<div class="messageservice-message-editor__alert" data-test-role="alert" :style="{
			marginTop: isAlertShown ? 'var(--ui-space-stack-xs2)' : null,
		}"></div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	const ENTITY_ID$3 = 'messageservice-from';

	// @vue/component
	const EditorFooter = {
		name: 'EditorFooter',
		components: {
			BButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			BText: ui_system_typography_vue.Text
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				channel: 'channels/current',
				/** @type From */
				from: 'channels/from',
				/** @type boolean */
				isReadyToSend: 'message/isReadyToSend',
				isProgress: 'application/isProgress'
			}),
			...ui_vue3_vuex.mapState({
				/** @type boolean */
				isSending: state => state.application.progress.isSending,
				/** @type Layout */
				layout: state => state.application.layout
			}),
			fromText() {
				return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_FROM', {
					'#FROM#': this.from?.name || ''
				});
			},
			isSelectable() {
				return this.fromList.length > 1;
			},
			fromList() {
				return this.channel?.fromList ?? [];
			},
			dialogItems() {
				return this.fromList.map(from => {
					return {
						id: from.id,
						entityId: ENTITY_ID$3,
						title: from.name,
						subtitle: from.description,
						selected: from.id === this.from.id,
						tabs: ['recents']
					};
				});
			}
		},
		methods: {
			toggleDialog() {
				if (!this.isSelectable) {
					return;
				}
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$refs.from,
					entities: [{
						id: ENTITY_ID$3,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 300,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					showAvatars: false,
					multiple: false,
					cacheable: false,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('channels/setFrom', {
								fromId: event.getData().item.id
							});
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			},
			send() {
				if (this.isProgress) {
					return;
				}
				this.$Bitrix.Data.get('locator').getSendService().sendMessage().catch(response => {
					this.$Bitrix.Data.get('locator').getAlertService().showError(response?.errors?.[0]?.message);
				});
			},
			cancel() {
				if (this.isProgress) {
					return;
				}
				this.$Bitrix.Data.get('locator').getAnalyticsService().onCancel();
				this.$Bitrix.Data.get('locator').getMessageModel().clearState();
				this.$store.dispatch('application/resetAlert');
				this.$Bitrix.Data.get('locator').getEventEmitter().emit('onCancel');
			}
		},
		template: `
		<div class="messageservice-message-editor__footer">
			<div class="messageservice-message-editor__footer__buttons">
				<BButton
					v-if="layout.isSendButtonShown"
					:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_BUTTON_SEND')"
					@click="send"
					:disabled="!isReadyToSend || (isProgress && !isSending)" 
					:loading="isSending"
				/>
				<BButton
					v-if="layout.isCancelButtonShown"
					:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_BUTTON_CANCEL')"
					@click="cancel"
					:style="AirButtonStyle.PLAIN"
					:disabled="isProgress"
				/>
			</div>
			<div v-if="from" ref="from" class="messageservice-message-editor__footer__from" data-test-role="from-selector" @click="toggleDialog" :style="{
				cursor: isSelectable ? 'pointer' : 'default',
			}">
				<BText 
					tag="div"
					size="xs"
					align="right"
					className="messageservice-message-editor__footer__from__text"
				>{{ fromText }}</BText>
				<BIcon v-if="isSelectable" :name="Outline.CHEVRON_DOWN_S"/>
			</div>
		</div>
	`
	};

	class Logger {
		#prefix;
		constructor(params = {}) {
			this.#prefix = params.prefix || '';
		}
		error(...args) {
			this.#prepareArgs(args);
			console.error(...args);
		}
		warn(...args) {
			this.#prepareArgs(args);

			// eslint-disable-next-line no-console
			console.warn(...args);
		}
		#prepareArgs(args) {
			const [message] = args;
			if (main_core.Type.isString(message)) {
				// eslint-disable-next-line no-param-reassign
				args[0] = `${this.#prefix}${message}`;
			} else {
				args.unshift(this.#prefix);
			}
		}
	}

	// default logger
	const logger = new Logger({
		prefix: 'messageservice.message.editor: '
	});

	function openContactCenter() {
		const settings = main_core.Extension.getSettings('messageservice.message.editor');
		const url = settings.get('contactCenterUrl');
		if (!main_core.Type.isStringFilled(url)) {
			logger.error('no contact center url in extension settings');
			return Promise.resolve();
		}
		return main_core.Runtime.loadExtension('main.sidepanel').then(({
			SidePanel
		}) => {
			return new Promise(resolve => {
				SidePanel.Instance.open(url, {
					cacheable: false,
					allowChangeHistory: true,
					events: {
						onClose: resolve
					}
				});
			});
		});
	}
	function replaceCustomMessagePlaceholders(template, replacer) {
		return placeholderService.replace(template, replacer);
	}

	// @vue/component
	const ChannelSelector = {
		name: 'ChannelSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		selector: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current',
				channelsSort: 'preferences/channelsSortOrDefault'
			}),
			...ui_vue3_vuex.mapState({
				/** @type Channel[] */
				allChannels: state => state.channels.collection,
				promoBanners: state => state.application.promoBanners
			}),
			selectorChannels() {
				return this.allChannels.map(channel => {
					return {
						id: channel.id,
						appearance: channel.appearance,
						onclick: selected => {
							this.$store.dispatch('channels/setChannel', {
								channelId: selected.id
							});
							this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectChannel();
							this.selector?.close();
						}
					};
				});
			}
		},
		watch: {
			allChannels() {
				this.destroySelector();
			},
			promoBanners() {
				this.destroySelector();
			}
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			toggleSelector() {
				if (this.selector?.isShown()) {
					this.selector.close();
					return;
				}
				this.selector ??= new messageservice_channel_selector.Selector({
					bindElement: this.$el,
					channels: main_core.Runtime.clone(this.selectorChannels),
					promoBanners: main_core.Runtime.clone(this.promoBanners),
					channelsSort: main_core.Runtime.clone(this.channelsSort),
					events: {
						onSave: event => {
							const {
								channelsSort
							} = event.getData();
							if (this.isSortChanged(channelsSort)) {
								this.$Bitrix.Data.get('locator').getAnalyticsService().onSaveChannelsSort();
							}
							this.getPreferencesService().saveChannelsSort(channelsSort);
						},
						onBeforeAddChannelOpen: event => {
							this.$Bitrix.Data.get('locator').getAnalyticsService().onAddChannelClick();
							const proxyEvent = new main_core_events.BaseEvent();
							this.$Bitrix.Data.get('locator').getEventEmitter().emit('onBeforeAddChannelOpen', proxyEvent);
							if (proxyEvent.isDefaultPrevented()) {
								event.preventDefault();
							}
						},
						onAfterAddChannelClose: () => {
							this.$Bitrix.Data.get('locator').getEventEmitter().emit('onAfterAddChannelClose');
						},
						onAfterPromoBannerSliderClose: event => {
							const {
								banner: {
									id: bannerId
								},
								connectStatus
							} = event.getData();
							this.$Bitrix.Data.get('locator').getAnalyticsService().onBannerConnectClick(bannerId, connectStatus);
							this.$Bitrix.Data.get('locator').getEventEmitter().emit('onAfterPromoBannerSliderClose');
						},
						onDestroy: () => {
							this.selector = null;
						}
					}
				});
				this.selector.show();
			},
			isSortChanged(newSort) {
				if (newSort.length !== this.channelsSort.length) {
					return true;
				}
				return !this.channelsSort.every((channelPosition, index) => {
					return channelPosition.channelId === newSort[index]?.channelId && channelPosition.isHidden === newSort[index]?.isHidden;
				});
			},
			destroySelector() {
				this.selector?.destroy();
				this.selector = null;
			},
			getPreferencesService() {
				return this.$Bitrix.Data.get('locator').getPreferencesService();
			}
		},
		template: `
		<Chip
			:icon="currentChannel.appearance.icon.title"
			:iconColor="currentChannel.appearance.icon.color"
			:iconBackground="currentChannel.appearance.icon.background"
			:dropdown="true"
			:text="currentChannel.appearance.title"
			:trimmable="true"
			data-test-role="channel-selector"
			@click="toggleSelector"
		/>
	`
	};

	const ENTITY_ID$2 = 'messageservice-notification-template';

	// @vue/component
	const NotificationTemplateSelector = {
		name: 'NotificationTemplateSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapState({
				/** @type NotificationTemplate[] */
				templates: state => state.notificationTemplates.collection
			}),
			...ui_vue3_vuex.mapGetters({
				/** @type ?NotificationTemplate */
				current: 'notificationTemplates/current'
			}),
			dialogItems() {
				return this.templates.map(template => {
					const hasTitle = main_core.Type.isStringFilled(template.translation?.TITLE);
					return {
						id: template.code,
						entityId: ENTITY_ID$2,
						title: hasTitle ? template.translation?.TITLE : template.translation?.TEXT || template.code,
						subtitle: hasTitle ? template.translation?.TEXT || '' : null,
						avatar: '/bitrix/js/messageservice/message/editor/images/template.svg',
						avatarOptions: {
							bgColor: 'var(--ui-color-accent-soft-blue-3)'
						},
						selected: this.current?.code === template.code,
						tabs: ['recents']
					};
				});
			}
		},
		beforeUnmount() {
			this.dialog?.destroy();
			this.dialog = null;
		},
		methods: {
			toggleDialog() {
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$el,
					entities: [{
						id: ENTITY_ID$2,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 350,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					multiple: false,
					cacheable: false,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('notificationTemplates/setSelected', {
								code: event.getData().item.id
							});
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			}
		},
		template: `
		<Chip
			:icon="Outline.TEXT_FORMAT_BOTTOM"
			:dropdown="true"
			:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_TEMPLATES')"
			data-test-role="notification-template-selector"
			@click="toggleDialog"
		/>
	`
	};

	const ENTITY_ID$1 = 'messageservice-template';

	// @vue/component
	const TemplateSelector = {
		name: 'TemplateSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Template[] */
				templates: 'templates/listForChannel',
				/** @type ?Template */
				current: 'templates/current'
			}),
			dialogItems() {
				return this.templates.map(template => {
					return {
						id: template.ORIGINAL_ID,
						entityId: ENTITY_ID$1,
						title: template.TITLE,
						subtitle: template.PREVIEW,
						avatar: '/bitrix/js/messageservice/message/editor/images/template.svg',
						avatarOptions: {
							bgColor: 'var(--ui-color-accent-soft-blue-3)'
						},
						selected: this.current?.ORIGINAL_ID === template.ORIGINAL_ID,
						tabs: ['recents']
					};
				});
			},
			dialogFooter() {
				return [main_core.Tag.render`<span style="width: 100%;"></span>`, main_core.Tag.render`
					<span onclick="${this.showFeedbackForm}" class="ui-selector-footer-link">${this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_SUGGEST_TEMPLATE')}</span>
				`];
			}
		},
		methods: {
			toggleDialog() {
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$el,
					entities: [{
						id: ENTITY_ID$1,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 350,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					multiple: false,
					cacheable: false,
					footer: this.dialogFooter,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('templates/setTemplate', {
								templateOriginalId: event.getData().item.id
							});
							this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectTemplate();
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			},
			async showFeedbackForm() {
				this.$Bitrix.Data.get('locator').getAnalyticsService().onSuggestTemplate();
				const {
					Form
				} = await main_core.Runtime.loadExtension('ui.feedback.form');

				/** @see BX.UI.Feedback.Form.open */
				Form.open({
					id: 'b24_crm_timeline_whatsapp_template_suggest_form',
					forms: [{
						zones: ['ru', 'by', 'kz'],
						id: 758,
						lang: 'ru',
						sec: 'jyafqa'
					}, {
						zones: ['en'],
						id: 760,
						lang: 'en',
						sec: 'culzcq'
					}, {
						zones: ['de'],
						id: 764,
						lang: 'de',
						sec: '9h74xf'
					}, {
						zones: ['com.br'],
						id: 766,
						lang: 'com.br',
						sec: 'ddkhcc'
					}, {
						zones: ['es'],
						id: 762,
						lang: 'es',
						sec: '6ni833'
					}]
				});
			}
		},
		template: `
		<Chip 
			:icon="Outline.TEXT_FORMAT_BOTTOM"
			:dropdown="true"
			:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_TEMPLATES')"
			data-test-role="template-selector"
			@click="toggleDialog"
		/>
	`
	};

	const ENTITY_ID = 'messageservice-to';

	// @vue/component
	const ToSelector = {
		name: 'ToSelector',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				ChipDesign: ui_system_chip_vue.ChipDesign
			};
		},
		dialog: null,
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type ?To */
				to: 'to/current'
			}),
			...ui_vue3_vuex.mapState({
				toList: state => state.to.collection
			}),
			hasTos() {
				return main_core.Type.isArrayFilled(this.toList);
			},
			chipText() {
				if (!this.hasTos) {
					return this.$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_NO_RECEIVER');
				}
				return this.to.appearance.caption;
			},
			dialogItems() {
				return this.toList.map(to => {
					return {
						id: to.id,
						entityId: ENTITY_ID,
						title: to.appearance.title,
						subtitle: to.appearance.subtitle,
						avatar: to.appearance.avatar,
						selected: this.to?.id === to.id,
						tabs: ['recents']
					};
				});
			}
		},
		methods: {
			toggleDialog() {
				if (!this.hasTos) {
					return;
				}
				if (this.dialog) {
					this.dialog.hide();
					this.dialog = null;
					return;
				}
				this.dialog = new ui_entitySelector.Dialog({
					targetNode: this.$el,
					entities: [{
						id: ENTITY_ID,
						searchable: true
					}],
					items: this.dialogItems,
					width: 400,
					height: 300,
					enableSearch: true,
					hideOnSelect: true,
					autoHide: true,
					dropdownMode: true,
					multiple: false,
					cacheable: false,
					events: {
						'Item:onSelect': event => {
							this.$store.dispatch('to/setTo', {
								toId: event.getData().item.id
							});
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				});
				this.dialog.show();
			}
		},
		template: `
		<Chip
			:icon="Outline.PERSON"
			iconColor="var(--ui-color-accent-main-primary-alt)"
			iconBackground="var(--ui-color-accent-soft-blue-3)"
			:design="hasTos ? ChipDesign.Outline : ChipDesign.ShadowDisabled"
			:dropdown="true"
			:trimmable="true"
			:text="chipText"
			data-test-role="receiver-selector"
			@click="toggleDialog"
		/>
	`
	};

	// @vue/component
	const EditorHeader = {
		name: 'EditorHeader',
		components: {
			BButton: ui_vue3_components_button.Button,
			ChannelSelector,
			NotificationTemplateSelector,
			ToSelector,
			TemplateSelector
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current',
				hasMultipleNotificationTemplates: 'notificationTemplates/hasMultiple'
			}),
			...ui_vue3_vuex.mapState({
				/** @type {Layout} */
				layout: state => state.application.layout
			}),
			hasChannels() {
				return !main_core.Type.isNil(this.currentChannel);
			},
			isTemplatesSelectorShown() {
				// todo templates for custom text
				return Boolean(this.currentChannel?.isTemplatesBased);
			},
			isNotificationTemplateSelectorShown() {
				return this.currentChannel?.backend.senderCode === 'bitrix24' && this.hasMultipleNotificationTemplates;
			}
		},
		methods: {
			openConnectionsSlider() {
				this.$Bitrix.Data.get('locator').getAnalyticsService().onNoChannelsButtonClick();
				const event = new main_core_events.BaseEvent();
				this.$Bitrix.Data.get('locator').getEventEmitter().emit('onBeforeAddChannelOpen', event);
				if (event.isDefaultPrevented()) {
					return;
				}
				void openContactCenter().then(() => {
					this.$Bitrix.Data.get('locator').getEventEmitter().emit('onAfterAddChannelClose');
				});
			}
		},
		template: `
		<div class="messageservice-message-editor__header">
			<div class="messageservice-message-editor__header-left" data-role="header-left">
				<template v-if="layout.isChannelSelectorShown">
					<ChannelSelector v-if="hasChannels"/>
					<BButton
						v-else
						:style="AirButtonStyle.FILLED"
						:leftIcon="Outline.MESSAGES"
						:shimmer="true"
						:text="$Bitrix.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_BUTTON_NO_CHANNELS')"
						@click="openConnectionsSlider"
					/>
				</template>
				<ToSelector v-if="hasChannels && layout.isToSelectorShown"/>
			</div>
			<div class="messageservice-message-editor__header-right">
				<TemplateSelector v-if="isTemplatesSelectorShown"/>
				<NotificationTemplateSelector v-if="isNotificationTemplateSelectorShown"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const MessageEditor = {
		name: 'MessageEditor',
		components: {
			EditorHeader,
			ContentContainer,
			CustomMessageContent,
			TemplateMessageContent,
			NotificationMessageContent,
			EditorFooter,
			EditorAlert
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				/** @type Channel */
				currentChannel: 'channels/current'
			}),
			...ui_vue3_vuex.mapState({
				/** @type Layout */
				layout: state => state.application.layout
			}),
			contentComponent() {
				if (this.currentChannel?.backend.senderCode === 'bitrix24') {
					return 'NotificationMessageContent';
				}
				if (this.currentChannel?.isTemplatesBased) {
					return 'TemplateMessageContent';
				}
				return 'CustomMessageContent';
			},
			paddingStyle() {
				return {
					paddingTop: this.layout.paddingTop ?? this.layout.padding,
					paddingBottom: this.layout.paddingBottom ?? this.layout.padding,
					paddingLeft: this.layout.paddingLeft ?? this.layout.padding,
					paddingRight: this.layout.paddingRight ?? this.layout.padding
				};
			}
		},
		template: `
		<div class="messageservice-message-editor" data-test-role="messageservice-message-editor" :style="paddingStyle">
			<EditorHeader v-if="layout.isHeaderShown"/>
			<ContentContainer>
				<component :is="contentComponent"/>
			</ContentContainer>
			<EditorFooter v-if="layout.isFooterShown"/>
			<EditorAlert/>
		</div>
	`
	};

	class CopilotContentProvider extends ContentProvider {
		getMenuItems() {
			return [];
		}
	}

	class FilesContentProvider extends ContentProvider {
		#locator;
		constructor(serverData, locator) {
			super(serverData);
			this.#locator = locator;
		}
		getMenuItems(ctx) {
			if (this.getCustomData().isLocked) {
				return [{
					title: main_core.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE'),
					icon: ui_iconSet_api_vue.Outline.ATTACH,
					isLocked: true,
					onClick: async () => {
						const sliderCode = this.getCustomData().sliderCode;
						if (sliderCode) {
							const {
								FeaturePromotersRegistry
							} = await main_core.Runtime.loadExtension('ui.info-helper');
							FeaturePromotersRegistry.getPromoter({
								code: sliderCode
							}).show();
						}
					}
				}];
			}
			return [{
				title: main_core.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE'),
				icon: ui_iconSet_api_vue.Outline.ATTACH,
				subMenu: {
					items: [{
						id: 'uploadFile',
						title: main_core.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE_UPLOAD'),
						onClick: () => {
							this.#locator.getFileService().uploadNewFile(file => {
								ctx.insertText(`${file.name} ${file.externalLink}`);
								ctx.trackAction('file');
							});
						}
					}, {
						id: 'diskFile',
						title: main_core.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE_DISK'),
						onClick: () => {
							this.#locator.getFileService().pickFromDisk(file => {
								ctx.insertText(`${file.name} ${file.externalLink}`);
								ctx.trackAction('file');
							});
						}
					}]
				}
			}];
		}
	}

	class AnalyticsModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'analytics';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				analytics: {
					tool: this.getVariable('analytics.tool', 'messageservice'),
					c_section: this.getVariable('analytics.c_section', null),
					c_sub_section: this.getVariable('analytics.c_sub_section', null),
					p1: this.getVariable('analytics.p1', null)
				}
			};
		}
	}

	function makeFrozenClone(source) {
		return deepFreeze(main_core.Runtime.clone(source));
	}
	function deepFreeze(target) {
		if (main_core.Type.isObject(target)) {
			Object.values(target).forEach(value => {
				deepFreeze(value);
			});
			return Object.freeze(target);
		}
		return target;
	}

	class ApplicationModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'application';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				contentProviders: makeFrozenClone(this.getVariable('contentProviders', {})),
				promoBanners: makeFrozenClone(this.getVariable('promoBanners', null)),
				layout: makeFrozenClone(this.getVariable('layout', {
					isHeaderShown: true,
					isFooterShown: true,
					isSendButtonShown: true,
					isCancelButtonShown: true,
					isMessagePreviewShown: true,
					isContentProvidersShown: true,
					isEmojiButtonShown: true,
					isMessageLengthCounterShown: true,
					isToSelectorShown: true,
					isChannelSelectorShown: true,
					isMessageTextReadOnly: false,
					padding: 'var(--ui-space-inset-lg)'
				})),
				scene: makeFrozenClone(this.getVariable('scene', {
					id: ''
				})),
				progress: {
					isSending: false,
					isLoading: false,
					isLoadingTemplates: false
				},
				alert: {
					error: ''
				},
				messages: makeFrozenClone(this.getVariable('messages', {}))
			};
		}
		getGetters() {
			return {
				/** @function application/isProgress */
				isProgress: state => {
					for (const value of Object.values(state.progress)) {
						if (value) {
							return true;
						}
					}
					return false;
				}
			};
		}
		getActions() {
			return {
				/** @function application/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', makeFrozenClone(payload));
				},
				/** @function application/setProgress */
				setProgress: (store, payload) => {
					const filteredPayload = {};
					for (const key of Object.keys(payload)) {
						if (key in store.state.progress) {
							filteredPayload[key] = payload[key];
						}
					}
					for (const [key, value] of Object.entries(filteredPayload)) {
						if (!main_core.Type.isBoolean(value)) {
							this.#logger.warn(`setProgress: ${key} should be boolean`, {
								payload
							});
							return;
						}
					}
					store.commit('updateProgress', {
						progress: filteredPayload
					});
				},
				/** @function application/setAlert */
				setAlert: (store, payload) => {
					if (!main_core.Type.isString(payload.error)) {
						this.#logger.warn('setError: error should be string', {
							payload
						});
						return;
					}
					store.commit('actualizeState', {
						alert: {
							error: payload.error
						}
					});
				},
				resetAlert: store => {
					store.commit('actualizeState', {
						alert: {
							error: ''
						}
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				updateProgress: (state, payload) => {
					state.progress = {
						...state.progress,
						...payload.progress
					};
				}
			};
		}
	}

	class ChannelsModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'channels';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			const collection = this.getVariable('collection', []);
			deepFreeze(collection);
			return {
				collection,
				selected: {
					channelId: this.getVariable('selected.channelId'),
					fromId: this.getVariable('selected.fromId')
				}
			};
		}
		getGetters() {
			return {
				/** @function channels/canSendMessage */
				canSendMessage: state => {
					return state.collection.some(chan => chan.isConnected);
				},
				/** @function channels/current */
				current: (state, getters, rootState, rootGetters) => {
					const selected = state.collection.find(channel => channel.id === state.selected.channelId);
					if (selected) {
						return selected;
					}
					const firstId = rootGetters['preferences/firstVisibleChannelId'];
					return state.collection.find(chan => chan.id === firstId) || state.collection[0];
				},
				/** @function channels/from */
				from: (state, getters, rootState) => {
					const channel = getters.current;
					if (!channel) {
						return null;
					}
					const channelsLastUsedFrom = rootState.preferences.channelsLastUsedFrom;
					const channelId = channel.id;
					const lastUsed = channelsLastUsedFrom?.find(item => item.channelId === channelId);
					const fromId = state.selected.fromId ?? lastUsed?.fromId;
					return channel.fromList.find(from => from.id === fromId) || channel.fromList[0];
				}
			};
		}
		getActions() {
			return {
				/** @function channels/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', deepFreeze(payload));
				},
				/** @function channels/setChannel */
				setChannel: (store, payload) => {
					const {
						channelId
					} = payload;
					if (!main_core.Type.isStringFilled(channelId)) {
						this.#logger.warn('setChannel: channelId should be a string', {
							payload
						});
						return;
					}
					const channel = store.state.collection.find(ch => ch.id === channelId);
					if (!channel) {
						this.#logger.warn('setChannel: channel not found', {
							payload
						});
						return;
					}
					store.commit('updateSelected', {
						selected: {
							channelId
						}
					});
				},
				/** @function channels/setFrom */
				setFrom: (store, payload) => {
					const {
						fromId
					} = payload;
					if (!main_core.Type.isStringFilled(fromId)) {
						this.#logger.warn('setFrom: fromId should be a string', {
							payload
						});
						return;
					}
					const currentChannel = store.getters.current;
					const from = currentChannel.fromList.find(fc => fc.id === fromId);
					if (!from) {
						this.#logger.warn('setFrom: from not found', {
							payload
						});
						return;
					}
					store.commit('updateSelected', {
						selected: {
							fromId
						}
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				updateSelected: (state, payload) => {
					state.selected = {
						...state.selected,
						...payload.selected
					};
				}
			};
		}
	}

	class MessageModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'message';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				text: String(this.getVariable('text', '') ?? '')
			};
		}
		getGetters() {
			return {
				/** @function message/body */
				body: (state, getters, rootState, rootGetters) => {
					const channel = rootGetters['channels/current'];
					if (channel?.backend.senderCode === 'bitrix24') {
						return rootGetters['notificationTemplates/body'];
					}
					if (!channel?.isTemplatesBased) {
						return state.text.trim();
					}
					return rootGetters['templates/body'];
				},
				/** @function message/isReadyToSend */
				isReadyToSend: (state, getters, rootState, rootGetters) => {
					if (main_core.Type.isNil(rootGetters['channels/current']) || main_core.Type.isNil(rootGetters['channels/from']) || main_core.Type.isNil(rootGetters['to/current'])) {
						return false;
					}
					const channel = rootGetters['channels/current'];
					if (channel.backend.senderCode === 'bitrix24') {
						return main_core.Type.isStringFilled(rootGetters['notificationTemplates/current']?.code);
					}
					return main_core.Type.isStringFilled(getters.body);
				}
			};
		}
		getActions() {
			return {
				/** @function message/setText */
				setText: (store, payload) => {
					const {
						text
					} = payload;
					if (!main_core.Type.isString(text)) {
						this.#logger.warn('setText: text should be a string', {
							payload
						});
						return;
					}
					store.commit('setText', {
						text
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				setText: (state, payload) => {
					state.text = payload.text;
				}
			};
		}
	}

	class NotificationTemplatesModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'notificationTemplates';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				collection: makeFrozenClone(this.getVariable('collection', [])),
				selectedCode: null
			};
		}
		getGetters() {
			return {
				/** @function notificationTemplates/current */
				current: state => {
					if (state.collection.length === 0) {
						return null;
					}
					if (main_core.Type.isNil(state.selectedCode)) {
						return state.collection[0];
					}
					return state.collection.find(t => t.code === state.selectedCode) || state.collection[0];
				},
				/** @function notificationTemplates/body */
				body: (state, getters) => {
					const notificationTemplate = getters.current;
					let text = notificationTemplate?.translation?.TEXT || '';
					for (const placeholder of notificationTemplate?.placeholders || []) {
						if (!main_core.Type.isNil(placeholder.value)) {
							text = text.replace(`#${placeholder.name}#`, placeholder.value);
						} else if (!main_core.Type.isNil(placeholder.caption)) {
							text = text.replace(`#${placeholder.name}#`, placeholder.caption);
						}
					}
					return text;
				},
				/** @function notificationTemplates/hasMultiple */
				hasMultiple: state => {
					return state.collection.length > 1;
				}
			};
		}
		getActions() {
			return {
				/** @function notificationTemplates/setSelected */
				setSelected: (store, payload) => {
					const {
						code
					} = payload;
					if (!main_core.Type.isStringFilled(code)) {
						this.#logger.warn('setSelected: code should be a non-empty string', {
							payload
						});
						return;
					}
					const exists = store.state.collection.some(t => t.code === code);
					if (!exists) {
						this.#logger.warn('setSelected: template with given code not found', {
							payload
						});
						return;
					}
					store.commit('setSelected', {
						code
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				setSelected: (state, {
					code
				}) => {
					state.selectedCode = code;
				}
			};
		}
	}

	class PreferencesModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'preferences';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				channelsSort: main_core.Runtime.clone(this.getVariable('channelsSort', [])),
				channelsLastUsedFrom: main_core.Runtime.clone(this.getVariable('channelsLastUsedFrom', []))
			};
		}
		getGetters() {
			return {
				/** @function preferences/channelsSortOrDefault */
				channelsSortOrDefault: (state, getters, rootState) => {
					const savedSort = main_core.Runtime.clone(state.channelsSort ?? []);
					for (const channel of rootState.channels.collection) {
						if (!savedSort.some(x => x.channelId === channel.id)) {
							savedSort.unshift({
								channelId: channel.id,
								isHidden: false
							});
						}
					}
					return savedSort;
				},
				firstVisibleChannelId: (state, getters) => {
					const sort = getters.channelsSortOrDefault;
					const visible = sort.filter(position => !position.isHidden);
					if (main_core.Type.isArrayFilled(visible)) {
						return visible[0].channelId;
					}
					return null;
				}
			};
		}
		getActions() {
			return {
				/** @function preferences/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', main_core.Runtime.clone(payload));
				},
				/** @function preferences/setChannelsSort */
				setChannelsSort: (store, payload) => {
					const {
						channelsSort
					} = payload;
					if (!main_core.Type.isArray(channelsSort)) {
						this.#logger.warn('setChannelsSort: channelsSort should be an array', {
							payload
						});
						return;
					}
					const normalized = channelsSort.filter(position => main_core.Type.isPlainObject(position)).map(position => main_core.Runtime.clone(position));
					if (!main_core.Type.isArrayFilled(normalized)) {
						this.#logger.warn('setChannelsSort: channelsSort should contain at least one position', {
							payload
						});
						return;
					}
					store.commit('setChannelsSort', {
						channelsSort: normalized
					});
				},
				/** @function preferences/setChannelsLastUsedFrom */
				setChannelsLastUsedFrom: (store, payload) => {
					const {
						channelsLastUsedFrom
					} = payload;
					if (!main_core.Type.isArray(channelsLastUsedFrom)) {
						this.#logger.warn('setChannelsLastUsedFrom: channelsLastUsedFrom should be an array', {
							payload
						});
						return;
					}
					const normalized = channelsLastUsedFrom.filter(channelLastUsedFrom => main_core.Type.isPlainObject(channelLastUsedFrom) && main_core.Type.isString(channelLastUsedFrom?.fromId)).map(channelLastUsedFrom => main_core.Runtime.clone(channelLastUsedFrom));
					if (!main_core.Type.isArrayFilled(normalized)) {
						this.#logger.warn('setChannelsLastUsedFrom: channelsLastUsedFrom should contain at least one channelLastUsedFrom', {
							payload
						});
						return;
					}
					store.commit('setChannelsLastUsedFrom', {
						channelsLastUsedFrom: normalized
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				setChannelsSort: (state, {
					channelsSort
				}) => {
					state.channelsSort = channelsSort;
				},
				setChannelsLastUsedFrom: (state, {
					channelsLastUsedFrom
				}) => {
					state.channelsLastUsedFrom = channelsLastUsedFrom;
				}
			};
		}
	}

	const POSITION = 'PREVIEW';
	class TemplatesModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'templates';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			return {
				collection: {},
				selected: {}
			};
		}
		getGetters() {
			return {
				/** @function templates/listForChannel */
				listForChannel: (state, getters, rootState, rootGetters) => {
					const chan = rootGetters['channels/current'];
					if (!chan?.isTemplatesBased) {
						return [];
					}
					return state.collection[chan.id] ?? [];
				},
				/** @function templates/current */
				current: (state, getters, rootState, rootGetters) => {
					const list = getters.listForChannel;
					const templateOriginalId = state.selected[rootGetters['channels/current']?.id];
					if (main_core.Type.isNil(templateOriginalId)) {
						return list[0];
					}
					return list.find(template => template.ORIGINAL_ID === templateOriginalId) || list[0];
				},
				/** @function templates/body */
				body: (state, getters) => {
					const template = getters.current;
					if (!template) {
						return '';
					}

					// todo position
					// todo tight coupling with template editor
					return messageservice_template_editor.getPlainText(template.PREVIEW, template.PLACEHOLDERS?.PREVIEW ?? [], template.FILLED_PLACEHOLDERS ?? []);
				},
				shouldLoad: (state, getters, rootState, rootGetters) => {
					const chan = rootGetters['channels/current'];
					if (!chan || !chan.isTemplatesBased) {
						return false;
					}
					return !Object.hasOwn(state.collection, chan.id);
				}
			};
		}
		getActions() {
			return {
				/** @function templates/addTemplates */
				addTemplates: (store, payload) => {
					const {
						templates
					} = payload;
					if (!main_core.Type.isArray(templates)) {
						this.#logger.warn('addTemplates: templates should be a empty array', {
							payload
						});
						return;
					}
					store.commit('addTemplates', {
						channelId: store.rootGetters['channels/current']?.id,
						templates: main_core.Runtime.clone(templates)
					});
				},
				/** @function templates/setTemplate */
				setTemplate: (store, payload) => {
					const {
						templateOriginalId
					} = payload;
					if (!main_core.Type.isInteger(templateOriginalId) || templateOriginalId <= 0) {
						this.#logger.warn('setTemplate: templateOriginalId should be a positive int', {
							payload
						});
						return;
					}
					const chan = store.rootGetters['channels/current'];
					if (main_core.Type.isNil(chan)) {
						this.#logger.warn('setTemplate: no current channel');
						return;
					}
					if (!chan.isTemplatesBased) {
						this.#logger.warn('setTemplate: channel is not templates based', {
							payload
						});
						return;
					}
					store.commit('select', {
						channelId: chan.id,
						templateOriginalId
					});
				},
				/** @function templates/setFilledPlaceholder */
				setFilledPlaceholder: (store, payload) => {
					const {
						filledPlaceholder
					} = payload;
					if (!main_core.Type.isPlainObject(filledPlaceholder)) {
						this.#logger.warn('setFilledPlaceholder: filledPlaceholder should be a valid object', {
							payload
						});
						return;
					}
					const template = store.getters.current;
					if (!template) {
						this.#logger.warn('setFilledPlaceholder: current template is not set', {
							payload
						});
						return;
					}
					const isPlaceholderExists = template.PLACEHOLDERS[POSITION].includes(filledPlaceholder.PLACEHOLDER_ID);
					if (!isPlaceholderExists) {
						this.#logger.warn('setFilledPlaceholder: filledPlaceholder.PLACEHOLDER_ID references non-existent placeholder', {
							payload
						});
						return;
					}
					store.commit('upsertFilledPlaceholder', {
						channelId: store.rootGetters['channels/current']?.id,
						templateOriginalId: template.ORIGINAL_ID,
						filledPlaceholder: makeFrozenClone(filledPlaceholder)
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				addTemplates: (state, {
					channelId,
					templates
				}) => {
					state.collection[channelId] = templates;
				},
				select: (state, {
					channelId,
					templateOriginalId
				}) => {
					state.selected[channelId] = templateOriginalId;
				},
				upsertFilledPlaceholder: (state, {
					channelId,
					templateOriginalId,
					filledPlaceholder
				}) => {
					const templates = state.collection[channelId];
					const template = templates.find(t => t.ORIGINAL_ID === templateOriginalId);
					template.FILLED_PLACEHOLDERS ??= [];
					template.FILLED_PLACEHOLDERS = template.FILLED_PLACEHOLDERS.filter(fp => fp.PLACEHOLDER_ID !== filledPlaceholder.PLACEHOLDER_ID);
					template.FILLED_PLACEHOLDERS.push(filledPlaceholder);
				}
			};
		}
	}

	class ToModel extends ui_vue3_vuex.BuilderModel {
		#logger;
		getName() {
			return 'to';
		}
		setLogger(logger) {
			this.#logger = logger;
			return this;
		}
		getState() {
			const collection = makeFrozenClone(this.getVariable('collection', []));
			return {
				collection,
				selected: {
					toId: this.getVariable('selected.toId', collection[0]?.id)
				}
			};
		}
		getGetters() {
			return {
				/** @function to/current */
				current: state => {
					const selected = state.collection.find(to => to.id === state.selected.toId);
					if (selected) {
						return selected;
					}
					return state.collection[0];
				}
			};
		}
		getActions() {
			return {
				/** @function to/actualizeState */
				actualizeState: (store, payload) => {
					store.commit('actualizeState', makeFrozenClone(payload));
				},
				/** @function to/setTo */
				setTo: (store, payload) => {
					const {
						toId
					} = payload;
					if (!main_core.Type.isStringFilled(toId)) {
						this.#logger.warn('setTo: toId should be a string', {
							payload
						});
						return;
					}
					const to = store.state.collection.find(candidate => candidate.id === toId);
					if (!to) {
						this.#logger.warn('setTo: to not found', {
							payload
						});
						return;
					}
					store.commit('updateSelected', {
						selected: {
							toId
						}
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				actualizeState: (state, payload) => {
					for (const [key, value] of Object.entries(payload)) {
						if (key in state) {
							state[key] = value;
						}
					}
				},
				updateSelected: (state, payload) => {
					state.selected = {
						...state.selected,
						...payload.selected
					};
				}
			};
		}
	}

	class AlertService {
		#store;
		constructor(params) {
			this.#store = params.store;
		}
		showError(message = null) {
			void this.#store.dispatch('application/setAlert', {
				error: message || main_core.Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_GENERIC_ERROR')
			});
		}
	}

	class AnalyticsService {
		#store;
		constructor(params) {
			this.#store = params.store;
		}
		onRender() {
			this.#send({
				...this.#store.state.analytics.analytics,
				category: 'communication',
				event: 'view'
			});
		}
		onAddChannelClick() {
			this.#sendChannelConnect('menu_button');
		}
		onBannerConnectClick(id, connectStatus) {
			this.#sendChannelConnect('banner_button', id, connectStatus);
		}
		onNoChannelsButtonClick() {
			this.#sendChannelConnect('no_connection_button');
		}
		#sendChannelConnect(element, id = null, connectStatus = null) {
			const data = {
				...this.#store.state.analytics.analytics,
				category: 'communication',
				event: 'connect',
				type: 'channel',
				c_element: element
			};
			if (main_core.Type.isStringFilled(id)) {
				data.p2 = `channel_${this.#normalizeChannelId(id)}`;
			}
			if (main_core.Type.isStringFilled(connectStatus)) {
				data.p3 = `connectStatus_${connectStatus}`;
			}
			this.#send(data);
		}
		#normalizeChannelId(channelId) {
			return channelId.replaceAll('_', '-').replaceAll('~~~', '-');
		}
		onPreviewShow() {
			this.#sendEditorInteraction('preview');
		}
		onSelectTemplate() {
			this.#sendEditorInteraction('template_selector');
		}
		onSuggestTemplate() {
			this.#sendEditorInteraction('template_offer');
		}
		onSelectChannel() {
			this.#sendEditorInteraction('channel_selector');
		}
		onSaveChannelsSort() {
			this.#sendEditorInteraction('channel_list_change');
		}
		onContentProviderAction(element) {
			this.#sendEditorInteraction('element_add', element);
		}
		#sendEditorInteraction(element, addedElement) {
			const data = {
				...this.#store.state.analytics.analytics,
				category: 'communication',
				event: 'edit',
				type: 'message',
				c_element: element
			};
			const chanId = this.#store.getters['channels/current']?.id;
			if (main_core.Type.isStringFilled(chanId)) {
				data.p5 = `channel_${this.#normalizeChannelId(chanId)}`;
			}
			if (main_core.Type.isStringFilled(addedElement)) {
				data.p2 = `element_${addedElement}`;
			}
			this.#send(data);
		}
		onAddCopilot() {
			this.#send({
				...this.#store.state.analytics.analytics,
				category: 'communication',
				event: 'copilot',
				type: 'message'
			});
		}
		onSend() {
			const data = {
				...this.#store.state.analytics.analytics,
				category: 'communication',
				event: 'send',
				type: 'message'
			};
			if (this.#store.getters['channels/current']?.isTemplatesBased) {
				data.p3 = `template_${this.#store.getters['templates/current']?.ORIGINAL_ID}`;
			}
			const chanId = this.#store.getters['channels/current']?.id;
			if (main_core.Type.isStringFilled(chanId)) {
				data.p5 = `channel_${this.#normalizeChannelId(chanId)}`;
			}
			this.#send(data);
		}
		onCancel() {
			this.#send({
				...this.#store.state.analytics.analytics,
				category: 'communication',
				event: 'cancel',
				type: 'message'
			});
		}
		#send(data) {
			ui_analytics.sendData(this.#filterOutNilValues(data));
		}
		#filterOutNilValues(object) {
			const result = {};
			Object.entries(object).forEach(([key, value]) => {
				if (!main_core.Type.isNil(value)) {
					result[key] = value;
				}
			});
			return result;
		}
	}

	class FileService {
		#logger;
		#store;
		#uploader = null;
		#browseElement = null;
		#fileWatcher = null;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
		}

		/**
		 * @param onSuccess can be called multiple times if user selects multiple files
		 */
		uploadNewFile(onSuccess) {
			if (this.#store.getters['application/isProgress']) {
				this.#logger.warn('Cannot upload file while in progress');
				return;
			}
			this.#fileWatcher = onSuccess;
			void this.#openFileBrowser();
		}

		/**
		 * @param onSuccess can be called multiple times if user selects multiple files
		 */
		pickFromDisk(onSuccess) {
			if (this.#store.getters['application/isProgress']) {
				this.#logger.warn('Cannot pick file from disk while in progress');
				return;
			}
			this.#fileWatcher = onSuccess;
			void this.#openDiskFileDialog();
		}
		async #openFileBrowser() {
			if (this.#browseElement) {
				this.#browseElement.click();
				return;
			}
			const uploader = await this.#getUploader();
			this.#browseElement = document.createElement('div');
			uploader.assignBrowse(this.#browseElement);
			this.#browseElement.click();
		}
		async #openDiskFileDialog() {
			const uploader = await this.#getUploader();
			const {
				openDiskFileDialog
			} = await main_core.Runtime.loadExtension('disk.uploader.user-field-widget');
			openDiskFileDialog({
				dialogId: 'messageservice-message-editor',
				uploader
			});
		}
		#getUploader() {
			if (this.#uploader) {
				return Promise.resolve(this.#uploader);
			}
			return main_core.Runtime.loadExtension('ui.uploader.core').then(exports => {
				let linkLoadsCount = 0;

				/** @see { BX.UI.Uploader.Uploader } */
				this.#uploader = new exports.Uploader({
					controller: 'disk.uf.integration.diskUploaderController',
					multiple: true,
					events: {
						[exports.UploaderEvent.FILE_ADD_START]: () => {
							void this.#store.dispatch('application/setProgress', {
								isLoading: true
							});
						},
						[exports.UploaderEvent.FILE_ERROR]: event => {
							this.#logger.error('Failed to upload file', event.getData());
							if (linkLoadsCount <= 0 && !this.#isUploaderBusy(this.#uploader)) {
								void this.#store.dispatch('application/setProgress', {
									isLoading: false
								});
							}
						},
						// fires both on upload complete (from browser) and load complete (from disk dialog)
						[exports.UploaderEvent.FILE_COMPLETE]: event => {
							const file = event.getData().file;
							linkLoadsCount++;
							void this.#getExternalLink(file.getCustomData('fileId'))
							// eslint-disable-next-line promise/no-nesting
							.then(link => {
								this.#fileWatcher?.({
									name: file.getName(),
									externalLink: link
								});
							}).finally(() => {
								linkLoadsCount--;
								if (linkLoadsCount <= 0 && !this.#isUploaderBusy(this.#uploader)) {
									void this.#store.dispatch('application/setProgress', {
										isLoading: false
									});
								}
							});
						}
					}
				});
				return this.#uploader;
			}).catch(error => {
				this.#logger.error('Failed to load ui.uploader.core', error);
				throw error;
			});
		}
		#isUploaderBusy(uploader) {
			if (!main_core.Type.isFunction(uploader.getUploadingFileCount)) {
				// already destroyed

				return false;
			}
			if (uploader.getUploadingFileCount() > 0) {
				return true;
			}
			if (uploader.getPendingFileCount() > 0) {
				return true;
			}
			return uploader.getFiles().some(file => file.isLoading());
		}
		#getExternalLink(fileId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('disk.file.generateExternalLink', {
					data: {
						fileId
					}
				}).then(response => {
					if (main_core.Type.isStringFilled(response?.data?.externalLink?.link)) {
						resolve(response.data.externalLink.link);
					} else {
						reject(new Error('No external link in response'));
					}
				}).catch(error => {
					this.#logger.error('Failed to get external link', error);
					reject(error);
				});
			});
		}
	}

	const OPTIONS_CATEGORY = 'messageservice.message.editor';
	class PreferencesService {
		#store;
		constructor(params) {
			this.#store = params.store;
		}
		saveChannelLastUsedFrom(channel, fromId) {
			const channelsLastUsedFrom = main_core.Runtime.clone(this.#store.state.preferences.channelsLastUsedFrom);
			const index = channelsLastUsedFrom.findIndex(item => item.channelId === channel.id);
			if (index >= 0) {
				if (channelsLastUsedFrom[index].fromId === fromId) {
					return;
				}
				channelsLastUsedFrom[index].fromId = fromId;
			} else {
				channelsLastUsedFrom.push({
					channelId: channel.id,
					fromId
				});
			}
			this.saveChannelsLastUsedFrom(channelsLastUsedFrom);
		}
		saveChannelsLastUsedFrom(channelsLastUsedFrom) {
			void this.#store.dispatch('preferences/setChannelsLastUsedFrom', {
				channelsLastUsedFrom
			});
			this.#savePreferences();
		}
		saveChannelsSort(sort) {
			void this.#store.dispatch('preferences/setChannelsSort', {
				channelsSort: sort
			});
			this.#savePreferences();
		}
		#savePreferences() {
			const sceneId = this.#store.state.application.scene?.id;
			if (!main_core.Type.isStringFilled(sceneId)) {
				return;
			}
			for (const [key, value] of Object.entries(this.#store.state.preferences)) {
				BX.userOptions.save(OPTIONS_CATEGORY, sceneId, key, JSON.stringify(value));
			}
		}
	}

	class SendService {
		#logger;
		#store;
		#messageModel;
		#emitter;
		#analyticsService;
		#preferencesService;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
			this.#messageModel = params.messageModel;
			this.#emitter = params.eventEmitter;
			this.#analyticsService = params.analyticsService;
			this.#preferencesService = params.preferencesService;
		}
		sendMessage() {
			if (this.#store.getters['application/isProgress']) {
				this.#logger.warn('sendMessage: already in progress');
				return Promise.resolve();
			}
			void this.#store.dispatch('application/setProgress', {
				isSending: true
			});
			return this.#emitter.emitAsync('onSend').then(eventResults => {
				const successResult = eventResults.find(x => main_core.Type.isPlainObject(x) && x.status === 'success');
				if (successResult) {
					return;
				}
				const errorResult = eventResults.find(x => main_core.Type.isPlainObject(x) && x.status === 'error' && main_core.Type.isArrayFilled(x.errors));
				if (errorResult) {
					throw errorResult;
				}
				throw new Error('sendMessage: all handlers failed without specific errors');
			}).then(() => {
				this.#analyticsService.onSend();
				this.#messageModel.clearState();
				void this.#store.dispatch('application/resetAlert');
				this.#emitter.emit('onSendSuccess');
				const channel = this.#store.getters['channels/current'];
				const from = this.#store.getters['channels/from'];
				if (channel && from) {
					this.#preferencesService.saveChannelLastUsedFrom(channel, from.id);
				}
			}).catch(result => {
				this.#logger.error('sendMessage: error', {
					result
				});
				throw result;
			}).finally(() => {
				void this.#store.dispatch('application/setProgress', {
					isSending: false
				});
			});
		}
	}

	class TemplateService {
		#logger;
		#store;
		#emitter;
		constructor(params) {
			this.#logger = params.logger;
			this.#store = params.store;
			this.#emitter = params.eventEmitter;
		}
		loadTemplates() {
			if (!this.#shouldLoadTemplates()) {
				return Promise.resolve();
			}
			void this.#store.dispatch('application/setProgress', {
				isLoadingTemplates: true
			});
			const event = new main_core_events.BaseEvent();
			return this.#emitter.emitAsync('onLoadTemplates', event).then(eventResults => {
				if (event.isDefaultPrevented()) {
					return eventResults.find(x => main_core.Type.isPlainObject(x) && x.status === 'success' && main_core.Type.isArray(x.data.templates));
				}
				return this.#loadDefault();
			}).then(result => {
				if (result?.data?.templates) {
					void this.#store.dispatch('templates/addTemplates', {
						templates: result.data.templates
					});
				}
			}).catch(error => {
				this.#logger.error('Error while loading templates', {
					error
				});
				throw error;
			}).finally(() => {
				void this.#store.dispatch('application/setProgress', {
					isLoadingTemplates: false
				});
			});
		}
		#shouldLoadTemplates() {
			return this.#store.getters['templates/shouldLoad'];
		}
		#loadDefault() {
			const senderId = this.#store.getters['channels/current']?.backend?.id;
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('messageservice.Sender.getTemplates', {
					data: {
						id: senderId
					}
				}).then(resolve).catch(reject);
			});
		}
		createOrUpdatePlaceholder(filledPlaceholder) {
			this.#emitter.emit('Template:onUpdatePlaceholder', {
				filledPlaceholder
			});
		}
	}

	/**
	 * One instance of this class per editor instance. Some services can be shared between editors.
	 */
	class ServiceLocator {
		#services = new main_core.Cache.MemoryCache();
		#store = null;
		#messageModel = null;
		#emitter = null;
		setStore(store) {
			this.#store = store;
			return this;
		}
		setMessageModel(messageModel) {
			this.#messageModel = messageModel;
			return this;
		}
		getMessageModel() {
			return this.#messageModel;
		}
		setEventEmitter(emitter) {
			this.#emitter = emitter;
			return this;
		}
		getEventEmitter() {
			return this.#emitter;
		}
		getLogger() {
			return logger;
		}
		getSendService() {
			return this.#services.remember('sendService', () => {
				return new SendService({
					logger: this.getLogger(),
					store: this.#store,
					messageModel: this.getMessageModel(),
					eventEmitter: this.#emitter,
					analyticsService: this.getAnalyticsService(),
					preferencesService: this.getPreferencesService()
				});
			});
		}
		getAlertService() {
			return this.#services.remember('alertService', () => {
				return new AlertService({
					store: this.#store
				});
			});
		}
		getFileService() {
			return this.#services.remember('fileService', () => {
				return new FileService({
					logger: this.getLogger(),
					store: this.#store
				});
			});
		}
		getTemplateService() {
			return this.#services.remember('templateService', () => {
				return new TemplateService({
					logger: this.getLogger(),
					store: this.#store,
					eventEmitter: this.#emitter
				});
			});
		}
		getPreferencesService() {
			return this.#services.remember('preferencesService', () => {
				return new PreferencesService({
					store: this.#store
				});
			});
		}
		getAnalyticsService() {
			return this.#services.remember('analyticsService', () => {
				return new AnalyticsService({
					store: this.#store
				});
			});
		}
		getPlaceholderService() {
			return placeholderService;
		}
		getLexicalService() {
			return lexicalService;
		}
		getProviderFactory() {
			return this.#services.remember('providerFactory', () => {
				return new ContentProviderFactory();
			});
		}
		destroy() {
			if (this.#services.has('providerFactory')) {
				this.#services.get('providerFactory').destroy();
			}
			this.#services = null;
		}
	}

	class StateExporter {
		#store;
		#emitter;
		#unwatches = [];
		#emitStateChangeDebounced = null;
		constructor({
			store,
			eventEmitter
		}) {
			this.#store = store;
			this.#emitter = eventEmitter;
			this.#bindEvents();
		}
		#bindEvents() {
			this.#watchChannel();
			this.#watchFrom();
			this.#watchTo();
			this.#watchMessageBody();
			this.#watchTemplate();
			this.#watchNotificationTemplate();
		}
		#watchChannel() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['channels/current'], (newValue, oldValue) => {
				if (newValue?.id !== oldValue?.id) {
					this.#emitOnStateChange();
					this.#emit('onChannelChange', {
						channel: newValue,
						oldChannel: oldValue
					});
				}
			}));
		}
		#watchFrom() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['channels/from'], (newValue, oldValue) => {
				if (newValue?.id !== oldValue?.id) {
					this.#emitOnStateChange();
					this.#emit('onFromChange', {
						from: newValue,
						oldFrom: oldValue
					});
				}
			}));
		}
		#watchTo() {
			const emit = (newValue, oldValue) => {
				this.#emitOnStateChange();
				this.#emit('onToChange', {
					to: newValue,
					oldTo: oldValue
				});
			};
			this.#unwatches.push(this.#store.watch((state, getters) => getters['to/current'], (newValue, oldValue) => {
				if (!newValue && oldValue) {
					emit(newValue, oldValue);
				}
				if (newValue && !oldValue) {
					emit(newValue, oldValue);
				}
				if (newValue && oldValue && !this.#isSameTo(newValue, oldValue)) {
					emit(newValue, oldValue);
				}
			}));
		}
		#isSameTo(a, b) {
			if (!a && !b) {
				return true;
			}
			if (!a || !b) {
				return false;
			}
			return a.id === b.id && a.value === b.value;
		}
		#watchMessageBody() {
			let lastNewValue = null;
			let lastOldValue = null;
			const throttledWatcher = main_core.Runtime.throttle(() => {
				if (lastNewValue !== lastOldValue) {
					this.#emitOnStateChange();
					this.#emit('onMessageBodyChange', {
						body: lastNewValue,
						oldBody: lastOldValue
					});
				}
			}, 200);
			this.#unwatches.push(this.#store.watch((state, getters) => getters['message/body'], (newValue, oldValue) => {
				// noinspection ReuseOfLocalVariableJS
				lastNewValue = newValue;
				// noinspection ReuseOfLocalVariableJS
				lastOldValue = oldValue;
				throttledWatcher();
			}));
		}
		#watchTemplate() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['templates/current'], (newValue, oldValue) => {
				if (newValue?.ORIGINAL_ID !== oldValue?.ORIGINAL_ID) {
					this.#emitOnStateChange();
					this.#emit('onTemplateChange', {
						// clone mutable data to avoid external mutations
						template: main_core.Runtime.clone(newValue),
						oldTemplate: main_core.Runtime.clone(oldValue)
					});
				}
			}));
		}
		#watchNotificationTemplate() {
			this.#unwatches.push(this.#store.watch((state, getters) => getters['notificationTemplates/current'], (newValue, oldValue) => {
				if (newValue?.code !== oldValue?.code) {
					this.#emitOnStateChange();
					this.#emit('onNotificationTemplateChange', {
						notificationTemplate: newValue,
						oldNotificationTemplate: oldValue
					});
				}
			}));
		}
		#emitOnStateChange() {
			// on channel change there usually from, to, template and message body changes
			// fire only one event in such cases
			this.#emitStateChangeDebounced ??= main_core.Runtime.debounce(() => {
				this.#emit('onStateChange');
			}, 25);
			this.#emitStateChangeDebounced();
		}
		#emit(eventName, eventData = {}) {
			this.#emitter.emit(eventName, eventData);
		}
		destroy() {
			this.#unwatches.forEach(unwatch => unwatch());
			this.#unwatches = null;
			this.#emitter = null;
			main_core.Runtime.destroy(this);
		}
		getState() {
			const state = {
				channel: this.#store.getters['channels/current'],
				from: this.#store.getters['channels/from'],
				to: this.#store.getters['to/current'],
				message: {
					body: this.#store.getters['message/body']
				}
			};
			const chan = this.#store.getters['channels/current'];
			if (chan?.backend.senderCode === 'bitrix24') {
				state.notificationTemplate = this.#store.getters['notificationTemplates/current'];
			} else if (chan?.isTemplatesBased) {
				// clone mutable data to avoid external mutations
				state.template = main_core.Runtime.clone(this.#store.getters['templates/current']);
			}
			return state;
		}
	}

	// to avoid skeleton flickering for fast loads
	const SKELETON_SHOW_DELAY = 200;

	/**
	 * @memberOf BX.MessageService.Message.Editor
	 *
	 * @emits BX.MessageService.Message.Editor:onBeforeRender
	 * @emits BX.MessageService.Message.Editor:onSend
	 * @emits BX.MessageService.Message.Editor:onSendSuccess
	 * @emits BX.MessageService.Message.Editor:onCancel
	 * @emits BX.MessageService.Message.Editor:onChannelChange
	 * @emits BX.MessageService.Message.Editor:onFromChange
	 * @emits BX.MessageService.Message.Editor:onToChange
	 * @emits BX.MessageService.Message.Editor:onMessageBodyChange
	 * @emits BX.MessageService.Message.Editor:onTemplateChange
	 * @emits BX.MessageService.Message.Editor:onNotificationTemplateChange
	 * @emits BX.MessageService.Message.Editor:onStateChange
	 */
	class Editor extends main_core_events.EventEmitter {
		#options;
		#skeleton = null;
		#locator = null;
		#store = null;
		#app = null;
		#rootComponent = null;
		#stateExporter = null;
		constructor(options) {
			super();
			this.setEventNamespace('BX.MessageService.Message.Editor');
			this.#options = options;
			this.#locator = new ServiceLocator();
			this.subscribeFromOptions(this.#options.events ?? {});
		}

		/**
		 * Export current editor state.
		 */
		getState() {
			return this.#stateExporter?.getState() ?? null;
		}

		/**
		 * WARNING! Don't modify the element, don't style.
		 * You can only use it for popup binding.
		 *
		 * Returns null if not rendered.
		 */
		getContainer() {
			return this.#rootComponent?.$el ?? null;
		}

		/**
		 * WARNING! Don't modify the element, don't style.
		 * You can only use it for popup binding.
		 *
		 * Returns null if not rendered.
		 */
		getContentContainer() {
			return this.getContainer()?.querySelector('[data-role="content-container"]') ?? null;
		}
		getOptions() {
			return this.#options;
		}

		/**
		 * Actualize options. Please note that not all options can be changed after the editor was created.
		 */
		setOptions(options) {
			const overrideKeys = new Set(['channels', 'toList', 'promoBanners', 'contentProviders', 'preferences']);
			for (const [key, value] of Object.entries(options)) {
				if (overrideKeys.has(key)) {
					this.#options[key] = value;
				}
			}
			void this.#store?.dispatch('application/actualizeState', {
				contentProviders: this.#options.contentProviders,
				promoBanners: this.#options.promoBanners
			});
			void this.#store?.dispatch('channels/actualizeState', {
				collection: this.#options.channels
			});
			void this.#store?.dispatch('to/actualizeState', {
				collection: this.#options.toList
			});
			void this.#store?.dispatch('preferences/actualizeState', {
				channelsSort: this.#options.preferences?.channelsSort
			});
			return this;
		}
		setLoading(isLoading) {
			void this.#store?.dispatch('application/setProgress', {
				isLoading
			});
			return this;
		}
		setChannel(id) {
			void this.#store?.dispatch('channels/setChannel', {
				channelId: id
			});
			return this;
		}
		setFrom(id) {
			void this.#store?.dispatch('channels/setFrom', {
				fromId: id
			});
			return this;
		}
		setTo(toId) {
			void this.#store?.dispatch('to/setTo', {
				toId
			});
			return this;
		}
		setMessageText(text) {
			void this.#store?.dispatch('message/setText', {
				text
			});
			return this;
		}
		setTemplate(templateOriginalId) {
			void this.#store?.dispatch('templates/setTemplate', {
				templateOriginalId
			});
			return this;
		}
		setFilledPlaceholder(filledPlaceholder) {
			void this.#store?.dispatch('templates/setFilledPlaceholder', {
				filledPlaceholder
			});
			return this;
		}
		setNotificationTemplate(code) {
			void this.#store?.dispatch('notificationTemplates/setSelected', {
				code
			});
			return this;
		}
		setError(error) {
			void this.#store?.dispatch('application/setAlert', {
				error
			});
			return this;
		}
		resetAlert() {
			void this.#store?.dispatch('application/resetAlert');
			return this;
		}
		getProviderFactory() {
			return this.#locator.getProviderFactory();
		}
		async render() {
			const target = main_core.Type.isElementNode(this.#options.renderTo) ? this.#options.renderTo : document.querySelector(this.#options.renderTo);
			if (main_core.Type.isNil(target)) {
				throw new TypeError(`Render container "${this.#options.renderTo}" not found`);
			}
			const skeletonTimeoutId = setTimeout(() => {
				main_core.Dom.clean(target);
				this.#skeleton ??= new messageservice_message_editor_skeleton.Skeleton({
					layout: this.#options.layout
				});
				this.#skeleton.renderTo(target);
			}, SKELETON_SHOW_DELAY);

			// options can be changed in onBeforeRender handlers
			await this.emitAsync('onBeforeRender');
			this.#locator.setEventEmitter(this);

			// Built-in content provider resolvers — all registered together
			const factory = this.#locator.getProviderFactory();
			factory.registerResolver('copilot', data => new CopilotContentProvider(data));
			factory.registerResolver('files', data => new FilesContentProvider(data, this.#locator));
			const locator = this.#locator;
			this.#app = ui_vue3.BitrixVue.createApp({
				name: 'MessageServiceMessageEditor',
				components: {
					MessageEditor
				},
				beforeCreate() {
					this.$bitrix.Data.set('locator', locator);
				},
				template: '<MessageEditor/>'
			});
			const {
				store,
				models: {
					messageModel
				}
			} = await this.#buildStore();
			this.#store = store;
			this.#locator.setStore(store);
			this.#stateExporter = new StateExporter({
				store,
				eventEmitter: this
			});
			this.#locator.setMessageModel(messageModel);
			this.#app.use(store);
			clearTimeout(skeletonTimeoutId);
			main_core.Dom.clean(target);
			this.#rootComponent = this.#app.mount(target);
			this.#locator.getAnalyticsService().onRender();
		}
		async #buildStore() {
			const messageModel = MessageModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				text: this.#options.message.text ?? ''
			});
			const {
				store
			} = await ui_vue3_vuex.Builder.init().addModel(ApplicationModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				contentProviders: this.#options.contentProviders,
				promoBanners: this.#options.promoBanners,
				layout: this.#options.layout,
				scene: this.#options.scene,
				messages: this.#options.messages
			})).addModel(ChannelsModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				collection: this.#options.channels
			})).addModel(ToModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				collection: this.#options.toList
			})).addModel(messageModel).addModel(TemplatesModel.create().useDatabase(false).setLogger(this.#locator.getLogger())).addModel(NotificationTemplatesModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				collection: this.#options.notificationTemplates
			})).addModel(PreferencesModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				channelsSort: this.#options.preferences?.channelsSort
			})).addModel(AnalyticsModel.create().useDatabase(false).setLogger(this.#locator.getLogger()).setVariables({
				analytics: this.#options.analytics
			})).build();
			return {
				store,
				models: {
					messageModel
				}
			};
		}
		destroy() {
			this.#app?.unmount();
			this.#app = null;
			this.#rootComponent?.$Bitrix?.eventEmitter?.unsubscribeAll();
			this.#rootComponent = null;
			this.#stateExporter?.destroy();
			this.#stateExporter = null;
			this.unsubscribeAll();
			this.#locator?.destroy();
			this.#locator = null;
			this.#store = null;
			main_core.Runtime.destroy(this);
		}
	}

	exports.ContentProvider = ContentProvider;
	exports.Editor = Editor;
	exports.replaceCustomMessagePlaceholders = replaceCustomMessagePlaceholders;

})(this.BX.MessageService.Message.Editor = this.BX.MessageService.Message.Editor || {}, window, window, BX, BX.Event, BX.Vue3, BX.Vue3.Vuex, BX.MessageService.Message.Editor.Skeleton, BX.UI.TextEditor, BX.UI.Lexical.Core, BX.UI.BBCode, BX.UI.Lexical.Clipboard, BX.UI.IconSet, BX.Vue3.Components, BX.UI.System.Typography.Vue, BX.MessageService.Template.Editor, BX.Vue3.Directives, BX.UI.System.Skeleton.Vue, BX.UI, BX.UI.EntitySelector, window, window, BX.MessageService.Channel.Selector, BX.UI.System.Chip.Vue, BX.UI.Analytics);
//# sourceMappingURL=editor.bundle.js.map
