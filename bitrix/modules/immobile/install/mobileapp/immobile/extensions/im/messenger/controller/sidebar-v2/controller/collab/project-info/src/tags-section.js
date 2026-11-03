/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-section
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-section', (require, exports, module) => {
	const { Type } = require('type');
	const { Indent, Component } = require('tokens');
	const {
		ChipButton,
		ChipButtonDesign,
		ChipButtonMode,
		ChipButtonSize,
	} = require('ui-system/blocks/chips/chip-button');

	const {
		splitTagsIntoRows,
	} = require('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/tags-layout');

	/**
	 * @extends {LayoutComponent<ProjectInfoTagsSectionProps>}
	 */
	class ProjectInfoTagsSection extends LayoutComponent
	{
		/**
		 * @return {string[]}
		 */
		get tags()
		{
			return Type.isArrayFilled(this.props.tags) ? this.props.tags : [];
		}

		/**
		 * By default the section is rendered inside a project info area, so the row is as wide
		 * as the screen without the horizontal padding of that area. A caller that nests the
		 * section deeper passes the width of its own row instead.
		 *
		 * @return {number}
		 */
		get availableWidth()
		{
			if (Type.isNumber(this.props.availableWidth) && this.props.availableWidth > 0)
			{
				return this.props.availableWidth;
			}

			return device.screen.width - (Component.areaPaddingLr.toNumber() * 2);
		}

		/**
		 * @return {number}
		 */
		get gap()
		{
			return Indent.S.toNumber();
		}

		render()
		{
			const tags = this.tags;
			if (tags.length === 0)
			{
				return null;
			}

			const rows = splitTagsIntoRows({
				tags,
				availableWidth: this.availableWidth,
				gap: this.gap,
			});

			let renderedCount = 0;

			return View(
				{
					testId: 'project-info-tags-list',
					style: {
						width: '100%',
					},
				},
				...rows.map((rowTags) => {
					const row = this.#renderRow(rowTags, renderedCount);
					renderedCount += rowTags.length;

					return row;
				}),
			);
		}

		/**
		 * @param {string[]} tags
		 * @param {number} indexOffset
		 * @return {object}
		 */
		#renderRow(tags, indexOffset)
		{
			const chips = tags.map((tag, index) => this.#renderTag(tag, indexOffset + index, {
				isLast: index === tags.length - 1,
			}));

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: indexOffset === 0 ? 0 : this.gap,
					},
				},
				...chips,
			);
		}

		/**
		 * @param {string} tag
		 * @param {number} index
		 * @param {{ isLast: boolean }} options
		 * @return {object}
		 */
		#renderTag(tag, index, { isLast })
		{
			return ChipButton({
				testId: `project-info-tag-${index}`,
				text: tag,
				size: ChipButtonSize.S,
				design: ChipButtonDesign.GREY,
				mode: ChipButtonMode.OUTLINE,
				style: {
					marginRight: isLast ? 0 : this.gap,
				},
			});
		}
	}

	module.exports = { ProjectInfoTagsSection };
});
