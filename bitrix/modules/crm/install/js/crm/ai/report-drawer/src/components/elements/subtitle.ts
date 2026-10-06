import { defineComponent, markRaw, PropType } from 'ui.vue3';
import { Type, Loc, Tag, Dom, Event, Text } from 'main.core';
import { type Menu, MenuManager } from 'main.popup';
import { EntityMiniCard } from 'crm.mini-card';
import { ManagerPopupContent } from '../popups/manager-popup-content';
import { PopupController } from '../popups/popup-controller';

import {
	type SubtitleData,
	type CallSubtitleData,
	type OpenLinesSubtitleData,
	type ClientData,
	type ResponsibleData,
} from '../../types';

const CLIENT_LINK_ID = 'crm-ai-report-drawer-client-name';
const MANAGER_LINK_ID = 'crm-ai-report-drawer-manager-name';
const MORE_MANAGERS_LINK_ID = 'crm-ai-report-drawer-more-managers';

export const Subtitle = defineComponent({
	name: 'Subtitle',

	props: {
		subtitleData: {
			type: Object as PropType<SubtitleData>,
			required: true,
		},
	},

	data()
	{
		return {
			runtime: markRaw({
				responsiblePopup: null as null | PopupController,
				additionalManagerPopups: [] as PopupController[],
				moreManagersMenu: null as null | Menu,
				moreManagersMenuId: null as null | string,
				moreManagersMenuCloseTimeout: null as null | number,
			}),
		};
	},

	methods: {
		getCallSubtitleData(): CallSubtitleData | null
		{
			if (this.subtitleData.type === 'open-lines')
			{
				return null;
			}

			return this.subtitleData.data as CallSubtitleData;
		},

		getOpenLinesSubtitleData(): OpenLinesSubtitleData | null
		{
			if (this.subtitleData.type !== 'open-lines')
			{
				return null;
			}

			return this.subtitleData.data as OpenLinesSubtitleData;
		},

		getCurrentClientData(): ClientData | null
		{
			if (this.subtitleData.type === 'open-lines')
			{
				return this.getOpenLinesSubtitleData()?.client ?? null;
			}

			return this.getCallSubtitleData()?.client ?? null;
		},

		getResponsibleData(): ResponsibleData | null
		{
			return this.getCallSubtitleData()?.responsible ?? null;
		},

		getPrimaryManagerData(): ResponsibleData | null
		{
			if (this.subtitleData.type === 'open-lines')
			{
				return this.getOpenLinesSubtitleData()?.managers[0] ?? null;
			}

			return this.getResponsibleData();
		},

		getAdditionalManagersData(): ResponsibleData[]
		{
			if (this.subtitleData.type !== 'open-lines')
			{
				return [];
			}

			return this.getOpenLinesSubtitleData()?.managers.slice(1) ?? [];
		},

		getClientLinkMarkup(client: ClientData): string
		{
			if (!Type.isStringFilled(client.clientDetailsUrl))
			{
				return `
					<span
						id="${CLIENT_LINK_ID}"
						class="crm-ai-report-drawer__subtitle-highlight"
					>
						${Text.encode(client.clientName)}
					</span>
				`.trim();
			}

			return `
				<a
					href="${client.clientDetailsUrl}"
					id="${CLIENT_LINK_ID}"
					class="crm-ai-report-drawer__subtitle-highlight"
				>
					${Text.encode(client.clientName)}
				</a>
			`.trim();
		},

		getClientMarkup(client: ClientData): string
		{
			if ((client.clientEntityTypeId ?? 0) <= 0 || (client.clientId ?? 0) <= 0)
			{
				return Text.encode(client.clientName);
			}

			return this.getClientLinkMarkup(client);
		},

		getManagerLinkMarkup(responsible: ResponsibleData): string
		{
			if (!Type.isStringFilled(responsible.responsibleProfileUrl))
			{
				return `
					<span
						id="${MANAGER_LINK_ID}"
						class="crm-ai-report-drawer__subtitle-highlight"
					>
						${Text.encode(responsible.responsibleName)}
					</span>
				`.trim();
			}

			return `
				<a
					href="${responsible.responsibleProfileUrl}"
					id="${MANAGER_LINK_ID}"
					class="crm-ai-report-drawer__subtitle-highlight"
				>
					${Text.encode(responsible.responsibleName)}
				</a>
			`.trim();
		},

		getMoreManagersButtonOpenMarkup(): string
		{
			return `
				<button
					type="button"
					id="${MORE_MANAGERS_LINK_ID}"
					class="crm-ai-report-drawer__subtitle-more-managers"
				>
			`.trim();
		},

		renderCallSubtitle(
			messageCode: string,
			client: ClientData | null,
			responsible: ResponsibleData | null,
		): HTMLElement
		{
			const stringElement = Loc.getMessage(
				messageCode,
				{
					'#CLIENT_NAME#': Type.isNil(client) ? '' : this.getClientMarkup(client),
					'#MANAGER_NAME#': Type.isNil(responsible) ? '' : this.getManagerLinkMarkup(responsible),
				},
			) ?? '';

			return Tag.render`<span>${stringElement}</span>`;
		},

		getIncomingCallSubtitle(): null | HTMLElement
		{
			const data = this.getCallSubtitleData();
			if (Type.isNil(data))
			{
				return null;
			}

			return this.renderCallSubtitle(
				'CRM_AI_REPORT_DRAWER_HEADER_INCOMING_CALL',
				data.client,
				data.responsible,
			);
		},

		getOutgoingCallSubtitle(): null | HTMLElement
		{
			const data = this.getCallSubtitleData();
			if (Type.isNil(data))
			{
				return null;
			}

			return this.renderCallSubtitle(
				'CRM_AI_REPORT_DRAWER_HEADER_OUTGOING_CALL',
				data.client,
				data.responsible,
			);
		},

		getOpenLinesSubtitle(): null | HTMLElement
		{
			const data = this.getOpenLinesSubtitleData();
			if (Type.isNil(data))
			{
				return null;
			}

			const clientMarkup = this.getClientMarkup(data.client);
			const primaryManager = data.managers[0];
			const additionalManagerCount = this.getAdditionalManagersData().length;
			const hasAdditionalManagers = additionalManagerCount > 0;
			const messageCode = hasAdditionalManagers
				? 'CRM_AI_REPORT_DRAWER_HEADER_OPEN_LINES_MULTIPLE_MANAGERS'
				: 'CRM_AI_REPORT_DRAWER_HEADER_OPEN_LINES_SINGLE_MANAGER'
			;

			const stringElement = Loc.getMessage(
				messageCode,
				{
					'#CLIENT_NAME#': clientMarkup,
					'#MANAGER_NAME#': this.getManagerLinkMarkup(primaryManager),
					'#BUTTON_START#': this.getMoreManagersButtonOpenMarkup(),
					'#BUTTON_END#': '</button>',
					'#MANAGER_COUNT#': String(additionalManagerCount),
				},
			) ?? '';

			return Tag.render`<span>${stringElement}</span>`;
		},

		bindClientMiniCard(): void
		{
			const clientNameContainer = (this.$refs.subtitleSection as HTMLElement).querySelector(`#${CLIENT_LINK_ID}`);
			const client = this.getCurrentClientData();

			if (
				!clientNameContainer
				|| Type.isNil(client)
				|| (client.clientEntityTypeId ?? 0) <= 0
				|| (client.clientId ?? 0) <= 0
			)
			{
				return;
			}

			new EntityMiniCard({
				bindElement: clientNameContainer as HTMLElement,
				entityTypeId: client.clientEntityTypeId ?? 0,
				entityId: client.clientId ?? 0,
			});
		},

		getManagerLinkContainer(): HTMLElement | null
		{
			return (this.$refs.subtitleSection as HTMLElement).querySelector(`#${MANAGER_LINK_ID}`);
		},

		destroyResponsiblePopup(): void
		{
			this.runtime.responsiblePopup?.destroy();
			this.runtime.responsiblePopup = null;
		},

		bindResponsiblePopup(): void
		{
			const managerLinkContainer = this.getManagerLinkContainer();
			const responsible = this.getPrimaryManagerData();
			if (!managerLinkContainer || Type.isNil(responsible))
			{
				return;
			}

			this.destroyResponsiblePopup();
			this.runtime.responsiblePopup = new PopupController({
				bindElement: managerLinkContainer,
				trigger: 'hover',
				component: ManagerPopupContent,
				props: {
					responsible,
				},
				popupOptions: {
					width: 360,
					className: 'crm-ai-report-drawer__popup-wrapper --manager',
				},
			});
		},

		getMoreManagersMenuId(): string
		{
			this.runtime.moreManagersMenuId ??= `crm-ai-report-drawer-more-managers-${Text.getRandom()}`;

			return this.runtime.moreManagersMenuId;
		},

		getMoreManagersLinkContainer(): HTMLElement | null
		{
			return (this.$refs.subtitleSection as HTMLElement).querySelector(`#${MORE_MANAGERS_LINK_ID}`);
		},

		destroyAdditionalManagerPopups(): void
		{
			this.runtime.additionalManagerPopups.forEach((controller) => controller.destroy());
			this.runtime.additionalManagerPopups = [];
		},

		cancelMoreManagersMenuClose(): void
		{
			const timeoutId = this.runtime.moreManagersMenuCloseTimeout;
			if (!Type.isNumber(timeoutId))
			{
				return;
			}

			clearTimeout(timeoutId);
			this.runtime.moreManagersMenuCloseTimeout = null;
		},

		scheduleMoreManagersMenuClose(menu: Menu): void
		{
			this.cancelMoreManagersMenuClose();
			this.runtime.moreManagersMenuCloseTimeout = window.setTimeout(() => {
				menu.close();
				this.runtime.moreManagersMenuCloseTimeout = null;
			}, 120);
		},

		destroyMoreManagersMenu(): void
		{
			this.cancelMoreManagersMenuClose();
			this.runtime.moreManagersMenu?.destroy();
			this.runtime.moreManagersMenu = null;
			this.runtime.moreManagersMenuId = null;
			this.destroyAdditionalManagerPopups();
		},

		renderMoreManagersMenuItem(manager: ResponsibleData): HTMLElement
		{
			const itemContainer = Tag.render`<div class="crm-ai-report-drawer__managers-menu-item"></div>`;
			const avatarContainer = Tag.render`
				<span class="ui-icon ui-icon-common-user crm-ai-report-drawer__managers-menu-item-avatar">
					<i></i>
				</span>
			`;
			const nameContainer = Type.isStringFilled(manager.responsibleProfileUrl)
				? Tag.render`
					<a
						href="${manager.responsibleProfileUrl}"
						class="crm-ai-report-drawer__managers-menu-item-link"
						data-manager-id="${manager.responsibleId}"
					>
						${Text.encode(manager.responsibleName)}
					</a>
				`
				: Tag.render`
					<span
						class="crm-ai-report-drawer__managers-menu-item-link"
						data-manager-id="${manager.responsibleId}"
					>
						${Text.encode(manager.responsibleName)}
					</span>
				`
			;

			if (Type.isStringFilled(manager.responsibleAvatarUrl))
			{
				Dom.style(
					avatarContainer.querySelector('i') as HTMLElement,
					'background-image',
					`url('${encodeURI(Text.encode(manager.responsibleAvatarUrl))}')`,
				);
			}

			Dom.append(avatarContainer, itemContainer);
			Dom.append(nameContainer, itemContainer);

			return itemContainer;
		},

		bindAdditionalManagerPopups(menu: Menu, managers: ResponsibleData[]): void
		{
			const popupContainer = menu.getPopupWindow().getPopupContainer();
			const managersById = new Map(managers.map((manager) => [String(manager.responsibleId), manager]));
			const controllers: PopupController[] = [];

			popupContainer.querySelectorAll('[data-manager-id]').forEach((element) => {
				const managerId = (element as HTMLElement).dataset.managerId ?? '';
				const manager = managersById.get(managerId);
				if (Type.isNil(manager))
				{
					return;
				}

				controllers.push(new PopupController({
					bindElement: element as HTMLElement,
					trigger: 'hover',
					component: ManagerPopupContent,
					props: {
						responsible: manager,
					},
					popupOptions: {
						width: 360,
						className: 'crm-ai-report-drawer__popup-wrapper --manager',
					},
				}));
			});

			this.runtime.additionalManagerPopups = controllers;
		},

		bindMoreManagersMenu(): void
		{
			if (this.subtitleData.type !== 'open-lines')
			{
				return;
			}

			const moreManagersLinkContainer = this.getMoreManagersLinkContainer();
			const managers = this.getAdditionalManagersData();
			if (!moreManagersLinkContainer || managers.length === 0)
			{
				return;
			}

			this.destroyMoreManagersMenu();

			const menuId = this.getMoreManagersMenuId();
			const menu = MenuManager.create({
				id: menuId,
				bindElement: moreManagersLinkContainer,
				cacheable: true,
				className: 'crm-ai-report-drawer__managers-menu',
				closeByEsc: true,
				maxWidth: 280,
				animation: 'fading-slide',
				navigationOptions: {
					initialFocusPosition: 'first',
				},
				items: managers.map((manager) => ({
					html: this.renderMoreManagersMenuItem(manager) as any,
					attrs: {},
					onclick: () => {
						menu.close();

						return {};
					},
				})),
			});

			const popupContainer = menu.getPopupWindow().getPopupContainer();
			Event.bind(popupContainer, 'mouseenter', () => {
				this.cancelMoreManagersMenuClose();
			});
			Event.bind(popupContainer, 'mouseleave', () => {
				this.scheduleMoreManagersMenuClose(menu);
			});

			menu.subscribe('onShow', () => {
				this.cancelMoreManagersMenuClose();
				this.destroyAdditionalManagerPopups();
				this.bindAdditionalManagerPopups(menu, managers);
			});

			menu.subscribe('onClose', () => {
				this.cancelMoreManagersMenuClose();
				this.destroyAdditionalManagerPopups();
			});

			this.runtime.moreManagersMenu = menu;

			Event.bind(
				moreManagersLinkContainer,
				'mouseenter',
				() => {
					this.cancelMoreManagersMenuClose();
					menu.show();
				},
			);

			Event.bind(
				moreManagersLinkContainer,
				'mouseleave',
				() => {
					this.scheduleMoreManagersMenuClose(menu);
				},
			);
		},
	},

	mounted(): void
	{
		let subtitleElement = null;
		switch (this.subtitleData.type)
		{
			case 'incoming-call':
				subtitleElement = this.getIncomingCallSubtitle();
				break;
			case 'outgoing-call':
				subtitleElement = this.getOutgoingCallSubtitle();
				break;
			case 'open-lines':
				subtitleElement = this.getOpenLinesSubtitle();
				break;
			default:
				return;
		}

		if (Type.isNull(subtitleElement))
		{
			return;
		}

		Dom.append(subtitleElement, this.$refs.subtitleSection as HTMLElement);
		this.bindClientMiniCard();
		this.bindResponsiblePopup();
		this.bindMoreManagersMenu();
	},

	beforeUnmount(): void
	{
		this.destroyResponsiblePopup();
		this.destroyMoreManagersMenu();
	},

	template: `
		<span class="crm-ai-report-drawer__subtitle ui-typography-text-md" ref="subtitleSection" />
	`,
});
