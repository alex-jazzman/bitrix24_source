/**
 * @module user-profile/common-tab/src/block/factory
 */
jn.define('user-profile/common-tab/src/block/factory', (require, exports, module) => {
	const { GratitudeBlock } = require('user-profile/common-tab/src/block/gratitude/block');
	const { HeaderBlock } = require('user-profile/common-tab/src/block/header/block');
	const { EfficiencyBlock } = require('user-profile/common-tab/src/block/efficiency/block');
	const { ViewMode } = require('user-profile/common-tab/src/block/base-view');
	const { Component } = require('tokens');

	const BlockRegistry = {
		HEADER: HeaderBlock,
		GRATITUDE: GratitudeBlock,
		EFFICIENCY: EfficiencyBlock,
	};

	class ProfileBlockFactory
	{
		/**
		 * @param {string} type
		 * @param {Object} options
		 * @returns {Object|null}
		 */
		static create(type, options)
		{
			const instance = ProfileBlockFactory.#createInstance(type, options);

			return instance ? instance.render() : null;
		}

		/**
		 * @param {Object} options
		 * @returns {Array}
		 */
		static getAll(options)
		{
			const instances = ProfileBlockFactory.#getInstances(options);
			const sortedBlocks = ProfileBlockFactory.#sortBlocks(instances);

			return ProfileBlockFactory.#unite(sortedBlocks);
		}

		static #createInstance(type, options)
		{
			const BlockClass = BlockRegistry[type];

			if (!BlockClass)
			{
				console.error(`Unknown block type: ${type}`);

				return null;
			}

			const block = new BlockClass(options);

			return block.isAvailable() ? block : null;
		}

		static #getInstances(options)
		{
			return Object.keys(BlockRegistry)
				.map((type) => ProfileBlockFactory.#createInstance(type, options))
				.filter(Boolean);
		}

		static #sortBlocks(blocks)
		{
			return blocks.sort((a, b) => a.getSort() - b.getSort());
		}

		static #unite(blocks)
		{
			const result = [];
			let currentGroup = [];

			for (let i = 0; i < blocks.length; i++)
			{
				const block = blocks[i];
				const next = blocks[i + 1];

				if (block.getViewMode() === ViewMode.HALF_WIDTH)
				{
					currentGroup.push(block);

					const isGroupBreak = !next
						|| next.getSort() !== block.getSort()
						|| next.getViewMode() !== ViewMode.HALF_WIDTH;

					if (isGroupBreak)
					{
						result.push(ProfileBlockFactory.#createGroupContainer(currentGroup));
						currentGroup = [];
					}
				}
				else
				{
					if (currentGroup.length > 0)
					{
						result.push(ProfileBlockFactory.#createGroupContainer(currentGroup));
						currentGroup = [];
					}
					result.push(block.render());
				}
			}

			if (currentGroup.length > 0)
			{
				result.push(ProfileBlockFactory.#createGroupContainer(currentGroup));
			}

			return result;
		}

		static #createGroupContainer(blocks)
		{
			return View(
				{
					style: {
						display: 'flex',
						flexDirection: 'row',
						flexWrap: 'no-wrap',
						width: '90%',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginHorizontal: Component.areaPaddingLr.toNumber(),
					},
				},
				...blocks.map((block) => block.render()),
			);
		}
	}

	module.exports = {
		ProfileBlockFactory,
	};
});
