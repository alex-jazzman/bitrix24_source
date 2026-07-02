/**
 * @module tasks/layout/template/list/more-menu
 */
jn.define('tasks/layout/template/list/more-menu', (require, exports, module) => {
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { createTestIdGenerator } = require('utils/test');

	const SortingType = {
		BY_RESPONSIBLE: 'RESPONSIBLE',
		BY_CREATED_DATE: 'CREATED_DATE',
	};

	class TemplatesListMoreMenu
	{
		constructor({ selectedSorting, isASC, onSortingClick })
		{
			this.selectedSorting = selectedSorting;
			this.isASC = isASC;
			this.onSortingClick = onSortingClick;
			this.getTestId = createTestIdGenerator({
				prefix: 'templates-sort-menu',
			});
		}

		setSelectedSorting(selectedSorting)
		{
			this.selectedSorting = selectedSorting;
		}

		setIsASC(isASC)
		{
			this.isASC = isASC;
		}

		getMenuButton()
		{
			return {
				type: 'more',
				id: this.getTestId(),
				testId: this.getTestId(),
				callback: this.openMenu,
				accent: false,
			};
		}

		getMenu()
		{
			return PopupMenu.create({
				cacheId: this.getTestId(),
			});
		}

		/**
		 * @return {Array<PopupMenuSection>}
		 */
		getSections()
		{
			return [
				{
					id: 'sorting',
					title: Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_SORT_TITLE'),
				},
			];
		}

		/**
		 * @return PopupMenuActionsData
		 */
		getMenuItems()
		{
			const orderIcon = this.isASC ? Icon.ARROW_TOP : Icon.ARROW_DOWN;
			const isSortingByDate = this.selectedSorting === SortingType.BY_CREATED_DATE;
			const isSortingByResponsible = this.selectedSorting === SortingType.BY_RESPONSIBLE;

			return [
				{
					id: SortingType.BY_CREATED_DATE,
					title: Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_SORT_CREATED_DATE'),
					icon: isSortingByDate ? orderIcon : null,
					checked: isSortingByDate,
					showCheckedIcon: isSortingByDate,
					sectionCode: 'sorting',
					onItemSelected: this.onItemSelected,
				},
				{
					id: SortingType.BY_RESPONSIBLE,
					title: Loc.getMessage('TASKSMOBILE_TEMPLATE_LIST_SORT_RESPONSIBLE'),
					icon: isSortingByResponsible ? orderIcon : null,
					checked: isSortingByResponsible,
					showCheckedIcon: isSortingByResponsible,
					sectionCode: 'sorting',
					onItemSelected: this.onItemSelected,
				},
			];
		}

		openMenu = (buttonRef) => {
			const menu = this.getMenu()
				.setActions(this.getMenuItems())
				.setSections(this.getSections());

			if (buttonRef)
			{
				menu.setTarget(buttonRef);
			}

			menu.show();
		};

		onItemSelected = (event, item) => {
			if (Object.values(SortingType).includes(item.id))
			{
				this.onSortingClick?.(item.id);
			}
		};
	}

	module.exports = {
		TemplatesListMoreMenu,
	};
});
