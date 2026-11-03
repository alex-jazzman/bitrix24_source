/**
 * @bxjs_lang_path extension.php
 * @module crm/conversion/client-creation
 */
jn.define('crm/conversion/client-creation', (require, exports, module) => {
	const { Loc } = require('loc');
	const { NotifyManager } = require('notify-manager');
	const { showSafeToast } = require('toast');
	const { ContextMenu } = require('layout/ui/context-menu');
	const { PerfPoint } = require('debug/prism');
	const { TypeId } = require('crm/type');
	const { getActionToChangeStage } = require('crm/entity-actions');
	const { EntityDetailOpener } = require('crm/entity-detail/opener');

	class ClientCreation
	{
		#openingPromise = null;

		constructor(props)
		{
			this.props = props;
		}

		open()
		{
			this.#openingPromise ??= this.#open();

			return this.#openingPromise;
		}

		async #open()
		{
			try
			{
				const items = await this.#loadItems();
				if (items.length === 0)
				{
					showSafeToast({ message: Loc.getMessage('M_CRM_CLIENT_CREATION_EMPTY') }, this.props.parentWidget);

					return;
				}

				const item = await this.#selectItem(items);
				if (item === null)
				{
					return;
				}

				const [entityTypeId] = item.entityTypeIds;
				const payload = {
					entityTypeId,
					entityId: 0,
					sourceEntityTypeId: this.props.entityTypeId,
					sourceEntityId: this.props.entityId,
				};

				if (entityTypeId === TypeId.Deal)
				{
					const categoryId = await getActionToChangeStage().onAction({
						title: item.title,
						entityTypeId,
						layoutWidget: this.props.parentWidget,
						allowedCategoryIds: item.allowedCategoryIds,
					}, new PerfPoint('CRM Client Creation Prepare Deal Categories'));
					if (categoryId === null)
					{
						return;
					}

					payload.categoryId = categoryId;
				}

				EntityDetailOpener.open({
					payload,
					parentWidget: this.props.parentWidget,
					analytics: this.props.analytics,
				}, new PerfPoint('CRM Client Creation Prepare Card'));
			}
			catch (error)
			{
				NotifyManager.showDefaultError();
				console.error(error);
			}
		}

		async #loadItems()
		{
			const { entityTypeId, entityId } = this.props;
			NotifyManager.showLoadingIndicator();
			const point = new PerfPoint('CRM Client Creation Load Targets').start();

			try
			{
				const { data } = await BX.ajax.runAction('crmmobile.Conversion.getConversionMenuItems', {
					json: { entityTypeId, entityId },
				});

				return data.items;
			}
			finally
			{
				point.end();
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		}

		#selectItem(items)
		{
			return new Promise((resolve, reject) => {
				let selected = false;
				const menu = new ContextMenu({
					params: { title: this.props.title },
					actions: items.map((item) => ({
						id: `crm-client-creation-${item.entityTypeIds[0]}`,
						title: item.title,
						onClickCallback: () => {
							if (selected)
							{
								return Promise.resolve({ closeMenu: false });
							}

							selected = true;

							return Promise.resolve({ closeCallback: () => resolve(item) });
						},
					})),
					onCancel: () => resolve(null),
				});

				const point = new PerfPoint('CRM Client Creation Open Target Menu').start();
				menu.show(this.props.parentWidget).finally(() => point.end()).catch(reject);
			});
		}
	}

	module.exports = { ClientCreation };
});
