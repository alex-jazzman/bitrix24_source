/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core_events,main_popup,main_core,ui_system_skeleton) {
	'use strict';

	let _ = t => t,
	  _t;
	var _layout = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("layout");
	class TaskCardSkeleton {
	  constructor() {
	    Object.defineProperty(this, _layout, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout] = {};
	  }
	  renderCompactCardSkeleton() {
	    babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].compactCardSkeleton = main_core.Tag.render(_t || (_t = _`
			<div class="tasks-task-compact-card-skeleton">
				<div class="tasks-task-compact-card-skeleton-fields">
					<div class="tasks-task-compact-card-skeleton-fields-title">
						${0}
						<div class="tasks-task-card-skeleton-group --icons">
							${0}
							${0}
						</div>
					</div>
					<div class="tasks-task-compact-card-skeleton-fields-description">
						${0}
					</div>
					<div class="tasks-task-compact-card-skeleton-fields-list">
						<div class="tasks-task-compact-card-skeleton-fields-list-row">
							<div class="tasks-task-card-skeleton-group">
								${0}
							</div>
							<div class="tasks-task-card-skeleton-group">
								${0}
								${0}
							</div>
						</div>
						<div class="tasks-task-compact-card-skeleton-fields-list-row">
							<div class="tasks-task-card-skeleton-group">
								${0}
							</div>
							<div class="tasks-task-card-skeleton-group">
								${0}
								${0}
							</div>
						</div>
					</div>
				</div>
				<div class="tasks-task-compact-card-skeleton-chips">
					${0}
				</div>
				<div class="tasks-task-compact-card-skeleton-footer">
					<div class="tasks-task-card-skeleton-group">
						${0}
						${0}
					</div>
					<div style="margin-right: 6px;">
						${0}
					</div>
				</div>
			</div>
		`), new ui_system_skeleton.Line({
	      width: 240,
	      height: 18,
	      borderRadius: 60
	    }).render(), new ui_system_skeleton.Circle({
	      size: 18
	    }).render(), new ui_system_skeleton.Circle({
	      size: 18
	    }).render(), new ui_system_skeleton.Line({
	      width: 80,
	      height: 12,
	      borderRadius: 60
	    }).render(), new ui_system_skeleton.Line({
	      width: 100,
	      height: 12,
	      borderRadius: 60
	    }).render(), new ui_system_skeleton.Circle({
	      size: 22
	    }).render(), new ui_system_skeleton.Line({
	      width: 130,
	      height: 12,
	      borderRadius: 60
	    }).render(), new ui_system_skeleton.Line({
	      width: 100,
	      height: 12,
	      borderRadius: 60
	    }).render(), new ui_system_skeleton.Circle({
	      size: 22
	    }).render(), new ui_system_skeleton.Line({
	      width: 130,
	      height: 12,
	      borderRadius: 60
	    }).render(), new ui_system_skeleton.Line({
	      height: 34,
	      borderRadius: 8
	    }).render(), new ui_system_skeleton.Line({
	      width: 84,
	      height: 34,
	      borderRadius: 8
	    }).render(), new ui_system_skeleton.Line({
	      width: 84,
	      height: 34,
	      borderRadius: 8
	    }).render(), new ui_system_skeleton.Line({
	      width: 97,
	      height: 12,
	      borderRadius: 60
	    }).render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].compactCardSkeleton;
	  }
	  removeCompactCardSkeleton() {
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _layout)[_layout].compactCardSkeleton);
	  }
	}

	let _$1 = t => t,
	  _t$1,
	  _t2;
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _compactCardPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("compactCardPopup");
	var _layout$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("layout");
	var _taskCardSkeleton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskCardSkeleton");
	var _taskCompactCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskCompactCard");
	var _subscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribe");
	var _unsubscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribe");
	var _renderPopupContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderPopupContent");
	var _renderDragHandle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDragHandle");
	var _handlePopupShow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePopupShow");
	var _closeCompactCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeCompactCard");
	var _openFullCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openFullCard");
	var _adjustPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustPosition");
	var _showOverlay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showOverlay");
	var _hideOverlay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideOverlay");
	class TaskCard {
	  constructor(params = {}) {
	    Object.defineProperty(this, _renderDragHandle, {
	      value: _renderDragHandle2
	    });
	    Object.defineProperty(this, _renderPopupContent, {
	      value: _renderPopupContent2
	    });
	    Object.defineProperty(this, _unsubscribe, {
	      value: _unsubscribe2
	    });
	    Object.defineProperty(this, _subscribe, {
	      value: _subscribe2
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _compactCardPopup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _layout$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _taskCardSkeleton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _taskCompactCard, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _handlePopupShow, {
	      writable: true,
	      value: event => {
	        var _babelHelpers$classPr, _babelHelpers$classPr2;
	        (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]).openedPopupsCount) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr.openedPopupsCount = 0;
	        const popup = event.getCompatData()[0];
	        const onClose = () => {
	          popup.unsubscribe('onClose', onClose);
	          popup.unsubscribe('onDestroy', onClose);
	          babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow].openedPopupsCount--;
	          if (babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow].openedPopupsCount === 0) {
	            main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].dragHandle, '--disabled');
	          }
	        };
	        popup.subscribe('onClose', onClose);
	        popup.subscribe('onDestroy', onClose);
	        babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow].openedPopupsCount++;
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].dragHandle, '--disabled');
	      }
	    });
	    Object.defineProperty(this, _closeCompactCard, {
	      writable: true,
	      value: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].close();
	      }
	    });
	    Object.defineProperty(this, _openFullCard, {
	      writable: true,
	      value: async baseEvent => {
	        const {
	          TaskFullCard
	        } = await main_core.Runtime.loadExtension('tasks.v2.application.task-full-card');
	        babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId = baseEvent.getData();
	        await new TaskFullCard(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]).showCard();
	        babelHelpers.classPrivateFieldLooseBase(this, _closeCompactCard)[_closeCompactCard]();
	      }
	    });
	    Object.defineProperty(this, _adjustPosition, {
	      writable: true,
	      value: (baseEvent = null) => {
	        var _baseEvent$getData;
	        const {
	          innerPopup,
	          titleFieldHeight,
	          animate
	        } = (_baseEvent$getData = baseEvent == null ? void 0 : baseEvent.getData()) != null ? _baseEvent$getData : {};
	        if (!innerPopup) {
	          babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].setOffset({
	            offsetTop: 0
	          });
	          babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].adjustPosition({
	            forceBindPosition: true
	          });
	          return;
	        }
	        const innerPopupContainer = innerPopup.getPopupContainer();
	        const heightDifference = innerPopupContainer.offsetHeight - babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].popupContainer.offsetHeight;
	        const popupPaddingTop = 20;
	        const offset = titleFieldHeight + heightDifference / 2 + popupPaddingTop * 2;
	        main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].popupContainer, '--overlay-offset-top', `-${offset}px`);
	        if (!animate) {
	          babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].adjustPosition({
	            forceBindPosition: true
	          });
	          main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].popupContainer, 'transition', 'none');
	          setTimeout(() => main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].popupContainer, 'transition', null));
	        }
	      }
	    });
	    Object.defineProperty(this, _showOverlay, {
	      writable: true,
	      value: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].adjustPosition({
	          forceBindPosition: true
	        });
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].getPopupContainer(), '--overlay');
	      }
	    });
	    Object.defineProperty(this, _hideOverlay, {
	      writable: true,
	      value: () => {
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].getPopupContainer(), '--overlay');
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	    babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1] = {};
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId = main_core.Type.isUndefined(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId) ? 0 : babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _taskCardSkeleton)[_taskCardSkeleton] = new TaskCardSkeleton();
	  }
	  static async init(params = {}) {
	    const {
	      taskId = null,
	      groupId = null,
	      deadlineTs = null,
	      analytics = {}
	    } = params;
	    const card = taskId ? 'TaskFullCard' : 'TaskCompactCard';
	    const extension = {
	      TaskFullCard: 'tasks.v2.application.task-full-card',
	      TaskCompactCard: 'tasks.v2.application.task-compact-card'
	    };
	    const exports = await main_core.Runtime.loadExtension(['tasks.v2.core', extension[card]]);
	    return new exports[card]({
	      taskId,
	      groupId,
	      deadlineTs,
	      analytics
	    });
	  }
	  showCompactCard() {
	    const popupId = `tasks-compact-card-${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`;
	    if (main_popup.PopupManager.getPopupById(popupId)) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup] = new main_popup.Popup({
	      id: popupId,
	      cacheable: false,
	      width: 580,
	      borderRadius: '16px',
	      angle: false,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _renderPopupContent)[_renderPopupContent](),
	      closeByEsc: false,
	      autoHide: false,
	      closeIcon: false,
	      noAllPaddings: true,
	      contentBorderRadius: '8px',
	      className: 'tasks-compact-card-popup',
	      events: {
	        onPopupAfterClose: async popup => {
	          await babelHelpers.classPrivateFieldLooseBase(this, _taskCompactCard)[_taskCompactCard].unmountCard();
	          babelHelpers.classPrivateFieldLooseBase(this, _unsubscribe)[_unsubscribe](babelHelpers.classPrivateFieldLooseBase(this, _taskCompactCard)[_taskCompactCard]);
	          popup.destroy();
	        },
	        onAfterPopupShow: async popup => {
	          babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].popupContainer = popup.getPopupContainer();
	          babelHelpers.classPrivateFieldLooseBase(this, _taskCompactCard)[_taskCompactCard] = await TaskCard.init(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]);
	          babelHelpers.classPrivateFieldLooseBase(this, _taskCardSkeleton)[_taskCardSkeleton].removeCompactCardSkeleton();
	          await babelHelpers.classPrivateFieldLooseBase(this, _taskCompactCard)[_taskCompactCard].mountCard(babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].cardContainer);
	          main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _renderDragHandle)[_renderDragHandle](), babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].cardContainer);
	          babelHelpers.classPrivateFieldLooseBase(this, _subscribe)[_subscribe](babelHelpers.classPrivateFieldLooseBase(this, _taskCompactCard)[_taskCompactCard]);
	        }
	      },
	      overlay: true,
	      draggable: {
	        element: babelHelpers.classPrivateFieldLooseBase(this, _renderDragHandle)[_renderDragHandle](),
	        restrict: true
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _compactCardPopup)[_compactCardPopup].show();
	  }
	}
	function _subscribe2(taskCompactCard) {
	  main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]);
	  taskCompactCard.subscribe('closeCard', babelHelpers.classPrivateFieldLooseBase(this, _closeCompactCard)[_closeCompactCard]);
	  taskCompactCard.subscribe('openFullCard', babelHelpers.classPrivateFieldLooseBase(this, _openFullCard)[_openFullCard]);
	  taskCompactCard.subscribe('adjustPosition', babelHelpers.classPrivateFieldLooseBase(this, _adjustPosition)[_adjustPosition]);
	  taskCompactCard.subscribe('showOverlay', babelHelpers.classPrivateFieldLooseBase(this, _showOverlay)[_showOverlay]);
	  taskCompactCard.subscribe('hideOverlay', babelHelpers.classPrivateFieldLooseBase(this, _hideOverlay)[_hideOverlay]);
	}
	function _unsubscribe2(taskCompactCard) {
	  main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onShow', babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]);
	  taskCompactCard.unsubscribe('closeCard', babelHelpers.classPrivateFieldLooseBase(this, _closeCompactCard)[_closeCompactCard]);
	  taskCompactCard.unsubscribe('openFullCard', babelHelpers.classPrivateFieldLooseBase(this, _openFullCard)[_openFullCard]);
	  taskCompactCard.unsubscribe('adjustPosition', babelHelpers.classPrivateFieldLooseBase(this, _adjustPosition)[_adjustPosition]);
	  taskCompactCard.unsubscribe('showOverlay', babelHelpers.classPrivateFieldLooseBase(this, _showOverlay)[_showOverlay]);
	  taskCompactCard.unsubscribe('hideOverlay', babelHelpers.classPrivateFieldLooseBase(this, _hideOverlay)[_hideOverlay]);
	}
	function _renderPopupContent2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].cardContainer = main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div class="tasks-task-compact-card-popup-content">
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _taskCardSkeleton)[_taskCardSkeleton].renderCompactCardSkeleton());
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].cardContainer;
	}
	function _renderDragHandle2() {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1]).dragHandle) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3.dragHandle = main_core.Tag.render(_t2 || (_t2 = _$1`
			<div class="tasks-compact-card-popup-drag-handle"></div>
		`));
	  return babelHelpers.classPrivateFieldLooseBase(this, _layout$1)[_layout$1].dragHandle;
	}

	exports.TaskCard = TaskCard;

}((this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}),BX.Event,BX.Main,BX,BX.UI.System));
//# sourceMappingURL=task-card.bundle.js.map
