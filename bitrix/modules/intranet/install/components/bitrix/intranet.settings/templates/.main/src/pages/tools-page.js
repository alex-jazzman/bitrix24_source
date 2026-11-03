import { EventEmitter } from 'main.core.events';
import { Draggable } from 'ui.draganddrop.draggable';
import { Section, Row } from 'ui.section';
import { Switcher } from 'ui.switcher';
import { SwitcherNestedItem, SwitcherNested } from 'ui.switcher-nested';
import { Loc, Type, Event as EventBX, Dom, Tag, Runtime } from 'main.core';
import { SettingsSection, SettingsRow, BaseSettingsPage } from 'ui.form-elements.field';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

type ToolConfig = {
	menuId: string,
	code: string,
	name: string,
	enabled: boolean,
	default: boolean,
	'settings-path'?: string,
	'settings-title'?: string,
	'infohelper-slider'?: string,
	subgroups: { [subgroupCode: string]: Object },
	disableConfirmation: {
		isNeeded: boolean,
		title?: string,
		text?: string,
		confirmCaption: string,
	},
	enableConfirmation?: {
		isNeeded: boolean,
		title?: string,
		text?: string,
		confirmCaption?: string,
		jsExtension?: string,
		jsExportName?: string,
	},
}

export class ToolsPage extends BaseSettingsPage
{
	#inputForSaveSortTools: HTMLElement;
	#toolsWrapperRow: Row;
	#draggable: Draggable;
	#mainSection: Section;
	#settingsSection: SettingsSection;
	#switcherA11yHandlers = new Map();
	#sectionA11yHeaderHandlers = new Map();
	#sectionA11yDisclosureHandlers = new Map();
	#sectionA11yDisclosureFocusHandlers = new Map();
	#scheduledSwitcherA11yGroups = new WeakSet();

	constructor()
	{
		super();
		this.titlePage = Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_TOOLS');
		this.descriptionPage = Loc.getMessage('INTRANET_SETTINGS_DESCRIPTION_PAGE_TOOLS');
	}

	getType(): string
	{
		return 'tools';
	}

	appendSections(contentNode: HTMLElement): void
	{
		const description = new Row({
			content: this.getDescription().getContainer(),
		});
		new SettingsRow({
			row: description,
			parent: this.#getSettingsSection(),
		});

		if (this.hasValue('tools'))
		{
			this.#renderToolsSelectors();
		}

		this.#getSettingsSection().renderTo(contentNode);
	}

	#renderToolsSelectors(): void
	{
		this.#cleanupToolsA11y();

		const tools: ToolConfig[] = this.getValue('tools');
		const startSort = [];
		const toolSelectors = [];

		Object.keys(tools).forEach((item) => {
			startSort.push(tools[item].menuId)
			const tool: ToolConfig = tools[item];
			const subgroups = tool.subgroups;
			let toolSelectorItems = [];

			if (Object.keys(subgroups).length > 0)
			{
				toolSelectorItems = this.#getToolsSelectorsItems(subgroups, tool);
			}

			const toolSelector = new SwitcherNested({
				id: tool.code,
				title: tool.name,
				link: this.getPermission().canEdit() ? tool['settings-path'] : null,
				infoHelperCode: this.getPermission().canEdit() ? tool['infohelper-slider'] : null,
				linkTitle: tool['settings-title'] ?? Loc.getMessage('INTRANET_SETTINGS_SECTION_TOOLS_LINK_SETTINGS'),
				isChecked: tool.enabled,
				mainInputName: tool.code,
				isOpen: false,
				items: toolSelectorItems,
				isDisabled: !this.getPermission().canEdit(),
				isDefault: tool.default,
				helpMessage: !this.getPermission().canEdit()
					? Loc.getMessage('INTRANET_SETTINGS_ELEMENT_PERMISSION_MSG')
					: Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_DISABLED', {'#TOOL#': tool.name}),
			});
			this.#adaptToolSelectorA11y(toolSelector, toolSelectorItems);
			toolSelectors.push(toolSelector);

			const switcher = this.#getToolSelectorSwitcher(toolSelector);
			if (switcher)
			{
				if (tool.disableConfirmation.isNeeded)
				{
					EventEmitter.subscribe(
						switcher,
						'toggled',
						() => {
							if (!switcher.isChecked())
							{
								this.#showDisableConfirmation(tool, switcher);
							}
						}
					);
				}

				if (tool.enableConfirmation?.isNeeded)
				{
					EventEmitter.subscribe(
						switcher,
						'toggled',
						() => {
							if (switcher.isChecked())
							{
								this.#showEnableConfirmation(tool, switcher);
							}
						}
					);
				}
			}

			const toolSelectorSection = new SettingsSection({
				section: toolSelector,
			});

			Dom.style(toolSelectorSection.getSectionView().render(), 'margin-bottom', '8px');
			Dom.attr(toolSelectorSection.getSectionView().render(), 'data-menu-id', tool.menuId);
			this.#getToolsWrapperRow().append(toolSelectorSection.getSectionView().render());
			new SettingsRow({
				row: this.#getToolsWrapperRow(),
				parent: this.#getSettingsSection(),
				child: toolSelectorSection
			});
		});
	}

	#getSubToolHelpMessage(tool: Object, parentToolName: ?string): string
	{
		if (!this.getPermission().canEdit())
		{
			return Loc.getMessage('INTRANET_SETTINGS_ELEMENT_PERMISSION_MSG');
		}

		if (tool.disabled)
		{
			return Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_DISABLED', {'#TOOL#': tool.name});
		}

		if (tool.default)
		{
			return Loc.getMessage('INTRANET_SETTINGS_FIELD_HELP_MESSAGE_MAIN_TOOL', {'#TOOL#': parentToolName ?? ''});
		}

		return '';
	}

	#getToolsSelectorsItems(subgroups: Object, tool: Object): Array<SwitcherNestedItem>
	{
		const toolSelectorItems = [];

		Object.keys(subgroups).forEach((item) => {
			const subgroupConfig = subgroups[item];

			if (
				Type.isNull(subgroupConfig.name)
				|| Type.isNull(subgroupConfig.code)
				|| Type.isNull(subgroupConfig.enabled)
			)
			{
				return;
			}

			const toolSelectorItem = new SwitcherNestedItem({
				title: subgroupConfig.name,
				id: subgroupConfig.code,
				inputName: subgroupConfig.code,
				isChecked: subgroupConfig.enabled,
				settingsPath: this.getPermission().canEdit() ? subgroupConfig['settings_path'] : null,
				settingsTitle: subgroupConfig['settings_title'] ?? Loc.getMessage('INTRANET_SETTINGS_SECTION_TOOLS_LINK_SETTINGS'),
				infoHelperCode: this.getPermission().canEdit() ? subgroupConfig['infohelper-slider'] : null,
				isDisabled: !this.getPermission().canEdit(),
				isDefault: subgroupConfig.default ?? subgroupConfig.disabled ?? false,
				helpMessage: this.#getSubToolHelpMessage(subgroupConfig, tool.name),
			});
			const descriptionLink = toolSelectorItem.render().querySelector(
				'.ui-section__tools-subgroup-description-link',
			);

			if (Type.isDomNode(descriptionLink))
			{
				Dom.removeClass(descriptionLink, 'ui-section__tools-subgroup-description-link');
				Dom.addClass(descriptionLink, 'ui-section__tools-description-link');
				Dom.addClass(descriptionLink, 'intranet-settings__tools-subgroup-description-link');
			}

			if (subgroupConfig.disabled)
			{
				Dom.style(toolSelectorItem.getSwitcher().getNode(), {opacity: '0.4'});
			}
			else
			{
				EventEmitter.subscribe(
					toolSelectorItem.getSwitcher(),
					'toggled',
					() => {
						this.getAnalytic()?.addEventToggleTools(
							subgroupConfig.code,
							toolSelectorItem.getSwitcher().isChecked()
						);
					}
				);
			}

			if (subgroupConfig.code === 'tool_subgroup_team_work_instant_messenger')
			{
				EventBX.bind(
					toolSelectorItem.getSwitcher().getNode(),
					'click',
					() => {
						if (!toolSelectorItem.getSwitcher().isChecked())
						{
							this.#getWarningMessage(subgroupConfig.code, toolSelectorItem.getSwitcher().getNode(), Loc.getMessage('INTRANET_SETTINGS_WARNING_TOOL_INSTANT_MESSENGER')).show();
						}
					}
				);
			}

			toolSelectorItems.push(toolSelectorItem);
		});

		return toolSelectorItems;
	}

	#adaptToolSelectorA11y(toolSelector: SwitcherNested, toolSelectorItems: Array<SwitcherNestedItem>): void
	{
		const sectionNode = toolSelector.render();
		const parentSwitcher = this.#getToolSelectorSwitcher(toolSelector);
		const switcherGroup = {
			controls: [],
			sections: [toolSelector],
		};

		if (parentSwitcher)
		{
			switcherGroup.controls.push({
				switcher: parentSwitcher,
				isUnavailable: !this.getPermission().canEdit() || toolSelector.isDefault(),
				hasUnavailableExplanation: true,
				labelNode: sectionNode.querySelector('.ui-section__title'),
				testId: `intranet-settings-tools-switcher-${this.#getSafeIdPart(toolSelector.getId())}`,
			});
		}

		toolSelectorItems.forEach((item) => {
			switcherGroup.controls.push({
				switcher: item.getSwitcher(),
				isUnavailable: !this.getPermission().canEdit() || item.isDefault(),
				hasUnavailableExplanation: true,
				labelNode: item.render().querySelector('.ui-section__row-tool-selector_title'),
				testId: `intranet-settings-tools-switcher-${this.#getSafeIdPart(item.getId())}`,
			});
		});

		switcherGroup.controls.forEach((control) => {
			this.#adaptSwitcherA11y(control, switcherGroup);
		});

		this.#adaptToolSectionA11y(toolSelector);
		this.#syncSwitcherGroupA11y(switcherGroup);
	}

	#adaptSwitcherA11y(control: Object, switcherGroup: ?Object = null): void
	{
		const switcher = control.switcher;
		const switcherNode = switcher?.getNode();

		if (!Type.isDomNode(switcherNode) || !Type.isDomNode(control.labelNode))
		{
			return;
		}

		const labelId = this.#ensureNodeId(
			control.labelNode,
			`${control.testId}-label`,
		);

		Dom.attr(switcherNode, {
			role: 'switch',
			'aria-labelledby': labelId,
			'data-testid': control.testId,
		});
		Dom.addClass(switcherNode, 'intranet-settings__tools-switcher');

		if (!this.#switcherA11yHandlers.has(switcher))
		{
			const handleKeydown = (event) => {
				if (!this.#isSwitcherActionKey(event))
				{
					return;
				}

				event.preventDefault();

				if (this.#isSwitcherKeyboardActionAvailable(control))
				{
					switcherNode.click();
				}
			};

			const handleSync = () => {
				if (switcherGroup)
				{
					this.#scheduleSwitcherGroupA11ySync(switcherGroup);
				}
				else
				{
					this.#syncSwitcherA11y(control);
				}
			};

			EventBX.bind(switcherNode, 'keydown', handleKeydown);
			EventEmitter.subscribe(switcher, 'toggled', handleSync);
			EventEmitter.subscribe(switcher, 'lock', handleSync);
			EventEmitter.subscribe(switcher, 'unlock', handleSync);

			this.#switcherA11yHandlers.set(switcher, {
				node: switcherNode,
				keydown: handleKeydown,
				sync: handleSync,
			});
		}

		this.#syncSwitcherA11y(control);
	}

	#adaptToolSectionA11y(section: SwitcherNested): void
	{
		if (section.isNestedMenu !== true)
		{
			return;
		}

		const sectionNode = section.render();
		const headerNode = sectionNode.querySelector('.ui-section__header');
		const titleNode = sectionNode.querySelector('.ui-section__title');
		const contentNode = sectionNode.querySelector('.ui-section__content');
		const iconNode = sectionNode.querySelector('.ui-section__collapse-icon');

		if (
			!Type.isDomNode(headerNode)
			|| !Type.isDomNode(titleNode)
			|| !Type.isDomNode(contentNode)
			|| !Type.isDomNode(iconNode)
		)
		{
			return;
		}

		const safeSectionId = this.#getSafeIdPart(section.getId());
		const titleId = this.#ensureNodeId(
			titleNode,
			`intranet-settings-tools-section-${safeSectionId}-label`,
		);
		const contentId = this.#ensureNodeId(
			contentNode,
			`intranet-settings-tools-section-${safeSectionId}-content`,
		);
		const button = this.#getToolSectionButton(iconNode, section, titleId, contentId);
		this.#adaptToolSectionDisclosureFocus(button, titleNode);

		if (!this.#sectionA11yHeaderHandlers.has(headerNode))
		{
			const handleHeaderClick = () => {
				this.#scheduleToolSectionA11ySync(section);
			};

			EventBX.bind(headerNode, 'click', handleHeaderClick);
			this.#sectionA11yHeaderHandlers.set(headerNode, handleHeaderClick);
		}

		Dom.attr(contentNode, {
			'data-testid': `intranet-settings-tools-content-${safeSectionId}`,
		});

		this.#syncToolSectionA11y(section, button, contentNode);
	}

	#getToolSectionButton(
		iconNode: HTMLElement,
		section: SwitcherNested,
		titleId: string,
		contentId: string,
	): HTMLElement
	{
		if (iconNode.tagName === 'BUTTON')
		{
			Dom.attr(iconNode, {
				type: 'button',
				'aria-labelledby': titleId,
				'aria-controls': contentId,
				'data-testid': `intranet-settings-tools-disclosure-${this.#getSafeIdPart(section.getId())}`,
			});

			return iconNode;
		}

		const button = Tag.render`
			<button
				class="${iconNode.className} intranet-settings__tools-disclosure"
				type="button"
				aria-labelledby="${titleId}"
				aria-controls="${contentId}"
				data-testid="intranet-settings-tools-disclosure-${this.#getSafeIdPart(section.getId())}"
			></button>
		`;

		const handleButtonClick = (event) => {
			event.stopPropagation();
			section.toggle();
			this.#syncToolSectionA11y(section, button);
		};

		EventBX.bind(button, 'click', handleButtonClick);
		this.#sectionA11yDisclosureHandlers.set(button, handleButtonClick);

		Dom.replace(iconNode, button);

		return button;
	}

	#adaptToolSectionDisclosureFocus(button: HTMLElement, titleNode: HTMLElement): void
	{
		if (this.#sectionA11yDisclosureFocusHandlers.has(button))
		{
			return;
		}

		const handleFocus = () => {
			if (button.matches(':focus-visible'))
			{
				Dom.addClass(titleNode, '--disclosure-focus-visible');
			}
		};
		const handleBlur = () => {
			Dom.removeClass(titleNode, '--disclosure-focus-visible');
		};

		EventBX.bind(button, 'focus', handleFocus);
		EventBX.bind(button, 'blur', handleBlur);
		this.#sectionA11yDisclosureFocusHandlers.set(button, {
			focus: handleFocus,
			blur: handleBlur,
			title: titleNode,
		});
	}

	#scheduleSwitcherGroupA11ySync(switcherGroup: Object): void
	{
		if (this.#scheduledSwitcherA11yGroups.has(switcherGroup))
		{
			return;
		}

		this.#scheduledSwitcherA11yGroups.add(switcherGroup);

		queueMicrotask(() => {
			this.#scheduledSwitcherA11yGroups.delete(switcherGroup);
			this.#syncSwitcherGroupA11y(switcherGroup);
		});
	}

	#syncSwitcherGroupA11y(switcherGroup: Object): void
	{
		switcherGroup.controls.forEach((control) => {
			this.#syncSwitcherA11y(control);
		});

		switcherGroup.sections.forEach((section) => {
			this.#syncToolSectionA11y(section);
		});
	}

	#scheduleToolSectionA11ySync(section: SwitcherNested): void
	{
		queueMicrotask(() => {
			this.#syncToolSectionA11y(section);
		});
	}

	#syncSwitcherA11y(control: Object): void
	{
		const switcher = control.switcher;
		const switcherNode = switcher.getNode();
		const isAvailable = this.#isSwitcherActionAvailable(control);
		const isKeyboardActionAvailable = this.#isSwitcherKeyboardActionAvailable(control);

		Dom.attr(switcherNode, {
			'aria-checked': switcher.isChecked() ? 'true' : 'false',
			'aria-disabled': isAvailable ? 'false' : 'true',
			tabindex: isKeyboardActionAvailable ? '0' : '-1',
		});

		if (switcher.isLoading())
		{
			Dom.attr(switcherNode, 'aria-busy', 'true');
		}
		else
		{
			switcherNode.removeAttribute('aria-busy');
		}
	}

	#syncToolSectionA11y(
		section: SwitcherNested,
		button: ?HTMLElement = null,
		contentNode: ?HTMLElement = null,
	): void
	{
		const sectionNode = section.render();
		const disclosureButton = button ?? sectionNode.querySelector('.intranet-settings__tools-disclosure');
		const sectionContent = contentNode ?? sectionNode.querySelector('.ui-section__content');

		if (!Type.isDomNode(disclosureButton) || !Type.isDomNode(sectionContent))
		{
			return;
		}

		const isExpanded = section.isOpen === true;
		disclosureButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

		if (isExpanded)
		{
			sectionContent.removeAttribute('inert');
			sectionContent.removeAttribute('aria-hidden');

			return;
		}

		if (sectionContent.contains(document.activeElement))
		{
			disclosureButton.focus();
		}

		sectionContent.setAttribute('inert', '');
		sectionContent.setAttribute('aria-hidden', 'true');
	}

	#isSwitcherActionKey(event: KeyboardEvent): boolean
	{
		return event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar';
	}

	#isSwitcherActionAvailable(control: Object): boolean
	{
		return control.isUnavailable !== true
			&& !control.switcher.isDisabled()
			&& !control.switcher.isLoading()
		;
	}

	#isSwitcherKeyboardActionAvailable(control: Object): boolean
	{
		return !control.switcher.isDisabled()
			&& !control.switcher.isLoading()
			&& (
				control.isUnavailable !== true
				|| control.hasUnavailableExplanation === true
			)
		;
	}

	#getToolSelectorSwitcher(toolSelector: SwitcherNested): ?Switcher
	{
		const switcherNode = toolSelector.render().querySelector('.ui-section__switcher-wrapper');

		if (!Type.isDomNode(switcherNode))
		{
			return null;
		}

		return Switcher.getList().find((switcher) => switcher.getNode() === switcherNode) ?? null;
	}

	#cleanupToolsA11y(): void
	{
		this.#switcherA11yHandlers.forEach(({ node, keydown, sync }, switcher) => {
			EventBX.unbind(node, 'keydown', keydown);
			EventEmitter.unsubscribe(switcher, 'toggled', sync);
			EventEmitter.unsubscribe(switcher, 'lock', sync);
			EventEmitter.unsubscribe(switcher, 'unlock', sync);
		});
		this.#switcherA11yHandlers.clear();

		this.#sectionA11yHeaderHandlers.forEach((handler, node) => {
			EventBX.unbind(node, 'click', handler);
		});
		this.#sectionA11yHeaderHandlers.clear();

		this.#sectionA11yDisclosureHandlers.forEach((handler, node) => {
			EventBX.unbind(node, 'click', handler);
		});
		this.#sectionA11yDisclosureHandlers.clear();

		this.#sectionA11yDisclosureFocusHandlers.forEach(({ focus, blur, title }, node) => {
			EventBX.unbind(node, 'focus', focus);
			EventBX.unbind(node, 'blur', blur);
			Dom.removeClass(title, '--disclosure-focus-visible');
		});
		this.#sectionA11yDisclosureFocusHandlers.clear();
	}

	#ensureNodeId(node: HTMLElement, id: string): string
	{
		if (!Type.isStringFilled(node.id))
		{
			Dom.attr(node, 'id', id);
		}

		return node.id;
	}

	#getSafeIdPart(value: string): string
	{
		return String(value).replaceAll(/[^\w-]/g, '-');
	}

	#getMainSection(): Section
	{
		if (this.#mainSection)
		{
			return this.#mainSection;
		}

		this.#mainSection = new Section(this.getValue('sectionTools'));

		return this.#mainSection;
	}

	#getSettingsSection(): SettingsSection
	{
		if (this.#settingsSection)
		{
			return this.#settingsSection;
		}

		this.#settingsSection = new SettingsSection({
			section: this.#getMainSection(),
			parent: this,
		});

		return this.#settingsSection;
	}

	getDescription(): BX.UI.Alert
	{
		const descriptionText = `
			${Loc.getMessage('INTRANET_SETTINGS_SECTION_TOOLS_DESCRIPTION')}
			<button
				type="button"
				class="ui-section__link intranet-settings__tools-description-more"
				onclick="top.BX.Helper.show('redirect=detail&code=18213196')"
			>
				${Loc.getMessage('INTRANET_SETTINGS_CANCEL_MORE')}
			</button>
		`;

		return new BX.UI.Alert({
			text: descriptionText,
			inline: true,
			size: BX.UI.Alert.Size.SMALL,
			color: BX.UI.Alert.Color.PRIMARY,
			animated: true,
		});
	}

	#getInputForSaveSortTools(): HTMLElement
	{
		if (this.#inputForSaveSortTools)
		{
			return this.#inputForSaveSortTools;
		}

		this.#inputForSaveSortTools = Tag.render`
			<input type="hidden" name="tools-sort">
		`;

		return this.#inputForSaveSortTools;
	}

	#getDraggable(): Draggable
	{
		if (this.#draggable)
		{
			return this.#draggable;
		}

		this.#draggable = new Draggable({
			container: [this.#getToolsWrapperRow().render()],
			draggable: '.--tool-selector',
			dragElement: '.ui-section__dragdrop-icon-wrapper',
			type: Draggable.CLONE,
		});

		return this.#draggable;
	}

	#getToolsWrapperRow(): Row
	{
		if (this.#toolsWrapperRow)
		{
			return this.#toolsWrapperRow;
		}

		this.#toolsWrapperRow = new Row({});

		return this.#toolsWrapperRow;
	}

	#getWarningMessage(toolId, bindElement, message)
	{
		return BX.PopupWindowManager.create(
			toolId,
			bindElement,
			{
				content: message,
				darkMode: true,
				autoHide: true,
				angle: true,
				offsetLeft: 14,
				bindOptions: {
					position: 'bottom',
				},
				closeByEsc: true,
			}
		);
	}

	#showEnableConfirmation(tool: ToolConfig, switcher: Switcher): void
	{
		if (tool.enableConfirmation.jsExtension && tool.enableConfirmation.jsExportName)
		{
			this.#showCustomEnableConfirmation(tool, switcher);
		}
		else
		{
			this.#showSimpleEnableConfirmation(tool);
		}
	}

	#showSimpleEnableConfirmation(tool: ToolConfig): void
	{
		MessageBox.show({
			title: tool.enableConfirmation.title,
			message: tool.enableConfirmation.text,
			useAirDesign: true,
			okCaption: tool.enableConfirmation.confirmCaption,
			buttons: MessageBoxButtons.OK,
			maxWidth: 360,
			popupOptions: {
				id: 'enable-tool-confirmation-' + tool.code,
			},
		});
	}

	#showCustomEnableConfirmation(tool: ToolConfig, switcher: Switcher): void
	{
		this.#setSaveButtonDisabled(true);

		Runtime.loadExtension(tool.enableConfirmation.jsExtension).then((exports) => {
			const PopupClass = exports[tool.enableConfirmation.jsExportName];
			if (!PopupClass)
			{
				this.#setSaveButtonDisabled(false);

				return;
			}

			const popup = new PopupClass({
				formNode: this.getFormNode(),
				toolCode: tool.code,
			});
			popup.show()
				.then(() => {
					this.#setSaveButtonDisabled(false);
				})
				.catch(() => {
					switcher.check(false, false);
					this.#setSaveButtonDisabled(false);
				});
		});
	}

	#setSaveButtonDisabled(disabled: boolean): void
	{
		const saveBtn = document.querySelector('#intranet-settings-page #ui-button-panel-save');
		if (saveBtn)
		{
			saveBtn.disabled = disabled;

			if (disabled)
			{
				Dom.addClass(saveBtn, 'ui-btn-disabled');
			}
			else
			{
				Dom.removeClass(saveBtn, 'ui-btn-disabled');
			}
		}
	}

	#showDisableConfirmation(tool: ToolConfig): void
	{
		MessageBox.show({
			title: tool.disableConfirmation.title,
			message: tool.disableConfirmation.text,
			useAirDesign: true,
			okCaption: tool.disableConfirmation.confirmCaption,
			buttons: MessageBoxButtons.OK,
			maxWidth: 360,
			popupOptions: {
				id: 'disable-tool-confirmation-' + tool.code,
			},
		});
	}
}
