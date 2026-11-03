import {Dom, Loc, Runtime} from 'main.core';
import {BaseEvent, EventEmitter} from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import {CellActionState} from '../../../../../../../../main/install/components/bitrix/main.ui.grid/templates/.default/src/js/cell-action-state';

export class ActionsController
{
	static options;

	static setOptions(options)
	{
		ActionsController.options = options;
	}

	static setActionsPanel(actionsPanel)
	{
		ActionsController.actionsPanel = actionsPanel;
	}

	static announce(messageCode, politeness = 'polite', useScrumVariant = false)
	{
		const prefix = useScrumVariant && ActionsController.options.isScrumList === 'Y'
			? 'TASKS_PROJECTS_SCRUM_A11Y_'
			: 'TASKS_PROJECTS_A11Y_'
		;
		const message = Loc.getMessage(`${prefix}${messageCode}`);
		if (message)
		{
			LiveAnnouncer.announce(message, politeness);
		}
	}

	static announceRequestResult(result, successMessageCode, errorMessageCode, useScrumVariant = false)
	{
		const isSuccess = result?.MESSAGE === 'SUCCESS';
		ActionsController.announce(
			isSuccess ? successMessageCode : errorMessageCode,
			isSuccess ? 'polite' : 'assertive',
			useScrumVariant,
		);
	}

	static doAction(action, groupId, data = [], announceResult = true)
	{
		return new Promise((resolve, reject) => {
			let isSettled = false;
			const settle = (isSuccess) => {
				if (isSettled)
				{
					return;
				}

				isSettled = true;
				if (isSuccess)
				{
					resolve();
				}
				else
				{
					reject();
				}

				if (announceResult && (action === 'pin' || action === 'unpin'))
				{
					ActionsController.announce(
						`${action.toUpperCase()}_${isSuccess ? 'SUCCESS' : 'ERROR'}`,
						isSuccess ? 'polite' : 'assertive',
						true,
					);
				}
			};

			BX.ajax.runComponentAction('bitrix:tasks.projects', 'processAction', {
				mode: 'class',
				data: {
					action,
					data,
					ids: ActionsController.getActionIds(groupId) || [],
				},
				signedParameters: ActionsController.options.signedParameters,
			}).then(() => settle(true), () => settle(false)).catch(() => settle(false));

			ActionsController.hideActionsPanel();
			ActionsController.unselectRows();
		});
	}

	static getActionIds(id)
	{
		if (id !== undefined)
		{
			return [id];
		}

		const selected = ActionsController.getSelectedRows();
		if (selected.length === 0)
		{
			return [];
		}

		return selected.map((row) => {
			return row.getDataset().id;
		});
	}

	static getSelectedRows()
	{
		return ActionsController.getGridInstance().getRows().getSelected();
	}

	static sendJoinRequest(button)
	{
		if (Dom.hasClass(button, 'ui-btn-clock'))
		{
			return;
		}
		Dom.addClass(button, 'ui-btn-clock');

		BX.ajax({
			url: button.getAttribute('bx-request-url'),
			method: 'POST',
			dataType: 'json',
			data: {
				ajax_request: 'Y',
				save: 'Y',
				sessid: BX.bitrix_sessid(),
			},
			onsuccess: (result) => {
				Dom.removeClass(button, 'ui-btn-clock');
				ActionsController.announceRequestResult(result, 'JOIN_SUCCESS', 'JOIN_ERROR', true);
			},
			onfailure: () => {
				Dom.removeClass(button, 'ui-btn-clock');
				ActionsController.announce('JOIN_ERROR', 'assertive', true);
			},
		});

		ActionsController.hideActionsPanel();
		ActionsController.unselectRows();
	}

	static sendAcceptRequest(userGroupRelationId, url)
	{
		BX.ajax({
			url: url,
			method: 'POST',
			dataType: 'json',
			data: {
				action: 'accept',
				max_count: 1,
				checked_0: 'Y',
				type_0: 'INVITE_GROUP',
				id_0: userGroupRelationId,
				type: 'in',
				ajax_request: 'Y',
				sessid: BX.bitrix_sessid(),
			},
			onsuccess: (result) => {
				ActionsController.announceRequestResult(
					result,
					'INVITATION_ACCEPT_SUCCESS',
					'INVITATION_ACCEPT_ERROR',
				);
			},
			onfailure: () => ActionsController.announce('INVITATION_ACCEPT_ERROR', 'assertive'),
		});

		ActionsController.hideActionsPanel();
		ActionsController.unselectRows();
	}

	static sendDenyRequest(userGroupRelationId, url)
	{
		ActionsController.sendCancelRequest(userGroupRelationId, url, true);
	}

	static sendCancelRequest(userGroupRelationId, url, isInvitationDeny = false)
	{
		const successMessageCode = isInvitationDeny
			? 'INVITATION_DENY_SUCCESS'
			: 'REQUEST_CANCEL_SUCCESS'
		;
		const errorMessageCode = isInvitationDeny
			? 'INVITATION_DENY_ERROR'
			: 'REQUEST_CANCEL_ERROR'
		;

		BX.ajax({
			url: url,
			method: 'POST',
			dataType: 'json',
			data: {
				action: 'reject',
				max_count: 1,
				checked_0: 'Y',
				type_0: 'INVITE_GROUP',
				id_0: userGroupRelationId,
				type: 'out',
				ajax_request: 'Y',
				sessid: BX.bitrix_sessid(),
			},
			onsuccess: (result) => {
				ActionsController.announceRequestResult(result, successMessageCode, errorMessageCode);
			},
			onfailure: () => ActionsController.announce(errorMessageCode, 'assertive'),
		});

		ActionsController.hideActionsPanel();
		ActionsController.unselectRows();
	}

	static hideActionsPanel()
	{
		ActionsController.options.actionsPanel.hidePanel();
	}

	static unselectRows()
	{
		ActionsController.getGridInstance().getRows().unselectAll();
	}

	static getGridInstance()
	{
		return BX.Main.gridManager.getById(ActionsController.options.gridId).instance;
	}

	static onPinKeyDown(groupId, event: BaseEvent, keyboardEvent: KeyboardEvent)
	{
		const { button } = event.getData();

		if (
			keyboardEvent.target !== keyboardEvent.currentTarget
			|| keyboardEvent.currentTarget !== button
			|| keyboardEvent.repeat
			|| (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ')
		)
		{
			return;
		}

		keyboardEvent.preventDefault();
		keyboardEvent.stopPropagation();
		void ActionsController.changePin(groupId, event);
	}

	static async changePin(groupId, event: BaseEvent)
	{
		const { button } = event.getData();
		if (button.dataset.pinPending === 'true')
		{
			return;
		}

		const isPinned = Dom.hasClass(button, CellActionState.ACTIVE);
		const action = isPinned ? 'unpin' : 'pin';
		button.dataset.pinPending = 'true';

		try
		{
			await ActionsController.doAction(action, groupId, [], false);
			ActionsController.updatePinState(button, !isPinned);
			ActionsController.announce(`${action.toUpperCase()}_SUCCESS`, 'polite', true);
		}
		catch
		{
			ActionsController.announce(`${action.toUpperCase()}_ERROR`, 'assertive', true);

			return;
		}
		finally
		{
			delete button.dataset.pinPending;
		}
	}

	static updatePinState(button, isPinned)
	{
		if (isPinned)
		{
			Dom.addClass(button, CellActionState.ACTIVE);
			Dom.removeClass(button, CellActionState.SHOW_BY_HOVER);
		}
		else
		{
			Dom.removeClass(button, CellActionState.ACTIVE);
			Dom.addClass(button, CellActionState.SHOW_BY_HOVER);
		}

		button.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
		button.setAttribute('aria-label', isPinned ? button.dataset.unpinLabel : button.dataset.pinLabel);
	}

	static onTagClick(field)
	{
		const {filter} = ActionsController.options;
		filter.toggleByField(field);
	}

	static onTagAddClick(groupId, event)
	{
		Runtime.loadExtension('ui.entity-selector').then(exports => {
			const onRowUpdate = (event: BaseEvent) => {
				const {id} = event.getData();
				if (id === groupId)
				{
					const row = ActionsController.getGridInstance().getRows().getById(id);
					const button = row.getCellById('TAGS').querySelector('.main-grid-tag-add');

					dialog.setTargetNode(button);
				}
			};
			const onRowRemove = (event: BaseEvent) => {
				const {id} = event.getData();
				if (id === groupId)
				{
					dialog.hide();
				}
			};
			const onTagsChange = (event: BaseEvent) => {
				const dialog = event.getTarget();
				const tags = dialog.getSelectedItems().map(item => item.getId());

				void ActionsController.doAction('update', groupId, {KEYWORDS: tags.join(',')});
			};
			const {Dialog} = exports;
			const dialog = new Dialog({
				targetNode: event.getData().button,
				enableSearch: true,
				width: 350,
				height: 400,
				multiple: true,
				dropdownMode: true,
				compactView: true,
				context: 'PROJECT_TAG',
				entities: [
					{
						id: 'project-tag',
						options: {
							groupId,
						},
					},
				],
				searchOptions: {
					allowCreateItem: true,
					footerOptions: {
						label: Loc.getMessage('TASKS_PROJECTS_ENTITY_SELECTOR_TAG_SEARCH_FOOTER_ADD'),
					},
				},
				footer: BX.SocialNetwork.EntitySelector.Footer,
				footerOptions: {
					tagCreationLabel: true,
				},
				events: {
					'onShow': () => {
						EventEmitter.subscribe('Tasks.Projects.Grid:RowUpdate', onRowUpdate);
						EventEmitter.subscribe('Tasks.Projects.Grid:RowRemove', onRowRemove);
					},
					'onHide': () => {
						EventEmitter.unsubscribe('Tasks.Projects.Grid:RowUpdate', onRowUpdate);
						EventEmitter.unsubscribe('Tasks.Projects.Grid:RowRemove', onRowRemove);
					},
					'Search:onItemCreateAsync': (event: BaseEvent) => {
						return new Promise((resolve) => {
							const {searchQuery} = event.getData();
							const name = searchQuery.getQuery().toLowerCase();
							const dialog: Dialog = event.getTarget();

							setTimeout(() => {
								const item = dialog.addItem({
									id: name,
									entityId: 'project-tag',
									title: name,
									tabs: 'all',
								});
								if (item)
								{
									item.select();
								}
								resolve();
							}, 1000);
						});
					},
					'Item:onSelect': onTagsChange,
					'Item:onDeselect': onTagsChange,
				},
			});
			dialog.show();
		});
	}
}
