import {ajax, Dom, Event, Loc, Tag, Type} from 'main.core';
import {PopupWindowManager} from 'main.popup';
import {Loader} from 'main.loader';

import './css/members.css';
import './css/popup.css';
import './css/role.css';
import './css/scrum-members.css';

export class ProjectMembersPopup
{
	#popup = null;
	#isPopupShown = false;
	#loader = null;
	#groupId = 0;
	#currentType = 'all';
	#popupData = {};
	#actionPrefix = 'socialnetwork.v2.Project';
	#paramName = 'projectId';
	#routeConfig = null;
	#isScrumPopup = false;
	#componentName = '';
	#signedParameters = '';

	constructor(options: ?Object)
	{
		this.#isScrumPopup = options?.popupType === 'scrum';
		this.#componentName = options?.componentName || '';
		this.#signedParameters = options?.signedParameters || '';
		this.#actionPrefix = options?.actionPrefix || 'socialnetwork.v2.Project';
		this.#paramName = options?.paramName
			|| (
				this.#actionPrefix.includes('Scrum')
					? 'scrumId'
					: (this.#actionPrefix.includes('LegacyGroup') ? 'legacyGroupId' : 'projectId')
			)
		;
	}

	showPopup(groupId: number, routeConfig: ?Object, bindNode: HTMLElement, type: string = 'all'): void
	{
		if (this.#isPopupShown)
		{
			this.#popup.destroy();
		}

		this.#groupId = groupId;
		this.#routeConfig = Type.isPlainObject(routeConfig) ? routeConfig : null;
		this.#resetPopupData();
		this.#changeType(type, false);

		this.#popup = PopupWindowManager.create({
			id: 'workgroup-grid-members-popup-menu',
			className: 'sonet-ui-members-popup',
			bindElement: bindNode,
			autoHide: true,
			closeByEsc: true,
			lightShadow: true,
			bindOptions: {position: 'bottom'},
			animationOptions: {
				show: {type: 'opacity-transform'},
				close: {type: 'opacity'},
			},
			events: {
				onPopupDestroy: () => {
					this.#loader = null;
					this.#isPopupShown = false;
				},
				onPopupClose: () => {
					this.#popup.destroy();
				},
				onAfterPopupShow: () => {
					this.#popup.contentContainer.appendChild(this.#renderContainer());
					this.#showLoader();
					this.#loadUsers(groupId, type);
					this.#isPopupShown = true;
				},
			},
		});
		this.#bindScroll(groupId, type);
		this.#popup.show();
	}

	#loadUsers(groupId: number, type: string): void
	{
		const popupData = this.#getCurrentPopupData();
		const route = this.#getRouteConfig();
		// Legacy scrum popup is the only source that already returns owner / scrum master / team roles.
		const request = this.#isScrumPopup
			? ajax.runAction('socialnetwork.api.workgroup.getGridPopupMembers', {
				data: {
					groupId,
					type,
					page: popupData.currentPage,
					componentName: this.#componentName,
					signedParameters: this.#signedParameters,
				},
			})
			: ajax.runAction(`${route.actionPrefix}.getMembers`, {
				json: {
					[route.paramName]: groupId,
					type,
					page: popupData.currentPage,
				},
			})
		;

		request.then(
			(response) => {
				if (this.#groupId !== groupId || this.#currentType !== type)
				{
					this.#hideLoader();
					return;
				}

				const data = response.data || [];
				if (data.length > 0)
				{
					this.#renderUsers(data);
					this.#bindScroll(groupId, this.#currentType);
				}
				else if (!popupData.innerContainer.hasChildNodes())
				{
					popupData.innerContainer.innerText =
						Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_EMPTY') || '';
				}
				popupData.currentPage++;
				this.#hideLoader();
			},
			() => this.#hideLoader(),
		);
	}

	#renderUsers(users: Array): void
	{
		if (this.#isScrumPopup && this.#currentType === 'scrumTeam')
		{
			this.#renderScrumUsers(users);

			return;
		}

		const popupData = this.#getCurrentPopupData();

		users.forEach((user) => {
			if (popupData.renderedUsers.indexOf(user.ID) >= 0)
			{
				return;
			}
			popupData.renderedUsers.push(user.ID);

			popupData.innerContainer.appendChild(
				Tag.render`
					<a class="sonet-ui-members-popup-item" href="${user.HREF}" target="_blank">
						${this.#renderAvatar(user)}
						<span class="sonet-ui-members-popup-name">${user.FORMATTED_NAME}</span>
					</a>
				`,
			);
		});
	}

	#renderScrumUsers(users: Array): void
	{
		const popupData = this.#getCurrentPopupData();
		const containersMap = {
			A: 'sonet-ui-scrum-members-popup-owner-container',
			M: 'sonet-ui-scrum-members-popup-master-container',
			E: 'sonet-ui-scrum-members-popup-team-container',
		};

		this.#renderScrumLabels(users);

		users.forEach((user) => {
			if (popupData.renderedUsers.indexOf(user.ID) >= 0 && user.ROLE !== 'M')
			{
				return;
			}

			popupData.renderedUsers.push(user.ID);

			const containerClass = containersMap[user.ROLE];
			if (!Type.isStringFilled(containerClass))
			{
				return;
			}

			const container = popupData.innerContainer.querySelector(`.${containerClass}`);
			if (!container)
			{
				return;
			}

			container.appendChild(
				Tag.render`
					<a class="sonet-ui-members-popup-item" href="${user.HREF}" target="_blank">
						${this.#renderAvatar(user)}
						<span class="sonet-ui-scrum-members-popup-name">${user.FORMATTED_NAME}</span>
					</a>
				`,
			);
		});
	}

	#renderScrumLabels(users: Array): void
	{
		const popupData = this.#getCurrentPopupData();
		const labels = [
			{
				role: 'A',
				containerClass: 'sonet-ui-scrum-members-popup-owner-container',
				messageCode: 'SONET_PROJECT_MEMBERS_POPUP_LABEL_SCRUM_OWNER',
			},
			{
				role: 'M',
				containerClass: 'sonet-ui-scrum-members-popup-master-container',
				messageCode: 'SONET_PROJECT_MEMBERS_POPUP_LABEL_SCRUM_MASTER',
			},
			{
				role: 'E',
				containerClass: 'sonet-ui-scrum-members-popup-team-container',
				messageCode: 'SONET_PROJECT_MEMBERS_POPUP_LABEL_SCRUM_TEAM',
			},
		];

		labels.forEach(({role, containerClass, messageCode}) => {
			if (!users.find((user) => user.ROLE === role))
			{
				return;
			}

			if (popupData.innerContainer.querySelector(`.${containerClass}`) !== null)
			{
				return;
			}

			popupData.innerContainer.appendChild(
				Tag.render`
					<div class="${containerClass}">
						<span class="sonet-ui-scrum-members-popup-label">
							<span class="sonet-ui-scrum-members-popup-label-text">
								${Loc.getMessage(messageCode) || ''}
							</span>
						</span>
					</div>
				`,
			);
		});
	}

	#renderAvatar(user: Object): HTMLElement
	{
		const avatarStyle = Type.isStringFilled(user.PHOTO)
			? `style="background-image: url('${encodeURI(user.PHOTO)}')"` : '';

		return Tag.render`
			<span class="sonet-ui-members-popup-avatar-new">
				<div class="ui-icon ui-icon-common-user sonet-ui-members-popup-avatar-img">
					<i ${avatarStyle}></i>
				</div>
				<span class="sonet-ui-members-popup-avatar-status-icon"></span>
			</span>
		`;
	}

	#renderContainer(): HTMLElement
	{
		if (this.#isScrumPopup)
		{
			return Tag.render`
				<span class="sonet-ui-members-popup-container">
					<span class="sonet-ui-members-popup-head">
						${this.#popupData.all.tab}
						${this.#popupData.scrumTeam.tab}
						${this.#popupData.members.tab}
					</span>
					<span class="sonet-ui-members-popup-body">
						<div class="sonet-ui-members-popup-content">
							<div class="sonet-ui-members-popup-content-box">
								${this.#getCurrentPopupData().innerContainer}
							</div>
						</div>
					</span>
				</span>
			`;
		}

		return Tag.render`
			<span class="sonet-ui-members-popup-container">
				<span class="sonet-ui-members-popup-head">
					${this.#popupData.all.tab}
					${this.#popupData.heads.tab}
					${this.#popupData.members.tab}
				</span>
				<span class="sonet-ui-members-popup-body">
					<div class="sonet-ui-members-popup-content">
						<div class="sonet-ui-members-popup-content-box">
							${this.#getCurrentPopupData().innerContainer}
						</div>
					</div>
				</span>
			</span>
		`;
	}

	#bindScroll(groupId: number, type: string): void
	{
		const container = this.#getCurrentPopupData().innerContainer;
		if (!Type.isDomNode(container))
		{
			return;
		}

		Event.bind(container, 'scroll', (event) => {
			const area = event.target;
			if (area.scrollTop > (area.scrollHeight - area.offsetHeight) / 1.5)
			{
				this.#loadUsers(groupId, type);
				Event.unbindAll(container);
			}
		});
	}

	#changeType(newType: string, loadUsers: boolean = true): void
	{
		const oldType = this.#currentType;
		this.#currentType = newType;

		Object.values(this.#popupData).forEach((item) => {
			Dom.removeClass(item.tab, 'sonet-ui-members-popup-head-item-current');
		});
		Dom.addClass(this.#getCurrentPopupData().tab, 'sonet-ui-members-popup-head-item-current');

		if (oldType && this.#popupData[oldType])
		{
			Dom.replace(this.#popupData[oldType].innerContainer, this.#getCurrentPopupData().innerContainer);
		}

		if (loadUsers && this.#getCurrentPopupData().currentPage === 1)
		{
			this.#showLoader();
			this.#loadUsers(this.#groupId, newType);
		}
	}

	#resetPopupData(): void
	{
		if (this.#isScrumPopup)
		{
			this.#popupData = {
				all: this.#createTabData(
					Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_ALL') || '',
					'all',
				),
				scrumTeam: this.#createTabData(
					Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_SCRUM_TEAM') || '',
					'scrumTeam',
				),
				members: this.#createTabData(
					Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS_SCRUM') || '',
					'members',
				),
			};

			return;
		}

		this.#popupData = {
			all: this.#createTabData(
				Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_ALL') || '',
				'all',
			),
			heads: this.#createTabData(
				Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_HEADS') || '',
				'heads',
			),
			members: this.#createTabData(
				Loc.getMessage('SONET_PROJECT_MEMBERS_POPUP_TAB_MEMBERS') || '',
				'members',
			),
		};
	}

	#createTabData(title: string, type: string): Object
	{
		return {
			currentPage: 1,
			renderedUsers: [],
			tab: Tag.render`
				<span class="sonet-ui-members-popup-head-item" onclick="${this.#changeType.bind(this, type)}">
					<span class="sonet-ui-members-popup-head-text">${title}</span>
				</span>
			`,
			innerContainer: Tag.render`<div class="sonet-ui-members-popup-inner"></div>`,
		};
	}

	#getCurrentPopupData(): Object
	{
		return this.#popupData[this.#currentType];
	}

	#getRouteConfig(): Object
	{
		return {
			actionPrefix: this.#routeConfig?.actionPrefix || this.#actionPrefix,
			paramName: this.#routeConfig?.entityParam || this.#routeConfig?.paramName || this.#paramName,
		};
	}

	#showLoader(): void
	{
		if (!this.#loader && this.#popup)
		{
			this.#loader = new Loader({
				target: this.#popup.getPopupContainer().querySelector('.sonet-ui-members-popup-content'),
				size: 40,
			});
		}
		if (this.#loader)
		{
			void this.#loader.show();
		}
	}

	#hideLoader(): void
	{
		if (this.#loader)
		{
			void this.#loader.hide();
			this.#loader = null;
		}
	}
}
