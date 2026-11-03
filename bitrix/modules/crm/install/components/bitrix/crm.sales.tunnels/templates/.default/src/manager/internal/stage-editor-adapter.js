import { Dom, Runtime, Text, Type } from 'main.core';

const darkTitleClass = 'main-kanban-column-title-dark';

BX.Crm ??= {};
BX.Crm.SalesTunnels ??= {};
const salesTunnelsNamespace = BX.Crm.SalesTunnels;

salesTunnelsNamespace.stageEditorExtensionPromise ??= null;
salesTunnelsNamespace.stageDescriptionTooltipExtensionPromise ??= null;

function loadStageEditorExtension(): Promise
{
	salesTunnelsNamespace.stageEditorExtensionPromise ??= Runtime.loadExtension('crm.stage.editor')
		.then((extension) => {
			if (!Type.isFunction(extension?.StageEditor?.open))
			{
				salesTunnelsNamespace.stageEditorExtensionPromise = null;

				return null;
			}

			return extension.StageEditor;
		})
		.catch(() => {
			salesTunnelsNamespace.stageEditorExtensionPromise = null;

			return null;
		})
	;

	return salesTunnelsNamespace.stageEditorExtensionPromise;
}

export function loadStageDescriptionTooltipExtension(): Promise
{
	salesTunnelsNamespace.stageDescriptionTooltipExtensionPromise ??= Runtime
		.loadExtension('crm.stage.description-tooltip')
		.then((extension) => {
			if (!Type.isFunction(extension?.StageDescriptionTooltip))
			{
				salesTunnelsNamespace.stageDescriptionTooltipExtensionPromise = null;

				return null;
			}

			return extension.StageDescriptionTooltip;
		})
		.catch(() => {
			salesTunnelsNamespace.stageDescriptionTooltipExtensionPromise = null;

			return null;
		})
	;

	return salesTunnelsNamespace.stageDescriptionTooltipExtensionPromise;
}

export function loadStageDescriptionTooltipForColumn(column): Promise
{
	if (!Type.isStringFilled(getStageDescription(column)) && !column.isStageTitleCropped())
	{
		return Promise.resolve(null);
	}

	return loadStageDescriptionTooltipExtension();
}

export function createLazyStageEditorFactory()
{
	return {
		open(options) {
			const state = {
				closed: false,
				editor: null,
			};
			const placeholder = {
				close() {
					if (state.closed)
					{
						return;
					}

					state.closed = true;
					if (Type.isFunction(state.editor?.close))
					{
						state.editor.close();
					}
					else if (Type.isFunction(options.onCancel))
					{
						options.onCancel();
					}
				},
			};

			loadStageEditorExtension().then((editorFactory) => {
				if (state.closed)
				{
					return;
				}

				if (!editorFactory)
				{
					placeholder.close();

					return;
				}

				try
				{
					state.editor = editorFactory.open(options);
				}
				catch
				{
					placeholder.close();
				}
			});

			return placeholder;
		},
	};
}

function getStage(source)
{
	if (Type.isFunction(source?.getData))
	{
		return source.getData().stage || {};
	}

	return Type.isPlainObject(source) ? source : {};
}

export function getStageDescription(source)
{
	const stage = getStage(source);

	return stage.DESCRIPTION ?? stage.description ?? '';
}

export function openStageEditorForColumn(column): boolean
{
	if (!column.getData().areStagesEditable || !Type.isFunction(column.onEditHandler))
	{
		return false;
	}

	column.closeStageDescriptionTooltip();
	column.onEditHandler(column);

	return true;
}

export function clearLegacyStageTitleHint(element, hint = null): void
{
	const hintObject = element?.closest?.('.main-kanban-column-title-info') || element;
	if (!Type.isElementNode(hintObject))
	{
		return;
	}

	hintObject.removeAttribute('data-hint-init');
	hintObject.removeAttribute('data-hint');
	hintObject.removeAttribute('data-hint-no-icon');
	hint?.hide(hintObject);
}

export function finalizeStageTitleRender(column, title, textColor)
{
	Dom.toggleClass(title, darkTitleClass, textColor === '#ffffff');
	column.bindStageInteractions();

	return title;
}

export function getStageEditorInteractionNode(column)
{
	return column.layout?.title || column.layout?.info || null;
}

export function getStageTooltipInteractionNode(column)
{
	return column.layout?.title || column.layout?.info || null;
}

export function getStagePopupAnchorElement(column)
{
	return getStageTooltipBindElement(column);
}

export function getStageTooltipBindElement(column)
{
	return (
		column.layout?.color
		|| column.layout?.title
		|| column.layout?.info
		|| column.getContainer?.()
		|| null
	);
}

export function shouldShowStageTooltipForControl(column, target): boolean
{
	const tooltipInteractionNode = getStageTooltipInteractionNode(column);

	return (
		Type.isElementNode(tooltipInteractionNode)
		&& Type.isElementNode(target)
		&& tooltipInteractionNode.contains(target)
	);
}

export function shouldRestoreStageTooltipAfterControl(column, relatedTarget): boolean
{
	const tooltipInteractionNode = getStageTooltipInteractionNode(column);

	return (
		Type.isElementNode(tooltipInteractionNode)
		&& Type.isElementNode(relatedTarget)
		&& tooltipInteractionNode.contains(relatedTarget)
	);
}

export function canOpenStageEditorFromEvent(column, event): boolean
{
	if (column.stageDragging)
	{
		return false;
	}

	const target = event?.target;
	if (!Type.isElementNode(target))
	{
		return false;
	}

	return !target.closest([
		'.main-kanban-column-title-add-column',
		'.main-kanban-column-edit',
		'.main-kanban-column-color',
		'.main-kanban-column-remove-button',
		'.crm-st-kanban-column-dot',
	].join(','));
}

export function toStageEditorData(source)
{
	const stage = getStage(source);
	const isColumn = Type.isFunction(source?.getData);

	return {
		id: stage.ID ?? stage.id ?? null,
		statusId: stage.STATUS_ID ?? stage.statusId ?? (isColumn ? source.getId() : null),
		entityId: stage.ENTITY_ID ?? stage.entityId ?? null,
		name: stage.NAME ?? stage.name ?? (isColumn ? source.getName() : ''),
		color: String(stage.COLOR ?? stage.color ?? (isColumn ? source.getColor() : '')).replace('#', '').toLowerCase(),
		description: getStageDescription(stage),
		sort: Text.toInteger(stage.SORT ?? stage.sort),
		semantics: stage.SEMANTICS ?? stage.semantics ?? null,
		categoryId: Text.toInteger(stage.CATEGORY_ID ?? stage.categoryId),
		system: (stage.SYSTEM ?? stage.system) === 'Y' || stage.system === true,
	};
}

export function createStageEditorDataAfter(column)
{
	const source = toStageEditorData(column);

	return {
		...source,
		id: null,
		statusId: null,
		name: column.getGrid().getMessage('COLUMN_TITLE_PLACEHOLDER'),
		description: '',
		sort: source.sort + 1,
		system: false,
	};
}

export function createAddStageRequest(column, payload)
{
	const source = toStageEditorData(column);

	return {
		afterStageId: source.id,
		name: payload.name,
		entityId: source.entityId,
		color: payload.color,
		semantics: source.semantics,
		categoryId: source.categoryId,
		description: payload.description,
	};
}

export function createUpdateStageRequest(column, payload)
{
	const source = toStageEditorData(column);

	return {
		statusId: source.statusId,
		stageId: source.id,
		entityId: source.entityId,
		name: payload.name,
		sort: source.sort,
		color: payload.color,
		categoryId: source.categoryId,
		description: payload.description,
	};
}
