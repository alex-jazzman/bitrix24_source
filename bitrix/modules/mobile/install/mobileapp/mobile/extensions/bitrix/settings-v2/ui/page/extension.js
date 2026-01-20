/**
 * @module settings-v2/ui/page
 */
jn.define('settings-v2/ui/page', (require, exports, module) => {
	const { Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Area } = require('ui-system/layout/area');
	const { Box } = require('ui-system/layout/box');
	const { Color } = require('tokens');
	const { Type } = require('type');
	const { SettingItemType } = require('settings-v2/const');
	const { ItemFactory } = require('settings-v2/ui/items');

	/**
	 * @class SettingsPage
	 */
	class SettingsPage extends LayoutComponent
	{
		/**
		 * @param {SettingPage} props
		 * @param {Array<SettingItem>} props.items
		 * @param {Function} props.openPage
		 * @param {String} props.testId
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				testId: props.testId || 'settings',
				context: this,
			});

			this.items = this.props?.items || [];

			this.initState();
		}

		initState()
		{
			this.state = {
				itemsValues: {},
				isLoading: true,
			};
		}

		componentDidMount()
		{
			this.load();
		}

		async load()
		{
			const settingsData = await this.loadSettingsData();
			this.items = this.prepareItems(this.items, settingsData);
			await this.loadItemsValues(this.items);

			this.setState({
				isLoading: false,
			});
		}

		async loadSettingsData()
		{
			const { requestSettingsData, ...other } = this.props;

			return requestSettingsData?.(other) ?? null;
		}

		async loadItemsValues(items)
		{
			await this.loadItemsValuesRecursive(items);
		}

		async loadItemsValuesRecursive(items)
		{
			await Promise.all(items.map(async (item) => {

				if (item.controller)
				{
					if (!Type.isNil(this.state.itemsValues[item.id]))
					{
						console.error(`item.id must be unique: "${item.id}" is not uniq`);
					}

					this.state.itemsValues[item.id] = await item.controller.get();
				}

				if (Type.isArrayFilled(item.items))
				{
					await this.loadItemsValuesRecursive(item.items);
				}
			}));
		}

		prepareItems(items, settingsData)
		{
			const preparedItems = items.map((item) => {
				if (item.prepareItems)
				{
					item.items = item.prepareItems(settingsData);
				}

				return item;
			});

			return this.filterItems(preparedItems, settingsData);
		}

		filterItems(items, settingsData)
		{
			items.forEach((item) => {
				if (Type.isArrayFilled(item.items))
				{
					item.items = this.filterItems(item.items, settingsData);
				}
			});

			return items.filter((item) => {
				if (item.prefilter)
				{
					return item.prefilter(settingsData);
				}

				return true;
			});
		}

		onChangeItemValue = (id, controller, value) => {
			controller.set(value);

			this.state.itemsValues = {
				...this.state.itemsValues,
				[id]: value,
			};
		};

		render()
		{
			return Box(
				{
					style: {
						justifyContent: 'center',
					},
				},
				this.renderContent(),
			);
		}

		renderContent()
		{
			if (this.state.isLoading)
			{
				return this.renderLoader();
			}

			return AreaList(
				{
					testId: this.getTestId('list'),
				},
				...this.renderItems(this.items),
			);
		}

		renderLoader()
		{
			return Loader({
				style: {
					width: 50,
					height: 50,
					alignSelf: 'center',
				},
				tintColor: Color.base3,
				animating: true,
				size: 'small',
				testId: this.getTestId('loader'),
			});
		}

		renderItems(items)
		{
			const lastItemIndex = items.length - 1;

			return items.map(
				(item, index) => this.renderItem(item, item.divider ?? index !== lastItemIndex),
			).filter(Boolean);
		}

		renderItem(item, showDivider)
		{
			if (item.type === SettingItemType.SECTION)
			{
				if (!Type.isArrayFilled(item.items))
				{
					return null;
				}

				return Area(
					{
						testId: this.getTestId(item.id),
						title: item.title,
						divider: showDivider,
					},
					...this.renderItems(item.items),
				);
			}
			const hidden = item.controller && Type.isNil(this.state.itemsValues[item.id]);

			if (hidden)
			{
				return null;
			}

			return ItemFactory.make(this.getItemProps(item, showDivider));
		}

		getItemProps(item, showDivider)
		{
			const { openPage } = this.props;

			return {
				...item,
				divider: showDivider,
				value: this.state.itemsValues[item.id] ?? null,
				onChange: this.onChangeItemValue,
				onClick: item.nextPage
					? () => {
						openPage(item.nextPage, item.nextPageParams);
					}
					: item.onClick,
				style: {
					paddingVertical: Indent.XL.toNumber(),
				},
				iconColor: item.iconColor ?? Color.accentMainPrimary,
			};
		}
	}

	module.exports = {
		SettingsPage,
	};
});
