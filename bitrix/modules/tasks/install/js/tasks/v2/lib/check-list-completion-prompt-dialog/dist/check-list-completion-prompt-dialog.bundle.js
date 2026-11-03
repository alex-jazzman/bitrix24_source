/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_vue3, ui_vue3_components_popup, ui_vue3_mixins_locMixin, ui_a11y, ui_iconSet_api_vue, ui_iconSet_outline, ui_system_alert, ui_system_typography, ui_vue3_components_button, ui_vue3_components_richLoc, tasks_v2_component_elements_progressBar, tasks_v2_lib_checkListBbCode) {
	'use strict';

	const SLIDER_EVENT_CLOSE = 'SidePanel.Slider:onCloseComplete';
	function createPopupClosingLock({
		eventEmitter,
		getPopup,
		isLoading
	}) {
		let stopped = false;
		const apply = () => {
			const closingEnabled = !isLoading();
			const popup = getPopup();
			popup?.setAutoHide(closingEnabled);
			popup?.setClosingByEsc(closingEnabled);
		};
		const handleSliderCloseComplete = () => {
			if (!isLoading()) {
				return;
			}
			void Promise.resolve().then(() => {
				if (!stopped && isLoading()) {
					apply();
				}
			});
		};
		eventEmitter?.subscribe(SLIDER_EVENT_CLOSE, handleSliderCloseComplete);
		apply();
		return {
			apply,
			stop: () => {
				if (stopped) {
					return;
				}
				stopped = true;
				eventEmitter?.unsubscribe(SLIDER_EVENT_CLOSE, handleSliderCloseComplete);
			}
		};
	}

	const TestId = Object.freeze({
		DialogRoot: 'tasks-checklist-on-complete-dialog',
		Title: 'tasks-checklist-on-complete-title',
		TitleLink: 'tasks-checklist-on-complete-title-link',
		Subtitle: 'tasks-checklist-on-complete-subtitle',
		List: 'tasks-checklist-on-complete-list',
		ScrollArea: 'tasks-checklist-on-complete-scroll-area',
		GroupPrefix: 'tasks-checklist-on-complete-group',
		ProgressPrefix: 'tasks-checklist-on-complete-progress',
		ProgressBarPrefix: 'tasks-checklist-on-complete-progress-bar',
		ItemPrefix: 'tasks-checklist-on-complete-item',
		CloseButton: 'tasks-checklist-on-complete-close-btn',
		CompleteButton: 'tasks-checklist-on-complete-complete-btn',
		ReturnButton: 'tasks-checklist-on-complete-return-btn',
		ErrorAlert: 'tasks-checklist-on-complete-error-alert'
	});

	const {
		HeadlineXs,
		TextMd: TextMd$1,
		TextSm
	} = ui_system_typography.Vue;
	const PromptGroup = {
		name: 'TasksCheckListCompletionGroup',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineXs,
			ProgressBar: tasks_v2_component_elements_progressBar.ProgressBar,
			TextMd: TextMd$1,
			TextSm
		},
		props: {
			group: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				TestId,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			formattedTitles() {
				const titles = [this.group.title, ...this.group.items.map(item => item.title)];
				return ui_vue3.markRaw(new Map(titles.map(title => [title, tasks_v2_lib_checkListBbCode.CheckListBbCode.formatHtml(title)])));
			}
		},
		methods: {
			formatTitle(title) {
				return this.formattedTitles.get(title) ?? '';
			}
		},
		template: `
		<section
			class="tasks-check-list-completion__group"
			:data-testid="TestId.GroupPrefix + '-' + group.id"
		>
			<div class="tasks-check-list-completion__group-header">
				<div class="tasks-check-list-completion__group-title-row">
					<BIcon
						class="tasks-check-list-completion__group-icon"
						:name="Outline.CHECK_LIST"
						:size="22"
						color="var(--ui-color-accent-main-primary)"
						aria-hidden="true"
					/>
					<HeadlineXs
						tag="h3"
						className="tasks-check-list-completion__group-title"
						v-html="formatTitle(group.title)"
					/>
				</div>
				<div class="tasks-check-list-completion__group-progress">
					<TextSm
						tag="p"
						className="tasks-check-list-completion__progress"
						:data-testid="TestId.ProgressPrefix + '-' + group.id"
					>
						{{ loc('TASKS_V2_CHECKLIST_COMPLETE_PROGRESS', { '#COMPLETED#': group.completedCount, '#TOTAL#': group.totalCount }) }}
					</TextSm>
					<ProgressBar
						:totalValue="group.totalCount"
						:completedValue="group.completedCount"
						:width="56"
						:height="5"
						color="var(--ui-color-accent-main-primary-alt)"
						bgColor="var(--ui-color-base-7)"
						:borderRadius="30"
						:data-testid="TestId.ProgressBarPrefix + '-' + group.id"
						aria-hidden="true"
					/>
				</div>
			</div>
			<ul class="tasks-check-list-completion__items">
				<li
					v-for="item in group.items"
					:key="item.id"
					class="tasks-check-list-completion__item"
					:class="{ '--context': item.isContext }"
					:style="{ '--item-depth': item.depth }"
					:aria-level="item.depth + 1"
					:data-testid="TestId.ItemPrefix + '-' + item.id"
				>
					<span class="tasks-check-list-completion__marker" aria-hidden="true">
						<BIcon
							v-if="item.isContext"
							:name="Outline.CHECK_S"
							:size="18"
							color="var(--ui-color-base-4)"
						/>
						<span v-else class="tasks-check-list-completion__dot"></span>
					</span>
					<span v-if="item.isContext" class="tasks-check-list-completion__completed-status">
						{{ loc('TASKS_V2_CHECKLIST_ITEM_COMPLETED') }}
					</span>
					<TextMd
						tag="span"
						className="tasks-check-list-completion__item-label"
						v-html="formatTitle(item.title)"
					/>
				</li>
			</ul>
		</section>
	`
	};

	const {
		Alert
	} = ui_system_alert.Vue;
	const {
		HeadlineMd,
		TextMd
	} = ui_system_typography.Vue;
	const PromptContent = {
		name: 'TasksCheckListCompletionContent',
		components: {
			Alert,
			BIcon: ui_iconSet_api_vue.BIcon,
			HeadlineMd,
			PromptGroup,
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			TextMd,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			snapshot: {
				type: Object,
				required: true
			},
			state: {
				type: Object,
				required: true
			},
			title: {
				type: String,
				required: false,
				default: ''
			},
			titleId: {
				type: String,
				required: false,
				default: null
			},
			titleLink: {
				type: Object,
				required: false,
				default: null
			},
			subtitle: {
				type: String,
				required: false,
				default: ''
			},
			completeButtonText: {
				type: String,
				default: ''
			},
			returnButtonText: {
				type: String,
				default: ''
			},
			onComplete: {
				type: Function,
				default: () => {}
			},
			onLoadingChange: {
				type: Function,
				default: () => {}
			},
			onReturn: {
				type: Function,
				default: () => {}
			},
			onCancel: {
				type: Function,
				default: () => {}
			},
			focusDialog: {
				type: Function,
				default: () => {}
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				TestId,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				hasOverflow: false
			};
		},
		computed: {
			resolvedCompleteButtonText() {
				if (this.state.error) {
					return this.loc('TASKS_V2_CHECKLIST_RETRY_BUTTON');
				}
				return this.completeButtonText || this.loc('TASKS_V2_CHECKLIST_COMPLETE_BUTTON');
			},
			resolvedReturnButtonText() {
				return this.returnButtonText || this.loc('TASKS_V2_CHECKLIST_RETURN_BUTTON');
			}
		},
		watch: {
			'state.loading': {
				handler(loading) {
					if (loading) {
						this.holdFocus();
						ui_a11y.LiveAnnouncer.announce(this.loc('TASKS_V2_CHECKLIST_COMPLETE_LOADING'), 'polite');
						return;
					}
					void this.restoreFocus();
				}
			},
			'state.error': {
				handler(hasError) {
					if (hasError) {
						ui_a11y.LiveAnnouncer.announce(this.loc('TASKS_V2_CHECKLIST_COMPLETE_ERROR'), 'assertive');
					}
				}
			}
		},
		created() {
			this.resizeObserver = null;
			this.focusedBeforeLoading = null;
		},
		mounted() {
			this.resizeObserver = new ResizeObserver(() => this.updateOverflow());
			this.resizeObserver.observe(this.$refs.scrollArea);
			this.updateOverflow();
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect();
			this.resizeObserver = null;
		},
		methods: {
			updateOverflow() {
				const scrollArea = this.$refs.scrollArea;
				this.hasOverflow = scrollArea.scrollHeight - scrollArea.clientHeight > 1;
			},
			holdFocus() {
				const activeElement = document.activeElement;
				this.focusedBeforeLoading = this.$el.contains(activeElement) ? activeElement : null;
				if (this.focusedBeforeLoading) {
					this.focusDialog();
				}
			},
			async restoreFocus() {
				const element = this.focusedBeforeLoading;
				this.focusedBeforeLoading = null;
				await ui_vue3.nextTick();
				if (element?.isConnected && !this.$el.contains(document.activeElement)) {
					element.focus();
				}
			},
			handleTitleLinkClick() {
				if (this.state.loading) {
					return;
				}
				this.titleLink?.onClick();
			},
			handleComplete() {
				if (this.state.loading) {
					return;
				}
				this.onLoadingChange(true);
				void this.onComplete();
			},
			handleReturn() {
				if (!this.state.loading) {
					this.onReturn();
				}
			},
			handleCancel() {
				if (!this.state.loading) {
					this.onCancel();
				}
			}
		},
		template: `
		<div
			class="tasks-check-list-completion"
			:data-testid="TestId.DialogRoot"
			:aria-busy="state.loading ? 'true' : 'false'"
		>
			<UiButton
				class="tasks-check-list-completion__close"
				:text="loc('TASKS_V2_CHECKLIST_CLOSE_BUTTON')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:leftIcon="Outline.CROSS_M"
				:dataset="{ testid: TestId.CloseButton }"
				:disabled="state.loading"
				collapsed
				@click="handleCancel"
			/>
			<div class="tasks-check-list-completion__status">
				<img
					class="tasks-check-list-completion__illustration"
					src="/bitrix/js/tasks/v2/lib/check-list-completion-prompt-dialog/images/checklist-completion.webp"
					alt=""
					width="152"
					height="93"
					draggable="false"
				>
				<HeadlineMd
					tag="h2"
					accent
					align="center"
					className="tasks-check-list-completion__title"
					:id="titleId"
					:data-testid="TestId.Title"
				>
					{{ title || loc('TASKS_V2_CHECKLIST_COMPLETE_TITLE') }}<template v-if="titleLink">{{ ' «' }}<a
							class="tasks-check-list-completion__title-link"
							href="#"
							:aria-disabled="state.loading ? 'true' : 'false'"
							:tabindex="state.loading ? -1 : 0"
							:data-testid="TestId.TitleLink"
							@click.prevent="handleTitleLinkClick"
						>{{ titleLink.text }}</a>{{ '»?' }}</template>
				</HeadlineMd>
			</div>
			<TextMd
				tag="p"
				align="center"
				className="tasks-check-list-completion__subtitle"
				:data-testid="TestId.Subtitle"
			>
				<RichLoc
					tag="span"
					:text="subtitle || loc('TASKS_V2_CHECKLIST_COMPLETE_SUBTITLE')"
					placeholder="[br/]"
				>
					<template #br><br></template>
				</RichLoc>
			</TextMd>
			<div v-if="state.error" class="tasks-check-list-completion__error-wrap">
				<Alert design="tinted-alert" :data-testid="TestId.ErrorAlert">
					<span class="tasks-check-list-completion__error">
							<BIcon
								class="tasks-check-list-completion__error-icon"
								:name="Outline.ALERT"
								:size="20"
								color="var(--ui-color-accent-main-alert)"
								aria-hidden="true"
							/>
							<span>{{ loc('TASKS_V2_CHECKLIST_COMPLETE_ERROR') }}</span>
						</span>
				</Alert>
			</div>
			<div class="tasks-check-list-completion__list" :data-testid="TestId.List">
				<div
					ref="scrollArea"
					class="tasks-check-list-completion__scroll-area"
					role="region"
					:tabindex="hasOverflow ? 0 : -1"
					:aria-label="loc('TASKS_V2_CHECKLIST_LIST_LABEL')"
					:data-testid="TestId.ScrollArea"
				>
					<PromptGroup
						v-for="group in snapshot.groups"
						:key="group.id"
						:group="group"
					/>
				</div>
				<div v-if="hasOverflow" class="tasks-check-list-completion__fade --top" aria-hidden="true"></div>
				<div v-if="hasOverflow" class="tasks-check-list-completion__fade --bottom" aria-hidden="true"></div>
			</div>
			<div class="tasks-check-list-completion__footer">
				<div class="tasks-check-list-completion__buttons">
					<UiButton
						class="tasks-check-list-completion__button"
						:text="resolvedCompleteButtonText"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.FILLED"
						:dataset="{ autofocus: '', testid: TestId.CompleteButton }"
						:disabled="state.loading"
						:loading="state.loading"
						@click="handleComplete"
					/>
					<UiButton
						class="tasks-check-list-completion__button"
						:text="resolvedReturnButtonText"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.PLAIN"
						:dataset="{ testid: TestId.ReturnButton }"
						:disabled="state.loading"
						@click="handleReturn"
					/>
				</div>
			</div>
		</div>
	`
	};

	const PromptDialogComponent = {
		name: 'TasksCheckListCompletionPromptDialog',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			PromptContent
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			presentation: {
				type: Object,
				default: null
			},
			onComplete: {
				type: Function,
				required: true
			},
			onLoadingChange: {
				type: Function,
				required: true
			},
			onReturn: {
				type: Function,
				required: true
			},
			onCancel: {
				type: Function,
				required: true
			},
			onPassiveClose: {
				type: Function,
				required: true
			},
			onClosed: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				titleId: `tasks-check-list-completion-title-${main_core.Text.getRandom()}`,
				closingLock: null
			};
		},
		computed: {
			title() {
				return this.presentation?.title ?? main_core.Loc.getMessage('TASKS_V2_CHECKLIST_COMPLETE_TITLE') ?? '';
			},
			titleLink() {
				const titleLink = this.presentation?.titleLink;
				if (!titleLink) {
					return null;
				}
				return {
					text: titleLink.text,
					onClick: () => this.onReturn(titleLink.onClick)
				};
			},
			popupOptions() {
				return {
					className: 'tasks-check-list-completion-popup',
					padding: 0,
					contentPadding: 0,
					borderRadius: '18px',
					overlay: {
						backgroundColor: 'rgba(0, 32, 78, 0.46)',
						opacity: 100,
						blur: 'none'
					},
					autoHide: true,
					closeByEsc: true,
					disableScroll: true,
					focusTrap: {
						initialFocus: '[data-autofocus]',
						restoreFocus: true,
						looped: true
					},
					ariaLabelledBy: this.titleId,
					animation: false,
					cacheable: false,
					targetContainer: document.body
				};
			}
		},
		watch: {
			'state.loading': {
				handler() {
					this.closingLock?.apply();
				}
			}
		},
		mounted() {
			this.closingLock = createPopupClosingLock({
				eventEmitter: getSliderEventEmitter(),
				getPopup: () => this.$refs.popup?.getPopupInstance(),
				isLoading: () => this.state.loading
			});
		},
		beforeUnmount() {
			this.closingLock?.stop();
			this.closingLock = null;
		},
		methods: {
			close() {
				this.$refs.popup?.getPopupInstance().close();
			},
			focusDialog() {
				this.$refs.popup?.getPopupInstance().getPopupContainer()?.focus();
			},
			handlePopupClose() {
				this.onPassiveClose();
				if (this.$refs.popup?.getPopupInstance().isDestroyed()) {
					this.onClosed();
				}
			}
		},
		template: `
		<Popup ref="popup" :options="popupOptions" @close="handlePopupClose">
			<template #default>
				<PromptContent
					:snapshot="snapshot"
					:state="state"
					:title="title"
					:titleId="titleId"
					:titleLink="titleLink"
					:subtitle="presentation?.subtitle"
					:completeButtonText="presentation?.completeButtonText"
					:returnButtonText="presentation?.returnButtonText"
					:onComplete="onComplete"
					:onLoadingChange="onLoadingChange"
					:onReturn="onReturn"
					:onCancel="onCancel"
					:focusDialog="focusDialog"
				/>
			</template>
		</Popup>
	`
	};
	class CheckListCompletionPromptDialog {
		#snapshot;
		#presentation;
		#onComplete;
		#onReturn;
		#onCancel;
		#onClosed;
		#application = null;
		#component = null;
		#container = main_core.Tag.render`<div></div>`;
		#state = ui_vue3.reactive({
			loading: false,
			error: false
		});
		#settled = false;
		#cleanupScheduled = false;
		#onSettledAfterClose = null;
		#onAfterClose = null;
		constructor({
			snapshot,
			onComplete,
			onReturn,
			onCancel,
			onClosed,
			presentation
		}) {
			this.#snapshot = snapshot;
			this.#presentation = presentation ?? null;
			this.#onComplete = onComplete;
			this.#onReturn = onReturn ?? onCancel;
			this.#onCancel = onCancel;
			this.#onClosed = onClosed ?? (() => {});
		}
		show() {
			if (this.#application || this.#settled) {
				return;
			}
			this.#application = ui_vue3.BitrixVue.createApp(PromptDialogComponent, {
				state: this.#state,
				snapshot: this.#snapshot,
				presentation: this.#presentation,
				onComplete: this.#onComplete,
				onLoadingChange: loading => this.setLoading(loading),
				onReturn: onAfterClose => this.returnToTask(onAfterClose),
				onCancel: () => this.cancel(),
				onPassiveClose: () => this.#handlePassiveClose(),
				onClosed: () => this.#scheduleCleanup()
			});
			this.#application.mixin(ui_vue3_mixins_locMixin.locMixin);
			this.#component = this.#application.mount(this.#container);
		}
		close() {
			if (this.#settled) {
				return;
			}
			this.#settled = true;
			this.#requestClose();
		}
		setLoading(loading) {
			this.#state.loading = loading;
			if (loading) {
				this.#state.error = false;
			}
		}
		setError() {
			this.#state.loading = false;
			this.#state.error = true;
		}
		cancel() {
			if (this.#settled || this.#state.loading) {
				return;
			}
			this.#settled = true;
			this.#onSettledAfterClose = this.#onCancel;
			this.#requestClose();
		}
		returnToTask(onAfterClose) {
			if (this.#settled || this.#state.loading) {
				return;
			}
			this.#settled = true;
			this.#onSettledAfterClose = this.#onReturn;
			this.#onAfterClose = onAfterClose ?? null;
			this.#requestClose();
		}
		#handlePassiveClose() {
			if (this.#settled || this.#state.loading) {
				return;
			}
			this.#settled = true;
			this.#onSettledAfterClose = this.#onCancel;
		}
		#requestClose() {
			if (this.#component) {
				this.#component.close();
				return;
			}
			this.#scheduleCleanup();
		}
		#scheduleCleanup() {
			if (this.#cleanupScheduled) {
				return;
			}
			this.#cleanupScheduled = true;
			void Promise.resolve().then(() => {
				this.#application?.unmount();
				this.#application = null;
				this.#component = null;
				this.#container.remove();
				const onSettledAfterClose = this.#onSettledAfterClose;
				this.#onSettledAfterClose = null;
				const onAfterClose = this.#onAfterClose;
				this.#onAfterClose = null;
				onSettledAfterClose?.();
				onAfterClose?.();
			});
			this.#onClosed();
		}
	}
	function getSliderEventEmitter() {
		return top.BX?.Event?.EventEmitter ?? null;
	}

	exports.CheckListCompletionPromptDialog = CheckListCompletionPromptDialog;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Vue3, BX.UI.Vue3.Components, BX.Vue3.Mixins, BX.UI.Accessibility, BX.UI.IconSet, window, BX.UI.System.Alert, BX.UI.System.Typography, BX.Vue3.Components, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib);
//# sourceMappingURL=check-list-completion-prompt-dialog.bundle.js.map
