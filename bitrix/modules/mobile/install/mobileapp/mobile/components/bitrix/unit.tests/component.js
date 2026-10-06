(() => {
	const require = (ext) => jn.require(ext);
	const { ComponentHelper } = require('helpers/component');
	const { Loc } = require('loc');
	const { isModuleInstalled } = require('module');
	const { createTestingGroupTestId, testingCatalog } = require('testing/catalog');
	require('testing/catalog/mobile');
	const { Indent } = require('tokens');
	const { EntityCell } = require('ui-system/blocks/entity-cell');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { StringInput, InputDesign, InputMode, InputSize, Icon } = require('ui-system/form/inputs/string');
	const { Box } = require('ui-system/layout/box');

	const Section = {
		ROOT: 'root',
		MODULES: 'modules',
		FEATURES: 'features',
	};

	/**
	 * @extends {LayoutComponent<UnitTestsCatalogProps, UnitTestsCatalogState>}
	 */
	class UnitTestsCatalog extends LayoutComponent
	{
		/**
		 * @param {UnitTestsCatalogProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				section: Section.ROOT,
				catalogReady: false,
				searchQuery: '',
			};
		}

		componentDidMount()
		{
			this.#updateTitle(Section.ROOT);
			layout.setLeftButtons([
				{
					type: 'back',
					callback: () => this.#handleBack(),
				},
			]);

			void this.#loadExternalCatalogs();
		}

		render()
		{
			return Box(
				{
					testId: 'unit-tests-catalog',
					safeArea: { bottom: true },
					withScroll: this.state.section !== Section.ROOT,
				},
				this.state.section === Section.ROOT ? this.#renderRoot() : this.#renderGroups(),
			);
		}

		#renderRoot()
		{
			const basicGroup = testingCatalog.getGroup('basic');

			return View(
				{ testId: 'unit-tests-catalog-root' },
				EntityCell({
					testId: 'unit-tests-catalog-modules',
					title: Loc.getMessage('MOBILE_UNIT_TESTS_MODULES'),
					nextLevel: true,
					onClick: () => this.#setSection(Section.MODULES),
				}),
				EntityCell({
					testId: 'unit-tests-catalog-features',
					title: Loc.getMessage('MOBILE_UNIT_TESTS_FEATURES'),
					nextLevel: true,
					onClick: () => this.#setSection(Section.FEATURES),
				}),
				EntityCell({
					testId: 'unit-tests-catalog-basic',
					title: Loc.getMessage('MOBILE_UNIT_TESTS_BASIC'),
					nextLevel: true,
					disabled: !basicGroup,
					onClick: () => basicGroup && this.#openRunner(basicGroup),
				}),
			);
		}

		#renderGroups()
		{
			const groupType = this.state.section === Section.MODULES ? 'module' : 'feature';
			const groups = testingCatalog.getGroupsByType(groupType);
			const extensionNames = this.#getExtensionNames(groups);
			const filteredGroups = this.#filterGroups(groups);

			return View(
				{ testId: `unit-tests-${groupType}-list` },
				this.#renderGroupControls(groupType, extensionNames),
				this.#renderGroupItems(groupType, groups, filteredGroups),
			);
		}

		#renderGroupControls(groupType, extensionNames)
		{
			return View(
				{
					testId: `unit-tests-${groupType}-controls`,
					style: {
						paddingHorizontal: Indent.XL.toNumber(),
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.M.toNumber(),
					},
				},
				StringInput({
					testId: `unit-tests-${groupType}-search`,
					value: this.state.searchQuery,
					placeholder: Loc.getMessage('MOBILE_UNIT_TESTS_SEARCH_PLACEHOLDER'),
					size: InputSize.M,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					leftContent: Icon.SEARCH,
					erase: true,
					onChange: (searchQuery) => this.setState({ searchQuery }),
					onErase: () => this.setState({ searchQuery: '' }),
				}),
				Button({
					testId: `unit-tests-${groupType}-run-all`,
					text: Loc.getMessage('MOBILE_UNIT_TESTS_RUN_ALL', {
						'#COUNT#': extensionNames.length,
					}),
					design: ButtonDesign.OUTLINE,
					size: ButtonSize.M,
					stretched: true,
					disabled: !this.state.catalogReady || extensionNames.length === 0,
					style: { marginTop: Indent.M.toNumber() },
					onClick: () => this.#openAllGroups(groupType, extensionNames),
				}),
			);
		}

		#renderGroupItems(groupType, groups, filteredGroups)
		{
			if (filteredGroups.length === 0)
			{
				return StatusBlock({
					testId: `unit-tests-${groupType}-empty`,
					title: Loc.getMessage(
						groups.length === 0
							? 'MOBILE_UNIT_TESTS_EMPTY'
							: 'MOBILE_UNIT_TESTS_SEARCH_EMPTY',
					),
				});
			}

			return View(
				{ testId: `unit-tests-${groupType}-groups` },
				...filteredGroups.map((group) => EntityCell({
					testId: createTestingGroupTestId(group.id),
					title: group.title,
					nextLevel: true,
					entityData: group,
					onClick: (selectedGroup) => this.#openRunner(selectedGroup),
				})),
			);
		}

		#filterGroups(groups)
		{
			const searchQuery = this.state.searchQuery.trim().toLocaleLowerCase();

			return groups.filter((group) => (
				`${group.title} ${group.id}`.toLocaleLowerCase().includes(searchQuery)
			));
		}

		#getExtensionNames(groups)
		{
			return [...new Set(groups.flatMap((group) => group.extensionNames))];
		}

		#openAllGroups(groupType, extensionNames)
		{
			const title = groupType === 'module'
				? Loc.getMessage('MOBILE_UNIT_TESTS_MODULES')
				: Loc.getMessage('MOBILE_UNIT_TESTS_FEATURES')
			;

			this.#openRunner({
				id: `all:${groupType}`,
				type: groupType,
				title,
				extensionNames,
			});
		}

		#setSection(section)
		{
			this.#updateTitle(section);
			this.setState({ section, searchQuery: '' });
		}

		#updateTitle(section)
		{
			const titles = {
				[Section.ROOT]: Loc.getMessage('MOBILE_UNIT_TESTS_TITLE'),
				[Section.MODULES]: Loc.getMessage('MOBILE_UNIT_TESTS_MODULES'),
				[Section.FEATURES]: Loc.getMessage('MOBILE_UNIT_TESTS_FEATURES'),
			};

			layout.setTitle({
				text: titles[section],
				type: 'common',
			}, true);
		}

		#handleBack()
		{
			if (this.state.section !== Section.ROOT)
			{
				this.#setSection(Section.ROOT);

				return;
			}

			layout.back();
		}

		#openRunner(group)
		{
			ComponentHelper.openLayout(
				{
					name: 'unit.tests.runner',
					canOpenInDefault: true,
					widgetParams: { title: group.title },
					componentParams: {
						groupId: group.id,
						groupType: group.type,
						title: group.title,
						extensionNames: group.extensionNames,
					},
				},
				layout,
			);
		}

		async #loadExternalCatalogs()
		{
			const externalCatalogs = [
				{
					moduleId: 'crmmobile',
					importName: 'crm:testing/catalog',
					requireName: 'crm/testing/catalog',
				},
				{
					moduleId: 'tasksmobile',
					importName: 'tasks:testing/catalog',
					requireName: 'tasks/testing/catalog',
				},
			].filter(({ moduleId }) => isModuleInstalled(moduleId));
			const catalogResults = await Promise.allSettled(
				externalCatalogs.map(({ importName, requireName }) => (
					jn.import(importName).then(() => require(requireName))
				)),
			);

			catalogResults.forEach((result, index) => {
				if (result.status === 'rejected')
				{
					console.error(`Failed to load ${externalCatalogs[index].importName}`, result.reason);
				}
			});

			this.setState({
				catalogReady: catalogResults.every(({ status }) => status === 'fulfilled'),
			});
		}
	}

	BX.onViewLoaded(() => {
		layout.showComponent(new UnitTestsCatalog({}));
	});
})();
