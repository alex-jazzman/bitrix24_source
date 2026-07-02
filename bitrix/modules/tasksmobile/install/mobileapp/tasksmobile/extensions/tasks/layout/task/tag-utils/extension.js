/**
 * @module tasks/layout/task/tag-utils
 */
jn.define('tasks/layout/task/tag-utils', (require, exports, module) => {
	const TagType = Object.freeze({
		TASK: 'task-tag',
		TEMPLATE: 'template-tag',
	});

	const resolveTagType = (item = {}, fallbackType = TagType.TASK) => item.type ?? item.entityId ?? fallbackType;

	const hasTagType = (tags, type) => (tags ?? []).some((item) => resolveTagType(item) === type);

	const mapTagToSelectorItem = (tag = {}, fallbackType = TagType.TASK) => ({
		id: tag.id,
		title: tag.title ?? tag.name,
		type: resolveTagType(tag, fallbackType),
	});

	const mapSelectorItemToTag = (item = {}, fallbackType = TagType.TASK) => ({
		id: item.id,
		name: item.name ?? item.title,
		type: resolveTagType(item, fallbackType),
	});

	const mapTagsToSelectorItems = (tags = [], fallbackType = TagType.TASK) => (
		tags.map((tag) => mapTagToSelectorItem(tag, fallbackType))
	);

	const mapSelectorItemsToTags = (items = [], fallbackType = TagType.TASK) => (
		items.map((item) => mapSelectorItemToTag(item, fallbackType))
	);

	module.exports = {
		TagType,
		resolveTagType,
		hasTagType,
		mapTagToSelectorItem,
		mapSelectorItemToTag,
		mapTagsToSelectorItems,
		mapSelectorItemsToTags,
	};
});
