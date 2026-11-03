/**
 * @module crm/entity-detail/opener
 */
jn.define('crm/entity-detail/opener', (require, exports, module) => {
	const { Alert } = require('alert');
	const { AnalyticsEvent } = require('analytics');
	const { NotifyManager } = require('notify-manager');
	const { EntitySvg } = require('crm/assets/entity');
	const { getEntityMessage } = require('crm/loc');
	const { Type } = require('crm/type');
	const { Type: CoreType } = require('type');
	const { mergeImmutable } = require('utils/object');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');
	const { PlanRestriction } = require('layout/ui/plan-restriction');
	const { CrmMode } = require('crm/crm-mode');
	const { CaseName } = require('crm/onboarding');
	const { TypeId } = require('crm/type');
	const { Color } = require('tokens');
	const { Presentation } = require('in-app-url/presentation');
	const { Uuid } = require('utils/uuid');

	const CACHE_TTL = 60 * 60 * 4; // 4 hours
	const CACHE_VERSION = 2;

	let storage;
	let inMemoryEntities = null;
	let inMemoryTtl = null;

	class EntityDetailOpener
	{
		/**
		 * @public
		 * @param {EntityDetailOpenerParams} params
		 * @param {PerfPoint} [perfPoint]
		 */
		static open({
			payload,
			widgetParams = {},
			parentWidget = null,
			canOpenInDefault = false,
			analytics = {},
			presentation = null,
		}, perfPoint = null)
		{
			const { entityTypeId, categoryId } = payload;
			const resolvedPresentation = Presentation.resolve(presentation, Presentation.MODAL);
			const widgetCode = `crm-entity-details-${Uuid.getV4()}`;

			let openingPromise = this
				.checkAvailability(entityTypeId, categoryId)
				.then(() => this.prepareAnalytics(analytics, entityTypeId))
				.then((preparedAnalytics) => {
					const analyticsEvent = preparedAnalytics.getEvent();
					if (analyticsEvent === 'entity_add_open'
						|| analyticsEvent === 'entity_copy_open')
					{
						preparedAnalytics.send();
						preparedAnalytics.setEvent(
							analyticsEvent === 'entity_add_open'
								? 'entity_create'
								: 'entity_copy',
						);
					}

					const presenter = new WidgetPresenter()
						.setPresentation(resolvedPresentation)
						.setParentWidget(parentWidget)
						.setCanOpenInDefault(canOpenInDefault)
						.setWidgetSettings({ ...widgetParams, code: widgetCode })
						.setTitleParams(this.prepareTitleParams(payload, widgetParams.titleParams))
						.setComponentName('crm:crm.entity.details', {
							componentParams: {
								payload: { ...payload, widgetCode },
								analytics: preparedAnalytics,
								context: {
									source: 'entity-detail-opener',
									caseForMarkAsShown: CaseName.ON_NO_CRM_DEALS,
									necessaryEntityTypeId: TypeId.Deal,
								},
							},
						});

					if (resolvedPresentation.isModal())
					{
						presenter.setBackgroundColor(Color.bgSecondary);
					}

					return presenter.open();
				})
			;

			if (perfPoint)
			{
				perfPoint.start();
				openingPromise = openingPromise.finally(() => perfPoint.end());
			}

			openingPromise.catch((error) => {
				console.error(error);
				this.showAlert(error, entityTypeId);
			});
		}

		static async prepareAnalytics(analytics, entityTypeId)
		{
			const crmMode = await CrmMode.getCurrentCrmMode();

			return new AnalyticsEvent(analytics)
				.setTool('crm')
				.setCategory('entity_operations')
				.setType(Type.getTypeForAnalytics(entityTypeId))
				.setP1(`crmMode_${crmMode.toLowerCase()}`);
		}

		/**
		 * @private
		 * @internal
		 *
		 * @return {KeyValueStorage}
		 */
		static getStorage()
		{
			if (!storage)
			{
				storage = Application.storageById(`crm/entity-detail/opener/${env.languageId}/v${CACHE_VERSION}`);
			}

			return storage;
		}

		/**
		 * @private
		 * @internal
		 */
		static updateStorage(entities)
		{
			this.setEntities(entities);
			this.setTtlValue(this.getCurrentTimeInSeconds());
		}

		/**
		 * @private
		 * @internal
		 */
		static getEntities()
		{
			if (inMemoryEntities === null)
			{
				inMemoryEntities = this.getStorage().getObject('entities', []);
			}

			return inMemoryEntities;
		}

		/**
		 * @private
		 * @internal
		 */
		static setEntities(entities)
		{
			inMemoryEntities = entities;

			return this.getStorage().setObject('entities', entities);
		}

		/**
		 * @private
		 * @internal
		 */
		static getTtlValue()
		{
			if (inMemoryTtl === null)
			{
				inMemoryTtl = this.getStorage().getNumber('ttl', 0);
			}

			return inMemoryTtl;
		}

		/**
		 * @private
		 * @internal
		 */
		static setTtlValue(ttl)
		{
			inMemoryTtl = ttl;

			return this.getStorage().setNumber('ttl', ttl);
		}

		/**
		 * @private
		 * @internal
		 */
		static cacheExpired(ttl = CACHE_TTL)
		{
			const cacheTime = this.getTtlValue();
			const currentTime = this.getCurrentTimeInSeconds();

			return currentTime > cacheTime + ttl;
		}

		/**
		 * @private
		 * @internal
		 */
		static getCurrentTimeInSeconds()
		{
			return Math.floor(Date.now() / 1000);
		}

		/**
		 * @private
		 * @internal
		 */
		static prepareTitleParams({ entityId, entityTypeId, copy = false }, titleParams = {})
		{
			const entity = this.findEntityType(entityTypeId);
			if (!entity)
			{
				return titleParams;
			}

			const entityTitleParams = {
				useLargeTitleMode: false,
				detailTextColor: Color.base4.toHex(),
			};

			if (entityId)
			{
				if (copy)
				{
					titleParams.text = getEntityMessage('MCRM_ENTITY_DETAIL_OPENER_COPY_TEXT', entityTypeId);
				}
				else
				{
					if (!CoreType.isStringFilled(titleParams.text))
					{
						titleParams.text = `${entity.title} #${entityId}`;
					}

					entityTitleParams.detailText = entity.title;
				}
			}
			else
			{
				entityTitleParams.text = getEntityMessage('MCRM_ENTITY_DETAIL_OPENER_CREATE_TEXT', entityTypeId);
			}

			const iconFunctionName = `${Type.getCamelizedEntityTypeName(entity.entityTypeName)}Inverted`;
			if (EntitySvg[iconFunctionName])
			{
				entityTitleParams.svg = {
					content: EntitySvg[iconFunctionName](),
				};
			}

			return mergeImmutable(entityTitleParams, titleParams);
		}

		/**
		 * @private
		 * @internal
		 */
		static checkAvailability(entityTypeId, categoryId = null)
		{
			if (!entityTypeId || !Type.existsById(entityTypeId))
			{
				return Promise.reject();
			}

			let loading = false;
			let promise = Promise.resolve();

			if (this.cacheExpired())
			{
				loading = true;
				promise = promise.then(() => this.loadEntities(
					true,
					{ [entityTypeId]: categoryId },
				));
			}

			return (
				promise
					.then(() => new Promise((resolve, reject) => {
						let entity = this.findEntityType(entityTypeId);
						if (entity && entity.supported && !entity.restricted)
						{
							this.resolveEntity(entity, resolve, reject);

							return;
						}

						if (this.cacheExpired(5))
						{
							// retry first reject
							loading = true;
							this.loadEntities(
								true,
								{ [entityTypeId]: categoryId },
							).then(() => {
								entity = this.findEntityType(entityTypeId);
								if (entity)
								{
									this.resolveEntity(entity, resolve, reject);
								}
								else
								{
									reject();
								}
							}).catch(console.error);
						}
						else if (entity)
						{
							this.resolveEntity(entity, resolve, reject);
						}
						else
						{
							reject();
						}
					}))
					.finally(() => {
						if (loading)
						{
							NotifyManager.hideLoadingIndicatorWithoutFallback();
						}
					})
			);
		}

		/**
		 * @private
		 * @internal
		 */
		static findEntityType(entityTypeId)
		{
			return this.getEntities().find((entity) => entity.entityTypeId === entityTypeId);
		}

		/**
		 * @private
		 * @internal
		 */
		static loadEntities(showLoader = false, categories = {})
		{
			if (showLoader)
			{
				NotifyManager.showLoadingIndicator();
			}

			return new Promise((resolve, reject) => {
				BX.ajax.runAction(
					'crmmobile.EntityDetails.getAvailableEntityTypes',
					{
						json: { categories },
					},
				).then(({ data }) => {
					this.updateStorage(data);
					resolve();
				}).catch(reject)
				;
			});
		}

		/**
		 * @private
		 * @internal
		 */
		static resolveEntity(entity, resolve, reject)
		{
			if (!entity.supported)
			{
				reject({
					title: getEntityMessage('MCRM_ENTITY_DETAIL_OPENER_NOT_SUPPORTED_TITLE', entity.entityTypeId),
					text: BX.message('MCRM_ENTITY_DETAIL_OPENER_NOT_SUPPORTED_TEXT'),
				});
			}
			else if (entity.restricted)
			{
				reject({ restricted: true });
			}
			else
			{
				resolve();
			}
		}

		/**
		 * @private
		 * @internal
		 */
		static showAlert(error, entityTypeId)
		{
			if (error && error.restricted)
			{
				PlanRestriction.open({ title: getEntityMessage('MCRM_ENTITY_DETAIL_OPENER_RESTRICTED', entityTypeId) });
			}
			else
			{
				const title = error ? error.title : '';
				const text = error ? error.text : '';

				Alert.alert(
					title || getEntityMessage('MCRM_ENTITY_DETAIL_OPENER_ALERT_TITLE2', entityTypeId),
					text || BX.message('MCRM_ENTITY_DETAIL_OPENER_ALERT_TEXT2'),
				);
			}
		}
	}

	module.exports = { EntityDetailOpener };
});
