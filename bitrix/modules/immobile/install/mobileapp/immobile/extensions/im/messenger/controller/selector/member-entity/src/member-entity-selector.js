/**
 * @module im/messenger/controller/selector/member-entity/member-entity-selector
 */
jn.define('im/messenger/controller/selector/member-entity/member-entity-selector', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { hasPublicError, showPublicAlert, showInternalAlert } = require('error');
	const { Icon } = require('ui-system/blocks/icon');
	const { NestedDepartmentSelector } = require('selector/widget/entity/tree-selectors/nested-department-selector');
	const { ScopesIds } = require('selector/providers/tree-providers/nested-department-provider');

	const { Loc } = require('im/messenger/loc');
	const {
		ActionByUserType,
		DialogType,
		EntitySelectorContext,
		EntitySelectorElementType,
		StructureNodeElementTypes,
	} = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLogger } = require('im/messenger/lib/logger');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { ChatPermission, UserPermission } = require('im/messenger/lib/permission-manager');
	const { ProjectAccessGuard } = require('im/messenger/lib/project-access-guard');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { ChatService } = require('im/messenger/provider/services/chat');

	const logger = getLogger('selector--member-entity');

	/**
	 * The chat types the server links org structure nodes to. The list repeats the server one:
	 * elsewhere the window offers people only.
	 */
	const CHAT_TYPES_ACCEPTING_NODES = Object.freeze([
		DialogType.chat,
		DialogType.open,
		DialogType.channel,
		DialogType.openChannel,
	]);

	/**
	 * How many org structure nodes a single linking call takes. The number repeats the server one
	 * (`Structure::MAX_NODES_PER_REQUEST` of the `im` module), and the server refuses the whole call
	 * over it, so a longer selection is stopped here instead of being spent on a known refusal.
	 * People are not counted against it: the limit is of the linking call alone.
	 */
	const MAX_STRUCTURE_NODES_PER_REQUEST = 10;
	const MemberEntitySelectorGoal = Object.freeze({
		chat: 'chat',
		collabProject: 'collabProject',
	});

	/**
	 * @desc Whether an element is taken by neither of the two calls a selection reaches a chat by.
	 * The border between people and nodes is a list of its own, so an element outside both is named
	 * apart instead of falling into one of them.
	 * @param {MemberEntity} entity
	 * @return {boolean}
	 */
	function isUnsupportedEntity({ type })
	{
		return type !== EntitySelectorElementType.user && !StructureNodeElementTypes.includes(type);
	}

	/**
	 * @desc A refusal turned into the errors it is told about by.
	 * @param {string} call the refused call, for the log
	 * @param {*} rejection the errors of the response, or an error of the client when the request
	 * never left
	 * @return {Array<BackendError>} an empty list stands for a refusal the server did not describe,
	 * so that a failed call is never read as a success
	 */
	function refusalErrors(call, rejection)
	{
		logger.error(`MemberEntitySelector.${call}: call refused`, rejection);

		return Type.isArray(rejection) ? rejection : [];
	}

	/**
	 * @desc The call the people of a selection reach a chat by. Nobody to add means no call at all.
	 * @param {ChatService} chatService
	 * @param {number} chatId
	 * @param {Array<number>} userIds
	 * @param {boolean} historyShow
	 * @param {MemberEntitySendProbe} probe
	 * @return {Promise<?Array<BackendError>>} errors of a refused call, `null` when it went through
	 */
	async function addUsersToChat(chatService, chatId, userIds, historyShow, probe)
	{
		if (!Type.isArrayFilled(userIds))
		{
			return null;
		}

		probe.onUsersCallStart?.();

		return chatService.addToChat(chatId, userIds, historyShow)
			.then(() => null)
			.catch((rejection) => refusalErrors('addUsersToChat', rejection))
			.finally(() => probe.onUsersCallEnd?.())
		;
	}

	/**
	 * @desc The refusal the client makes on its own for a selection the server would refuse anyway.
	 * It is shaped as an error of the server and marked for the user, so that it reaches them by the
	 * very path a refusal of the call reaches them by. The code repeats the server one: the reason
	 * is the same, and the log of the two reads alike.
	 * @return {Array<BackendError>}
	 */
	function tooManyNodesErrors()
	{
		return [{
			code: 'TOO_MANY_NODES',
			message: Loc.getMessage('IMMOBILE_MESSENGER_MEMBER_SELECTOR_TOO_MANY_NODES_ERROR', {
				'#LIMIT#': MAX_STRUCTURE_NODES_PER_REQUEST,
			}),
			customData: { public: true },
		}];
	}

	/**
	 * @desc The call the org structure nodes of a selection reach a chat by. Nothing to link means
	 * no call at all.
	 * @param {ChatService} chatService
	 * @param {number} chatId
	 * @param {Array<MemberEntityId>} structureNodes
	 * @param {MemberEntitySendProbe} probe
	 * @return {Promise<?Array<BackendError>>} errors of a refused call, `null` when it went through
	 */
	async function linkStructureNodes(chatService, chatId, structureNodes, probe)
	{
		if (!Type.isArrayFilled(structureNodes))
		{
			return null;
		}

		if (structureNodes.length > MAX_STRUCTURE_NODES_PER_REQUEST)
		{
			logger.error(
				'MemberEntitySelector.linkStructureNodes: selection over the limit of the call',
				structureNodes.length,
			);

			return tooManyNodesErrors();
		}

		probe.onNodesCallStart?.();

		return chatService.userService.linkStructureNodes(chatId, structureNodes)
			.then(() => null)
			.catch((rejection) => refusalErrors('linkStructureNodes', rejection))
			.finally(() => probe.onNodesCallEnd?.())
		;
	}

	/**
	 * @class MemberEntitySelector
	 * @desc The single place that opens the department tree selector for adding chat members.
	 * The window can only add: the whole current composition of the chat comes preselected
	 * and undeselectable, and the entry point is handed the part of the selection the chat does
	 * not have yet. That part is counted here, against the composition the window was opened
	 * with, so every entry point gets the same answer and none of them reads the chat again.
	 *
	 * The way a selection reaches a chat is described here as well, by the statics below: the split
	 * into the two calls it goes by, the calls themselves, the confirmation asked before them, and the
	 * words the user gets — the refusal of a call, the part of the selection neither call takes, and
	 * the word that the linking went through. The words are shared and not copied per entry point:
	 * a copy of them has already fallen behind the other two once.
	 */
	class MemberEntitySelector
	{
		/**
		 * The selection captured on close and not handled yet.
		 * @type {Array<MemberEntity>|null}
		 */
		#pendingEntities = null;

		/**
		 * The composition the window was opened with. The selection is counted against it, so the
		 * entry point needs no second read of the chat to tell the added part from the rest.
		 * @type {Array<MemberEntityId>}
		 */
		#currentEntities = [];

		/**
		 * @param {MemberEntitySelectorProps} props
		 */
		constructor(props)
		{
			this.dialogId = props.dialogId;
			this.goal = props.goal === MemberEntitySelectorGoal.collabProject
				? MemberEntitySelectorGoal.collabProject
				: MemberEntitySelectorGoal.chat
			;
			this.title = props.title ?? Loc.getMessage('IMMOBILE_MESSENGER_MEMBER_SELECTOR_TITLE');
			// The wording of the confirm button belongs to the entry point: left out, it makes the
			// widget fall back to its own text.
			this.sendButtonName = props.sendButtonName;
			this.integrateSelectorToParentLayout = props.integrateSelectorToParentLayout ?? false;
			this.onSelectedChanged = props.onSelectedChanged;
			this.onSelectMemberEntities = props.onSelectMemberEntities;
			this.chatService = new ChatService();
		}

		/**
		 * @desc Opens the selector filled with the current composition of the chat.
		 * @param {PageManager|LayoutWidget} [parentWidget]
		 * @return {Promise<void>}
		 */
		async open(parentWidget)
		{
			// The window shows nothing until the composition arrives, so the wait for the server is
			// measured apart from the opening of the widget itself.
			const point = new PerfPoint('IM Add Members Open', `dialog ${this.dialogId}`).start();

			try
			{
				let memberEntities = [];
				if (this.goal === MemberEntitySelectorGoal.chat)
				{
					point.startPoint('Load Member Entities');
					memberEntities = await this.#loadMemberEntities();
					point.endPoint('Load Member Entities', { itemsCount: memberEntities.length });
				}

				this.#currentEntities = memberEntities;

				const selector = new NestedDepartmentSelector(this.getSelectorOptions(memberEntities));
				if (this.integrateSelectorToParentLayout)
				{
					const integratedSelector = selector.getSelector();
					integratedSelector.close = () => {
						integratedSelector.onClose();

						return Promise.resolve();
					};
				}

				this.#leaveCurrentUserOut(selector);

				point.startPoint('Show Selector');

				// A refusal to open is passed on: the entry point is the one that tells the user,
				// and a refusal turned into a resolve leaves it with a selector that never opened.
				return await selector.show({}, parentWidget)
					.catch((error) => {
						logger.error(`${this.constructor.name}.open.catch:`, error);

						throw error;
					})
					.finally(() => point.endPoint('Show Selector'))
				;
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @desc The contract every entry point of "add members" opens the selector with.
		 * @param {Array<MemberEntityId>} memberEntities
		 * @return {Object}
		 */
		getSelectorOptions(memberEntities)
		{
			const selectedChangedEvent = this.onSelectedChanged
				? { onSelectedChanged: this.onSelectedChanged }
				: {}
			;

			return {
				initSelectedIds: memberEntities,
				// The window can only add, so the whole current composition is undeselectable.
				undeselectableIds: memberEntities,
				widgetParams: {
					title: this.title,
					sendButtonName: this.sendButtonName,
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
					},
				},
				allowMultipleSelection: true,
				closeOnSelect: true,
				integrateSelectorToParentLayout: this.integrateSelectorToParentLayout,
				events: {
					...selectedChangedEvent,
					onClose: this.#onClose,
					// The widget reports its removal by one event or the other depending on the
					// platform, so both are listened to and the first one of them wins.
					onWidgetClosed: this.#onWidgetGone,
					onViewRemoved: this.#onWidgetGone,
				},
				createOptions: {
					enableCreation: false,
				},
				selectOptions: {
					canUnselectLast: true,
					singleEntityByType: false,
				},
				canUseRecent: false,
				// No list at all leaves the selector its own set of tabs, a list of one leaves the recent only.
				customTabsConfig: this.#getTabsConfig(),
				provider: {
					// The history of the recent is the one the chat forms keep: a department picked
					// while editing the chat is offered here as well, and the other way round.
					context: EntitySelectorContext.chatMembers,
					options: {
						useLettersForEmptyAvatar: true,
						allowFlatDepartments: true,
						allowSelectRootDepartment: true,
						addMetaUser: false,
					},
				},
			};
		}

		/**
		 * @desc Keeps the one adding out of every list of the selector: they are in the chat already,
		 * and the preselected composition would put them at the top of the recent otherwise. The
		 * department tree provider of the mobile module offers no way to leave an item out, and its
		 * class is fixed by the selector entity, so the two list builders of the instance are wrapped:
		 * the recent it assembles out of the preselection and the history, and the preparation every
		 * list goes through - the search, the tree and the recent tab alike.
		 * @param {NestedDepartmentSelector} selector
		 */
		#leaveCurrentUserOut(selector)
		{
			const provider = selector.getSelector().getProvider();
			const currentUserId = MessengerParams.getUserId();
			const isCurrentUser = ({ entityId, id }) => (
				entityId === EntitySelectorElementType.user && Number(id) === currentUserId
			);
			const initRecentItems = provider.initRecentItems.bind(provider);
			const prepareItems = provider.prepareItems.bind(provider);

			provider.initRecentItems = (dialog) => initRecentItems(dialog).filter((item) => !isCurrentUser(item));
			provider.prepareItems = (items) => prepareItems(items.filter((item) => !isCurrentUser(item)));
		}

		/**
		 * @desc The part of a selection the chat does not have yet, counted against the composition
		 * the window was opened with. Removed entities are left out of it: the window only adds, and
		 * unlinking lives on the chat editing screen.
		 *
		 * The composition it is counted against is the very one the preselection was built from, so
		 * the two can never disagree: a composition that failed to arrive preselects nothing, and a
		 * selection made in such a window carries the picks of the user and nothing else.
		 * @param {Array<MemberEntity>} selectedEntities
		 * @return {Array<MemberEntity>}
		 */
		#getAddedEntities(selectedEntities)
		{
			if (!Type.isArrayFilled(selectedEntities))
			{
				return [];
			}

			// The delta is counted over whole `type-id` pairs, so a department and its "employees only"
			// form are two entities and not one.
			const currentTuples = new Set(this.#currentEntities.map(([type, id]) => `${type}-${id}`));

			return selectedEntities.filter(({ type, id }) => !currentTuples.has(`${type}-${id}`));
		}

		/**
		 * @desc Whether the window offers the org structure: the chat type must be one the server
		 * links nodes to, and the current user must be allowed to link them. The server decides that
		 * by two rights at once, the role in this chat and the kind of the account, and an external
		 * user made an owner of a chat passes the first one while the second still refuses. Both are
		 * read here, so the window never offers a way the server is bound to turn down.
		 * @return {boolean}
		 */
		#canOfferStructureNodes()
		{
			if (this.goal === MemberEntitySelectorGoal.collabProject)
			{
				return UserPermission.canPerformActionByUserType(ActionByUserType.linkStructureNode);
			}

			const dialog = DialogHelper.getDialogModel(this.dialogId);
			if (!dialog)
			{
				return false;
			}

			return CHAT_TYPES_ACCEPTING_NODES.includes(dialog.type)
				&& UserPermission.canPerformActionByUserType(ActionByUserType.linkStructureNode)
				&& ChatPermission.canLinkStructureNode(dialog)
			;
		}

		#getTabsConfig()
		{
			if (!this.#canOfferStructureNodes())
			{
				return [ScopesIds.RECENT];
			}

			if (this.goal === MemberEntitySelectorGoal.collabProject)
			{
				return [ScopesIds.RECENT, ScopesIds.DEPARTMENT, ScopesIds.TEAM];
			}

			return undefined;
		}

		/**
		 * @desc Reads the composition of the chat the preselection is built from.
		 * @return {Promise<Array<MemberEntityId>>}
		 */
		async #loadMemberEntities()
		{
			const memberEntities = await this.chatService.loadService
				.loadChatMemberEntitiesList(this.dialogId)
				.catch((error) => {
					logger.error(`${this.constructor.name}.loadMemberEntities.catch:`, error);

					return null;
				})
			;

			// The load service resolves with the errors of the request instead of rejecting,
			// so a payload that is not a list of entities is dropped as a whole: a preselection
			// built out of errors is worse than an empty one.
			if (!Type.isArray(memberEntities) || !memberEntities.every((entity) => Type.isArray(entity)))
			{
				logger.error(`${this.constructor.name}.loadMemberEntities: unexpected payload`, memberEntities);

				return [];
			}

			return memberEntities;
		}

		/**
		 * The selection is captured here, and its handling is deferred until the widget leaves
		 * the stack: a native confirm shown while the host widget is being dismissed is
		 * auto-dismissed by the platform. An embedded selector has no widget of its own to be
		 * removed and reports no removal, so there the selection is handled right away.
		 *
		 * @param {Array<MemberEntity>} selectedEntities
		 */
		#onClose = (selectedEntities) => {
			if (this.integrateSelectorToParentLayout)
			{
				this.onSelectMemberEntities?.(this.#getAddedEntities(selectedEntities));

				return;
			}

			this.#pendingEntities = selectedEntities;
		};

		/**
		 * Handles the captured selection once the widget is gone: `onWidgetClosed` after a confirm,
		 * `onViewRemoved` after a dismissal. Both may arrive, so the captured selection is taken
		 * away before it is handed over, and the second call finds nothing left to hand over.
		 */
		#onWidgetGone = () => {
			if (this.#pendingEntities === null)
			{
				return;
			}

			const selectedEntities = this.#pendingEntities;
			this.#pendingEntities = null;

			this.onSelectMemberEntities?.(this.#getAddedEntities(selectedEntities));
		};

		/**
		 * @desc Picks the people out of a selection: the org structure nodes go their own way.
		 * @param {Array<MemberEntity>} selectedEntities
		 * @return {Array<number>}
		 */
		static getUserIds(selectedEntities)
		{
			if (!Type.isArrayFilled(selectedEntities))
			{
				return [];
			}

			return selectedEntities
				.filter(({ type }) => type === EntitySelectorElementType.user)
				.map(({ id }) => Number(id))
			;
		}

		/**
		 * @desc Picks the org structure nodes out of a selection: the people go their own way. The id
		 * of a node goes as it came, since the `:F` suffix is what tells the node alone from the node
		 * with everything under it, and a cast to a number would swap one for the other.
		 * @param {Array<MemberEntity>} selectedEntities
		 * @return {Array<MemberEntityId>}
		 */
		static getStructureNodes(selectedEntities)
		{
			if (!Type.isArrayFilled(selectedEntities))
			{
				return [];
			}

			return selectedEntities
				.filter(({ type }) => StructureNodeElementTypes.includes(type))
				.map(({ type, id }) => [type, id])
			;
		}

		/**
		 * @desc The selection split by the way its parts reach a chat: people go by one call, nodes
		 * of the org structure by another. What neither call takes is named apart, so that an entry
		 * point tells about it instead of dropping it in silence.
		 * @param {Array<MemberEntity>} entities
		 * @return {MemberEntitySplit}
		 */
		static splitEntities(entities)
		{
			if (!Type.isArrayFilled(entities))
			{
				return { userIds: [], structureNodes: [], unsupportedEntities: [] };
			}

			return {
				userIds: MemberEntitySelector.getUserIds(entities),
				structureNodes: MemberEntitySelector.getStructureNodes(entities),
				unsupportedEntities: entities.filter((entity) => isUnsupportedEntity(entity)),
			};
		}

		/**
		 * @desc Tells about the part of a selection that neither call takes. There is nothing to name
		 * it with and nothing the user can do about it, so the text is the common one and the types go
		 * to the log, where they point at the split that has fallen behind the selector.
		 * @param {Array<MemberEntity>} unsupportedEntities
		 * @return {Promise<void>}
		 */
		static async showUnsupportedEntitiesError(unsupportedEntities)
		{
			if (!Type.isArrayFilled(unsupportedEntities))
			{
				return;
			}

			logger.error(
				'MemberEntitySelector.showUnsupportedEntitiesError: unsupported element types',
				unsupportedEntities,
			);

			await showInternalAlert();
		}

		/**
		 * @desc Tells about the call that failed, in the words of the server when they are meant for the
		 * user: an error kept for the log, `ACCESS_DENIED` and the like, says nothing to anybody and is
		 * replaced by the common text. The other call is not rolled back: it went on its own and what it
		 * did stays done.
		 * @param {?Array<BackendError>} errors errors of a refused call, `null` when the call went through
		 * @return {Promise<void>}
		 */
		static async showCallError(errors)
		{
			if (!errors)
			{
				return;
			}

			logger.error('MemberEntitySelector.showCallError: call failed', errors);

			if (hasPublicError(errors))
			{
				await showPublicAlert(errors);

				return;
			}

			await showInternalAlert();
		}

		/**
		 * @desc Tells the linking went through, and that the chat keeps taking in the people that come
		 * to the linked nodes later: the window has no room to say it before the choice is made, and
		 * the linking adds nobody at the moment it is confirmed. Nothing linked means nothing to say.
		 * @param {number} nodeCount
		 */
		static showStructureNodesLinkedToast(nodeCount)
		{
			if (nodeCount <= 0)
			{
				return;
			}

			Notification.showToastWithParams({
				message: Loc.getMessagePlural('IMMOBILE_MESSENGER_MEMBER_SELECTOR_STRUCTURE_NODE_LINKED_TOAST', nodeCount),
				icon: Icon.CIRCLE_CHECK,
			});
		}

		/**
		 * @desc Asks the user to confirm the addition in a chat that inherits the composition of its
		 * parent: the added ones get to the parent as well. The confirmation is asked about the delta
		 * only, since the current composition comes preselected and undeselectable and the whole
		 * selection would ask it at every addition for nothing. It is of the interface only: access
		 * itself is decided by the server.
		 * @param {DialoguesModelState} dialog
		 * @param {Array<MemberEntity>} addedEntities
		 * @return {Promise<boolean>}
		 */
		static async confirmAdditionToProjectChildChat(dialog, addedEntities)
		{
			if (!DialogHelper.createByModel(dialog)?.inheritsParentChatMembership)
			{
				return true;
			}

			return ProjectAccessGuard.canAddEntitiesToProjectChildChat(dialog.parentChatId ?? 0, addedEntities);
		}

		/**
		 * @desc Hands a selection over to a chat: the people become members by one call, the nodes of
		 * the org structure get linked by another. The two are independent and both are made: each has
		 * a right and a check of its own, so a refusal in one says nothing about the other, and what
		 * the other did is not rolled back. The people go first, and the pair keeps that order at
		 * every entry point.
		 *
		 * A part with nothing in it costs no call, and it is told from a refused one by the errors:
		 * `null` stands for a call that went through as well as for a call that was never made.
		 * @param {MemberEntitySendParams} params
		 * @return {Promise<MemberEntitySendResult>}
		 */
		static async sendEntities({
			chatService,
			chatId,
			userIds,
			structureNodes,
			historyShow,
			probe = {},
		})
		{
			const [usersErrors, nodesErrors] = await Promise.all([
				addUsersToChat(chatService, chatId, userIds, historyShow, probe),
				linkStructureNodes(chatService, chatId, structureNodes, probe),
			]);

			return { usersErrors, nodesErrors };
		}
	}

	module.exports = { MemberEntitySelector, MemberEntitySelectorGoal };
});
