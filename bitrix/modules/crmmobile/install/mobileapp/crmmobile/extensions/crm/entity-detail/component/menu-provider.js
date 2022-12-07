/**
 * @bxjs_lang_path extension.php
 */

/**
 * @module crm/entity-detail/component/menu-provider
 */
jn.define('crm/entity-detail/component/menu-provider', (require, exports, module) => {

	const { Alert } = require('alert');
	const { NotifyManager } = require('notify-manager');
	const { TypeId } = require('crm/type');
	const { getEntityMessage } = require('crm/loc');
	const { CategoryListView } = require('crm/category-list-view');
	const { getSmartActivityMenuItem } = require('crm/entity-detail/component/smart-activity-menu-item');

	/**
	 * @param {DetailCardComponent} detailCard
	 * @returns {*[]}
	 */
	const menuProvider = (detailCard) => {
		const result = [];

		const { entityTypeId, qrUrl, permissions = {}, todoNotificationParams } = detailCard.getComponentParams();
		const { entityModel } = detailCard;

		if (!entityModel)
		{
			return [];
		}

		if (!detailCard.isNewEntity())
		{
			const canUpdate = BX.prop.getBoolean(permissions, 'update', false);
			const canDelete = BX.prop.getBoolean(permissions, 'delete', false);
			const canExclude = BX.prop.getBoolean(permissions, 'exclude', false);

			if (entityTypeId === TypeId.Deal)
			{
				result.push({
					id: 'excludeItem',
					sectionCode: 'action',
					onItemSelected: () => excludeEntity(detailCard),
					title: BX.message('M_CRM_ENTITY_ACTION_EXCLUDE'),
					iconUrl: component.path + '/icons/exclude.png',
					disable: !canExclude,
				});
			}

			result.push({
				id: 'deleteItem',
				sectionCode: 'action',
				onItemSelected: () => deleteEntity(detailCard),
				title: getEntityMessage('M_CRM_ENTITY_ACTION_DELETE', detailCard.getEntityTypeId()),
				iconUrl: component.path + '/icons/delete.png',
				disable: !canDelete,
			});

			if (entityTypeId === TypeId.Deal)
			{
				if (entityModel.hasOwnProperty('IS_MANUAL_OPPORTUNITY'))
				{
					result.push({
						id: 'disableManualOpportunity',
						sectionCode: 'action',
						onItemSelected: () => detailCard.customEventEmitter.emit('EntityDetails::onChangeManualOpportunity'),
						title: BX.message('M_CRM_CHANGE_MANUAL_OPPORTUNITY_SET_TO_AUTOMATIC'),
						checked: entityModel.IS_MANUAL_OPPORTUNITY !== 'Y',
						iconUrl: component.path + '/icons/manual_opportunity.png',
						disable: !canUpdate,
					});
				}

				result.push({
					id: 'changeCategoryItem',
					sectionCode: 'action',
					onItemSelected: () => changeEntityCategory(detailCard, entityModel),
					title: BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY2'),
					iconUrl: component.path + '/icons/change_category.png',
					disable: !canUpdate,
				});

				if (todoNotificationParams)
				{
					result.push(getSmartActivityMenuItem(!todoNotificationParams.isSkipped));
				}
			}

			result.push({
				id: 'shareItem',
				sectionCode: 'action',
				onItemSelected: () => dialogs.showSharingDialog({ message: currentDomain + qrUrl }),
				title: BX.message('M_CRM_ENTITY_ACTION_SHARE'),
				iconUrl: component.path + '/icons/share.png',
				showTopSeparator: result.length > 0,
			});
		}

		result.push({
			type: UI.Menu.Types.DESKTOP,
			data: { qrUrl },
			showTopSeparator: result.length > 0 && !result.some((item) => item.id === 'shareItem'),
		});

		const articleCode = getArticleCodeByType(entityModel.ENTITY_TYPE_NAME);
		if (articleCode)
		{
			result.push({
				type: UI.Menu.Types.HELPDESK,
				data: { articleCode },
			});
		}

		return result;
	};

	/**
	 * @param {DetailCardComponent} detailCard
	 * @param {Object} entityModel
	 */
	const changeEntityCategory = (detailCard, entityModel) => {
		let promise = Promise.resolve();

		if (detailCard.isToolPanelVisible())
		{
			promise = promise.then(() => askAboutUnsavedChanges());
		}

		promise.then(() => openCategoryList(detailCard, entityModel));
	};

	/**
	 * @private
	 */
	const askAboutUnsavedChanges = () => {
		return new Promise((resolve, reject) => {
			Alert.confirm(
				BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_UNSAVED_ALERT_TITLE2'),
				BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_UNSAVED_ALERT_TEXT2'),
				[
					{
						text: BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_UNSAVED_ALERT_OK'),
						type: 'destructive',
						onPress: resolve,
					},
					{
						text: BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_UNSAVED_ALERT_CANCEL'),
						type: 'cancel',
						onPress: reject,
					},
				],
			);
		});
	};

	/**
	 * @private
	 * @param {DetailCardComponent} detailCard
	 * @param {Object} entityModel
	 */
	const openCategoryList = (detailCard, entityModel) => {
		return CategoryListView.open(
			{
				entityTypeId: detailCard.getEntityTypeId(),
				currentCategoryId: entityModel.CATEGORY_ID,
				readOnly: true,
				showCounters: false,
				showTunnels: false,
				onSelectCategory: (category, categoryListLayout) => {
					if (parseInt(entityModel.CATEGORY_ID) !== parseInt(category.id))
					{
						return askToChangeCategory().then(() => {
							closeListAndSaveCategoryChange(categoryListLayout, detailCard, category.id);
						});
					}

					categoryListLayout.close();

					return Promise.resolve();
				},
			},
			{
				title: BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_TITLE2'),
			},
		);
	};

	const closeListAndSaveCategoryChange = (categoryListLayout, detailCard, categoryId) => {
		categoryListLayout.setListener((eventName) => {
			if (eventName === 'onViewHidden')
			{
				detailCard.refreshDetailCard()
					.then(() => detailCard.handleSave({ CATEGORY_ID: categoryId }))
				;
			}
		});
		categoryListLayout.close();
	};

	const askToChangeCategory = () => {
		return new Promise((resolve, reject) => {
			Alert.confirm(
				BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_ALERT_TITLE2'),
				BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_ALERT_TEXT2'),
				[
					{
						text: BX.message('M_CRM_ENTITY_ACTION_CHANGE_CATEGORY_ALERT_OK2'),
						onPress: resolve,
					},
					{
						type: 'cancel',
						onPress: reject,
					},
				],
			);
		});
	};

	/**
	 * @param {DetailCardComponent} detailCard
	 */
	const excludeEntity = (detailCard) => {
		Alert.confirm(
			BX.message('M_CRM_ENTITY_ACTION_EXCLUDE'),
			getEntityMessage('M_CRM_ENTITY_ACTION_EXCLUDE_CONFIRMATION', detailCard.getEntityTypeId()),
			[
				{
					text: BX.message('M_CRM_ENTITY_ACTION_EXCLUDE_CONFIRMATION_OK'),
					type: 'destructive',
					onPress: () => runActionWithClose('excludeEntity', detailCard),
				},
				{
					type: 'cancel',
				},
			],
		);
	};

	/**
	 * @param {DetailCardComponent} detailCard
	 */
	const deleteEntity = (detailCard) => {
		Alert.confirm(
			getEntityMessage('M_CRM_ENTITY_ACTION_DELETE', detailCard.getEntityTypeId()),
			getEntityMessage('M_CRM_ENTITY_ACTION_DELETE_CONFIRMATION', detailCard.getEntityTypeId()),
			[
				{
					text: BX.message('M_CRM_ENTITY_ACTION_DELETE_CONFIRMATION_OK'),
					type: 'destructive',
					onPress: () => runActionWithClose('deleteEntity', detailCard),
				},
				{
					type: 'cancel',
				},
			],
		);
	};

	/**
	 * @private
	 * @param {String} actionName
	 * @param {DetailCardComponent} detailCard
	 * @returns {void}
	 */
	const runActionWithClose = (actionName, detailCard) => {
		NotifyManager.showLoadingIndicator();

		BX.ajax.runAction(`crmmobile.EntityDetails.${actionName}`, {
			json: {
				entityTypeId: detailCard.getEntityTypeId(),
				entityId: detailCard.getEntityId(),
			},
		})
			.then(() => {
				detailCard.emitEntityUpdate(actionName);
				NotifyManager.hideLoadingIndicatorWithoutFallback();
				detailCard.close();
			})
			.catch((error) => {
				NotifyManager.showDefaultError();
				console.error(error);
			})
		;
	};

	// ToDo article codes
	const getArticleCodeByType = (type) => {
		// switch (type)
		// {
		// 	// adjustment
		// 	case 'S':
		// 		return '14662772';
		//
		// 	// arrival
		// 	case 'A':
		// 		return '14662786';
		// }

		return null;
	};

	module.exports = { menuProvider };
});
