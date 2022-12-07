/**
 * @module layout/ui/fields/crm-element
 */
jn.define('layout/ui/fields/crm-element', (require, exports, module) => {

	const { EntitySelectorFieldClass, CastType } = require('layout/ui/fields/entity-selector');
	const { get, clone } = require('utils/object');
	const { stringify } = require('utils/string');

	const DEFAULT_AVATAR = '/bitrix/mobileapp/mobile/extensions/bitrix/layout/ui/fields/crm-element/images/default-avatar.png';

	let EntityDetailOpener;
	let Type;

	try
	{
		EntityDetailOpener = require('crm/entity-detail/opener').EntityDetailOpener;
		Type = require('crm/type').Type;
	}
	catch (e)
	{
		console.warn(e);

		return;
	}

	/**
	 * @class CrmElementField
	 */
	class CrmElementField extends EntitySelectorFieldClass
	{
		constructor(props)
		{
			super(props);

			this.handleUpdateEntity = this.handleUpdateEntity.bind(this);
			this.state.showAll = false;
		}

		componentDidMount()
		{
			super.componentDidMount();

			BX.addCustomEvent('DetailCard::onUpdate', this.handleUpdateEntity.bind(this));
		}

		handleUpdateEntity(uid, { entityTypeId, entityId }, { text })
		{
			const entityList = clone(this.state.entityList);

			const entity = entityList.find(({ type, id }) => {
				type = Type.resolveIdByName(type);
				id = parseInt(id);

				return type === entityTypeId && id === entityId;
			});

			if (entity && entity.title !== text)
			{
				entity.title = text;
				this.setState({ entityList });
			}
		}

		getConfig()
		{
			const config = super.getConfig();

			return {
				...config,
				selectorType: EntitySelectorFactory.Type.CRM_ELEMENT,
				castType: CastType.STRING,
			};
		}

		renderEmptyEntity()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Image({
					style: this.styles.entityImage,
					uri: this.getImageUrl(DEFAULT_AVATAR),
				}),
				Text({
					style: this.styles.emptyEntity,
					numberOfLines: 1,
					ellipsize: 'end',
					text: BX.message('FIELDS_CRM_ELEMENT_EMPTY'),
				}),
			);
		}

		renderEntity(entity = {}, showPadding = false)
		{
			const { imageUrl, type, title } = entity;
			const onClick = this.openEntity.bind(this, entity);
			const subtitle = get(entity, ['customData', 'entityInfo', 'typeNameTitle'], null) || entity.subtitle;
			const entityTypeId = Type.resolveIdByName(type);

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingBottom: showPadding ? 5 : undefined,
					},
				},
				Image({
					style: this.styles.entityImage,
					uri: this.getImageUrl(imageUrl, type),
					onClick,
				}),
				View(
					{
						style: {
							flexDirection: 'column',
							flexShrink: 2,
						},
						onClick,
					},
					Text({
						style: this.styles.entityTitle(this.supportsOpenEntity(entityTypeId)),
						numberOfLines: 1,
						ellipsize: 'end',
						text: title,
					}),
					subtitle && Text({
						style: this.styles.entitySubtitle,
						numberOfLines: 1,
						ellipsize: 'end',
						text: subtitle,
					}),
				),
			);
		}

		getImageUrl(imageUrl, type)
		{
			imageUrl = stringify(imageUrl);

			if (imageUrl === '')
			{
				const path = `/bitrix/mobileapp/mobile/extensions/bitrix/selector/providers/common/images/${type}.png`;

				return currentDomain + path;
			}

			if (imageUrl.indexOf(currentDomain) !== 0)
			{
				imageUrl = encodeURI(imageUrl);
				imageUrl = imageUrl.replace(`${currentDomain}`, '');
				imageUrl = (imageUrl.indexOf('http') !== 0 ? `${currentDomain}${imageUrl}` : imageUrl);
			}

			return imageUrl;
		}

		openEntity(entity)
		{
			const { type: entityTypeName, id: entityId, title } = entity;
			const entityTypeId = Type.resolveIdByName(entityTypeName);

			if (!this.supportsOpenEntity(entityTypeId))
			{
				return;
			}

			EntityDetailOpener.open(
				{
					entityTypeId,
					entityId,
				},
				{ titleParams: { text: title } },
				this.getParentWidget(),
			);
		}

		supportsOpenEntity(entityTypeId)
		{
			if (!this.canOpenEntity())
			{
				return false;
			}

			return EntityDetailOpener.supportsEntityType(entityTypeId);
		}

		canOpenEntity(entity)
		{
			return true;
		}

		getDefaultStyles()
		{
			const styles = super.getDefaultStyles();

			return {
				...styles,
				emptyEntity: {
					...styles.emptyValue,
					flex: null,
				},
				entityContent: {
					...styles.entityContent,
					flexDirection: 'column',
					flexWrap: 'no-wrap',
				},
				entityImage: {
					width: 24,
					height: 24,
					borderRadius: 12,
					marginRight: 6,
				},
				entityTitle: (clickable) => ({
					color: clickable ? '#0b66c3' : '#333333',
					fontSize: 16,
					flexShrink: 2,
				}),
				entitySubtitle: {
					color: '#a8adb4',
					fontSize: 12,
					flexShrink: 2,
				},
			};
		}
	}

	module.exports = {
		CrmElementType: 'crm',
		CrmElementField: (props) => new CrmElementField(props),
	};

});
