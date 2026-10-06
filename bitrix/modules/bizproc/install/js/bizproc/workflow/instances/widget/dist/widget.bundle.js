/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Workflow = this.BX.Bizproc.Workflow || {};
(function (exports, main_core, main_popup, ui_imageStackSteps, ui_label, main_date, bizproc_a11y) {
	'use strict';

	const defaulFormatDuration = [['s', 'sdiff'], ['i', 'idiff'], ['H', 'Hdiff'], ['d', 'ddiff'], ['m', 'mdiff'], ['Y', 'Ydiff']];
	const autoRunIconType = {
		type: ui_imageStackSteps.imageTypeEnum.ICON,
		data: {
			icon: 'business-process-1',
			color: 'var(--ui-color-base-10)'
		}
	};
	class Widget {
		#params;
		#stack;
		#popupInstance;
		#popupListNode;
		#listSkeleton;
		#offset = 0;
		constructor(params) {
			this.#params = params;
			this.#initStack();
		}
		static renderTo(node) {
			const instance = new Widget(JSON.parse(node.dataset.widget));
			main_core.Dom.replace(node, instance.render());
		}
		#initStack() {
			this.#stack = new ui_imageStackSteps.ImageStackSteps({
				steps: [{
					id: 'basis',
					stack: {
						images: main_core.Type.isArrayFilled(this.#params.users) ? this.#getStackUserImages(this.#params.users, this.#params.allCount) : this.#getEmptyStackImages()
					},
					footer: {
						type: ui_imageStackSteps.footerTypeEnum.TEXT,
						data: {
							text: this.#getStackText(this.#params.allCount)
						},
						styles: {
							maxWidth: 90
						}
					},
					styles: {
						minWidth: 90
					}
				}]
			});
		}
		#getStackText(counter) {
			if (counter < 1) {
				return main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_LIST_EMPTY');
			}
			return main_core.Loc.getMessagePlural('BIZPROC_JS_WORKFLOW_INST_WIDGET_LIST', counter, {
				'#COUNT#': counter < 100 ? counter : '99+'
			});
		}
		#getStackUserImages(avatars, allCount) {
			const images = [];
			avatars.forEach(avatar => {
				const userId = main_core.Text.toInteger(avatar.id);
				if (userId > 0) {
					images.push({
						type: ui_imageStackSteps.imageTypeEnum.USER,
						data: {
							userId,
							src: String(avatar.avatarUrl || '')
						}
					});
				} else {
					images.push(autoRunIconType);
				}
			});
			if (allCount > 3) {
				const mixed = images.slice(0, 2);
				mixed.push({
					type: ui_imageStackSteps.imageTypeEnum.COUNTER,
					data: {
						text: `+${allCount - 2}`
					}
				});
				return mixed;
			}
			return images;
		}
		#getEmptyStackImages(fill, length = 3) {
			return Array.from({
				length
			}).fill(fill ?? {
				type: ui_imageStackSteps.imageTypeEnum.USER_STUB
			});
		}
		render() {
			const isEmpty = this.#params.allCount < 1;
			const node = main_core.Tag.render`
			<div
				class="bp-workflow-instances-widget ${isEmpty ? '--empty' : ''}"
				data-testid="bizproc-instances-widget"
			></div>
		`;
			this.#stack.renderTo(node);
			if (!isEmpty) {
				main_core.Dom.attr(node, {
					'aria-label': this.#getStackText(this.#params.allCount),
					'aria-haspopup': 'dialog'
				});
				bizproc_a11y.makeActivatable(node, this.#handleClick.bind(this));
			}
			return node;
		}
		#handleClick(event) {
			if (!this.#popupInstance) {
				this.#popupInstance = new main_popup.Popup({
					autoHide: true,
					width: 305,
					minHeight: 342,
					animation: 'fading-slide',
					content: this.#getPopupContent(),
					bindElement: event.target,
					padding: 0,
					borderRadius: '12px',
					role: 'dialog',
					ariaLabel: main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_TITLE'),
					// the portal accessibility settings can be off, so both options are passed explicitly
					closeByEsc: true,
					focusTrap: true
				});
			}
			this.#popupInstance.toggle();
		}
		#getPopupContent() {
			this.#listSkeleton = this.#renderListSkeleton();
			this.#popupListNode = main_core.Tag.render`<div class="bizproc-workflow-instances-popup-list">${this.#listSkeleton}</div>`;
			this.#loadList();
			return main_core.Tag.render`
			<div class="bizproc-workflow-instances-popup-content">
				<div class="bizproc-workflow-instances-popup-title">${main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_TITLE')}</div>
				<div class="bizproc-workflow-instances-popup-text">
					${main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_TEXT_P1')}
					<br>
					${main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_TEXT_P2')}
				</div>
				<div class="bizproc-workflow-instances-popup-heads">
					<div class="bizproc-workflow-instances-popup-heads-item">
						${main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_AUTHOR')}
					</div>
					<div class="bizproc-workflow-instances-popup-heads-item">
						${main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_IN_PROGRESS_MSGVER_1')}
					</div>
					<div class="bizproc-workflow-instances-popup-heads-item">
						${main_core.Loc.getMessage('BIZPROC_JS_WORKFLOW_INST_WIDGET_POPUP_TIME')}
					</div>
				</div>
				${this.#popupListNode}
			</div>
		`;
		}
		#renderListSkeleton() {
			let i = 0;
			let opacity = 1.15;
			const target = main_core.Tag.render`<div class="bizproc-workflow-instances-popup-list-page"></div>`;
			while (i < 5) {
				++i;
				opacity -= 0.15;
				const facesNode = this.#renderListItemFaces();
				const label = new ui_label.Label({
					color: ui_label.LabelColor.DEFAULT,
					size: ui_label.LabelSize.SM,
					fill: true,
					customClass: 'bizproc-workflow-instances-popup-list-item-time-skeleton'
				});
				const node = main_core.Tag.render`
				<div class="bizproc-workflow-instances-popup-list-item" style="opacity: ${opacity}">
					${facesNode}
					<div class="bizproc-workflow-instances-popup-list-item-time">${label.render()}</div>
				</div>
			`;
				main_core.Dom.append(node, target);
			}
			return target;
		}
		#renderListPage(list) {
			const pageNode = main_core.Tag.render`<div class="bizproc-workflow-instances-popup-list-page"></div>`;
			list.forEach(item => {
				const steps = item.steps;
				const facesNode = this.#renderListItemFaces(steps.at(0)?.avatarsData, steps.find(step => step.id === 'running')?.avatarsData);
				const label = new ui_label.Label({
					text: this.#formatDuration(item.timeStep.duration),
					color: ui_label.LabelColor.LIGHT_BLUE,
					size: ui_label.LabelSize.SM,
					fill: true
				});
				const itemNode = main_core.Tag.render`
				<div class="bizproc-workflow-instances-popup-list-item">
					${facesNode}
					<div class="bizproc-workflow-instances-popup-list-item-time">${label.render()}</div>
				</div>
			`;
				main_core.Dom.append(itemNode, pageNode);
			});
			return pageNode;
		}
		#loadList() {
			main_core.ajax.runAction('bizproc.workflow.getTemplateInstances', {
				data: {
					templateId: this.#params.tplId,
					offset: this.#offset
				}
			}).then(response => {
				this.#offset += response.data.list.length;
				main_core.Dom.append(this.#renderListPage(response.data.list), this.#popupListNode);
				main_core.Dom.append(this.#listSkeleton, this.#popupListNode); // move skeleton to the end

				this.#handleNextPage(response.data.hasNextPage);
			}).catch(response => {
				if (response.errors?.length > 0) {
					main_core.Runtime.loadExtension('ui.dialogs.messagebox').then(({
						MessageBox
					}) => {
						MessageBox.alert(main_core.Text.encode(response.errors[0].message));
					}).catch(() => {});
				} else {
					console?.error(response);
				}
			});
		}
		#handleNextPage(hasNextPage) {
			if (hasNextPage && this.#listSkeleton) {
				new IntersectionObserver((entries, observer) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							observer.disconnect();
							this.#loadList();
						}
					});
				}).observe(this.#listSkeleton);
				return;
			}
			main_core.Dom.remove(this.#listSkeleton);
			this.#listSkeleton = null;
		}
		#renderListItemFaces(author, running) {
			const facesNode = main_core.Tag.render`
			<div class="bizproc-workflow-instances-popup-list-item-faces"></div>
		`;
			const stack = new ui_imageStackSteps.ImageStackSteps({
				steps: [{
					id: 'col-1',
					stack: {
						images: main_core.Type.isArrayFilled(author) ? this.#getStackUserImages(author) : this.#getEmptyStackImages(autoRunIconType, 1)
					},
					styles: {
						minWidth: 36
					}
				}, {
					id: 'col-2',
					stack: {
						images: main_core.Type.isArrayFilled(running) ? this.#getStackUserImages(running) : this.#getEmptyStackImages(autoRunIconType, 1)
					}
				}]
			});
			stack.renderTo(facesNode);
			return facesNode;
		}
		#formatDuration(duration) {
			if (!duration) {
				return '?';
			}
			return main_date.DateTimeFormat.format(defaulFormatDuration, 0, duration);
		}
	}

	exports.Widget = Widget;

})(this.BX.Bizproc.Workflow.Instances = this.BX.Bizproc.Workflow.Instances || {}, BX, BX.Main, BX.UI, BX.UI, BX.Main, BX.Bizproc.A11y);
//# sourceMappingURL=widget.bundle.js.map
