import { EventEmitter, type BaseEvent } from 'main.core.events';

import { ActionByRole, ActionByUserType, PromoId } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { PromoManager } from 'im.v2.lib.promo';
import { Utils } from 'im.v2.lib.utils';

export type ShowPromoEvent = BaseEvent<boolean>;

const EVENT_NAMESPACE = 'BX.Messenger.v2.List.Collab.Promo';
const INITIAL_DELAY = 1000;
const BETWEEN_DELAY = 600;

export class CollabPromoManager extends EventEmitter
{
	static events = {
		showCardPromo: 'showCardPromo',
		showCreateChatPromo: 'showCreateChatPromo',
	};

	#dialogId: string;
	#timer: number;

	constructor(parentChatId: number)
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#dialogId = Utils.dialog.buildChatDialogId(parentChatId);
	}

	init()
	{
		this.#timer = setTimeout(() => {
			if (this.#shouldShowCardPromo())
			{
				this.emit(CollabPromoManager.events.showCardPromo, true);

				return;
			}

			if (this.#shouldShowCreateChatPromo())
			{
				this.emit(CollabPromoManager.events.showCreateChatPromo, true);
			}
		}, INITIAL_DELAY);
	}

	onCloseCardPromo()
	{
		void PromoManager.getInstance().markAsWatched(PromoId.collabCardNavigation);

		this.emit(CollabPromoManager.events.showCardPromo, false);

		this.#timer = setTimeout(() => {
			if (this.#shouldShowCreateChatPromo())
			{
				this.emit(CollabPromoManager.events.showCreateChatPromo, true);
			}
		}, BETWEEN_DELAY);
	}

	onCloseCreateChatPromo()
	{
		void PromoManager.getInstance().markAsWatched(PromoId.collabCreateChat);

		this.emit(CollabPromoManager.events.showCreateChatPromo, false);
	}

	stop()
	{
		this.unsubscribeAll(CollabPromoManager.events.showCreateChatPromo);
		this.unsubscribeAll(CollabPromoManager.events.showCardPromo);
		clearTimeout(this.#timer);
	}

	#shouldShowCardPromo(): boolean
	{
		return PromoManager.getInstance().needToShow(PromoId.collabCardNavigation);
	}

	#shouldShowCreateChatPromo(): boolean
	{
		const isPromoActive = PromoManager.getInstance().needToShow(PromoId.collabCreateChat);

		return isPromoActive && this.#canCreateChat();
	}

	#canCreateChat(): boolean
	{
		const manager = PermissionManager.getInstance();
		const canCreateByRole = manager.canPerformActionByRole(ActionByRole.createChildChat, this.#dialogId);
		const canCreateByUserType = manager.canPerformActionByUserType(ActionByUserType.createChat);

		return canCreateByRole && canCreateByUserType;
	}
}
