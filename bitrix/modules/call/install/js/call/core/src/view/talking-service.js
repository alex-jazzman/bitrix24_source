import { CallUser } from './call-user';
import { TalkingPopup } from './talking-popup';

export class TalkingService
{
	talkingPopup: ?TalkingPopup;
	activeId: ?number | null;
	queue: number[];
	users: { [key: number]: CallUser; };
	root: ?HTMLElement | null;

	constructor(config)
	{
		this.hasQueue = this.hasQueue.bind(this);
		this.refreshQueue = this.refreshQueue.bind(this);
		this.watchTalking = this.watchTalking.bind(this);
		this.deleteFromQueue = this.deleteFromQueue.bind(this);
		this.updateQueue = this.updateQueue.bind(this);
		this.showPopup = this.showPopup.bind(this);
		this.hidePopup = this.hidePopup.bind(this);

		this.root = config?.root ?? null;
		this.users = {};
		this.activeId = null;
		this.queue = [];
	}

	init(config) {
		this.root = config?.root ?? null;
	}

	hasQueue() {
		return this.queue.length > 0;
	}

	refreshQueue() {
		if (this.hasQueue())
		{
			this.updateQueue();
		}
	}

	watchTalking(event) {
		const eventData = event.data;

		const userId = BX.prop.getInteger(eventData.user.data, 'id', 0);

		if (userId < 1)
		{
			return;
		}

		if (eventData.fieldName === 'talking')
		{
			this.updateQueue({ user: eventData.user.data, isUserTalking: eventData.newValue });
		}
		else if (eventData.fieldName === 'order')
		{
			this.refreshQueue();
		}
	}

	deleteFromQueue(userId) {
		const index = this.queue.indexOf(userId);
		if (index > -1)
		{
			this.queue.splice(index, 1);
			delete this.users[userId];
		}
	}

	updateQueue(config) {
		let user = null;
		let isUserTalking = false;
		if (config)
		{
			user = config.user;
			isUserTalking = config.isUserTalking;
		}

		let mutedUserId = null;
		let newActiveId = null;
		const deleteUserFromQueue = () => {
			if (mutedUserId)
			{
				this.deleteFromQueue(mutedUserId);
			}
		};

		if (user)
		{
			if (isUserTalking)
			{
				if (!this.users[user.id])
				{
					this.queue.push(user.id);
					this.users[user.id] = user;
				}
			}
			else
			{
				mutedUserId = user.id;
			}
		}

		let activeUserCard = null;

		if (this.activeId)
		{
			activeUserCard = this.root?.querySelector(`.bx-messenger-videocall-user[data-user-id="${this.activeId}"]`);
		}

		let canPopupClose = false;
		const userTalkAgain = user && user?.id === this.activeId && isUserTalking && this.talkingPopup?.closingTimeout;

		if (!this.activeId || activeUserCard || (mutedUserId && mutedUserId === this.activeId))
		{
			canPopupClose = true;

			for (const userId of this.queue)
			{
				if (userId === mutedUserId || userId === this.activeId)
				{
					continue;
				}
				const userCard = this.root?.querySelector(`.bx-messenger-videocall-user[data-user-id="${userId}"]`);

				if (!userCard)
				{
					newActiveId = userId;
					break;
				}
			}
		}
		else if (!userTalkAgain)
		{
			deleteUserFromQueue();

			return;
		}

		if (this.activeId && !newActiveId && canPopupClose)
		{
			this.hidePopup(this.activeId !== mutedUserId, () => {
				deleteUserFromQueue();

				this.activeId = null;
			}, true);
		}
		else if ((this.activeId && newActiveId && this.activeId !== newActiveId)
			|| (!this.activeId && newActiveId))
		{
			this.showPopup(this.users[newActiveId]);
			deleteUserFromQueue();
			this.activeId = newActiveId;
		}
		else if (userTalkAgain)
		{
			this.showPopup(this.users[user?.id]);
			deleteUserFromQueue();
		}
		else
		{
			deleteUserFromQueue();
		}
	}

	showPopup(user) {
		if (!this.talkingPopup)
		{
			this.talkingPopup = new TalkingPopup({
				bindElement: document.body,
				targetContainer: this.root,
				content: user,
			});
		}
		else if (this.talkingPopup && this.activeId !== user.id)
		{
			this.talkingPopup.setContent(user);
		}

		this.talkingPopup.show();
	}

	hidePopup(isForce, callback) {
		if (!this.talkingPopup)
		{
			return;
		}

		this.talkingPopup.closeWithDelay(isForce, callback);
	}

	destroy() {
		this.hidePopup(true);
		this.talkingPopup?.destroy();
		this.users = {};
		this.activeId = null;
		this.queue = [];
	}
}
