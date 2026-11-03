import {
	Cache,
	Type,
	Dom,
	Text,
	Tag,
	Loc,
} from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'clipboard';
import 'ui.switcher';
import 'ui.layout-form';
import 'main.date';
import { Backend } from './backend';

type exportLinkType = {
	id: ?number,
	objectId: ?number,
	link: ?string,
	hash: ?string,
	hasPassword: ?boolean,
	hasDeathTime: ?boolean,
	availableEdit: ?boolean,
	canEditDocument: ?boolean,
	canEditSettings: ?boolean,
	deathTime: ?string,
	deathTimeTimestamp ?: number,
	isBoard: boolean,
	supportsSharingAccessPopup: ?boolean,
};

type InputOptions = {
	layout?: 'horizontal' | 'vertical',
	switcherLabelId?: ?string,
	testId?: {
		container?: ?string,
		switcher?: ?string,
		link?: ?string,
		copy?: ?string,
		settings?: ?string,
	},
};

const LAYOUT_VERTICAL = 'vertical';
const LAYOUT_VERTICAL_CLASS = 'disk-control-external-link-block--vertical';

// the fields of the link itself: a reset clears exactly these and keeps the fields describing
// the object (objectId, isBoard, supportsSharingAccessPopup), which outlive any link created for it.
// Keeping them is safe for every caller: the control is bound to one object for its whole life,
// and the grid of Documents builds a new control for every row it draws.
const EMPTY_LINK_DATA = {
	id: null,
	link: null,
	hash: null,
	hasPassword: null,
	hasDeathTime: null,
	availableEdit: null,
	canEditDocument: null,
	canEditSettings: null,
	deathTime: null,
	deathTimeTimestamp: null,
};

const renderSeparator = (): HTMLElement => {
	return Tag.render`<span class="disk-control-external-link-separator">, </span>`;
};

const setTestId = (node: HTMLElement, testId: ?string): void => {
	if (Type.isStringFilled(testId))
	{
		Dom.attr(node, 'data-testid', testId);
	}
};

export default class Input
{
	cache = new Cache.MemoryCache();
	objectId: Number;
	data: exportLinkType = {};
	options: InputOptions = {};

	constructor(objectId, data: ?exportLinkType, options: ?InputOptions)
	{
		this.options = Type.isPlainObject(options) ? options : {};
		this.bindEvents();
		if (Type.isPlainObject(objectId))
		{
			this.objectId = parseInt(objectId.objectId, 10);
			this.setData(objectId, false);
		}
		else
		{
			this.objectId = parseInt(objectId, 10);
			this.setData(data, false);
		}
	}

	setData(data, fireEvent: boolean = true): void
	{
		this.data = Object.assign(this.data, data && Type.isPlainObject(data) ? data : EMPTY_LINK_DATA);
		this.data.id = this.data.id === null ? this.data.id : parseInt(this.data.id, 10);

		this.adjustData();
		EventEmitter.emit(this, 'Disk:ExternalLink:DataSet', data);

		if (fireEvent !== false)
		{
			EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'Disk:ExternalLink:HasChanged', {
				objectId: this.objectId,
				data: this.data,
				target: this,
			});
		}
	}

	adjustData(): void
	{
		if (this.data.id === null)
		{
			this.getSwitcher().check(false, false);
			this.showUnchecked();
		}
		else
		{
			this.getSwitcher().check(true, false);
			this.showChecked();

			this.getLinkContainer().innerHTML = Text.encode(this.data.link);
			this.getLinkContainer().href = Text.encode(this.data.link);

			this.getPasswordContainer().innerHTML = this.data.hasPassword
				? Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_WITH_PASSWORD')
				: Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_WITHOUT_PASSWORD');

			this.getDeathTimeContainer().innerHTML = this.data.hasDeathTime
				? Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_BEFORE')
					.replace(
						'#deathTime#',
						BX.Main.Date.format(
							BX.Main.Date.convertBitrixFormat(Loc.getMessage('FORMAT_DATETIME').replace(':SS', '')),
							new Date(this.data.deathTimeTimestamp * 1000),
						),
					)
				: Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_FOREVER');

			if (this.data.availableEdit === true)
			{
				this.getRightsContainer().innerHTML = this.data.canEditDocument
					? Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_RIGHTS_CAN_EDIT')
					: Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_RIGHTS_CAN_READ');

				Dom.style(this.getRightsContainer(), 'display', '');
				Dom.style(this.getRightsSeparator(), 'display', '');
			}
			else
			{
				Dom.style(this.getRightsContainer(), 'display', 'none');
				Dom.style(this.getRightsSeparator(), 'display', 'none');
			}
		}

		this.syncSwitcherState();
	}

	bindEvents(): void
	{
		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'Disk:ExternalLink:HasChanged',
			({ data: { objectId, data, target } }: BaseEvent) => {
				if (objectId !== this.objectId || Object.is(target, this))
				{
					return;
				}
				this.setData(data, false);
			},
		);
	}

	getBackend(): Backend
	{
		return Backend;
	}

	openSettingsPopup(): mixed
	{
		if (!this.canEditSettings())
		{
			return null;
		}

		return this.constructor.showPopup(this.objectId, this.data);
	}

	canEditSettings(): boolean
	{
		return this.data.canEditSettings !== false;
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('main', () => {
			const copyButton = Tag.render`<button type="button" class="disk-control-external-link-link-icon" aria-label="${Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_COPY')}"></button>`;
			setTestId(copyButton, this.options.testId?.copy);
			BX.clipboard.bindCopyClick(copyButton, {
				text: () => {
					return this.data.link;
				},
				// the confirmation balloon hides itself in a moment: it must not pull the focus off the button
				popup: { focusTrap: false },
			});

			const tune = () => {
				return this.openSettingsPopup();
			};

			const settingsButton = Tag.render`<button type="button" class="disk-control-external-link-subtitle" aria-haspopup="dialog" onclick="${tune}">${this.getDeathTimeContainer()}${this.getPasswordSeparator()}${this.getPasswordContainer()}${this.getRightsSeparator()}${this.getRightsContainer()}</button>`;
			setTestId(settingsButton, this.options.testId?.settings);

			// the base class stays first: showChecked()/showUnchecked() build the active class from classList.item(0)
			const layoutClassName = this.options.layout === LAYOUT_VERTICAL ? ` ${LAYOUT_VERTICAL_CLASS}` : '';

			const container = Tag.render`
				<div class="disk-control-external-link-block${this.data.id === null ? '' : ' disk-control-external-link-block--active'}${layoutClassName}">
					<div class="disk-control-external-link">
						<div class="disk-control-external-link-btn">
							${this.getSwitcher().getNode()}
						</div>
						<div class="disk-control-external-link-main">
							<div class="disk-control-external-link-link-box">
								${this.getLinkContainer()}
								${copyButton}
							</div>
							${settingsButton}
							<div class="disk-control-external-link-text">${Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_IS_NOT_PUBLISHED')}</div>
							<div class="disk-control-external-link-skeleton"></div>
						</div>
					</div>
				</div>
			`;
			setTestId(container, this.options.testId?.container);

			return container;
		});
	}

	getSwitcher(): HTMLElement
	{
		return this.cache.remember('switcher', () => {
			// ui.switcher renders a plain span, so the role, the checked state and the keyboard
			// activation stay on the node this control owns
			const switcherLabel = Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_TITLE');
			const switcherNode = Tag.render`<span class="ui-switcher" role="switch" tabindex="0" aria-checked="${this.data.id === null ? 'false' : 'true'}" aria-label="${switcherLabel}" onkeydown="${this.handleSwitcherKeydown.bind(this)}"></span>`;
			setTestId(switcherNode, this.options.testId?.switcher);

			// where the host already shows the same caption, the switch is named by it: a screen
			// reader must not read the phrase twice, and the caption must not be a name of nothing
			if (Type.isStringFilled(this.options.switcherLabelId))
			{
				Dom.attr(switcherNode, 'aria-label', null);
				Dom.attr(switcherNode, 'aria-labelledby', this.options.switcherLabelId);
			}

			const switcher = new BX.UI.Switcher({
				node: switcherNode,
				checked: this.data.id !== null,
				inputName: 'ACTIVE',
				useAirDesign: true,
			});
			switcher.handlers = { toggled: this.toggle.bind(this, { target: switcher }) };

			return switcher;
		});
	}

	handleSwitcherKeydown(event: KeyboardEvent): void
	{
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		event.preventDefault();
		this.getSwitcher().getNode().click();
	}

	syncSwitcherState(): void
	{
		Dom.attr(this.getSwitcher().getNode(), 'aria-checked', this.getSwitcher().isChecked() ? 'true' : 'false');
	}

	getLinkContainer(): HTMLElement
	{
		return this.cache.remember('link', () => {
			const link = Tag.render`<a href="${Text.encode(this.data.link)}" class="disk-control-external-link-link" target="_blank">${Text.encode(this.data.link)}</a>`;
			setTestId(link, this.options.testId?.link);

			return link;
		});
	}

	getRightsContainer(): HTMLElement
	{
		return this.cache.remember('rights', () => {
			return document.createElement('span');
		});
	}

	getPasswordSeparator(): HTMLElement
	{
		return this.cache.remember('passwordSeparator', renderSeparator);
	}

	getRightsSeparator(): HTMLElement
	{
		return this.cache.remember('rightsSeparator', renderSeparator);
	}

	getDeathTimeContainer(): HTMLElement
	{
		return this.cache.remember('deathTime', () => {
			return document.createElement('span');
		});
	}

	getPasswordContainer(): HTMLElement
	{
		return this.cache.remember('password', () => {
			return document.createElement('span');
		});
	}

	getCanEditTextContainer(): HTMLElement
	{
		return this.cache.remember('canEditText', () => {
			return Tag.render`<div class="ui-ctl-label-text">${Loc.getMessage('DISK_EXTENSION_EXTERNAL_LINK_ALLOW_EDITING')}</div>`;
		});
	}

	toggle({ target }: BaseEvent): void
	{
		this.syncSwitcherState();

		if (target.isChecked())
		{
			this.showLoader();
			void this.getBackend().generateExternalLink(this.objectId)
				.then(({ data: { externalLink } }) => {
					this.setData(externalLink);
					this.hideLoader();
				});
		}
		else
		{
			this.getBackend().disableExternalLink(this.objectId);
			this.setData(null);
		}
	}

	showChecked(): void
	{
		const baseClassName = this.getContainer().classList.item(0);
		const activeClassName = [baseClassName, '--active'].join('');
		Dom.addClass(this.getContainer(), activeClassName);
	}

	showUnchecked(): void
	{
		const baseClassName = this.getContainer().classList.item(0);
		const activeClassName = [baseClassName, '--active'].join('');
		Dom.removeClass(this.getContainer(), activeClassName);
	}

	showLoader(): void
	{
		Dom.addClass(this.getContainer(), 'disk-control-external-link-skeleton--active');
	}

	hideLoader(): void
	{
		Dom.removeClass(this.getContainer(), 'disk-control-external-link-skeleton--active');
	}

	reload(): Promise<void>
	{
		this.showLoader();

		return this.getBackend().getExternalLink(this.objectId)
			.then(({ data }) => {
				this.setData(data && data.externalLink ? data.externalLink : null);
				this.hideLoader();
			});
	}
}
