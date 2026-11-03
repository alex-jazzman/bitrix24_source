import {Dom, Event, Loc, Tag, Type} from 'main.core';
import {Loader} from 'main.loader';
import {PopupWindowManager} from 'main.popup';

export class MembersPopup
{
	constructor(options)
	{
		this.signedParameters = options.signedParameters;
		this.popupVersion = 0;
		this.scrollHandlers = new WeakMap();
	}

	show(groupId, bindNode, type = 'all')
	{
		const shouldFocusCurrentType = (
			Type.isElementNode(bindNode)
			&& bindNode.ownerDocument.activeElement === bindNode
			&& bindNode.matches(':focus-visible')
		);

		if (this.popup && !this.popup.isDestroyed())
		{
			this.popup.getFocusTrap()?.setRestoreFocus(false);
			this.popup.destroy();
		}

		this.groupId = groupId;
		this.popupVersion++;

		this.resetPopupData();
		this.changeType(type, false);
		const popupData = this.popupData;

		const popup = PopupWindowManager.create({
			id: 'projects-members-popup-menu',
			className: 'tasks-projects-members-popup',
			bindElement: bindNode,
			autoHide: true,
			closeByEsc: true,
			ariaLabel: this.getPopupAriaLabel(),
			focusTrap: {
				initialFocus: false,
			},
			lightShadow: true,
			bindOptions: {
				position: 'bottom',
			},
			animationOptions: {
				show: {
					type: 'opacity-transform',
				},
				close: {
					type: 'opacity',
				},
			},
			events: {
				onPopupDestroy: () => {
					this.unbindPopupScrolls(popupData);
					if (this.popup === popup)
					{
						this.popupVersion++;
						this.loader = null;
						this.isPopupShown = false;
						this.popup = null;
					}
				},
				onPopupClose: () => {
					this.configureFocusRestore(popup, bindNode);
					popup.destroy();
				},
				onAfterPopupShow: () => {
					popup.contentContainer.appendChild(this.renderContainer());

					this.showLoader();
					this.showUsers(groupId, type);

					this.isPopupShown = true;

					if (shouldFocusCurrentType)
					{
						this.getCurrentPopupData().tab.focus();
					}
				},
			},
		});
		this.popup = popup;
		this.popupScroll(groupId, type);
		popup.show();
	}

	configureFocusRestore(popup, bindNode)
	{
		const focusTrap = popup.getFocusTrap();
		if (!focusTrap)
		{
			return;
		}

		const popupContainer = popup.getPopupContainer();
		const ownerDocument = popupContainer.ownerDocument;
		const activeElement = ownerDocument.activeElement;
		const shouldRestoreFocus = (
			Type.isElementNode(bindNode)
			&& bindNode.isConnected
			&& bindNode.ownerDocument === ownerDocument
			&& (
				activeElement === ownerDocument.body
				|| popupContainer.contains(activeElement)
			)
		);

		focusTrap.setRestoreFocus(shouldRestoreFocus ? bindNode : false);
	}

	getPopupAriaLabel()
	{
		return Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_ARIA_LABEL');
	}

	renderContainer()
	{
		return Tag.render`
			<div class="tasks-projects-members-popup-container">
				<div class="tasks-projects-members-popup-head">
					${this.popupData.all.tab}
					${this.popupData.heads.tab}
					${this.popupData.members.tab}
				</div>
				<div class="tasks-projects-members-popup-body">
					<div class="tasks-projects-members-popup-content">
						<div class="tasks-projects-members-popup-content-box">
							${this.getCurrentPopupData().innerContainer}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	popupScroll(groupId, type)
	{
		const popupData = this.popupData[type];
		if (
			!Type.isDomNode(popupData?.innerContainer)
			|| !popupData.hasMore
			|| this.scrollHandlers.has(popupData.innerContainer)
		)
		{
			return;
		}

		const scrollHandler = (event) => {
			const area = event.target;
			if (area.scrollTop > (area.scrollHeight - area.offsetHeight) / 1.5)
			{
				this.unbindPopupScroll(popupData);
				this.showUsers(groupId, type);
			}
		};
		this.scrollHandlers.set(popupData.innerContainer, scrollHandler);
		Event.bind(popupData.innerContainer, 'scroll', scrollHandler);
	}

	unbindPopupScroll(popupData)
	{
		const scrollHandler = this.scrollHandlers.get(popupData?.innerContainer);
		if (!scrollHandler)
		{
			return;
		}

		Event.unbind(popupData.innerContainer, 'scroll', scrollHandler);
		this.scrollHandlers.delete(popupData.innerContainer);
	}

	unbindPopupScrolls(popupData)
	{
		Object.values(popupData).forEach((item) => this.unbindPopupScroll(item));
	}

	showUsers(groupId, type)
	{
		const popupData = this.popupData[type];
		if (
			!popupData
			|| !popupData.hasMore
			|| popupData.isLoading
			|| this.groupId !== groupId
			|| this.currentType !== type
		)
		{
			return null;
		}

		popupData.isLoading = true;
		const popupVersion = this.popupVersion;

		return BX.ajax.runComponentAction('bitrix:tasks.projects', 'getPopupMembers', {
			mode: 'class',
			data: {
				groupId,
				type,
				page: popupData.currentPage,
			},
			signedParameters: this.signedParameters,
		}).then(
			(response) => {
				popupData.isLoading = false;
				if (
					this.popupVersion !== popupVersion
					|| this.groupId !== groupId
					|| this.currentType !== type
				)
				{
					return;
				}

				if (response.data.length > 0)
				{
					this.renderUsers(response.data);
					this.popupScroll(groupId, this.currentType);
				}
				else
				{
					popupData.hasMore = false;
					this.unbindPopupScroll(popupData);
					if (!this.getCurrentPopupData().innerContainer.hasChildNodes())
					{
						this.getCurrentPopupData().innerContainer.innerText = Loc.getMessage('TASKS_PROJECTS_MEMBERS_POPUP_EMPTY');
					}
				}
				popupData.currentPage++;
				this.hideLoader();
			},
			() => {
				popupData.isLoading = false;
				if (
					this.popupVersion === popupVersion
					&& this.groupId === groupId
					&& this.currentType === type
				)
				{
					this.hideLoader();
					this.popupScroll(groupId, type);
				}
			},
		);
	}

	renderUsers(users)
	{
		Object.values(users).forEach((user) => {
			if (this.getCurrentPopupData().renderedUsers.indexOf(user.ID) >= 0)
			{
				return;
			}
			this.getCurrentPopupData().renderedUsers.push(user.ID);

			this.getCurrentPopupData().innerContainer.appendChild(
				Tag.render`
					<a class="tasks-projects-members-popup-item" href="${user['HREF']}" target="_blank">
						<div class="tasks-projects-members-popup-avatar-new">
							${this.getAvatar(user)}
							<span class="tasks-projects-members-popup-avatar-status-icon"></span>
						</div>
						<span class="tasks-projects-members-popup-name">${user['FORMATTED_NAME']}</span>
					</a>
				`
			);
		})
	}

	getAvatar(user)
	{
		if (Type.isStringFilled(user['PHOTO']))
		{
			return Tag.render`
				<div class="ui-icon ui-icon-common-user tasks-projects-members-popup-avatar-img">
					<i style="background-image: url('${encodeURI(user['PHOTO'])}')"></i>
				</div>
			`;
		}

		return Tag.render`
			<div class="ui-icon ui-icon-common-user tasks-projects-members-popup-avatar-img"><i></i></div>
		`;
	}

	showLoader()
	{
		if (!this.loader)
		{
			this.loader = new Loader({
				target: this.popup.getPopupContainer().querySelector('.tasks-projects-members-popup-content'),
				size: 40,
			});
		}
		void this.loader.show();
	}

	hideLoader()
	{
		if (this.loader)
		{
			void this.loader.hide();
			this.loader = null;
		}
	}

	changeType(newType, loadUsers = true)
	{
		const oldType = this.currentType;

		this.currentType = newType;

		Object.values(this.popupData).forEach((item) => {
			Dom.removeClass(item.tab, 'tasks-projects-members-popup-head-item-current');
			Dom.attr(item.tab, 'aria-pressed', 'false');
		});
		Dom.addClass(this.getCurrentPopupData().tab, 'tasks-projects-members-popup-head-item-current');
		Dom.attr(this.getCurrentPopupData().tab, 'aria-pressed', 'true');

		if (oldType && oldType !== newType)
		{
			Dom.replace(this.popupData[oldType].innerContainer, this.getCurrentPopupData().innerContainer);
		}

		if (loadUsers && oldType !== newType)
		{
			if (this.getCurrentPopupData().currentPage === 1)
			{
				this.showLoader();
				this.showUsers(this.groupId, newType);
			}
			else
			{
				this.hideLoader();
				this.popupScroll(this.groupId, newType);
			}
		}
	}

	renderTypeButton(type, messageCode)
	{
		return Tag.render`
			<button
				type="button"
				class="tasks-projects-members-popup-head-item"
				aria-pressed="false"
				onclick="${this.changeType.bind(this, type)}"
			>
				<span class="tasks-projects-members-popup-head-text">${Loc.getMessage(messageCode)}</span>
			</button>
		`;
	}

	resetPopupData()
	{
		this.popupData = {
			all: {
				currentPage: 1,
				hasMore: true,
				isLoading: false,
				renderedUsers: [],
				tab: this.renderTypeButton('all', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_ALL'),
				innerContainer: Tag.render`<div class="tasks-projects-members-popup-inner"></div>`,
			},
			heads: {
				currentPage: 1,
				hasMore: true,
				isLoading: false,
				renderedUsers: [],
				tab: this.renderTypeButton('heads', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_HEADS'),
				innerContainer: Tag.render`<div class="tasks-projects-members-popup-inner"></div>`,
			},
			members: {
				currentPage: 1,
				hasMore: true,
				isLoading: false,
				renderedUsers: [],
				tab: this.renderTypeButton('members', 'TASKS_PROJECTS_MEMBERS_POPUP_TITLE_MEMBERS'),
				innerContainer: Tag.render`<div class="tasks-projects-members-popup-inner"></div>`,
			},
		};
	}

	getCurrentPopupData()
	{
		return this.popupData[this.currentType];
	}
}
