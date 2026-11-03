import { EventEmitter } from 'main.core.events';
import { Event, Type } from 'main.core';
import {
	AscendingOpeningVisitor,
	BaseSettingsElement,
	BaseSettingsPage,
	RecursiveFilteringVisitor,
	SettingsField,
	SettingsRow,
	SettingsSection,
	TabField,
	TabsField,
} from 'ui.form-elements.field';
import { SiteTitleField } from './fields/site-title-field';
import {SiteTitle24Field} from "./fields/site-title-24-field";
import { type Settings } from './settings';

export class Navigation
{
	#settings: Settings;
	#currentPage: ?BaseSettingsPage;
	#prevPage: ?BaseSettingsPage;

	constructor(settings: Settings)
	{
		this.#settings = settings;
		EventEmitter.subscribe('BX.Intranet.SettingsNavigation:onMove', (event) => {
			const {page, fieldName} = event.data;
			this.#settings.show(page, {
				userInitiated: true,
				focusTarget: {
					type: 'field',
					fieldName,
				},
			});
		});
	}

	getPageByType(type: string): ?BaseSettingsPage
	{
		return this.getPages().find((page: BaseSettingsPage) => {
			return page.getType() === type;
		});
	}

	getCurrentPage(): ?BaseSettingsPage
	{
		return this.#currentPage;
	}

	getPrevPage(): ?BaseSettingsPage
	{
		return this.#prevPage;
	}

	changePage(page: BaseSettingsPage)
	{
		if (!(page instanceof BaseSettingsPage))
		{
			console.log('Not found "' + type + '" page');
			return;
		}

		if (page === this.#currentPage)
		{
			return;
		}

		this.#prevPage = this.#currentPage;
		this.#currentPage = page;
	}

	getPages(): [BaseSettingsPage]
	{
		return this.#settings.getChildrenElements();
	}

	updateAddressBar()
	{
		let url = new URL(window.location.href);
		url.searchParams.set('page', this.getCurrentPage()?.getType());
		url.searchParams.delete('IFRAME');
		url.searchParams.delete('IFRAME_TYPE');
		top.window.history.replaceState(null, '', url.toString());
	}


	findByFieldName(rootNode: BaseSettingsElement, fieldName: string): ?SettingsField
	{
		const node = RecursiveFilteringVisitor.startFrom(rootNode, (fieldElement) => {
			if (
				fieldElement instanceof SettingsSection
				&& fieldElement.getSectionView().getId() === fieldName
			)
			{
				return true;
			}
			if (
				fieldElement instanceof TabField
				&& fieldElement.getFieldView().getId() === fieldName
			)
			{
				return true;
			}

			return ((fieldElement instanceof SettingsField
				|| fieldElement instanceof SiteTitleField
					|| fieldElement instanceof SiteTitle24Field)
			&& (fieldElement.getFieldView().getName() === fieldName || fieldElement.getFieldView().getId() === fieldName))
		});

		return node.shift() ?? null;
	}

	scrollToNode(node: BaseSettingsElement): void
	{
		const element = node.render();
		const headerOffset = 45;
		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

		scrollTo({
			top: offsetPosition,
			behavior: "smooth"
		});
	}

	moveTo(element: BaseSettingsPage, fieldName: string, shouldFocus: boolean = false): boolean
	{
		if (!Type.isStringFilled(fieldName))
		{
			return false;
		}

		const fieldNode = this.findByFieldName(element, fieldName);
		if (Type.isNil(fieldNode))
		{
			return false;
		}

		let isColored = false;
		AscendingOpeningVisitor.startFrom(fieldNode, (ancestorElement) => {
			if (ancestorElement instanceof SettingsRow)
			{
				ancestorElement.getRowView().show();
			}
			else if (ancestorElement instanceof SettingsSection)
			{
				ancestorElement.getSectionView().toggle(true, false);
			}
			else if (ancestorElement instanceof TabField)
			{
				const tabs = ancestorElement.getParentElement();

				if (tabs instanceof TabsField)
				{
					tabs.activateTab(ancestorElement, false);
				}
			}

			if (!isColored)
			{
				isColored = ancestorElement.highlight();
			}
		});
		this.scrollToNode(fieldNode);

		if (shouldFocus)
		{
			return this.#focusElement(this.#getFocusNode(fieldNode));
		}

		return true;
	}

	focusPageTitle(page: BaseSettingsPage): boolean
	{
		return this.#focusElement(page.getPage().querySelector('.intranet-settings__page-header'));
	}

	focusNode(node: ?HTMLElement): boolean
	{
		return this.#focusElement(node);
	}

	#getFocusNode(element: BaseSettingsElement): ?HTMLElement
	{
		if (
			element instanceof SettingsField
			|| element instanceof SiteTitleField
			|| element instanceof SiteTitle24Field
		)
		{
			const inputNode = element.getFieldView()?.getInputNode?.();
			const focusableNode = this.#findFocusableNode(inputNode);

			return focusableNode || inputNode || element.render();
		}

		if (element instanceof SettingsSection)
		{
			const sectionNode = element.getSectionView().render();

			return sectionNode.querySelector('.ui-section__title, h2, h3') || sectionNode;
		}

		if (element instanceof TabField)
		{
			return element.getFieldView().getHeader();
		}

		return element.render();
	}

	#findFocusableNode(node: ?HTMLElement): ?HTMLElement
	{
		if (!Type.isDomNode(node))
		{
			return null;
		}

		return node.matches?.('input:not([type="hidden"]), textarea, select, button, a[href], [tabindex]')
			? node
			: node.querySelector('input:not([type="hidden"]), textarea, select, button, a[href], [tabindex]')
		;
	}

	#focusElement(node: ?HTMLElement): boolean
	{
		if (!this.#isAvailableFocusTarget(node))
		{
			return false;
		}

		const hadTabIndex = node.hasAttribute('tabindex');
		const previousTabIndex = node.getAttribute('tabindex');
		const needsTemporaryTabIndex = !this.#isNaturallyFocusable(node);

		if (needsTemporaryTabIndex)
		{
			node.setAttribute('tabindex', '-1');
		}

		node.focus({ preventScroll: true });
		const isFocused = document.activeElement === node || node.contains(document.activeElement);

		if (!hadTabIndex && needsTemporaryTabIndex)
		{
			if (isFocused)
			{
				const removeTemporaryTabIndex = () => {
					Event.unbind(node, 'blur', removeTemporaryTabIndex);
					node.removeAttribute('tabindex');
				};

				Event.bind(node, 'blur', removeTemporaryTabIndex);
			}
			else
			{
				node.removeAttribute('tabindex');
			}
		}
		else if (previousTabIndex !== null)
		{
			node.setAttribute('tabindex', previousTabIndex);
		}

		return isFocused;
	}

	#isAvailableFocusTarget(node: ?HTMLElement): boolean
	{
		return Type.isDomNode(node)
			&& node.isConnected
			&& node.closest('[inert]') === null
			&& !node.hasAttribute('disabled')
			&& node.getAttribute('aria-disabled') !== 'true'
			&& Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length > 0)
		;
	}

	#isNaturallyFocusable(node: HTMLElement): boolean
	{
		return node.matches('input:not([type="hidden"]), textarea, select, button, a[href], [tabindex]');
	}
}
