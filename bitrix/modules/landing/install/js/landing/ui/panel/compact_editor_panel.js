;(function() {
	"use strict";

	BX.namespace("BX.Landing.UI.Panel");


	/**
	 * Implements compact editor actions panel with a reduced set of base buttons.
	 * Implements singleton pattern.
	 *
	 * Not use as constructor
	 *
	 * @extends {BX.Landing.UI.Panel.EditorPanel}
	 *
	 * @constructor
	 */
	BX.Landing.UI.Panel.CompactEditorPanel = function()
	{
		BX.Landing.UI.Panel.EditorPanel.apply(this, arguments);
		this.layout.classList.add("landing-ui-panel-compact-editor");
	};


	/**
	 * Stores instance of BX.Landing.UI.Panel.CompactEditorPanel
	 * @static
	 * @type {?BX.Landing.UI.Panel.CompactEditorPanel}
	 */
	BX.Landing.UI.Panel.CompactEditorPanel.instance = null;


	/**
	 * Gets instance on BX.Landing.UI.Panel.CompactEditorPanel
	 * @static
	 * @return {BX.Landing.UI.Panel.CompactEditorPanel}
	 */
	BX.Landing.UI.Panel.CompactEditorPanel.getInstance = function()
	{
		if (!BX.Landing.UI.Panel.CompactEditorPanel.instance)
		{
			BX.Landing.UI.Panel.CompactEditorPanel.instance = new BX.Landing.UI.Panel.CompactEditorPanel();
			BX.Landing.UI.Panel.CompactEditorPanel.instance.init();
		}

		return BX.Landing.UI.Panel.CompactEditorPanel.instance;
	};


	/**
	 * Makes a format button expose its toggle state to assistive technologies:
	 * mirrors activate()/deactivate() (css class sync in adjustButtonsState)
	 * into the aria-pressed attribute.
	 * @param {BX.Landing.UI.Button.EditorAction} button
	 * @return {BX.Landing.UI.Button.EditorAction}
	 */
	function makeToggleButton(button)
	{
		button.layout.setAttribute("aria-pressed", "false");

		var originalActivate = button.activate.bind(button);
		var originalDeactivate = button.deactivate.bind(button);

		button.activate = function() {
			originalActivate();
			button.layout.setAttribute("aria-pressed", "true");
		};

		button.deactivate = function() {
			originalDeactivate();
			button.layout.setAttribute("aria-pressed", "false");
		};

		return button;
	}


	/**
	 * Wires the WAI-ARIA toolbar keyboard pattern for the compact panel: a single
	 * tab stop (roving tabindex) plus Arrow/Home/End navigation between buttons.
	 * The buttons stay native <button> elements, so activation (Enter/Space) is
	 * handled by the browser; this only moves focus horizontally within the group.
	 * @param {BX.Landing.UI.Panel.CompactEditorPanel} panel
	 */
	function setupToolbarKeyboardNav(panel)
	{
		var items = [];
		panel.buttons.forEach(function(button) {
			if (button && button.layout)
			{
				items.push(button.layout);
			}
		});

		if (items.length === 0)
		{
			return;
		}

		items.forEach(function(item, index) {
			item.setAttribute("tabindex", index === 0 ? "0" : "-1");
		});

		function focusItem(index)
		{
			var target = items[(index + items.length) % items.length];
			items.forEach(function(item) {
				item.setAttribute("tabindex", item === target ? "0" : "-1");
			});
			target.focus();
		}

		BX.bind(panel.layout, "keydown", function(event) {
			var current = items.indexOf(event.target);
			if (current === -1)
			{
				return;
			}

			switch (event.key)
			{
				case "ArrowRight":
				case "ArrowDown":
					event.preventDefault();
					focusItem(current + 1);
					break;
				case "ArrowLeft":
				case "ArrowUp":
					event.preventDefault();
					focusItem(current - 1);
					break;
				case "Home":
					event.preventDefault();
					focusItem(0);
					break;
				case "End":
					event.preventDefault();
					focusItem(items.length - 1);
					break;
			}
		});
	}


	/**
	 * Resolves the nearest ancestor <a> for the given DOM node, or null.
	 * @param {?Node} node
	 * @return {?HTMLAnchorElement}
	 */
	function closestAnchor(node)
	{
		var element = (node && node.nodeType === Node.ELEMENT_NODE)
			? node
			: (node ? node.parentElement : null);

		return element ? element.closest("a") : null;
	}


	/**
	 * Finds the real <a> in the DOM that the current selection/caret sits in or
	 * wraps, checking several boundary points of the range and selection. Every
	 * candidate is a live DOM node (via closestAnchor), so the result is safe to
	 * use both for reading href and for positioning (getBoundingClientRect).
	 * @param {?Range} range
	 * @param {?Selection} selection
	 * @return {?HTMLAnchorElement}
	 */
	function findDomSelectionLink(range, selection)
	{
		return closestAnchor(range ? range.commonAncestorContainer : null)
			|| closestAnchor(range ? range.startContainer : null)
			|| closestAnchor(range ? range.endContainer : null)
			|| (selection ? closestAnchor(selection.anchorNode) : null)
			|| (selection ? closestAnchor(selection.focusNode) : null);
	}


	/**
	 * Finds the existing <a> that the current selection/caret sits in or wraps.
	 * First tries the live DOM boundary points (findDomSelectionLink); falls back
	 * to an <a> contained inside the range (selection whose boundaries sit on
	 * element edges around the link). The cloneContents fallback is only valid
	 * for reading href (prefill), NOT for positioning: the clone is detached from
	 * the document and has no layout box.
	 * @param {?Range} range
	 * @param {?Selection} selection
	 * @return {?HTMLAnchorElement}
	 */
	function findSelectionLink(range, selection)
	{
		var link = findDomSelectionLink(range, selection);
		if (link)
		{
			return link;
		}

		if (range && typeof range.cloneContents === "function")
		{
			var fragment = range.cloneContents();
			var innerLink = fragment.querySelector ? fragment.querySelector("a[href]") : null;
			if (innerLink)
			{
				return innerLink; // clone: valid for reading href (prefill), not for positioning
			}
		}

		return null;
	}


	/**
	 * Resolves a stable DOM element to anchor the SimpleLinkPanel next to.
	 * SimpleLinkPanel requires a DOM node (Type.isDomNode) and reads its
	 * getBoundingClientRect, so a range/rect is not enough. Prefer the existing
	 * link element (real DOM node only), then the closest element of the
	 * selection start, and finally the currently edited element.
	 * @param {?Range} range
	 * @param {BX.Landing.UI.Panel.CompactEditorPanel} editor
	 * @param {?Selection} selection
	 * @return {?HTMLElement}
	 */
	function resolveLinkAnchorEl(range, editor, selection)
	{
		var existingLink = findDomSelectionLink(range, selection);
		if (existingLink)
		{
			return existingLink;
		}

		if (range)
		{
			var startNode = range.startContainer;
			var startElement = (startNode && startNode.nodeType === Node.ELEMENT_NODE)
				? startNode
				: (startNode ? startNode.parentElement : null);

			if (startElement)
			{
				return startElement;
			}
		}

		return editor.currentElement || null;
	}


	/**
	 * Detects whether the given href points outside of the current site and thus
	 * must be opened in a new tab. Internal targets (block/page anchors, hash
	 * anchors, relative paths) stay in the same tab. Kept identical to
	 * Link.isExternalHref in landing.node.link (separate build contexts, so the
	 * duplication is intentional).
	 * @param {string} url
	 * @return {boolean}
	 */
	function isExternalHref(url)
	{
		var value = String(url || "").trim();

		if (value === "")
		{
			return false;
		}

		if (/^(#|block:|page:)/i.test(value)) // internal anchors / block / page links
		{
			return false;
		}

		if (/^(\.?\/)/.test(value)) // relative paths: /… ./…
		{
			return false;
		}

		if (/^(https?:)?\/\//i.test(value)) // http(s):// or protocol-relative //
		{
			return true;
		}

		if (/^(mailto:|tel:|ftp:|callto:)/i.test(value))
		{
			return true;
		}

		if (/^[a-z][a-z0-9+.-]*:/i.test(value)) // any other explicit protocol
		{
			return true;
		}

		return true; // bare domain / anything else — treat as external
	}


	/**
	 * Rejects hrefs whose scheme can execute code in the editor (DOM-XSS):
	 * javascript:, data:, vbscript:, file:. Everything else is safe — http(s),
	 * mailto:, tel:, #anchors, relative paths, schemeless values. The url is
	 * lowercased, stripped of leading/trailing whitespace and control chars
	 * (defeats `java\tscript:` obfuscation) before matching the scheme. Kept
	 * identical to Link.isSafeHref in landing.node.link (separate build
	 * contexts, so the duplication is intentional).
	 * @param {string} url
	 * @return {boolean}
	 */
	function isSafeHref(url)
	{
		var value = String(url || "").trim().replace(/[\x00-\x20]/g, "");
		var match = value.match(/^([a-z][a-z0-9+.-]*):/i);
		var scheme = match ? match[1].toLowerCase() : "";

		return ["javascript", "data", "vbscript", "file"].indexOf(scheme) === -1;
	}


	/**
	 * Decodes HTML-entities in a value using a detached DOM element in the given
	 * document. Mirrors the browser's own href decoding, so isSafeHref can be
	 * applied to the effective (decoded) URL as well as the raw one.
	 * @param {Document} doc
	 * @param {string} value
	 * @return {string}
	 */
	function decodeHtmlEntities(doc, value)
	{
		var el = doc.createElement("textarea");
		el.innerHTML = String(value == null ? "" : value);
		return el.value;
	}


	/**
	 * Opens the SimpleLinkPanel for the current text selection and writes the
	 * result back into the editable content via document.execCommand.
	 * Used instead of BX.Landing.UI.Button.CreateLink (which opens the full
	 * Panel.Link) to keep AI-site link editing lightweight.
	 * @param {BX.Landing.UI.Panel.CompactEditorPanel} editor
	 */
	function openSimpleLinkPanel(editor)
	{
		var selection = editor.contextWindow.getSelection();
		var range = (selection && selection.rangeCount > 0)
			? selection.getRangeAt(0)
			: null;

		var anchorEl = resolveLinkAnchorEl(range, editor, selection);
		if (!anchorEl)
		{
			return;
		}

		// The selection can be lost while the panel input takes focus, so it is
		// captured here and restored right before execCommand.
		var savedRange = range ? range.cloneRange() : null;

		var existingLink = findSelectionLink(range, selection);
		var href = existingLink ? (existingLink.getAttribute("href") || "") : "";

		var restoreSelection = function() {
			if (!savedRange)
			{
				return;
			}

			var currentSelection = editor.contextWindow.getSelection();
			if (currentSelection)
			{
				currentSelection.removeAllRanges();
				currentSelection.addRange(savedRange);
			}
		};

		BX.Landing.UI.Panel.SimpleLinkPanel.getInstance().show(anchorEl, {
			href: href,
			onSave: function(url) {
				restoreSelection();

				// The browser decodes HTML-entities in href on click, so an
				// entity-obfuscated scheme (e.g. "java&#115;cript:") passes the
				// raw isSafeHref check yet still resolves to a dangerous URL. Check
				// both the raw value and its entity-decoded form (mirrors the double
				// check in landing.node.link).
				var doc = editor.contextDocument || document;

				// An unsafe scheme (javascript:/data:/vbscript:/file:) must never
				// become an <a href>: fall back to unlink instead of createLink so
				// no dangerous link node is produced.
				if (!isSafeHref(url) || !isSafeHref(decodeHtmlEntities(doc, url)))
				{
					editor.contextDocument.execCommand("unlink");
					editor.adjustButtonsState();
					return;
				}

				editor.contextDocument.execCommand("createLink", false, url);

				var createdLink = closestAnchor(
					editor.contextWindow.getSelection().anchorNode
				);
				if (createdLink)
				{
					if (isExternalHref(url))
					{
						createdLink.setAttribute("target", "_blank");
						createdLink.setAttribute("rel", "noopener noreferrer");
					}
					else
					{
						createdLink.setAttribute("target", "_self");
						createdLink.removeAttribute("rel");
					}
				}

				editor.adjustButtonsState();
			},
			onRemove: function() {
				restoreSelection();
				editor.contextDocument.execCommand("unlink");
				editor.adjustButtonsState();
			}
		});
	}


	/**
	 * Resolves the active copilot element picker. Returns null when the
	 * extension is not loaded or its option is disabled, so callers can
	 * skip rendering AI controls entirely.
	 * @return {?BX.Landing.Copilot.ElementPicker}
	 */
	function resolveElementPicker()
	{
		var picker = BX.Landing.Copilot && BX.Landing.Copilot.ElementPicker;

		return (picker && picker.isEnabled()) ? picker.getInstance() : null;
	}


	/**
	 * Register compact set of editor actions: bold, italic, underline,
	 * strikeThrough, createLink, AI element select (when the picker is active)
	 * @param {BX.Landing.UI.Panel.CompactEditorPanel} editor
	 */
	function registerCompactActions(editor)
	{
		// Format buttons run the same document.execCommand as the classic editor.
		// EditorAction's default click handler targets the button's own
		// contextDocument, which is unreliable for the compact panel, so it is
		// replaced with one that runs the command on the panel's contextDocument
		// (the edited node's document) and refreshes the toggle state. This is what
		// actually applies B/I/U/S formatting, mirroring the classic editor panel.
		function addFormatButton(command, iconClass, modifier, title, testId)
		{
			var button = makeToggleButton(new BX.Landing.UI.Button.EditorAction(command, {
				html: "<span class=\"ui-icon-set " + iconClass + "\"></span>",
				className: ["landing-ui-button-compact-editor-action", modifier],
				attrs: {title: title, "data-testid": testId}
			}));

			BX.unbind(button.layout, "click", BX.proxy(button.onClick, button));
			BX.bind(button.layout, "click", function(event) {
				event.preventDefault();
				event.stopPropagation();
				(editor.contextDocument || document).execCommand(command);
				editor.adjustButtonsState();
				BX.Landing.UI.Tool.ColorPicker.hideAll();
			});

			editor.addButton(button);
		}

		addFormatButton("bold", "--o-bold", "--bold", BX.Landing.Loc.getMessage("LANDING_TITLE_OF_EDITOR_ACTION_BOLD"), "landing-compact-editor-bold-btn");
		addFormatButton("italic", "--o-italic", "--italic", BX.Landing.Loc.getMessage("LANDING_TITLE_OF_EDITOR_ACTION_ITALIC"), "landing-compact-editor-italic-btn");
		addFormatButton("underline", "--o-underline", "--underline", BX.Landing.Loc.getMessage("LANDING_TITLE_OF_EDITOR_ACTION_UNDERLINE"), "landing-compact-editor-underline-btn");
		addFormatButton("strikeThrough", "--o-strikethrough", "--strike", BX.Landing.Loc.getMessage("LANDING_TITLE_OF_EDITOR_ACTION_STRIKE"), "landing-compact-editor-strike-btn");

		var linkButton = new BX.Landing.UI.Button.EditorAction("createLink", {
			html: "<span class=\"ui-icon-set --o-link\"></span>",
			className: ["landing-ui-button-compact-editor-action", "--link"],
			attrs: {
				title: BX.Landing.Loc.getMessage("LANDING_TITLE_OF_EDITOR_ACTION_CREATE_LINK"),
				"data-testid": "landing-compact-editor-link-btn"
			}
		});

		// EditorAction.init() binds its default handler (execCommand(this.id))
		// on click. For "createLink" that would create a link with no URL, so
		// the default is removed and replaced with the SimpleLinkPanel handler.
		// BX.proxy caches the delegate per (context, method), so the same proxy
		// bound in init() is returned here and can be unbound.
		BX.unbind(linkButton.layout, "click", BX.proxy(linkButton.onClick, linkButton));
		BX.bind(linkButton.layout, "click", function(event) {
			event.preventDefault();
			event.stopPropagation();
			openSimpleLinkPanel(editor);
		});

		editor.addButton(linkButton);

		// The bitrix-gpt (AI) button is registered only when the copilot element
		// picker is available and enabled: with the option off the panel keeps
		// no trace of it. Clicking the button never edits content - it only
		// toggles the AI selection of the currently edited text node.
		var picker = resolveElementPicker();
		if (picker)
		{
			var aiButton = new BX.Landing.UI.Button.EditorAction("aiElementSelect", {
				html: "<span class=\"ui-icon-set --bitrix-gpt\"></span>",
				className: ["landing-ui-button-compact-editor-action", "--ai"],
				attrs: {
					title: BX.Landing.Loc.getMessage("LANDING_TITLE_OF_EDITOR_ACTION_AI_TEXT"),
					"data-testid": "landing-compact-editor-ai-btn"
				}
			});

			// The default EditorAction handler would run
			// execCommand("aiElementSelect"), so it is replaced (see the
			// createLink button above for the BX.proxy unbind mechanics).
			BX.unbind(aiButton.layout, "click", BX.proxy(aiButton.onClick, aiButton));
			BX.bind(aiButton.layout, "click", function(event) {
				event.preventDefault();
				event.stopPropagation();

				var currentNode = BX.Landing.Node.Text.currentNode;
				if (currentNode)
				{
					picker.toggleSelection(currentNode);
				}
			});

			editor.addButton(aiButton);
		}
	}


	BX.Landing.UI.Panel.CompactEditorPanel.prototype = {
		constructor: BX.Landing.UI.Panel.CompactEditorPanel,
		__proto__: BX.Landing.UI.Panel.EditorPanel.prototype,

		/**
		 * Method for separate init actions from object create.
		 * Appends layout to the same document as the original EditorPanel:
		 * the outOfFrame ? parent : current document branching intentionally
		 * duplicates the private appendToBody(editor) from editor_panel.js
		 * (it is scoped inside that file's IIFE and is not reachable from
		 * here), so the inherited adjustAbsolutePosition math (parent window
		 * viewport + scroll) is applied in the right document.
		 * Unlike the base EditorPanel init flow, makeDraggable(this) is
		 * intentionally NOT called: the compact panel is not draggable.
		 */
		init: function()
		{
			registerCompactActions(this);

			this.layout.setAttribute("role", "toolbar");
			this.layout.setAttribute(
				"aria-label",
				BX.Landing.Loc.getMessage("LANDING_COMPACT_EDITOR_PANEL_LABEL")
			);
			setupToolbarKeyboardNav(this);

			if (this.outOfFrame)
			{
				window.parent.document.body.appendChild(this.layout);
			}
			else
			{
				window.document.body.appendChild(this.layout);
			}

			this.rect = this.layout.getBoundingClientRect();
		},

		/**
		 * Refreshes the active (pressed) state of the B/I/U/S toggle buttons.
		 *
		 * Overrides the inherited EditorPanel.adjustButtonsState, which derives the
		 * state from getComputedStyle(getSelectedElement()).font-weight etc. That
		 * shared logic reads the *computed* style of the selection's parent element,
		 * so text inside an element that is bold/italic by default (a heading, a
		 * <b>, a CSS-styled block) always reports bold=true - the button stays lit
		 * even right after the user removes the formatting.
		 *
		 * queryCommandState reflects the actual command toggle on the current
		 * selection and flips correctly after execCommand, which is exactly what a
		 * toolbar toggle needs. Scoped to the compact panel only; the classic panel
		 * keeps its getFormat-based logic untouched. Link has no toggle state here
		 * (matching the classic panel, which also does not light the link button).
		 */
		adjustButtonsState: function()
		{
			var doc = this.contextDocument || document;
			var buttons = this.buttons;

			requestAnimationFrame(function() {
				["bold", "italic", "underline", "strikeThrough"].forEach(function(command) {
					var button = buttons.get(command);
					if (!button)
					{
						return;
					}

					var active = false;
					try
					{
						active = doc.queryCommandState(command);
					}
					catch (e)
					{
						active = false;
					}

					button[active ? "activate" : "deactivate"]();
				});
			});
		}
	}
})();
