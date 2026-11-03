import { EventEmitter } from 'main.core.events';
import { Cache, ajax, Event, Runtime, Tag } from 'main.core';
import { PopupComponentsMaker } from 'ui.popupcomponentsmaker';
import { FocusNavigator } from 'ui.a11y';
import type { Popup } from 'main.popup';
import type { ConfigContent } from './types/content';
import type { InvitationPopupOptions } from './types/options';
import { InvitationContent } from './contents/invitation';
import { StructureContent } from './contents/structure';
import { EmployeesContent } from './contents/employees';
import { ExtranetContent } from './contents/extranet';
import { CollabContent } from './contents/collab';
import { UserOnlineContent } from './contents/user-online';

const POPUP_WIDTH = 350;
const POPUP_HORIZONTAL_OFFSET = 40;
const OFFICES_TILE_HEIGHT = 66;

export class InvitationPopup extends EventEmitter
{
	#cache = new Cache.MemoryCache();

	constructor(options: InvitationPopupOptions)
	{
		super();
		this.setEventNamespace('BX.Intranet.InvitationWidget.Popup');
		this.setOptions(options)
		this.#setEventHandler();
	}

	setOptions(options: InvitationPopupOptions): void
	{
		this.#cache.set('options', options);
	}

	getOptions(): InvitationPopupOptions
	{
		return this.#cache.get('options', {});
	}

	show(): void
	{
		const popup = this.getPopup();
		this.#syncPopupPosition(popup.getPopup());
		const wasShown = popup.isShown();

		popup.show();

		if (wasShown)
		{
			this.#applyPopupInitialFocus();
		}
	}

	close(): void
	{
		this.getPopup().close();
	}

	#getAwaitData(): Promise
	{
		return this.#cache.remember('await-data', () => {
			return new Promise((resolve, reject) => {
				ajax.runAction("intranet.invitationwidget.getData", {
					data: {},
					analyticsLabel: {
						headerPopup: "Y"
					}
				}).then(resolve).catch(reject);
			});
		});
	}

	getPopup(): PopupComponentsMaker
	{
		return this.#cache.remember('popup', () => {
			const popup = new PopupComponentsMaker({
				id: 'invitation-popup',
				target: this.getOptions().target,
				width: POPUP_WIDTH,
				content: this.#getContent(),
				popupLoader: this.getOptions().loader,
			});
			const popupWindow = popup.getPopup();
			popupWindow.subscribe('onShow', () => this.#applyPopupInitialFocus());
			this.#observeTargetResize(popupWindow);

			return popup;
		});
	}

	//This is the method for popup content configuration
	#getContent(): Array<ConfigContent>
	{
		return this.#cache.remember('content', () => {
			return [
				this.#getInvitationContent().getConfig(),
				{
					html: [
						{
							...this.#getStructureContent().getConfig(),
							attrs: { role: 'listitem' },
						},
						{
							...this.#getEmployeesContent().getConfig(),
							attrs: { role: 'listitem' },
						},
					],
					marginBottom: 24,
					attrs: { role: 'list' },
				},
				this.#getOfficesTileConfig(),
				this.getOptions().isExtranetAvailable ? this.#getExtranetContent().getConfig() : null,
				this.getOptions().isCollabAvailable ? this.#getCollabContent().getConfig() : null,
				this.#getUserOnlineContent().getConfig(),
			];
		});
	}

	//region Get Content
	#getInvitationContent(): InvitationContent
	{
		return this.#cache.remember('invitation-content', () => {
			return new InvitationContent({
				...this.getOptions(),
			});
		});
	}

	#getStructureContent(): StructureContent
	{
		return this.#cache.remember('structure-content', () => {
			return new StructureContent({
				...this.getOptions(),
			});
		});
	}

	#getEmployeesContent(): EmployeesContent
	{
		return this.#cache.remember('employees-content', () => {
			return new EmployeesContent({
				...this.getOptions(),
			});
		});
	}

	#getOfficesTileConfig(): ConfigContent | null
	{
		const offices = this.getOptions().offices;

		if (!offices)
		{
			return null;
		}

		const { count, url } = offices;
		const renderTilePlaceholder = () => Tag.render`<div></div>`;

		return {
			html: Runtime.loadExtension('stafftrack.offices-tile')
				.then(({ OfficesTile }) => OfficesTile.create({ count, url })?.getLayout() ?? renderTilePlaceholder())
				.catch(renderTilePlaceholder),
			minHeight: `${OFFICES_TILE_HEIGHT}px`,
			marginBottom: 24,
		};
	}

	#getExtranetContent(): ExtranetContent
	{
		return this.#cache.remember('extranet-content', () => {
			return new ExtranetContent({
				...this.getOptions(),
			});
		});
	}

	#getCollabContent(): CollabContent
	{
		return this.#cache.remember('collab-content', () => {
			return new CollabContent({
				...this.getOptions(),
				awaitData: Runtime.loadExtension('im.public', 'im.v2.component.content.chat-forms.forms'),
			});
		});
	}

	#getUserOnlineContent(): UserOnlineContent
	{
		return this.#cache.remember('user-online-content', () => {
			return new UserOnlineContent();
		});
	}
	//endregion

	#getPopupContainer(): HTMLElement
	{
		return this.#cache.remember('popup-container', () => {
			return this.getPopup().getPopup().getPopupContainer();
		});
	}

	#applyPopupInitialFocus(): void
	{
		const focusTrap = this.getPopup().getPopup().getFocusTrap();
		const activeElement = FocusNavigator.getActiveElement();

		if (
			focusTrap
			&& (
				activeElement === this.getOptions().button
				|| (activeElement && focusTrap.contains(activeElement))
			)
		)
		{
			FocusNavigator.focusContainer(this.#getPopupContainer(), { preventScroll: true });
		}
	}

	#syncPopupPosition(popup: Popup): void
	{
		const target = this.getOptions().target;
		if (!target)
		{
			return;
		}

		popup.setOffset({
			offsetTop: 0,
			offsetLeft: -(POPUP_WIDTH / 2) + (target.offsetWidth / 2) + POPUP_HORIZONTAL_OFFSET,
		});

		if (popup.isShown())
		{
			popup.adjustPosition({ forceBindPosition: true });
		}
	}

	#observeTargetResize(popup: Popup): void
	{
		const target = this.getOptions().target;
		if (!target)
		{
			return;
		}

		const resizeObserver = new ResizeObserver(() => this.#syncPopupPosition(popup));
		resizeObserver.observe(target);
		popup.subscribeOnce('onDestroy', () => resizeObserver.disconnect());
	}

	#setEventHandler()
	{
		const autoHideHandler = (event) => {
			if (event.data.popup)
			{
				setTimeout(() => {
					Event.bind(this.#getPopupContainer(), 'click', () => {
						event.data.popup.close();
					});
				}, 100);
			}
		}

		const close = () => {
			this.close();
		}

		EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.EmployeesContent:showRightMenu', autoHideHandler);
		EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.InvitationWidget.HintPopup:show', autoHideHandler);
		EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.UstatOnline:showPopup', autoHideHandler);
		EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onOpenStart', close);
	}
}
