import { ajax as Ajax, Loc, Text, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Router } from 'crm.router';
import {
	ApplyButton,
	ButtonSize,
	CancelButton,
	CreateButton,
	AirButtonStyle,
} from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Dialog, Item } from 'ui.entity-selector';
import { UI } from 'ui.notification';
import { ActionParams, Base } from './base';
import ConfigurableItem from '../configurable-item';

const ALLOWED_MOVE_TO_ITEM_TYPES = [
	'Activity:Call',
	'Activity:Email',
	'Activity:OpenLine',
];

declare type ActionData = {
	activityId: number,
	ownerTypeId: number,
	ownerId: number,
	categoryId: ?number,
	canAddItems: boolean,
};

export class Activity extends Base
{
	#moveToSelectorDialog: ?Dialog = null;

	getDeleteActionMethod(): string
	{
		return 'crm.timeline.activity.delete';
	}

	getMoveActionMethod(): string
	{
		return 'crm.activity.binding.move';
	}

	getDeleteTagActionMethod(): string
	{
		return 'crm.timeline.activity.deleteTag';
	}

	getDeleteActionCfg(recordId: Number, ownerTypeId: Number, ownerId: Number): Object
	{
		return {
			data: {
				activityId: recordId,
				ownerTypeId,
				ownerId,
			},
		};
	}

	runDeleteTagAction(recordId: Number, ownerTypeId: Number, ownerId: Number): Promise
	{
		const deleteTagActionCfg = {
			data: {
				activityId: recordId,
				ownerTypeId,
				ownerId,
			},
		};

		return Ajax.runAction(
			this.getDeleteTagActionMethod(),
			deleteTagActionCfg,
		).then(() => {
			return true;
		}, (response) => {
			UI.Notification.Center.notify({
				content: response.errors[0].message,
				autoHideDelay: 5000,
			});

			return true;
		});
	}

	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData, animationCallbacks } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Activity:Edit' && actionData && actionData.activityId)
		{
			this.#editActivity(actionData.activityId);
		}

		if (action === 'Activity:MoveTo' && Type.isPlainObject(actionData))
		{
			this.#showMoveToSelectorDialog(item, actionData);
		}

		if (action === 'Activity:View' && actionData && actionData.activityId)
		{
			this.#viewActivity(actionData.activityId);
		}

		if (action === 'Activity:Delete' && actionData && actionData.activityId)
		{
			const confirmationText = actionData.confirmationText ?? '';
			if (confirmationText)
			{
				MessageBox.show({
					message: Text.encode(confirmationText),
					modal: true,
					buttons: MessageBoxButtons.YES_NO,
					onYes: () => {
						return this.runDeleteAction(
							actionData.activityId,
							actionData.ownerTypeId,
							actionData.ownerId,
							animationCallbacks,
						);
					},
					onNo: (messageBox) => {
						messageBox.close();
					},
				});
			}
			else
			{
				this.runDeleteAction(
					actionData.activityId,
					actionData.ownerTypeId,
					actionData.ownerId,
				);
			}
		}

		if (action === 'Activity:DeleteTag' && actionData && actionData.activityId)
		{
			const confirmationText = actionData.confirmationText ?? '';
			if (confirmationText)
			{
				MessageBox.show({
					message: Text.encode(confirmationText),
					modal: true,
					buttons: MessageBoxButtons.YES_CANCEL,
					yesCaption: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_TODO_DELETE_TAG_CONFIRM_YES_CAPTION'),
					onYes: () => {
						return this.runDeleteTagAction(
							actionData.activityId,
							actionData.ownerTypeId,
							actionData.ownerId,
						);
					},
					onCancel: (messageBox) => {
						messageBox.close();
					},
				});
			}
			else
			{
				this.runDeleteTagAction(
					actionData.activityId,
					actionData.ownerTypeId,
					actionData.ownerId,
				);
			}
		}

		if (action === 'Activity:FilterRelated' && Type.isPlainObject(actionData))
		{
			this.#filterRelated(actionData);
		}
	}

	#viewActivity(id): void
	{
		const editor = this.#getActivityEditor();
		if (editor && id)
		{
			editor.viewActivity(id);
		}
	}

	#editActivity(id): void
	{
		const editor = this.#getActivityEditor();
		if (editor && id)
		{
			editor.editActivity(id);
		}
	}

	#showMoveToSelectorDialog(
		itemElement: ConfigurableItem,
		actionData: ActionData,
	): void
	{
		if (!ALLOWED_MOVE_TO_ITEM_TYPES.includes(itemElement.getType()))
		{
			// eslint-disable-next-line no-console
			console.warn('Move to action provided only for following item types:', ALLOWED_MOVE_TO_ITEM_TYPES);

			return;
		}

		const isValidParams = Type.isNumber(actionData.activityId)
			&& Type.isNumber(actionData.ownerId)
			&& Type.isNumber(actionData.ownerTypeId)
		;
		if (!isValidParams)
		{
			throw new TypeError('Invalid actionData parameters');
		}

		const element = itemElement.getLayoutFooterMenu().$el;
		if (!Type.isDomNode(element))
		{
			throw new ReferenceError('Selector dialog target element must be a DOM node');
		}

		if (!this.#moveToSelectorDialog)
		{
			this.#createSelectorDialog(element, actionData);
		}

		this.#moveToSelectorDialog.show();
	}

	onBeforeItemClearLayout(item: ConfigurableItem): void
	{
		this.#moveToSelectorDialog?.hide();
	}

	#getActivityEditor(): BX.CrmActivityEditor
	{
		return BX.CrmActivityEditor.getDefault();
	}

	#createSelectorDialog(
		dialogTargetElement: HTMLElement,
		actionData: ActionData,
	): void
	{
		let dialogEntityId = BX.CrmEntityType.resolveName(actionData.ownerTypeId);
		if (BX.CrmEntityType.isDynamicTypeByTypeId(actionData.ownerTypeId))
		{
			dialogEntityId = BX.CrmEntityType.names.dynamic;
		}

		const applyButton = new ApplyButton({
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			size: ButtonSize.MEDIUM,
			color: null,
			round: true,
			onclick: () => {
				this.#runMoveAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, targetItem);
				this.#moveToSelectorDialog.hide();
			},
		});

		const cancelButton = new CancelButton({
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.MEDIUM,
			round: true,
			color: null,
			onclick: (): void => {
				targetItem = null;
				this.#moveToSelectorDialog.deselectAll();
				this.#moveToSelectorDialog.hide();
			},
		});

		const createAndApplyButton: Button | null = actionData.canAddItems
			? this.#getCreateAndApplyButton(actionData, dialogEntityId)
			: null
		;

		let targetItem: Item = null;

		this.#moveToSelectorDialog = new Dialog({
			targetNode: dialogTargetElement,
			enableSearch: true,
			context: `CRM-TIMELINE-MOVE-ACTIVITY-ENTITY-SELECTOR-${actionData.ownerTypeId}`,
			tagSelectorOptions: {
				textBoxWidth: '50%',
			},
			entities: [{
				id: dialogEntityId,
				dynamicLoad: true,
				dynamicSearch: true,
				options: {
					ownerId: actionData.ownerId,
					categoryId: actionData.categoryId,
					showEntityTypeNameInHeader: true,
					hideClosedItems: true,
					excludeMyCompany: true,
					entityTypeId: actionData.ownerTypeId, // for 'dynamic' types
				},
			}],
			events: {
				'Item:onBeforeSelect': (event: BaseEvent): void => {
					const { item } = event.getData();
					if (item)
					{
						if (item.getId() === actionData.ownerId)
						{
							event.preventDefault();

							return;
						}

						targetItem = item;
						this.#moveToSelectorDialog.getSelectedItems().forEach((row: Item) => {
							if (
								row.getEntityId() === targetItem.getEntityId()
								&& Text.toInteger(row.getId()) !== Text.toInteger(targetItem.getId())
							)
							{
								row.deselect();
							}
						});

						applyButton.setDisabled(false);
						createAndApplyButton?.setDisabled(true);
					}
				},
				'Item:onDeselect': (): void => {
					applyButton.setDisabled(true);
					createAndApplyButton?.setDisabled(false);
				},
			},
			footer: [
				applyButton.setDisabled(true).render(),
				cancelButton.render(),
				createAndApplyButton?.render(),
			],
			footerOptions: {
				containerStyles: {
					display: 'flex',
					'justify-content': 'center',
					gap: '12px',
					background: 'white',
					height: 'auto',
					padding: '18px 0',
				},
			},
		});
	}

	#getCreateAndApplyButton(
		actionData: ActionData,
		dialogEntityId: string,
	): Button
	{
		const newItemUrl = Router.Instance.getItemDetailUrl(actionData.ownerTypeId, 0, actionData.categoryId);

		return new CreateButton({
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			size: ButtonSize.MEDIUM,
			round: true,
			disabled: newItemUrl === null,
			color: null,
			onclick: (): void => {
				if (newItemUrl === null)
				{
					return;
				}

				this.#openItemCreateSlider(String(newItemUrl), actionData, dialogEntityId);
			},
		});
	}

	#openItemCreateSlider(newItemUrl: Uri, actionData: ActionData, dialogEntityId: string): void
	{
		let runMoveActionForNewItem = null;

		BX.Crm.Page.openSlider(String(newItemUrl), {
			events: {
				onOpen: ({ slider }): void => {
					runMoveActionForNewItem = this.#getRunMoveActionForNewItemCallback(slider, actionData, dialogEntityId);

					BX.Crm.EntityEvent.subscribe(runMoveActionForNewItem);
				},
				onClose: (): void => {
					BX.Crm.EntityEvent.unsubscribe(runMoveActionForNewItem);
				},
			},
		});
	}

	#getRunMoveActionForNewItemCallback(
		slider,
		actionData: ActionData,
		dialogEntityId: string,
	): Function
	{
		const runMoveActionForNewItem = (eventName, eventData) => {
			if (eventName !== 'onCrmEntityCreate' || eventData.entityTypeId !== actionData.ownerTypeId)
			{
				return;
			}

			const newItemEntityEditor = slider.getWindow().BX?.Crm?.EntityEditor?.getDefault();
			if (Type.isNil(newItemEntityEditor))
			{
				return;
			}

			const isItemCreatedInCurrentSlider = newItemEntityEditor.getEntityId() === eventData.entityId;
			if (!isItemCreatedInCurrentSlider)
			{
				return;
			}

			const item = new Item({
				id: eventData.entityId,
				entityId: dialogEntityId,
			});

			this.#runMoveAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, item);
			this.#moveToSelectorDialog.hide();

			BX.Crm.EntityEvent.unsubscribe(runMoveActionForNewItem);
		};

		return runMoveActionForNewItem;
	}

	#runMoveAction(activityId: Number, sourceEntityTypeId: Number, sourceEntityId: Number, targetItem: ?Item): void
	{
		if (!targetItem)
		{
			throw new ReferenceError('Target item is not defined');
		}

		const targetEntityTypeId = BX.CrmEntityType.resolveId(targetItem.getEntityId());
		const targetEntityId = targetItem.getId();
		if (targetEntityTypeId <= 0 || targetEntityId <= 0)
		{
			throw new Error('Target entity in not valid');
		}

		if (Text.toInteger(targetEntityTypeId) !== Text.toInteger(sourceEntityTypeId))
		{
			throw new Error('Source and target entity types are not equal');
		}

		const data = {
			activityId,
			sourceEntityTypeId,
			sourceEntityId,
			targetEntityTypeId,
			targetEntityId,
		};

		Ajax
			.runAction(this.getMoveActionMethod(), { data })
			.catch((response) => {
				UI.Notification.Center.notify({
					content: response.errors[0].message,
					autoHideDelay: 5000,
				});

				throw response;
			});
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		const itemType = item.getType();

		return (
			itemType.indexOf('Activity:') === 0 // for items with type started from `Activity:`
			|| itemType === 'TodoCreated' 		// TodoCreated can contain link to activity
		);
	}

	#filterRelated(actionData: { activityId: Number, activityLabel: String, filterId: String }): void
	{
		if (!(Type.isNumber(actionData.activityId)
			&& Type.isStringFilled(actionData.activityLabel)
			&& Type.isStringFilled(actionData.filterId)
		))
		{
			return;
		}

		const filterManager = BX.Main.filterManager.getById(actionData.filterId);
		if (!filterManager)
		{
			return;
		}

		const filterApi = filterManager.getApi();

		const fields = {
			ACTIVITY: actionData.activityId,
			ACTIVITY_label: actionData.activityLabel,
		};

		filterApi.extendFilter(fields, true);

		BX.CrmTimelineManager.getDefault().getHistory().showFilter();
	}
}
