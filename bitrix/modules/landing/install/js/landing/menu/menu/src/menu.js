import {Event, Cache, Tag, Dom, Type, Text} from 'main.core';
import {Loc} from 'landing.loc';
import {Env} from 'landing.env';
import {Main} from 'landing.main';
import {Backend} from 'landing.backend';
import {MenuItem} from 'landing.menu.menuitem';
import {MenuForm} from 'landing.ui.form.menuform';
import {StylePanel} from 'landing.ui.panel.stylepanel';
import {A11y} from 'landing.ui.a11y';
import buildTree from './build-tree';
import makeFlatTree from './make-flat-tree';
import getNodeClass from './get-node-class';
import decorateTreeSemantics from './decorate-tree';
import createTreeFocusNavigator from './get-tree-focusable';

import './css/style.css';

/**
 * @memberOf BX.Landing.Menu
 */
export class Menu extends Event.EventEmitter
{
	static prefetchLandingsPromise = null;

	/**
	 * Prefetches all site landings into Backend cache before menu forms are built.
	 * Deduplicates concurrent calls within the same editor session.
	 * block.js calls this statically before getEditForms() for blocks with menu nodes,
	 * so this method must ship together with block.js (see ticket 247221/250505).
	 */
	static prefetchLandings(): Promise<void>
	{
		if (Menu.prefetchLandingsPromise !== null)
		{
			return Menu.prefetchLandingsPromise;
		}

		Menu.prefetchLandingsPromise = Backend
			.getInstance()
			.getLandings({siteId: Env.getInstance().getSiteId()})
			.then(() => {})
			.catch((error) => {
				Menu.prefetchLandingsPromise = null;
				throw error;
			});

		return Menu.prefetchLandingsPromise;
	}

	constructor(options = {})
	{
		super(options);
		this.setEventNamespace('BX.Landing.Menu.Menu');

		this.code = options.code;
		this.root = options.root;
		this.block = options.block;
		this.manifest = Object.freeze({...options.manifest});
		this.cache = new Cache.MemoryCache();

		if (
			Env.getInstance().getType() === 'KNOWLEDGE'
			|| Env.getInstance().getType() === 'GROUP'
		)
		{
			if (Dom.hasClass(this.root.nextElementSibling, 'landing-menu-add'))
			{
				Dom.remove(this.root.nextElementSibling);
			}

			Dom.addClass(this.root, 'landing-menu-root-list');
			Dom.insertAfter(this.getAddPageLayout(), this.root);
		}

		decorateTreeSemantics(this.root);

		this.focusZone = null;
		this.setupTreeFocusZone();

		Event.bind(this.root, 'click', (event: MouseEvent) => {
			if (
				!StylePanel.getInstance().isShown()
				&& event.target.nodeName === 'A'
			)
			{
				event.preventDefault();
				let href = Dom.attr(event.target, 'href');
				const hrefPagePrefix = 'page:';
				if (href.startsWith(hrefPagePrefix))
				{
					href = href.replace(hrefPagePrefix, '');
				}
				if (href.startsWith('#landing'))
				{
					const pageId = Text.toNumber(href.replace('#landing', ''));
					this.reloadPage(pageId);
				}
			}
		});
	}

	setupTreeFocusZone(): void
	{
		const root = this.root;
		A11y.load()
			.then(({FocusZone}) => {
				if (root !== this.root)
				{
					return;
				}
				if (this.focusZone)
				{
					this.focusZone.deactivate();
				}
				this.focusZone = new FocusZone(root, {
					getNextFocusable: createTreeFocusNavigator(),
					focusInStrategy: 'first',
				});
				this.focusZone.activate();
			})
			.catch(() => {});
	}

	createMenuItem(options): MenuItem
	{
		const nodes = new BX.Landing.Collection.NodeCollection();

		Object.entries(this.manifest.nodes).forEach(([code, nodeManifest]) => {
			const nodeElements = [
				...options.layout.querySelectorAll(code),
			].filter((nodeElement) => {
				const elementParent = nodeElement.closest(this.manifest.item);
				return elementParent === options.layout;
			});

			if (nodeElements.length > 0)
			{
				const NodeClass = getNodeClass(nodeManifest.type);

				nodeElements.forEach((nodeElement) => {
					nodes.push(
						new NodeClass({
							node: nodeElement,
							manifest: {...nodeManifest, allowInlineEdit: false, menuMode: true},
						}),
					);
				});
			}
		});

		return new MenuItem({
			layout: options.layout,
			children: options.children.map((itemOptions, index) => {
				return this.createMenuItem({...itemOptions, index});
			}),
			selector: `${this.manifest.item}@${options.index}`,
			depth: options.depth,
			nodes,
		});
	}

	getTree()
	{
		const {item} = this.manifest;
		return buildTree(this.root, item)
			.map((options, index) => this.createMenuItem({...options, index}));
	}

	getFlatTree()
	{
		return makeFlatTree(this.getTree());
	}

	getForm(): MenuForm
	{
		return new MenuForm({
			title: Loc.getMessage('LANDING_MENU_TITLE'),
			type: 'menu',
			code: this.code,
			forms: this.getFlatTree().map((item) => {
				return item.getForm();
			}),
		});
	}

	getAddPageButton(): HTMLButtonElement
	{
		return this.cache.remember('addPageButton', () => {
			return Tag.render`
				<button 
					class="ui-btn ui-btn-light-border ui-btn-icon-add ui-btn-round landing-ui-menu-add-button"
					onclick="${this.onAddPageButtonClick.bind(this)}"
					>
					${Loc.getMessage('LANDING_MENU_CREATE_NEW_PAGE')}
				</button>
			`;
		});
	}

	onAddPageTextInputKeydown(event: KeyboardEvent)
	{
		if (event.keyCode === 13)
		{
			this.addPage();
		}
	}

	addPage()
	{
		const input = this.getAddPageInput();
		const {value} = input;

		input.value = '';
		input.focus();

		if (Type.isStringFilled(value))
		{
			const code = BX.translit(
				value,
				{
					change_case: 'L',
					replace_space: '-',
					replace_other: '',
				},
			);

			const backend = Backend.getInstance();

			backend
				.createPage({
					title: value,
					menuCode: this.code,
					blockId: this.block,
					code,
				})
				.then((id) => {
					const li = this.createLi({
						text: value,
						href: `#landing${id}`,
						target: '_self',
						children: [],
					});

					Dom.append(li, this.root);
					decorateTreeSemantics(this.root);
					Dom.remove(this.getAddPageField());
					Dom.removeClass(this.root, 'landing-menu-root-list-with-field');
					Dom.removeClass(this.getAddPageLayout(), 'landing-menu-add-with-background');

					this.reloadPage(id);
				});
		}
	}

	// eslint-disable-next-line class-methods-use-this
	reloadPage(id: number)
	{
		const main = Main.getInstance();
		const url = Env.getInstance().getLandingEditorUrl({
			landing: id,
		});

		void main.reloadSlider(url);
	}

	getAddPageInput(): TextField
	{
		return this.cache.remember('addPageTextInput', () => {
			return Tag.render`
				<input 
					type="text" 
					class="landing-menu-add-field-input"
					placeholder="${Loc.getMessage('LANDING_MENU_CREATE_NEW_PAGE')}"
					onkeydown="${this.onAddPageTextInputKeydown.bind(this)}"
					>
			`;
		});
	}

	onAddPageInputCloseButtonClick(event: MouseEvent)
	{
		event.preventDefault();

		const input = this.getAddPageInput();

		input.value = '';
		Dom.removeClass(this.root, 'landing-menu-root-list-with-field');
		Dom.removeClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
		Dom.remove(this.getAddPageField());
		Dom.append(this.getAddPageButton(), this.getAddPageLayout());
	}

	getAddPageInputCloseButton(): HTMLElement
	{
		return this.cache.remember('addPageInputCloseButton', () => {
			return Tag.render`
				<span 
					class="landing-menu-add-field-close"
					onclick="${this.onAddPageInputCloseButtonClick.bind(this)}"
					title="${Loc.getMessage('LANDING_MENU_CLOSE_BUTTON_LABEL')}"
					>
				</span>
			`;
		});
	}

	getAddPageInputApplyButton(): HTMLElement
	{
		return this.cache.remember('addPageInputApplyButton', () => {
			return Tag.render`
				<span 
					class="landing-menu-add-field-apply"
					onclick="${this.onAddPageInputApplyButtonClick.bind(this)}"
					title="${Loc.getMessage('LANDING_MENU_APPLY_BUTTON_LABEL')}"
					>
				</span>
			`;
		});
	}

	onAddPageInputApplyButtonClick(event: MouseEvent)
	{
		event.preventDefault();
		this.addPage();
	}

	getAddPageField(): HTMLElement
	{
		return this.cache.remember('addPageInput', () => {
			return Tag.render`
				<div class="landing-menu-add-field">
					${this.getAddPageInput()}
					${this.getAddPageInputApplyButton()}
					${this.getAddPageInputCloseButton()}
				</div>
			`;
		});
	}

	getAddPageLayout(): HTMLElement
	{
		return this.cache.remember('addPageLayout', () => {
			return Tag.render`
				<div class="landing-menu-add">
					${this.getAddPageButton()}
				</div>
			`;
		});
	}

	onAddPageButtonClick(event: MouseEvent)
	{
		event.preventDefault();
		Dom.addClass(this.root, 'landing-menu-root-list-with-field');
		Dom.addClass(this.getAddPageLayout(), 'landing-menu-add-with-background');
		Dom.prepend(this.getAddPageField(), this.getAddPageLayout());
		Dom.remove(this.getAddPageButton());
		this.getAddPageInput().focus();
	}

	createList(items, type = 'root')
	{
		const {ulClassName} = this.manifest[type];
		return Tag.render`
			<ul class="${ulClassName}">${items.map((item) => this.createLi(item, type))}</ul>
		`;
	}

	createA(item, type = 'root')
	{
		const {aClassName} = this.manifest[type];
		return Tag.render`
			<a class="${aClassName}" href="${item.href}" target="${item.target}">${Text.encode(item.text)}</a>
		`;
	}

	createLi(item, type = 'root')
	{
		const {liClassName} = this.manifest[type];
		return Tag.render`
			<li class="${liClassName}">
				${this.createA(item, type)}
				${item.children ? this.createList(item.children, 'children') : undefined}
			</li>
		`;
	}

	rebuild(items)
	{
		const newList = this.createList(items);

		decorateTreeSemantics(newList);

		Dom.replace(this.root, newList);
		this.root = newList;

		this.setupTreeFocusZone();
	}
}