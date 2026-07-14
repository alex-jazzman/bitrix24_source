/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
(function (exports, main_core, landing_loc, landing_env, landing_main, landing_backend, landing_menu_menuitem, landing_ui_form_menuform, landing_ui_panel_stylepanel) {
	'use strict';

	function buildTree(root, selector, parent = null, depth = 0) {
		return [...root.querySelectorAll(selector)].filter(element => {
			return element.parentElement.closest(selector) === parent;
		}).map(element => {
			const newDepth = depth + 1;
			return {
				layout: element,
				children: buildTree(element, selector, element, newDepth),
				depth
			};
		});
	}

	function makeFlatTree(tree, acc = []) {
		tree.forEach(item => {
			acc.push(item);
			makeFlatTree(item.children, acc);
		});
		return acc;
	}

	function getNodeClass(type) {
		if (type === 'link') {
			return BX.Landing.Node.Link;
		}
		if (type === 'img') {
			return BX.Landing.Node.Img;
		}
		if (type === 'icon') {
			return BX.Landing.Node.Icon;
		}
		if (type === 'embed') {
			return BX.Landing.Node.Embed;
		}
		if (type === 'map') {
			return BX.Landing.Node.Map;
		}
		if (type === 'component') {
			return BX.Landing.Node.Component;
		}
		return BX.Landing.Node.Text;
	}

	/**
	 * @memberOf BX.Landing.Menu
	 */
	class Menu extends main_core.Event.EventEmitter {
		static prefetchLandingsPromise = null;

		/**
		 * Prefetches all site landings into Backend cache before menu forms are built.
		 * Deduplicates concurrent calls within the same editor session.
		 */
		static prefetchLandings() {
			if (Menu.prefetchLandingsPromise !== null) {
				return Menu.prefetchLandingsPromise;
			}
			Menu.prefetchLandingsPromise = landing_backend.Backend.getInstance().getLandings({
				siteId: landing_env.Env.getInstance().getSiteId()
			}).then(() => {}).catch(error => {
				Menu.prefetchLandingsPromise = null;
				throw error;
			});
			return Menu.prefetchLandingsPromise;
		}
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.Landing.Menu.Menu');
			this.code = options.code;
			this.root = options.root;
			this.block = options.block;
			this.manifest = Object.freeze({
				...options.manifest
			});
			this.cache = new main_core.Cache.MemoryCache();
			if (landing_env.Env.getInstance().getType() === 'KNOWLEDGE' || landing_env.Env.getInstance().getType() === 'GROUP') {
				if (main_core.Dom.hasClass(this.root.nextElementSibling, 'landing-menu-add')) {
					main_core.Dom.remove(this.root.nextElementSibling);
				}
				main_core.Dom.addClass(this.root, 'landing-menu-root-list');
				main_core.Dom.insertAfter(this.getAddPageLayout(), this.root);
			}
			main_core.Event.bind(this.root, 'click', event => {
				if (!landing_ui_panel_stylepanel.StylePanel.getInstance().isShown() && event.target.nodeName === 'A') {
					event.preventDefault();
					let href = main_core.Dom.attr(event.target, 'href');
					const hrefPagePrefix = 'page:';
					if (href.startsWith(hrefPagePrefix)) {
						href = href.replace(hrefPagePrefix, '');
					}
					if (href.startsWith('#landing')) {
						const pageId = main_core.Text.toNumber(href.replace('#landing', ''));
						this.reloadPage(pageId);
					}
				}
			});
		}
		createMenuItem(options) {
			const nodes = new BX.Landing.Collection.NodeCollection();
			Object.entries(this.manifest.nodes).forEach(([code, nodeManifest]) => {
				const nodeElements = [...options.layout.querySelectorAll(code)].filter(nodeElement => {
					const elementParent = nodeElement.closest(this.manifest.item);
					return elementParent === options.layout;
				});
				if (nodeElements.length > 0) {
					const NodeClass = getNodeClass(nodeManifest.type);
					nodeElements.forEach(nodeElement => {
						nodes.push(new NodeClass({
							node: nodeElement,
							manifest: {
								...nodeManifest,
								allowInlineEdit: false,
								menuMode: true
							}
						}));
					});
				}
			});
			return new landing_menu_menuitem.MenuItem({
				layout: options.layout,
				children: options.children.map((itemOptions, index) => {
					return this.createMenuItem({
						...itemOptions,
						index
					});
				}),
				selector: `${this.manifest.item}@${options.index}`,
				depth: options.depth,
				nodes
			});
		}
		getTree() {
			const {
				item
			} = this.manifest;
			return buildTree(this.root, item).map((options, index) => this.createMenuItem({
				...options,
				index
			}));
		}
		getFlatTree() {
			return makeFlatTree(this.getTree());
		}
		getForm() {
			return new landing_ui_form_menuform.MenuForm({
				title: landing_loc.Loc.getMessage('LANDING_MENU_TITLE'),
				type: 'menu',
				code: this.code,
				forms: this.getFlatTree().map(item => {
					return item.getForm();
				})
			});
		}
		getAddPageButton() {
			return this.cache.remember('addPageButton', () => {
				return main_core.Tag.render`
				<button 
					class="ui-btn ui-btn-light-border ui-btn-icon-add ui-btn-round landing-ui-menu-add-button"
					onclick="${this.onAddPageButtonClick.bind(this)}"
					>
					${landing_loc.Loc.getMessage('LANDING_MENU_CREATE_NEW_PAGE')}
				</button>
			`;
			});
		}
		onAddPageTextInputKeydown(event) {
			if (event.keyCode === 13) {
				this.addPage();
			}
		}
		addPage() {
			const input = this.getAddPageInput();
			const {
				value
			} = input;
			input.value = '';
			input.focus();
			if (main_core.Type.isStringFilled(value)) {
				const code = BX.translit(value, {
					change_case: 'L',
					replace_space: '-',
					replace_other: ''
				});
				const backend = landing_backend.Backend.getInstance();
				backend.createPage({
					title: value,
					menuCode: this.code,
					blockId: this.block,
					code
				}).then(id => {
					const li = this.createLi({
						text: value,
						href: `#landing${id}`,
						target: '_self',
						children: []
					});
					main_core.Dom.append(li, this.root);
					main_core.Dom.remove(this.getAddPageField());
					main_core.Dom.removeClass(this.root, 'landing-menu-root-list-with-field');
					main_core.Dom.removeClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
					this.reloadPage(id);
				});
			}
		}

		// eslint-disable-next-line class-methods-use-this
		reloadPage(id) {
			const main = landing_main.Main.getInstance();
			const url = landing_env.Env.getInstance().getLandingEditorUrl({
				landing: id
			});
			void main.reloadSlider(url);
		}
		getAddPageInput() {
			return this.cache.remember('addPageTextInput', () => {
				return main_core.Tag.render`
				<input 
					type="text" 
					class="landing-menu-add-field-input"
					placeholder="${landing_loc.Loc.getMessage('LANDING_MENU_CREATE_NEW_PAGE')}"
					onkeydown="${this.onAddPageTextInputKeydown.bind(this)}"
					>
			`;
			});
		}
		onAddPageInputCloseButtonClick(event) {
			event.preventDefault();
			const input = this.getAddPageInput();
			input.value = '';
			main_core.Dom.removeClass(this.root, 'landing-menu-root-list-with-field');
			main_core.Dom.removeClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
			main_core.Dom.remove(this.getAddPageField());
			main_core.Dom.append(this.getAddPageButton(), this.getAddPageLayout());
		}
		getAddPageInputCloseButton() {
			return this.cache.remember('addPageInputCloseButton', () => {
				return main_core.Tag.render`
				<span 
					class="landing-menu-add-field-close"
					onclick="${this.onAddPageInputCloseButtonClick.bind(this)}"
					title="${landing_loc.Loc.getMessage('LANDING_MENU_CLOSE_BUTTON_LABEL')}"
					>
				</span>
			`;
			});
		}
		getAddPageInputApplyButton() {
			return this.cache.remember('addPageInputApplyButton', () => {
				return main_core.Tag.render`
				<span 
					class="landing-menu-add-field-apply"
					onclick="${this.onAddPageInputApplyButtonClick.bind(this)}"
					title="${landing_loc.Loc.getMessage('LANDING_MENU_APPLY_BUTTON_LABEL')}"
					>
				</span>
			`;
			});
		}
		onAddPageInputApplyButtonClick(event) {
			event.preventDefault();
			this.addPage();
		}
		getAddPageField() {
			return this.cache.remember('addPageInput', () => {
				return main_core.Tag.render`
				<div class="landing-menu-add-field">
					${this.getAddPageInput()}
					${this.getAddPageInputApplyButton()}
					${this.getAddPageInputCloseButton()}
				</div>
			`;
			});
		}
		getAddPageLayout() {
			return this.cache.remember('addPageLayout', () => {
				return main_core.Tag.render`
				<div class="landing-menu-add">
					${this.getAddPageButton()}
				</div>
			`;
			});
		}
		onAddPageButtonClick(event) {
			event.preventDefault();
			main_core.Dom.addClass(this.root, 'landing-menu-root-list-with-field');
			main_core.Dom.addClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
			main_core.Dom.prepend(this.getAddPageField(), this.getAddPageLayout());
			main_core.Dom.remove(this.getAddPageButton());
			this.getAddPageInput().focus();
		}
		createList(items, type = 'root') {
			const {
				ulClassName
			} = this.manifest[type];
			return main_core.Tag.render`
			<ul class="${ulClassName}">${items.map(item => this.createLi(item, type))}</ul>
		`;
		}
		createA(item, type = 'root') {
			const {
				aClassName
			} = this.manifest[type];
			return main_core.Tag.render`
			<a class="${aClassName}" href="${item.href}" target="${item.target}">${main_core.Text.encode(item.text)}</a>
		`;
		}
		createLi(item, type = 'root') {
			const {
				liClassName
			} = this.manifest[type];
			return main_core.Tag.render`
			<li class="${liClassName}">
				${this.createA(item, type)}
				${item.children ? this.createList(item.children, 'children') : undefined}
			</li>
		`;
		}
		rebuild(items) {
			const newList = this.createList(items);
			main_core.Dom.replace(this.root, newList);
			this.root = newList;
		}
	}

	exports.Menu = Menu;

})(this.BX.Landing.Menu = this.BX.Landing.Menu || {}, BX, BX.Landing, BX.Landing, BX.Landing, BX.Landing, BX.Landing.Menu, BX.Landing.UI.Form, BX.Landing.UI.Panel);
//# sourceMappingURL=menu.bundle.js.map
