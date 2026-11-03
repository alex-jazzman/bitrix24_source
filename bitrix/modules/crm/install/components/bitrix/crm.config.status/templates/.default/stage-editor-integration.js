/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Config = this.BX.Crm.Config || {};
(function (exports, crm_stage_color, main_core) {
	'use strict';

	const DEFAULT_PROCESS_COLOR = '#39A8EF';
	const DEFAULT_SUCCESS_COLOR = '#7BD500';
	const DEFAULT_FAILURE_COLOR = '#FF5752';
	function isElementNode(node) {
		return node?.nodeType === Node.ELEMENT_NODE;
	}
	function normalizeColor(color) {
		if (!main_core.Type.isString(color)) {
			return null;
		}
		const normalizedColor = color.trim().replace(/^#/, '');
		return /^[\da-f]{6}$/i.test(normalizedColor) ? `#${normalizedColor.toUpperCase()}` : null;
	}
	function resolveStageVisual$1(color, semantics, options = {}) {
		let backgroundColor = normalizeColor(color);
		if (backgroundColor === null) {
			if (semantics === 'S') {
				backgroundColor = normalizeColor(options.defaultSuccessColor) ?? DEFAULT_SUCCESS_COLOR;
			} else if (semantics === 'F') {
				backgroundColor = normalizeColor(options.defaultFailureColor) ?? DEFAULT_FAILURE_COLOR;
			} else {
				backgroundColor = normalizeColor(options.defaultProcessColor) ?? DEFAULT_PROCESS_COLOR;
			}
		}
		const textColor = options.getTextColor(backgroundColor);
		const isDark = textColor === '#ffffff';
		return {
			backgroundColor,
			textColor,
			iconClass: isDark ? 'light-icon' : 'dark-icon',
			blockClass: isDark ? 'transaction-stage-phase-dark' : ''
		};
	}
	function resolveDefaultStageName(entityId, entityInfos, fallbackName) {
		const defaultName = entityInfos?.[entityId]?.DEFAULT_NAME;
		return main_core.Type.isStringFilled(defaultName) ? defaultName : fallbackName;
	}
	function toStageEditorData(stage) {
		return {
			id: stage.ID ?? stage.id ?? null,
			statusId: stage.STATUS_ID ?? stage.statusId ?? null,
			entityId: stage.ENTITY_ID ?? stage.entityId ?? null,
			name: stage.NAME ?? stage.name ?? '',
			color: String(stage.COLOR ?? stage.color ?? '').replace('#', '').toLowerCase(),
			description: stage.DESCRIPTION ?? stage.description ?? '',
			sort: Number.parseInt(stage.SORT ?? stage.sort, 10) || 0,
			semantics: stage.SEMANTICS ?? stage.semantics ?? null,
			categoryId: Number.parseInt(stage.CATEGORY_ID ?? stage.categoryId, 10) || 0,
			system: (stage.SYSTEM ?? stage.system) === 'Y' || stage.system === true
		};
	}
	function canOpenStageEditorFromEvent(event) {
		const target = event?.target;
		if (!isElementNode(target)) {
			return false;
		}
		return !target.closest(['.transaction-stage-phase-icon-move', '.transaction-stage-phase-panel-button', '.transaction-stage-phase-icon-edit'].join(','));
	}
	function createLazyStageEditorFactory(loadEditor) {
		return {
			open(options) {
				let isClosed = false;
				let isCancelled = false;
				let editor = null;
				const cancel = () => {
					if (isCancelled) {
						return;
					}
					isCancelled = true;
					options.onCancel();
				};
				const placeholder = {
					close() {
						if (isClosed) {
							return;
						}
						isClosed = true;
						if (editor && main_core.Type.isFunction(editor.close)) {
							editor.close();
						} else {
							cancel();
						}
					}
				};
				loadEditor().then(editorFactory => {
					if (isClosed) {
						return;
					}
					if (!editorFactory || !main_core.Type.isFunction(editorFactory.open)) {
						isClosed = true;
						cancel();
						return;
					}
					editor = editorFactory.open(options);
				}).catch(() => {
					if (isClosed) {
						return;
					}
					isClosed = true;
					cancel();
				});
				return placeholder;
			}
		};
	}
	function applyPayload(stage, payload) {
		return {
			...stage,
			NAME: payload.name,
			COLOR: payload.color,
			DESCRIPTION: payload.description
		};
	}
	let StageEditorIntegration$1 = class StageEditorIntegration {
		constructor(options) {
			this.options = {
				getStage: () => null,
				getStageElement: () => null,
				getStageNameElement: () => null,
				editLabel: '',
				getEntityTypeId: () => 0,
				getEntityTypeName: () => '',
				canDeleteStage: () => false,
				getDeleteBlockReasons: () => [],
				previewStage: () => {},
				restoreStage: () => {},
				applyStage: () => {},
				activateStage: () => {},
				deleteStage: () => Promise.resolve(),
				removeDraft: () => {},
				...options
			};
			const TooltipFactory = this.options.tooltipFactory;
			this.tooltip = new TooltipFactory();
			this.editor = null;
			this.openedStageKey = null;
		}
		registerStage(entityId, stageId) {
			const stageElement = this.options.getStageElement(entityId, stageId);
			if (!isElementNode(stageElement) || stageElement.dataset.stageEditorInitialized === 'Y') {
				return;
			}
			stageElement.dataset.stageEditorInitialized = 'Y';
			const testIdSuffix = `${entityId}-${stageId}`.toLowerCase().replaceAll(/[^\da-z]+/g, '-').replaceAll(/^-+|-+$/g, '');
			stageElement.dataset.testid = `crm-config-status-stage-${testIdSuffix}`;
			stageElement.removeAttribute('ondblclick');
			main_core.Event.bind(stageElement, 'mouseenter', () => this.showDescription(entityId, stageId));
			main_core.Event.bind(stageElement, 'mouseleave', () => this.hideDescription());
			main_core.Event.bind(stageElement, 'focusin', event => this.showDescription(entityId, stageId, event.target));
			main_core.Event.bind(stageElement, 'focusout', () => this.hideDescription());
			const editControl = stageElement.querySelector('.transaction-stage-phase-icon-edit');
			if (isElementNode(editControl)) {
				editControl.dataset.testid = `crm-config-status-stage-edit-${testIdSuffix}`;
				editControl.removeAttribute('onclick');
				editControl.onclick = null;
				editControl.setAttribute('role', 'button');
				editControl.setAttribute('tabindex', '0');
				editControl.setAttribute('aria-haspopup', 'dialog');
				const title = editControl.getAttribute('title');
				const editLabel = main_core.Type.isStringFilled(title) ? title : this.options.editLabel;
				if (main_core.Type.isStringFilled(editLabel)) {
					editControl.setAttribute('aria-label', editLabel);
				}
				main_core.Event.bind(editControl, 'click', event => {
					event.preventDefault();
					event.stopPropagation();
					this.openEdit(entityId, stageId);
				});
				main_core.Event.bind(editControl, 'keydown', event => {
					if (!['Enter', ' '].includes(event.key)) {
						return;
					}
					event.preventDefault();
					event.stopPropagation();
					this.openEdit(entityId, stageId);
				});
			}
			main_core.Event.bind(stageElement, 'mousedown', () => this.hideDescription());
		}
		openEdit(entityId, stageId) {
			this.open(entityId, stageId, false);
		}
		openCreate(entityId, stageId) {
			this.registerStage(entityId, stageId);
			this.open(entityId, stageId, true);
		}
		cancelEditing() {
			this.editor?.close();
		}
		open(entityId, stageId, isDraft) {
			const stageKey = `${entityId}:${stageId}`;
			if (this.openedStageKey === stageKey) {
				return;
			}
			const stage = this.options.getStage(entityId, stageId);
			const anchor = this.options.getStageElement(entityId, stageId);
			if (!stage || !isElementNode(anchor)) {
				return;
			}
			this.hideDescription();
			this.editor?.close();
			const snapshot = {
				...stage
			};
			this.openedStageKey = stageKey;
			this.editor = this.options.editorFactory.open({
				stage: toStageEditorData(stage),
				entityTextContext: {
					entityTypeId: Number.parseInt(this.options.getEntityTypeId(entityId), 10) || 0,
					entityTypeName: this.options.getEntityTypeName(entityId)
				},
				mode: isDraft ? 'create' : 'edit',
				anchor,
				canEdit: true,
				canDelete: !isDraft && this.options.canDeleteStage(entityId, stageId),
				deleteBlockReasons: this.options.getDeleteBlockReasons(entityId, stageId),
				onChange: payload => {
					this.options.previewStage(entityId, stageId, payload);
				},
				onSave: async payload => {
					this.options.applyStage(entityId, stageId, payload);
					if (isDraft) {
						this.options.activateStage(entityId, stageId);
					}
					this.clear(entityId, stageId);
					return toStageEditorData(applyPayload(stage, payload));
				},
				onDelete: async () => {
					await this.options.deleteStage(entityId, stageId);
					this.clear(entityId, stageId);
				},
				onCancel: () => {
					if (isDraft) {
						this.options.removeDraft(entityId, stageId);
					} else {
						Object.assign(stage, snapshot);
						this.options.restoreStage(entityId, stageId, snapshot);
					}
					this.clear(entityId, stageId);
				}
			});
		}
		showDescription(entityId, stageId, focusElement = null) {
			if (this.openedStageKey !== null) {
				this.hideDescription();
				return;
			}
			const stage = this.options.getStage(entityId, stageId);
			const stageElement = this.options.getStageElement(entityId, stageId);
			if (!stage || !isElementNode(stageElement)) {
				return;
			}
			const nameElement = this.options.getStageNameElement(entityId, stageId);
			this.tooltip.show({
				bindElement: stageElement,
				focusElement: isElementNode(focusElement) ? focusElement : stageElement,
				name: stage.NAME ?? '',
				description: stage.DESCRIPTION ?? '',
				showName: isElementNode(nameElement) && nameElement.offsetWidth < nameElement.scrollWidth
			});
		}
		hideDescription() {
			this.tooltip.hide();
		}
		clear(entityId, stageId) {
			if (this.openedStageKey === `${entityId}:${stageId}`) {
				this.openedStageKey = null;
				this.editor = null;
			}
		}
	};

	function resolveStageVisual(color, semantics, options = {}) {
		return resolveStageVisual$1(color, semantics, {
			...options,
			getTextColor: crm_stage_color.getStageTextColor
		});
	}
	class StageEditorIntegration extends StageEditorIntegration$1 {
		constructor(options) {
			super(options);
		}
	}

	exports.StageEditorIntegration = StageEditorIntegration;
	exports.canOpenStageEditorFromEvent = canOpenStageEditorFromEvent;
	exports.createLazyStageEditorFactory = createLazyStageEditorFactory;
	exports.resolveDefaultStageName = resolveDefaultStageName;
	exports.resolveStageVisual = resolveStageVisual;
	exports.toStageEditorData = toStageEditorData;

})(this.BX.Crm.Config.Status = this.BX.Crm.Config.Status || {}, BX.Crm.Stage, BX);
//# sourceMappingURL=stage-editor-integration.js.map
