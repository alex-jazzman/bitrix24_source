import { Dom, Type } from 'main.core';
import { Dialog, type TagItem, type TagSelector } from 'ui.entity-selector';

export const PROJECT_FIELD_TYPE = 'project';
export const PROJECT_FIELD_STATE_DELETED = 'deleted';

export function isDeletedProjectField(field: Object): boolean
{
	const projectState = field?.meta?.projectState;

	return projectState?.type === PROJECT_FIELD_TYPE && projectState?.state === PROJECT_FIELD_STATE_DELETED;
}

export function getDeletedProjectIds(field: Object): Array<string>
{
	const projectState = field?.meta?.projectState;
	const projectIds = Type.isArray(projectState?.deletedValues)
		? projectState.deletedValues
		: [projectState?.resolvedValue]
	;

	return projectIds
		.map((projectId) => String(projectId ?? ''))
		.filter((projectId: string) => Type.isStringFilled(projectId))
	;
}

function getSelectorContainer(control: ?HTMLElement): ?HTMLElement
{
	if (!Type.isElementNode(control))
	{
		return null;
	}

	const container = control.matches('[data-role="bp-entity-selector"]')
		? control
		: control.querySelector('[data-role="bp-entity-selector"]')
	;

	return Type.isElementNode(container) ? container : null;
}

function getSelectorConfig(control: ?HTMLElement): ?Object
{
	const container = getSelectorContainer(control);
	if (!container)
	{
		return null;
	}

	try
	{
		const config = JSON.parse(container.dataset.config || '{}');

		return Type.isObjectLike(config) ? config : null;
	}
	catch
	{
		return null;
	}
}

function getProjectTagSelector(control: ?HTMLElement): ?TagSelector
{
	const inputName = getSelectorConfig(control)?.inputName;
	if (!Type.isStringFilled(inputName))
	{
		return null;
	}

	return Dialog.getById(`entityselector_${inputName}`)?.getTagSelector() ?? null;
}

function normalizeProjectIds(value: mixed): Array<string>
{
	if (Type.isArray(value))
	{
		const projectIds = [];
		value.forEach((item) => projectIds.push(...normalizeProjectIds(item)));

		return projectIds;
	}

	if (Type.isObjectLike(value) && !Type.isArray(value))
	{
		return normalizeProjectIds(value.id);
	}

	if (!Type.isStringFilled(value) && !Type.isNumber(value))
	{
		return [];
	}

	const projectId = String(value);

	return Type.isStringFilled(projectId) ? [projectId] : [];
}

function getSelectedProjectIds(control: ?HTMLElement): Array<string>
{
	const container = getSelectorContainer(control);
	if (!container)
	{
		return [];
	}

	const inputs = [...container.querySelectorAll('input[type="hidden"]')];
	if (inputs.length > 0)
	{
		return inputs
			.map((input: HTMLInputElement) => input.value)
			.filter((projectId: string) => Type.isStringFilled(projectId))
		;
	}

	return normalizeProjectIds(getSelectorConfig(control)?.initialValue);
}

function getDeletedProjectTagItems(control: ?HTMLElement, field: Object): Array<TagItem>
{
	const deletedProjectIds = getDeletedProjectIds(field);
	if (deletedProjectIds.length === 0)
	{
		return [];
	}

	return getProjectTagSelector(control)
		?.getTags()
		.filter((tag: TagItem) => {
			return tag.getEntityId() === PROJECT_FIELD_TYPE && deletedProjectIds.includes(String(tag.getId()));
		})
		?? []
	;
}

function findProjectTagItem(tagSelector: TagSelector, projectId: string): ?TagItem
{
	return tagSelector
		.getTags()
		.find((tag: TagItem) => {
			return tag.getEntityId() === PROJECT_FIELD_TYPE && String(tag.getId()) === projectId;
		})
	;
}

export function hasDeletedProjectTag(control: ?HTMLElement, field: Object): boolean
{
	return getDeletedProjectTagItems(control, field).length > 0;
}

function isDeletedProjectValueSelected(control: ?HTMLElement, field: Object): boolean
{
	const selectedProjectIds = getSelectedProjectIds(control);
	const selectedProjectIdSet = new Set(selectedProjectIds);
	const deletedProjectIds = getDeletedProjectIds(field);

	return deletedProjectIds.some((projectId: string) => selectedProjectIdSet.has(projectId))
	;
}

function getProjectCaption(row: ?HTMLElement): ?HTMLElement
{
	if (!Type.isElementNode(row))
	{
		return null;
	}

	const caption = row.querySelector('[data-role="project-field-caption"]')
		?? row.querySelector('.node-settings-edit-caption')
		?? row.querySelector('.edit-action-expression-form__label')
	;

	return Type.isElementNode(caption) ? caption : null;
}

export function syncDeletedProjectCaption(
	row: ?HTMLElement,
	field: Object,
	isDeletedProjectSelected: boolean,
	shouldShowRequiredMark: (field: Object) => boolean,
): void
{
	const caption = getProjectCaption(row);
	if (!caption)
	{
		return;
	}

	const warning = caption.querySelector('.node-settings-project-warning');
	if (Type.isElementNode(warning))
	{
		Dom.style(warning, 'display', isDeletedProjectSelected ? null : 'none');
	}

	const requiredMark = caption.querySelector('.node-settings-edit-caption-required');
	if (Type.isElementNode(requiredMark))
	{
		Dom.style(requiredMark, 'display', isDeletedProjectSelected ? null : 'none');
	}

	Dom.toggleClass(caption, '--project-deleted', isDeletedProjectSelected);
	Dom.toggleClass(caption, '--required', shouldShowRequiredMark(field) && !isDeletedProjectSelected);
}

function renameDeletedProjectTags(control: ?HTMLElement, field: Object, title: string): void
{
	const tagSelector = getProjectTagSelector(control);
	if (!tagSelector)
	{
		return;
	}

	const selectedProjectIds = new Set(getSelectedProjectIds(control));
	const selectedDeletedProjectIds = getDeletedProjectIds(field)
		.filter((projectId: string) => selectedProjectIds.has(projectId))
	;

	selectedDeletedProjectIds.forEach((projectId: string) => {
		const tag = findProjectTagItem(tagSelector, projectId) ?? tagSelector.addTag({
			id: Number(projectId),
			entityId: PROJECT_FIELD_TYPE,
			title,
			deselectable: false,
			animate: false,
		});

		if (tag && tag.getTitle() !== title)
		{
			tag.setTitle(title);
			tag.render();
		}
	});
}

export function syncDeletedProjectField(
	control: ?HTMLElement,
	field: Object,
	row: ?HTMLElement,
	title: string,
	shouldShowRequiredMark: (field: Object) => boolean,
): boolean
{
	if (!isDeletedProjectField(field))
	{
		return false;
	}

	const isDeletedProjectSelected = isDeletedProjectValueSelected(control, field);
	syncDeletedProjectCaption(row, field, isDeletedProjectSelected, shouldShowRequiredMark);
	if (!isDeletedProjectSelected)
	{
		return false;
	}

	renameDeletedProjectTags(control, field, title);

	return true;
}

export function watchDeletedProjectField(
	control: ?HTMLElement,
	field: Object,
	row: ?HTMLElement,
	onChange: () => void,
): ?MutationObserver
{
	if (!Type.isElementNode(control) || !isDeletedProjectField(field) || !Type.isFunction(window.MutationObserver))
	{
		return null;
	}

	const observer = new MutationObserver(onChange);
	observer.observe(control, { childList: true, subtree: true });

	return observer;
}
