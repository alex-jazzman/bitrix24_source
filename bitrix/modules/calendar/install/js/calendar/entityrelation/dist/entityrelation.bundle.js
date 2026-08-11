/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_loader, im_public, ui_iconSet_api_core) {
	'use strict';

	class Bar {
		constructor(options) {
			this.parentNode = options.parentNode;
			this.init();
		}
		init() {
			this.bar = main_core.Tag.render`
			<div class="calendar-relation-bar">
			</div>
		`;
			main_core.Event.bind(this.bar, 'mouseenter', () => {
				main_core_events.EventEmitter.emit('BX.Calendar.EntityRelation.onMouseEnter');
			});
		}
		renderLoader() {
			main_core.Dom.clean(this.bar);
			if (!this.loaderWrap) {
				this.loaderWrap = main_core.Tag.render`<div class="calendar-relation-bar-loader"></div>`;
			}
			main_core.Dom.append(this.loaderWrap, this.bar);
			this.showLoader();
			return this.bar;
		}
		showLoader() {
			if (this.loader) {
				this.loader.destroy();
			}
			this.loader = new main_loader.Loader({
				target: this.loaderWrap,
				size: 22,
				color: '#2066B0',
				offset: {
					left: '0px',
					top: '0px'
				},
				mode: 'inline'
			});
			this.loader.show();
		}
		render(relationData, entityLink) {
			main_core.Dom.clean(this.bar);
			main_core.Dom.append(entityLink, this.bar);
			main_core.Dom.append(this.getOwnerData(relationData), this.bar);
			return this.bar;
		}
		getEntityLink({
			link = '#',
			text,
			title
		}) {
			const arrowIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CHEVRON_RIGHT_M,
				size: 20,
				color: 'rgb(130, 139, 149)'
			});
			return main_core.Tag.render`
			<a
				class="calendar-relation-entity-link"
				href="${link}"
				title="${title}"
			>
				<div class="calendar-relation-entity-link-text">
					${text}
				</div>
				<div class="calendar-relation-entity-link-arrow">
					${arrowIcon.render()}
				</div>
			</a>
		`;
		}
		getOwnerData(relationData) {
			const chatIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.MESSAGES,
				size: 22,
				color: 'rgb(0, 117, 255)'
			});
			const {
				root,
				chatButton
			} = main_core.Tag.render`
			<div class="calendar-relation-owner">
				<div class="calendar-relation-owner-role">${main_core.Loc.getMessage('CALENDAR_RELATION_OWNER_ROLE_DEAL')}</div>
				<div class="calendar-relation-owner-info">
					${this.getOwnerAvatarNode(relationData)}
					${this.getOwnerNameNode(relationData)}
					<div
						ref="chatButton"
						class="calendar-relation-owner-chat"
						title="${main_core.Loc.getMessage('CALENDAR_RELATION_CHAT_BUTTON_HINT')}"
					>
						${chatIcon.render()}
					</div>
				</div>
			</div>
		`;
			main_core.Event.bind(chatButton, 'click', () => this.openChat(relationData.owner.id));
			return root;
		}
		getOwnerAvatarNode(relationData) {
			const avatarWrap = main_core.Tag.render`
			<a
				href="${relationData.owner.link}"
				class="calendar-relation-owner-avatar ui-icon ui-icon-common-user"
				title="${main_core.Loc.getMessage('CALENDAR_RELATION_OWNER_PROFILE_HINT')}"
			>
			</a>
		`;
			let avatar = null;
			if (relationData.owner.avatar) {
				avatar = main_core.Tag.render`
				<img
					src="${encodeURI(relationData.owner.avatar)}"
					alt=""
				/>
			`;
			} else {
				avatar = main_core.Tag.render`
				<i></i>
			`;
			}
			main_core.Dom.append(avatar, avatarWrap);
			return avatarWrap;
		}
		getOwnerNameNode(relationData) {
			return main_core.Tag.render`
			<a
				class="calendar-relation-owner-name"
				href="${relationData.owner.link}"
				title="${main_core.Loc.getMessage('CALENDAR_RELATION_OWNER_PROFILE_HINT')}"
			>
				${relationData.owner.name}
			</a>
		`;
		}
		openChat(chatId) {
			im_public.Messenger.openChat(chatId);
		}
	}

	class BookingBar {
		#bar;
		#BookingEventPopup = null;
		constructor(bar) {
			this.#bar = bar;
		}
		render(relationData) {
			main_core.Runtime.loadExtension('booking.application.booking-event-popup').then(exports => {
				this.#BookingEventPopup = exports.BookingEventPopup;
			}).catch(error => {
				console.error('Calendar. EntityRelation. Load BookingEventPopup extension error', error);
			});
			return this.#bar.render(relationData, this.#getEntityLink(relationData));
		}
		#getEntityLink(relationData) {
			const entityLink = this.#bar.getEntityLink({
				link: relationData.entity.link,
				text: main_core.Loc.getMessage('CALENDAR_RELATION_ENTITY_LINK_BOOKING'),
				title: main_core.Loc.getMessage('CALENDAR_RELATION_ENTITY_LINK_BOOKING')
			});
			main_core.Event.bind(entityLink, 'click', async event => {
				event.preventDefault();
				await this.#openBooking(relationData.entity.id);
			});
			return entityLink;
		}
		async #openBooking(bookingId) {
			if (!this.#BookingEventPopup) {
				return;
			}
			await new this.#BookingEventPopup({
				bookingId
			}).show();
		}
	}

	class DealBar {
		#bar;
		constructor(bar) {
			this.#bar = bar;
		}
		render(relationData) {
			return this.#bar.render(relationData, this.#getEntityLink(relationData));
		}
		#getEntityLink(relationData) {
			return this.#bar.getEntityLink({
				link: relationData.entity.link,
				text: main_core.Loc.getMessage('CALENDAR_RELATION_ENTITY_LINK_DEAL'),
				title: main_core.Loc.getMessage('CALENDAR_RELATION_OPEN_ENTITY_HINT_DEAL')
			});
		}
	}

	class Client {
		static async getRelationData(eventId) {
			if (main_core.Type.isNil(eventId)) {
				return false;
			}
			const action = 'calendar.api.calendarentryajax.getEventEntityRelation';
			const data = {
				eventId
			};
			const response = await main_core.ajax.runAction(action, {
				data
			}).then(ajaxResponse => {
				return ajaxResponse;
			}, () => {
				return null;
			});
			return response?.data || false;
		}
	}

	class RelationCollection {
		static map = new Map();
		static getRelation(eventId) {
			return RelationCollection.map.get(eventId) ?? false;
		}
		static setRelation(relationData) {
			RelationCollection.map.set(relationData.eventId, relationData);
		}
	}

	const HELP_DESK_CODE = 25_570_792;
	class EntityRelationsHeader {
		render() {
			return main_core.Tag.render`
			<div class="calendar--relation-entities-header">
				<h6 class="calendar--relation-entities-title">
					${main_core.Loc.getMessage('CALENDAR_RELATIONS_TITLE')}
				</h6>
				<span class="calendar--relation-entities-help-desk-icon">
					${this.#getHelpDeskIcon()}
				</span>
			</div>
		`;
		}
		#getHelpDeskIcon() {
			const helpDeskIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.QUESTION,
				size: 16,
				color: 'rgba(167, 167, 167, 1)'
			}).render();
			main_core.Event.bind(helpDeskIcon, 'click', () => this.#showHelpDesk());
			return helpDeskIcon;
		}
		#showHelpDesk() {
			if (!top.BX.Helper) {
				return;
			}
			const params = {
				redirect: 'detail',
				code: HELP_DESK_CODE,
				anchor: 'comm'
			};
			const queryString = Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&');
			top.BX.Helper.show(queryString);
		}
	}

	class RelationInterface {
		constructor(options) {
			this.bar = new Bar({
				parentNode: options.parentNode
			});
			this.eventId = options.eventId ?? null;
			this.relationData = RelationCollection.getRelation(this.eventId) || null;
			this.layout = null;
		}
		render() {
			if (main_core.Type.isNil(this.relationData)) {
				this.layout = this.bar.renderLoader();
				void this.showLazy();
			} else if (this.relationData) {
				this.layout = this.#renderBar(this.relationData);
			}
			return this.#wrapLayout(this.layout);
		}
		async showLazy() {
			this.relationData = await Client.getRelationData(this.eventId);
			if (this.relationData) {
				RelationCollection.setRelation(this.relationData);
				const barLayout = this.#renderBar(this.relationData);
				main_core.Dom.replace(this.layout, barLayout);
				this.layout = barLayout;
			} else {
				this.destroy();
			}
		}
		destroy() {
			main_core.Dom.remove(this.layout);
			this.layout = null;
		}
		#renderBar(relationData) {
			if (relationData.entity.type === 'deal') {
				return new DealBar(this.bar).render(relationData);
			}
			if (relationData.entity.type === 'booking') {
				return new BookingBar(this.bar).render(relationData);
			}
			return null;
		}
		#wrapLayout(layout) {
			if (layout === null) {
				return layout;
			}
			return main_core.Tag.render`
			<div class="calendar--relation-entities-wrapper">
				${new EntityRelationsHeader().render()}
				${this.layout}
			</div>
		`;
		}
	}

	exports.RelationInterface = RelationInterface;

})(this.BX.Calendar = this.BX.Calendar || {}, BX, BX.Event, BX, BX.Messenger.v2.Lib, BX.UI.IconSet);
//# sourceMappingURL=entityrelation.bundle.js.map
