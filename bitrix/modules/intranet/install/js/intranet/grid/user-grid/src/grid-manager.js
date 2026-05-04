import { Type, Loc, ajax, Runtime } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { ErrorCollection } from 'ui.form-elements.field';
import { FirstAdminGuard } from 'bitrix24.first-admin-guard';
import { FireEmployeeWizard, MoveWebhookRequest } from 'intranet.fire-employee-wizard';

export type SetSortType = {
	menuId: ?string,
	gridId: string,
	sortBy: string,
	order: 'ASC' | 'DESC',
}

export type SetFilterType = {
	gridId: string,
	filter: Object,
}

export class GridManager
{
	static instances: Array<GridManager> = [];
	#grid: BX.Main.grid;
	#firstAdminId: ?number = undefined;
	isCloud: boolean = false;
	isFirstAdminConfirmationEnabled: boolean = false;

	constructor(gridId: string, isCloud: boolean = false, isFirstAdminConfirmationEnabled: boolean = false)
	{
		this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
		this.isCloud = isCloud;
		this.isFirstAdminConfirmationEnabled = isFirstAdminConfirmationEnabled;
	}

	static getInstance(
		gridId: string,
		isCloud: boolean = false,
		isFirstAdminConfirmationEnabled: boolean = false,
	): GridManager
	{
		if (!this.instances[gridId])
		{
			this.instances[gridId] = new GridManager(gridId, isCloud, isFirstAdminConfirmationEnabled);
		}

		return this.instances[gridId];
	}

	static setSort(options: SetSortType): void
	{
		const grid = BX.Main.gridManager.getById(options.gridId)?.instance;

		if (Type.isObject(grid))
		{
			grid.tableFade();
			grid.getUserOptions().setSort(options.sortBy, options.order, () => {
				grid.reload();
			});
		}
	}

	static setFilter(options: SetFilterType): void
	{
		const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
		const filter = BX.Main.filterManager.getById(options.gridId);

		if (Type.isObject(grid) && Type.isObject(filter))
		{
			filter.getApi().extendFilter(options.filter);
		}
	}

	static reinviteCloudAction(data): Promise
	{
		return ajax.runAction('intranet.invite.reinviteWithChangeContact', {
			data,
		}).then((response) => {
			if (response.data.result)
			{
				const InviteAccessPopup = new BX.PopupWindow({
					content: `<p>${Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS')}</p>`,
					autoHide: true,
				});

				InviteAccessPopup.show();
			}

			return response;
		}, (response) => {
			const errors = response.errors.map((error) => error.message);
			ErrorCollection.showSystemError(errors.join('<br>'));

			return response;
		});
	}

	static reinviteAction(userId, isExtranetUser): Promise
	{
		return ajax.runAction('intranet.controller.invite.reinvite', {
			data: {
				params: {
					userId,
					extranet: (isExtranetUser ? 'Y' : 'N'),
				},
			},
		}).then((response) => {
			if (response.data.result)
			{
				const InviteAccessPopup = new BX.PopupWindow({
					content: `<p>${Loc.getMessage('INTRANET_USER_LIST_ACTION_REINVITE_SUCCESS')}</p>`,
					autoHide: true,
				});

				InviteAccessPopup.show();
			}

			return response;
		});
	}

	getGrid(): BX.Main.grid
	{
		return this.#grid;
	}

	confirmAction(params: {
		userId: number,
		isAccept: boolean,
	}): void
	{
		if (params.userId)
		{
			this.confirmUser(params.isAccept ? 'confirm' : 'decline', () => {
				const row = this.#grid.getRows().getById(params.userId);
				row?.stateLoad();
				ajax.runAction('intranet.controller.invite.confirmUserRequest', {
					data: {
						userId: params.userId,
						isAccept: params.isAccept ? 'Y' : 'N',
					},
				}).then((response) => {
					if (response.data === true)
					{
						row?.update();
					}
					else if (params.isAccept)
					{
						row?.stateUnload();
					}
					else
					{
						this.activityAction({
							userId: params.userId,
							action: 'deleteOrFire',
						});
					}
				}).catch(() => {
					if (params.isAccept)
					{
						row?.stateUnload();
					}
					else
					{
						this.activityAction({
							userId: params.userId,
							action: 'deleteOrFire',
						});
					}
				});
			});
		}
	}

	activityAction(params: {
		userId: number,
		action: string,
		userFullName: ?string,
		currentUserId: ?number,
	}): void
	{
		const userId = params.userId ?? null;
		const action = params.action ?? null;

		if (!userId)
		{
			return;
		}

		if ((action === 'fire' || action === 'deleteOrFire'))
		{
			this.#grid.getLoader().show();
			this.runFireWizard(userId).then((response) => {
				this.#grid.getLoader().hide();
				const wizard = new FireEmployeeWizard({
					...response.data,
					onConfirm: (data) => {
						MoveWebhookRequest.send(userId, data).then(() => {
							this.handleFirstAdminFireSingle(userId, params.userFullName, params.currentUserId, () => {
								this.executeUserAction(userId, action, data);
							});
						}).catch((error) => console.warn(error));
					},
				});
				wizard.show();
			}).catch((response) => {
				this.#grid.getLoader().hide();
				console.warn(response);
			});
		}
		else
		{
			this.confirmUser(action, () => {
				this.executeUserAction(userId, action);
			});
		}
	}

	handleFirstAdminFireSingle(
		userId: number,
		userFullName: ?string,
		currentUserId: ?number,
		fallbackAction: function,
	): void
	{
		if (!this.isCloud || !this.isFirstAdminConfirmationEnabled)
		{
			fallbackAction();

			return;
		}

		this.checkIfFirstAdmin(userId).then((isFirstAdmin) => {
			if (!isFirstAdmin)
			{
				throw new Error('User is not first admin');
			}
			const guard = new FirstAdminGuard(
				userFullName || '',
				currentUserId || 0,
				userId,
			);

			guard.confirmAction(
				'bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest',
				() => {
					this.firstAdminConfirm({
						userId: Number(currentUserId),
						toUser: Number(userId),
					});
				},
				() => {},
			);
		}).catch(() => {
			fallbackAction();
		});
	}

	firstAdminConfirm(data)
	{
		ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.sendFireRequest', {
			data,
		}).then((response) => {
			if (response.status === 'success')
			{
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage(
						'INTRANET_USER_LIST_FIRST_GROUP_ACTION_FIRST_ADMIN_REQUEST_SENT',
						{
							'[b]': '<b>',
							'[/b]': '</b>',
							'[br]': '<br>',
						},
					),
					autoHide: true,
					autoHideDelay: 3000,
					useAirDesign: true,
				});
			}
		})
			.catch(() => {
				ErrorCollection.showSystemError('An error occurred while sending fire request');
			});
	}

	executeUserAction(userId: number, action: string, options = {}): void
	{
		this.createHandlerByAction(action).call(this, userId, action, options);
	}

	confirmUser(action: ?string, callBack: function)
	{
		MessageBox.show({
			title: this.getConfirmTitle(action) ?? '',
			message: this.getConfirmMessage(action) ?? '',
			buttons: MessageBoxButtons.YES_CANCEL,
			yesCaption: this.getConfirmButtonText(action),
			onYes: (messageBox) => {
				callBack();
				messageBox.close();
			},
		});
	}

	executeFireAction(userId: number, action: string): void
	{
		const row = this.#grid.getRows().getById(userId);
		row?.stateLoad();
		ajax.runAction(`intranet.v2.User.${action}`, {
			data: {
				userId,
			},
		}).then(() => {
			row?.update();
		}).catch((response) => {
			row?.stateUnload();
			const errors = response.errors.map((error) => error.message);
			ErrorCollection.showSystemError(errors.join('<br>'));
		});
	}

	executeRestoreAction(userId: number, action: string): void
	{
		const row = this.#grid.getRows().getById(userId);
		row?.stateLoad();

		ajax.runAction('intranet.v2.User.restore', {
			data: {
				userId,
			},
		}).then(() => {
			row?.update();
		}).catch((response) => {
			row?.stateUnload();
			const errors = response.errors.map((error) => error.message);
			ErrorCollection.showSystemError(errors.join('<br>'));
		});
	}

	createHandlerByAction(action: string): function
	{
		const handlers = {
			fire: this.executeFireAction,
			deleteOrFire: this.executeFireAction,
			restore: this.executeRestoreAction,
		};

		const handler = handlers[action];
		if (!Type.isFunction(handler))
		{
			throw new TypeError(`Handler is not defined for action ${action}`);
		}

		return handler;
	}

	runFireWizard(userId: number): Promise
	{
		return Runtime.loadExtension('intranet.fire-employee-wizard').then(({ FireWizardConfigProvider }) => {
			return FireWizardConfigProvider.fetch(userId);
		});
	}

	getConfirmTitle(action: ?string): ?string
	{
		switch (action)
		{
			case 'restore':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_RESTORE_TITLE');
			case 'confirm':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_TITLE');
			case 'delete':
			case 'deleteOrFire':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_TITLE');
			case 'fire':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_TITLE');
			case 'deactivateInvited':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_TITLE');
			case 'decline':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_TITLE');
			default:
				return '';
		}
	}

	getConfirmMessage(action: ?string): ?string
	{
		switch (action)
		{
			case 'restore':
			case 'confirm':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_MESSAGE');
			case 'delete':
			case 'deleteOrFire':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_MESSAGE');
			case 'fire':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_MESSAGE');
			case 'deactivateInvited':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_MESSAGE');
			case 'decline':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_MESSAGE');
			default:
				return '';
		}
	}

	getConfirmButtonText(action: ?string): ?string
	{
		switch (action)
		{
			case 'restore':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_RESTORE_BUTTON');
			case 'confirm':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_CONFIRM_BUTTON');
			case 'delete':
			case 'deleteOrFire':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DELETE_BUTTON');
			case 'fire':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_BUTTON');
			case 'deactivateInvited':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DEACTIVATE_INVITED_BUTTON');
			case 'decline':
				return Loc.getMessage('INTRANET_USER_LIST_ACTION_DECLINE_BUTTON');
			default:
				return null;
		}
	}

	getFirstAdminId(): Promise
	{
		if (this.#firstAdminId !== undefined)
		{
			return Promise.resolve(this.#firstAdminId);
		}

		return ajax.runAction('bitrix24.v2.FirstAdmin.FirstAdminRightsController.getPortalCreator')
			.then((response) => {
				this.#firstAdminId = Number(response.data.id);
				return this.#firstAdminId;
			})
			.catch(() => {
				this.#firstAdminId = null;
				return null;
			});
	}

	checkIfFirstAdmin(userId: number): Promise
	{
		return this.getFirstAdminId().then((firstAdminId) => {
			return firstAdminId && Number(userId) === Number(firstAdminId);
		});
	}
}
