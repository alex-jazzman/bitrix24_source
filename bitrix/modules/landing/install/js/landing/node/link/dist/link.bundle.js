/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, landing_node_base, main_core) {
	'use strict';

	const trim = BX.Landing.Utils.trim;
	const isPlainObject = BX.Landing.Utils.isPlainObject;
	const isString = BX.Landing.Utils.isString;
	const textToPlaceholders = BX.Landing.Utils.textToPlaceholders;
	const create = BX.Landing.Utils.create;
	const escapeText = BX.Landing.Utils.escapeText;
	const decodeDataValue = BX.Landing.Utils.decodeDataValue;
	class Link extends landing_node_base.Base {
		constructor(options) {
			super(options);
			this.type = 'link';
			if (!this.isGrouped()) {
				main_core.Event.bind(this.node, 'click', this.onClick.bind(this));
			}
			if (this.isAllowInlineEdit()) {
				main_core.Dom.attr(this.node, 'title', BX.Landing.Loc.getMessage('LANDING_TITLE_OF_LINK_NODE'));
			}
			this.onChange = BX.Runtime.debounce(this.onChange, 500);
			this.onContentUpdate = BX.Runtime.debounce(this.onContentUpdate, 500);
		}
		onContentUpdate() {
			BX.Landing.History.getInstance().push();
			this.getField().setValue(this.getValue());
		}
		isMenuMode() {
			return this.manifest.menuMode === true;
		}

		/**
		 * Handles click event
		 * @param {MouseEvent} event
		 */
		onClick(event) {
			event.preventDefault();
			if (!this.isMenuMode()) {
				event.stopPropagation();
			}
			if (this.isAllowInlineEdit()) {
				if (!BX.Landing.UI.Panel.StylePanel.getInstance().isShown()) {
					if (!BX.Landing.Env.getInstance().isBlockControlsEnabled()) {
						const options = {
							href: this.getValue().href,
							onSave: url => this.setValue(this.getSimpleLinkValue(url)),
							onRemove: () => this.setValue(this.getSimpleLinkValue('#'))
						};

						// AI select button appears only when the copilot element
						// picker is available and enabled: without the handler the
						// panel keeps no trace of it. The click only toggles the AI
						// selection of this node and never writes the href.
						const picker = getElementPicker();
						if (picker) {
							options.onAiSelect = () => picker.toggleSelection(this);
						}
						BX.Landing.UI.Panel.SimpleLinkPanel.getInstance().show(this.node, options);
					} else {
						BX.Landing.UI.Panel.Link.getInstance().show(this);
					}
				}
			}
		}

		/**
		 * Detects whether the given href points outside of the current site and thus
		 * must be opened in a new tab. Internal targets (block/page anchors, hash
		 * anchors, relative paths) stay in the same tab.
		 * @param {string} href
		 * @return {boolean}
		 */
		isExternalHref(href) {
			const value = String(href || '').trim();
			if (value === '') {
				return false;
			}
			if (/^(#|block:|page:)/i.test(value))
				// internal anchors / block / page links
				{
					return false;
				}
			if (/^(\.?\/)/.test(value))
				// relative paths: /… ./…
				{
					return false;
				}
			if (/^(https?:)?\/\//i.test(value))
				// http(s):// or protocol-relative //
				{
					return true;
				}
			if (/^(mailto:|tel:|ftp:|callto:)/i.test(value)) {
				return true;
			}
			if (/^[a-z][a-z0-9+.-]*:/i.test(value))
				// any other explicit protocol
				{
					return true;
				}
			return true; // bare domain / anything else — treat as external
		}

		/**
		 * Rejects hrefs whose scheme can execute code in the editor (DOM-XSS):
		 * javascript:, data:, vbscript:, file:. Everything else is safe — http(s),
		 * mailto:, tel:, #anchors, relative paths, schemeless values. The href is
		 * lowercased, stripped of leading/trailing whitespace and control chars
		 * (defeats `java\tscript:` obfuscation) before matching the scheme.
		 * @param {string} href
		 * @return {boolean}
		 */
		isSafeHref(href) {
			// eslint-disable-next-line no-control-regex
			const value = String(href || '').trim().replace(/[\x00-\x20]/g, '');
			const scheme = (value.match(/^([a-z][a-z0-9+.-]*):/i) || [, ''])[1].toLowerCase();
			return ['javascript', 'data', 'vbscript', 'file'].indexOf(scheme) === -1;
		}

		/**
		 * Builds node value for the simple link panel (AI sites). External links are
		 * opened in a new tab with rel="noopener noreferrer"; internal links stay in
		 * the same tab and must not carry the rel attribute (it is dropped if a
		 * previous _blank save had set it). An unsafe scheme (see isSafeHref) is
		 * treated as link removal: href '#', same tab, rel dropped.
		 * @param {string} href
		 * @return {{text: string, href: string|*, target: string|*}}
		 */
		getSimpleLinkValue(href) {
			// decodeDataValue (applied on write in setAttrValue) can reveal an unsafe
			// scheme hidden behind html-entities, so both the raw input and the
			// decoded value are checked before the href is written.
			if (!this.isSafeHref(href) || !this.isSafeHref(decodeDataValue(href))) {
				href = '#';
			}
			const value = this.getValue();
			const external = this.isExternalHref(href);
			value.href = href;
			value.target = external ? '_blank' : '_self';
			const attrs = {
				...(value.attrs || {})
			};
			delete attrs.rel;
			if (external) {
				attrs.rel = 'noopener noreferrer';
			} else {
				// setAttrValue skips keys absent from attrs, so a bare delete would
				// leave a stale rel in the DOM; rel: null makes Dom.attr remove it.
				attrs.rel = null;
			}
			value.attrs = attrs;
			return value;
		}

		/**
		 * Sets node value
		 * @param data
		 * @param {?boolean} [preventSave = false]
		 * @param {?boolean} [preventHistory = false]
		 */
		setValue(data, preventSave, preventHistory) {
			this.startValue = this.startValue || this.getValue();
			this.preventSave(preventSave);
			if (!this.containsImage() && this.isAllowInlineEdit()) {
				const field = this.getField(true).hrefInput;
				if (isString(data.text) && data.text.includes('{{name}}')) {
					field.getPlaceholderData(data.href).then(placeholdersData => {
						this.node.innerHTML = data.text.replace(/{{name}}/, `<span data-placeholder="name">${placeholdersData.name}</span>`);
					}).catch(() => {});
				} else if (!this.getField().containsHtml() && !this.manifest.skipContent) {
					this.node.innerHTML = escapeText(data.text);
				}
			}
			this.setAttrValue(data);
			this.onChange(preventHistory);
			if (!preventHistory) {
				this.onContentUpdate();
			}
		}
		setAttrValue(data) {
			main_core.Dom.attr(this.node, 'href', decodeDataValue(data.href));
			main_core.Dom.attr(this.node, 'target', escapeText(data.target));
			if ('attrs' in data) {
				Object.keys(data.attrs).forEach(attr => {
					if (Object.prototype.hasOwnProperty.call(data.attrs, attr)) {
						main_core.Dom.attr(this.node, attr, data.attrs[attr]);
					}
				});
			} else {
				main_core.Dom.attr(this.node, 'data-url', null);
				main_core.Dom.attr(this.node, 'data-embed', null);
			}
		}

		/**
		 * Checks that this node contains image node
		 * @return {boolean}
		 */
		containsImage() {
			return Boolean(this.node.firstElementChild) && this.node.firstElementChild.tagName === 'IMG';
		}

		/**
		 * Gets node value
		 * @return {{text: string, href: string|*, target: string|*}}
		 */
		getValue() {
			const value = {
				text: textToPlaceholders(trim(this.node.innerHTML)),
				href: trim(this.node.getAttribute('href')),
				target: trim(this.node.getAttribute('target') || '_self')
			};
			if (this.node.getAttribute('data-url')) {
				value.attrs = {
					'data-url': trim(this.node.getAttribute('data-url'))
				};
			}
			if (this.node.getAttribute('data-dynamic')) {
				if (!isPlainObject(value.attrs)) {
					value.attrs = {};
				}
				value.attrs['data-dynamic'] = this.node.getAttribute('data-dynamic');
			}
			if (this.manifest.skipContent) {
				value.skipContent = true;
				delete value.text;
			}
			if (value.href && value.href.startsWith('selectActions:')) {
				value.href = '#';
			}
			return value;
		}

		/**
		 * Gets field
		 * @param {boolean} preventAdjustValue
		 * @return {BX.Landing.UI.Field.BaseField}
		 */
		getField(preventAdjustValue) {
			const value = this.getValue();
			value.text = textToPlaceholders(create('div', {
				html: value.text
			}).innerHTML);
			if (!this.field) {
				const allowedTypes = [BX.Landing.UI.Field.LinkUrl.TYPE_BLOCK, BX.Landing.UI.Field.LinkUrl.TYPE_PAGE, BX.Landing.UI.Field.LinkUrl.TYPE_CRM_FORM, BX.Landing.UI.Field.LinkUrl.TYPE_CRM_PHONE];
				if (BX.Landing.Main.getInstance().options.params.type === BX.Landing.Main.TYPE_STORE) {
					allowedTypes.push(BX.Landing.UI.Field.LinkUrl.TYPE_CATALOG);
				}
				if (BX.Landing.Main.getInstance().options.features.includes('diskFile')) {
					allowedTypes.push(BX.Landing.UI.Field.LinkUrl.TYPE_DISK_FILE);
				}
				this.field = new BX.Landing.UI.Field.Link({
					title: this.manifest.name,
					selector: this.selector,
					skipContent: this.manifest.skipContent,
					content: value,
					options: {
						siteId: BX.Landing.Main.getInstance().options.site_id,
						landingId: BX.Landing.Main.getInstance().id
					},
					allowedTypes
				});
			} else if (!preventAdjustValue) {
				this.field.setValue(value);
				this.field.content = value;
				this.field.hrefInput.content = value.href;
				this.field.hrefInput.makeDisplayedHrefValue();
				this.field.hrefInput.setHrefTypeSwitcherValue(this.field.hrefInput.getHrefStringType());
				this.field.hrefInput.removeHrefTypeFromHrefString();
			}
			return this.field;
		}
	}
	BX.Landing.Node.Link = Link;

	/**
	 * Resolves the active copilot element picker. Returns null when the extension
	 * is not loaded or its option is disabled, so AI controls are not rendered.
	 * @return {?BX.Landing.Copilot.ElementPicker}
	 */
	function getElementPicker() {
		const picker = BX.Landing.Copilot && BX.Landing.Copilot.ElementPicker;
		return picker && picker.isEnabled() ? picker.getInstance() : null;
	}

	exports.Link = Link;

})(this.BX.Landing.Node = this.BX.Landing.Node || {}, BX.Landing.Node, BX);
//# sourceMappingURL=link.bundle.js.map
