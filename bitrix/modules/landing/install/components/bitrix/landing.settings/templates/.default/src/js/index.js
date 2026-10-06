import {Event, ajax as Ajax, Tag, Dom} from 'main.core';
import {Loader} from "main.loader";

type PageOption = {
	page: string,
	name: string,
	link: ?string,
	linkToSave: ?string,
	current: ?boolean,
	container: ?HTMLDivElement,
	form: ?HTMLFormElement,
}

export class LandingSettings
{
	static PAGE_LINK_SELECTOR = 'a[data-page], a[data-placement]';

	// The saving raises the busy state on the very container the loading of a section raises it on,
	// so it takes a place of its own in the same list: whichever of the two ends first, the state
	// goes off only when nothing is left running. The value is no section code and cannot collide.
	static SAVING = 'landing-settings-saving';

	siteId: number;
	landingId: number;
	pages: {
		[code: string]: PageOption
	};
	currentPage: PageOption;
	menu: HTMLDivElement;
	container: HTMLDivElement;
	message: HTMLDivElement;
	messages: {
		[code: string]: string
	};
	links: [HTMLAnchorElement];
	saveButton: HTMLButtonElement;
	loader: Loader;
	loadingPages: [string];

	/**
	 * Constructor.
	 */
	constructor(options: {
		siteId: number,
		landingId: number,
		pages: {
			[code: string]: PageOption
		},
		menuId: string,
		containerId: string,
		messageId: string,
		messages: {
			[code: string]: string
		},
		saveButtonId: string,
		cancelButtonId: string,
		type: string,
		tool: string,
	})
	{
		this.siteId = options.siteId;
		this.landingId = options.landingId;
		this.type = options.type;
		this.tool = options.tool;

		// pages
		this.pages = options.pages;
		this.container = document.getElementById(options.containerId);
		this.menu = document.getElementById(options.menuId);
		this.message = document.getElementById(options.messageId);
		this.messages = options.messages ?? {};

		for (let page in this.pages)
		{
			// A section that was never opened is an empty named region otherwise: the panel joins the
			// accessibility tree the moment it is created and is taken out of it when another one opens.
			this.pages[page].container = Tag.render`<div class="landing-settings-page-container" hidden></div>`;
			Dom.append(this.pages[page].container, this.container);
		}
		this.loadingPages = [];

		// purely visual indicator: the busy state is exposed on the content container instead
		this.loaderContainer = Tag.render`<div class="landing-settings-loader-container" aria-hidden="true"></div>`;
		Dom.insertAfter(this.loaderContainer, this.container);
		this.loader = new Loader({target: this.loaderContainer});

		// links
		this.links = [].slice.call(this.menu.querySelectorAll(LandingSettings.PAGE_LINK_SELECTOR));
		let currentLink = this.links[0];
		this.links.forEach(link => {
			this.bindMenuLink(link);
			this.setupSectionA11y(link);

			if (
				link.dataset.page
				&& this.pages[link.dataset.page]
				&& this.pages[link.dataset.page].current === true
			)
			{
				currentLink = link;
			}
		});
		if (currentLink)
		{
			this.onMenuLinkClick(currentLink, false);
		}

		// save
		this.saveButton = document.getElementById(options.saveButtonId);
		this.cancelButton = document.getElementById(options.cancelButtonId);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		Event.bind(this.saveButton, 'click', this.onSave);
		BX.Event.EventEmitter.subscribe('SidePanel.Slider:onClose', () => {
			this.onCancel();
		});

		this.focusFatalError();
	}

	/**
	 * Reads out the message printed by the server instead of the content of a section.
	 *
	 * The block arrives together with the document, and a live region is announced only for what
	 * appears in it afterwards, so the message is read by moving the focus onto the block. There is
	 * nothing to interact with on such a page: the message is the whole content of the shell.
	 */
	focusFatalError()
	{
		const fatalError = this.container.querySelector('.landing-error-page');
		if (fatalError)
		{
			fatalError.focus({preventScroll: true});
		}
	}

	/**
	 * Reports an operation the shell could not carry through.
	 *
	 * The message goes into the live region printed with the document, so it is announced where the
	 * user is instead of taking the focus away: the control that was activated is the one a second
	 * attempt is made from, and a dialog to dismiss stands between the two. The region is emptied at
	 * the start of every attempt, so the same message twice is announced twice and a message about
	 * an attempt that is over never stays on the screen.
	 */
	reportFailure(message: string)
	{
		if (this.message)
		{
			this.message.textContent = message ?? '';
		}
	}

	clearFailure()
	{
		if (this.message)
		{
			this.message.textContent = '';
		}
	}

	showLoader()
	{
		this.loader.show();
		Dom.show(this.loaderContainer);
		Dom.attr(this.container, 'aria-busy', 'true');
	}

	hideLoader()
	{
		this.loader.hide();
		Dom.hide(this.loaderContainer);
		Dom.attr(this.container, 'aria-busy', null);
	}

	/**
	 * Names a section panel by its menu item. Both ids come from the same section code here,
	 * so the two sides of the link can never drift apart. Menu items of marketplace
	 * applications are not sections and have no panel to name.
	 */
	setupSectionA11y(link: HTMLAnchorElement)
	{
		if (!link.dataset.page)
		{
			return;
		}

		const page = this.pages[link.dataset.page];
		if (!page)
		{
			return;
		}

		const linkId = link.id || `landing-settings-menu-item-${link.dataset.page}`;
		Dom.attr(link, 'id', linkId);
		Dom.attr(page.container, {
			'id': `landing-settings-page-${link.dataset.page}`,
			'role': 'region',
			'aria-labelledby': linkId,
			// The panel is focused programmatically, and without an explicit tabindex it cannot be.
			'tabindex': '-1',
		});
	}

	markCurrentSection(currentLink: HTMLAnchorElement)
	{
		this.links.forEach(link => {
			// the item swaps a panel of the same document, so the section is current and not the page
			Dom.attr(link, 'aria-current', link === currentLink ? 'true' : null);
		});
	}

	bindMenuLink(link: HTMLAnchorElement)
	{
		Event.bind(link, 'click', event => {
			event.preventDefault();
			event.stopPropagation();
			this.onMenuLinkClick(link)
		});

		// an anchor without an address gets no activation from the browser; a marketplace item is a
		// real link and would fire twice
		if (link.getAttribute('role') === 'button')
		{
			Event.bind(link, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ')
				{
					event.preventDefault();
					link.click();
				}
			});
		}
	}

	bindPageLink(pageLink: HTMLAnchorElement)
	{
		if (pageLink.dataset.page)
		{
			const currentMenuLink = this.links.find(menuLink => menuLink.dataset.page === pageLink.dataset.page);
			if (currentMenuLink)
			{
				Event.bind(pageLink, 'click', event => {
					event.preventDefault();
					event.stopPropagation();
					currentMenuLink.click();
				});
			}
		}
	}

	onMenuLinkClick(link: HTMLAnchorElement, isUserCLick: boolean = true)
	{
		this.currentLink = link;

		if (link.dataset.page)
		{
			this.clearFailure();
			this.onPageChange(link.dataset.page, isUserCLick);

			if (isUserCLick)
			{
				BX.UI.Analytics.sendData({
					tool: this.tool,
					category: 'settings',
					event: 'click_on_section',
					p1: this.getTypePageForMetrika(link.dataset.page),
					p3: `siteID_${this.siteId}`,
				});
			}
		}
		else if (link.dataset.placement)
		{
			// for open app pages in slider
			if (
				typeof BX.rest !== 'undefined' &&
				typeof BX.rest.Marketplace !== 'undefined'
			)
			{
				BX.rest.Marketplace.bindPageAnchors({});
			}
			BX.rest.AppLayout.openApplication(
				link.dataset.appId,
				{
					SITE_ID: this.siteId,
					LID: this.landingId,
				},
				{
					PLACEMENT: link.dataset.placement,
					PLACEMENT_ID: link.dataset.placementId,
				},
			);
		}
	}

	/**
	 * Closes the loading of a section whatever it ended with: the code leaves the loading list and
	 * the busy state goes off the container as soon as nothing else is being loaded.
	 */
	finishPageLoading(pageId: string)
	{
		const loading = this.loadingPages.indexOf(pageId);
		if (loading !== -1)
		{
			this.loadingPages.splice(loading, 1);
		}
		if (this.loadingPages.length === 0)
		{
			this.hideLoader();
		}
	}

	/**
	 * Puts the mark of the current section on the item whose panel is on screen, and it is the only
	 * thing that puts it anywhere. A section marked at the click, before it is fetched, is a menu
	 * telling a screen reader that a panel is current while another one is still the one shown -
	 * during the whole load on a slow stand, and for good when the load never arrives.
	 */
	markSectionOnScreen()
	{
		const shownLink = this.links.find(
			link => Boolean(link.dataset.page) && this.pages[link.dataset.page] === this.currentPage,
		);
		if (shownLink)
		{
			this.currentLink = shownLink;
		}
		this.markCurrentSection(shownLink ?? null);
	}

	onPageChange(pageId: string, isUserClick: boolean = true)
	{
		const pageToLoad = this.pages[pageId];
		if (pageToLoad)
		{
			if (pageToLoad.container.childNodes.length === 0)
			{
				this.showLoader();
				this.loadingPages.push(pageId);
				// Ajax.get carries a success callback only, and a load that never arrives would keep the
				// busy state on the container and the section in the loading list for the rest of the session
				Ajax({
					method: 'GET',
					dataType: 'html',
					url: pageToLoad.link,
					onfailure: () =>
					{
						this.finishPageLoading(pageId);
						this.markSectionOnScreen();
						this.reportFailure(this.messages.sectionLoadError);
					},
					onsuccess: result =>
					{
						this.finishPageLoading(pageId);
						pageToLoad.container.innerHTML = result;

						const form = pageToLoad.container.querySelector('form.landing-form');
						if (form)
						{
							pageToLoad.form = form;
						}

						const pageLinks = pageToLoad.container.querySelectorAll(LandingSettings.PAGE_LINK_SELECTOR);
						if (pageLinks.length > 0)
						{
							pageLinks.forEach(link => this.bindPageLink(link));
						}

						if (this.currentPage)
						{
							this.currentPage.container.hidden = true;
						}
						this.currentPage = pageToLoad;
						this.currentPage.container.hidden = false;
						this.markSectionOnScreen();
						if (isUserClick)
						{
							// a hidden element cannot take the focus, so the panel is shown first
							this.currentPage.container.focus({preventScroll: true});
						}
					},
				});
			}
			else
			{
				if (this.currentPage)
				{
					this.currentPage.container.hidden = true;
				}
				this.currentPage = pageToLoad;
				this.currentPage.container.hidden = false;
				this.markSectionOnScreen();
				if (isUserClick)
				{
					this.currentPage.container.focus({preventScroll: true});
				}
			}
		}
	}

	onSave()
	{
		BX.UI.Analytics.sendData({
			tool: this.tool,
			category: 'settings',
			event: 'save',
			p1: this.getTypePageForMetrika(this.currentLink.dataset.page),
			p3: `siteID_${this.siteId}`,
		});

		this.clearFailure();
		this.showLoader();
		this.loadingPages.push(LandingSettings.SAVING);

		let saved = false;
		const submits = [];
		for (let page in this.pages)
		{
			const currPage = this.pages[page];
			if (currPage.form)
			{
				submits.push(
					fetch(currPage.linkToSave, {
						method: 'POST',
						body: new FormData(currPage.form),
						headers: {
							'Bx-ajax': true,
						},
					}),
				);
			}
		}
		Promise.all(submits)
			.then((results: [Response]) =>
			{
				let all = true;
				results.forEach(result => {
					all = all && result.ok;
				});
				saved = all;
				if (all)
				{
					top.window['landingSettingsSaved'] = true;
					top.BX.onCustomEvent('BX.Landing.Filter:apply');

					const previous = BX.SidePanel.Instance.getPreviousSlider();
					if (previous)
					{
						previous.reload();
						BX.SidePanel.Instance.close();
					}
					else
					{
						top.window.location.reload();
						BX.SidePanel.Instance.close();
					}
				}
			})
			.catch(err => {
				console.error(err);
			})
			// a save that failed leaves the content in place, and a busy state nothing takes off keeps
			// it out of reach of a screen reader for the rest of the session; the button says the same
			// thing visually, so it leaves the waiting state at the very same point
			.finally(() => {
				this.finishPageLoading(LandingSettings.SAVING);
				Dom.removeClass(this.saveButton, 'ui-btn-wait');
				// One answer for both ways a save can fall through: an error from the stand and a
				// request that never reached it leave the user with the same unsaved settings, and
				// the shell says so instead of looking exactly like a save that went through.
				if (!saved)
				{
					this.reportFailure(this.messages.saveError);
				}
			});
	}

	onCancel()
	{
		BX.UI.Analytics.sendData({
			tool: this.tool,
			category: 'settings',
			event: 'close',
			p1: this.getTypePageForMetrika(this.currentLink.dataset.page),
			p3: `siteID_${this.siteId}`,
		});
	}

	getTypePageForMetrika(typePage: string): string
	{
		let type = '';
		switch (typePage)
		{
			case 'SITE_EDIT':
				type = 'site_settings';
				break;
			case 'SITE_DESIGN':
				type = 'site_design';
				break;
			case 'LANDING_EDIT':
				type = 'page_settings';
				break;
			case 'LANDING_DESIGN':
				type = 'page_design';
				break;
			case 'CATALOG_EDIT':
				type = 'catalog_settings';
				break;
			default:
				type = typePage;
				break;
		}

		return type;
	}
}