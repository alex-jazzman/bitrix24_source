/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, im_v2_application_core, im_v2_const, im_v2_lib_dateFormatter, im_v2_lib_message, main_core, ui_a11y, ui_iconSet_api_vue, im_v2_component_elements_attach, im_v2_component_elements_keyboard, pull_client, im_v2_lib_localStorage, im_v2_lib_notifier, im_v2_provider_service_settings, ui_reaction_item, main_core_events, im_v2_lib_channel, im_v2_lib_permission, im_v2_lib_logger, im_v2_lib_rest, ui_reaction_item_vue, im_v2_component_elements_avatar, im_v2_component_elements_userListPopup, im_v2_lib_utils, im_v2_provider_service_user, ui_reaction_picker, ui_iconSet_outline, im_v2_component_elements_popup, im_v2_lib_promo, im_v2_lib_feature, im_v2_lib_parser, im_v2_component_elements_chatTitle, im_v2_lib_copilot, ui_system_menu, im_v2_lib_menu, im_v2_provider_service_message, im_v2_provider_service_sending, im_v2_provider_service_uploading, im_v2_component_animation, im_v2_provider_service_comments, main_sidepanel, ui_system_chip_vue, ui_sidepanel_layout, ui_lottie, im_v2_component_elements_player, im_v2_component_elements_progressbar, ui_vue3_components_button, im_v2_lib_confirm, ui_icons_disk, ui_system_checkbox, ui_system_radiobutton, ui_system_input_vue, ui_system_menu_vue, im_v2_component_elements_mediaGallery) {
	'use strict';

	const TextContent = ui_vue3.defineComponent({
		name: 'TextContent',
		props: {
			text: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="bx-im-message-text-content__container" data-testid="im-message-text-content">
			<slot>
				<span v-html="text"></span>
			</slot>
		</div>
	`
	});

	const MessageStatus = ui_vue3.defineComponent({
		name: 'MessageStatus',
		props: {
			item: {
				type: Object,
				required: true
			},
			isOverlay: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			message() {
				return this.item;
			},
			formattedDate() {
				return im_v2_lib_dateFormatter.DateFormatter.formatByCode(this.message.date, im_v2_lib_dateFormatter.DateCode.shortTimeFormat);
			},
			isSelfMessage() {
				return this.message.authorId === im_v2_application_core.Core.getUserId();
			},
			isNotDelivered() {
				return this.message.notDelivered === true && !this.message.error;
			},
			messageStatus() {
				if (im_v2_lib_message.messageHasError(this.message)) {
					return im_v2_const.OwnMessageStatus.error;
				}
				if (this.message.sending) {
					return im_v2_const.OwnMessageStatus.sending;
				}
				if (this.message.viewedByOthers) {
					return im_v2_const.OwnMessageStatus.viewed;
				}
				return im_v2_const.OwnMessageStatus.sent;
			}
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-message-status__container" :class="{'--overlay': isOverlay}">
			<div v-if="message.isEdited && !message.isDeleted" class="bx-im-message-status__edit-mark">
				{{ loc('IM_MESSENGER_MESSAGE_EDITED') }}
			</div>
			<div
				v-if="isNotDelivered"
				class="bx-im-message-status__date --not-delivered"
				:class="{'--overlay': isOverlay}"
				:title="formattedDate"
				data-testid="im-message-not-delivered-label"
			>
				{{ loc('IM_MESSENGER_MESSAGE_NOT_DELIVERED') }}
			</div>
			<div v-else class="bx-im-message-status__date" :class="{'--overlay': isOverlay}">
				{{ formattedDate }}
			</div>
			<div v-if="isSelfMessage" :class="'--' + messageStatus" class="bx-im-message-status__icon" data-testid="im-message-status-icon"></div>
		</div>
	`
	});

	const AiTaskIndicationLayout = Object.freeze({
		bubble: 'bubble',
		media: 'media',
		round: 'round',
		mediaCaption: 'media-caption'
	});
	function isAiTaskStatusInTimeRow(layout) {
		return layout === AiTaskIndicationLayout.bubble || layout === AiTaskIndicationLayout.mediaCaption;
	}
	const AiTaskIndicationLayoutKey = 'imAiTaskIndicationLayout';
	const Tone = Object.freeze({
		ai: 'ai',
		warning: 'warning',
		alert: 'alert'
	});
	const CREATING_STATUSES = new Set([im_v2_const.AiTaskStatus.taskCreationStarted, im_v2_const.AiTaskStatus.resultCreationStarted]);
	const FRAMES = Object.freeze([{
		name: 'preparing',
		matches: operation => operation.status === null,
		labelKey: 'IM_MESSAGE_AI_TASK_PREPARING',
		icon: ui_iconSet_api_vue.Outline.AI_STARS,
		tone: Tone.ai,
		isTerminal: false,
		extinguishesDecor: false,
		politeness: 'polite'
	}, {
		name: 'analyzing',
		matches: operation => operation.status === im_v2_const.AiTaskStatus.search,
		labelKey: 'IM_MESSAGE_AI_TASK_ANALYZING',
		icon: ui_iconSet_api_vue.Outline.AI_STARS,
		tone: Tone.ai,
		isTerminal: false,
		extinguishesDecor: false,
		politeness: 'polite'
	}, {
		name: 'creating',
		matches: operation => CREATING_STATUSES.has(operation.status),
		labelKey: 'IM_MESSAGE_AI_TASK_CREATING',
		icon: ui_iconSet_api_vue.Outline.AI_STARS,
		tone: Tone.ai,
		isTerminal: false,
		extinguishesDecor: false,
		politeness: 'polite'
	}, {
		name: 'created',
		matches: operation => {
			return operation.status === im_v2_const.AiTaskStatus.taskCreationCompleted && !operation.isPartial;
		},
		labelKey: 'IM_MESSAGE_AI_TASK_CREATED',
		icon: ui_iconSet_api_vue.Outline.AI_STARS,
		tone: Tone.ai,
		isTerminal: true,
		extinguishesDecor: false,
		politeness: 'polite'
	}, {
		name: 'partial',
		matches: operation => {
			return operation.status === im_v2_const.AiTaskStatus.taskCreationCompleted;
		},
		labelKey: 'IM_MESSAGE_AI_TASK_CREATED_PARTIAL',
		icon: ui_iconSet_api_vue.Outline.EXCLAMATION_CIRCLE,
		tone: Tone.warning,
		isTerminal: true,
		extinguishesDecor: false,
		politeness: 'polite'
	}, {
		name: 'result-added',
		matches: operation => {
			return operation.status === im_v2_const.AiTaskStatus.resultCreationCompleted;
		},
		labelKey: 'IM_MESSAGE_AI_TASK_RESULT_ADDED',
		icon: ui_iconSet_api_vue.Outline.AI_STARS,
		tone: Tone.ai,
		isTerminal: true,
		extinguishesDecor: false,
		politeness: 'polite'
	}, {
		name: 'error',
		matches: operation => operation.status === im_v2_const.AiTaskStatus.notFound,
		labelKey: 'IM_MESSAGE_AI_TASK_ERROR',
		icon: ui_iconSet_api_vue.Outline.ALERT,
		tone: Tone.alert,
		isTerminal: true,
		extinguishesDecor: true,
		politeness: 'assertive'
	}]);
	const PROGRESSIVE_FRAMES = FRAMES.filter(frame => !frame.isTerminal);
	function findAiTaskFrame(operation) {
		if (!operation) {
			return null;
		}
		return FRAMES.find(frame => frame.matches(operation)) ?? null;
	}
	function getAiTaskOperation(store, message) {
		const operation = store.getters['aiTask/getForChat'](message.chatId);
		if (!operation) {
			return null;
		}
		const indicatedIds = operation.indicatedMessageIds;
		return indicatedIds.includes(message.id) ? operation : null;
	}
	function hasAiTaskIndication(store, message) {
		return getAiTaskOperation(store, message) !== null;
	}
	function isAiTaskCaptionPlace(operation, message) {
		return operation?.captionMessageId === message.id;
	}

	const AiTaskStatusRow = ui_vue3.defineComponent({
		name: 'AiTaskStatusRow',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			layout: {
				type: String,
				default: AiTaskIndicationLayout.bubble
			}
		},
		computed: {
			stages: () => PROGRESSIVE_FRAMES,
			operation() {
				return getAiTaskOperation(this.$store, this.message);
			},
			isCaptionPlace() {
				return isAiTaskCaptionPlace(this.operation, this.message);
			},
			frame() {
				return this.isCaptionPlace ? findAiTaskFrame(this.operation) : null;
			},
			layoutModifier() {
				return `--${this.layout}`;
			}
		},
		methods: {
			isCurrentStage(stage) {
				return this.frame?.name === stage.name;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			v-if="frame"
			class="bx-im-message-ai-task__status"
			:class="[layoutModifier, '--' + frame.tone]"
			data-testid="im-message-ai-task-status"
		>
			<BIcon class="bx-im-message-ai-task__icon" :name="frame.icon" aria-hidden="true" />
			<span class="bx-im-message-ai-task__stack">
				<span
					v-for="stage in stages"
					:key="stage.name"
					class="bx-im-message-ai-task__label"
					:class="{ '--current': isCurrentStage(stage) }"
					:aria-hidden="!isCurrentStage(stage)"
				>{{ loc(stage.labelKey) }}</span>
				<span
					v-if="frame.isTerminal"
					:key="frame.name"
					class="bx-im-message-ai-task__label --current --terminal"
					:data-testid="'im-message-ai-task-outcome-' + frame.name"
				>{{ loc(frame.labelKey) }}</span>
			</span>
			<span
				v-if="!frame.isTerminal"
				class="bx-im-message-ai-task__dots"
				aria-hidden="true"
				data-testid="im-message-ai-task-progress"
			>
				<i class="bx-im-message-ai-task__dot"></i>
				<i class="bx-im-message-ai-task__dot"></i>
				<i class="bx-im-message-ai-task__dot"></i>
			</span>
		</div>
	`
	});

	const ENTRY_ANNOUNCEMENT_KEY = 'IM_MESSAGE_AI_TASK_PREPARING';
	const ENTRY_ANNOUNCEMENT_MULTIPLE_KEY = 'IM_MESSAGE_AI_TASK_PREPARING_MULTIPLE';
	const SOURCE_MARK_KEY = 'IM_MESSAGE_AI_TASK_SOURCE';
	const AiTaskIndication = ui_vue3.defineComponent({
		name: 'AiTaskIndication',
		components: {
			AiTaskStatusRow
		},
		compilerOptions: {
			isCustomElement: tag => tag === 'visually-hidden'
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			layout: {
				type: String,
				default: AiTaskIndicationLayout.bubble
			}
		},
		data() {
			return {
				isOffscreen: false
			};
		},
		computed: {
			operation() {
				return getAiTaskOperation(this.$store, this.message);
			},
			frame() {
				return findAiTaskFrame(this.operation);
			},
			frameName() {
				return this.frame?.name ?? null;
			},
			isCaptionPlace() {
				return isAiTaskCaptionPlace(this.operation, this.message);
			},
			withStatusPlate() {
				return !isAiTaskStatusInTimeRow(this.layout);
			},
			sourceCount() {
				return this.operation?.messageIds.length ?? 0;
			},
			entryAnnouncement() {
				if (this.sourceCount < 2) {
					return this.loc(ENTRY_ANNOUNCEMENT_KEY);
				}
				return main_core.Loc.getMessagePlural(ENTRY_ANNOUNCEMENT_MULTIPLE_KEY, this.sourceCount, {
					'#COUNT#': String(this.sourceCount)
				}) ?? '';
			},
			sourceMark() {
				return this.loc(SOURCE_MARK_KEY);
			},
			decorClasses() {
				const classes = [`--${this.layout}`];
				if (this.frame?.extinguishesDecor) {
					classes.push('--extinguished');
				}
				if (this.isOffscreen) {
					classes.push('--offscreen');
				}
				if (this.isCaptionPlace && this.withStatusPlate) {
					classes.push('--with-status');
				}
				return classes;
			}
		},
		watch: {
			frameName: {
				immediate: true,
				handler(name, previousName) {
					this.announceFrame(previousName ?? null);
				}
			}
		},
		mounted() {
			this.$Bitrix.eventEmitter.subscribe(im_v2_const.EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
			this.$Bitrix.eventEmitter.subscribe(im_v2_const.EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
		},
		beforeUnmount() {
			this.$Bitrix.eventEmitter.unsubscribe(im_v2_const.EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
			this.$Bitrix.eventEmitter.unsubscribe(im_v2_const.EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
			this.reportAnchorVisibility(false);
		},
		methods: {
			onMessageIsVisible(event) {
				this.handleVisibilityEvent(event, true);
			},
			onMessageIsNotVisible(event) {
				this.handleVisibilityEvent(event, false);
			},
			handleVisibilityEvent(event, visible) {
				const messageId = event.getData()?.messageId;
				if (messageId !== this.message.id) {
					return;
				}
				this.isOffscreen = !visible;
				this.reportAnchorVisibility(visible);
			},
			reportAnchorVisibility(visible) {
				if (!this.isCaptionPlace) {
					return;
				}
				if (this.operation?.anchorVisible === visible) {
					return;
				}
				void this.$store.dispatch('aiTask/setAnchorVisibility', {
					chatId: this.message.chatId,
					messageId: this.message.id,
					visible
				});
			},
			announceFrame(previousName) {
				const frame = this.frame;
				if (!frame || !this.isCaptionPlace) {
					return;
				}
				if (frame.isTerminal) {
					ui_a11y.LiveAnnouncer.announce(this.loc(frame.labelKey), frame.politeness);
					return;
				}
				if (previousName) {
					return;
				}
				ui_a11y.LiveAnnouncer.announce(this.entryAnnouncement, frame.politeness);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<template v-if="frame">
			<div
				class="bx-im-message-ai-task__decor"
				:class="decorClasses"
				aria-hidden="true"
				data-testid="im-message-ai-task-indication"
			>
				<div class="bx-im-message-ai-task__wash">
					<div class="bx-im-message-ai-task__wash-core"></div>
				</div>
				<div class="bx-im-message-ai-task__ring">
					<div class="bx-im-message-ai-task__ring-blur">
						<div class="bx-im-message-ai-task__ring-band"></div>
					</div>
				</div>
			</div>
			<visually-hidden>{{ sourceMark }}</visually-hidden>
			<AiTaskStatusRow v-if="withStatusPlate" :message="message" :layout="layout" />
		</template>
	`
	});

	const MessageAttach = ui_vue3.defineComponent({
		name: 'MessageAttach',
		components: {
			Attach: im_v2_component_elements_attach.Attach
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			user() {
				return this.$store.getters['users/get'](this.dialogId, true);
			},
			dialogColor() {
				return this.dialog.type === im_v2_const.ChatType.user ? this.user.color : this.dialog.color;
			}
		},
		created() {
			ui_vue3.provide('message', this.item);
		},
		template: `
		<div v-for="config in item.attach" :key="config.id" class="bx-im-message-attach__container">
			<Attach :baseColor="dialogColor" :config="config" />
		</div>
	`
	});

	const MessageKeyboard = ui_vue3.defineComponent({
		name: 'MessageKeyboard',
		components: {
			Keyboard: im_v2_component_elements_keyboard.Keyboard
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		emits: ['click'],
		computed: {
			message() {
				return this.item;
			},
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			user() {
				return this.$store.getters['users/get'](this.dialogId, true);
			}
		},
		template: `
		<div class="bx-im-message-keyboard__container">
			<Keyboard
				:buttons="message.keyboard"
				:dialogId="dialogId"
				:messageId="message.id"
				@click="$emit('click', $event)"
			/>
		</div>
	`
	});

	const singleFlight = task => {
		let inFlight = null;
		let rerunRequested = false;
		const run = () => {
			if (inFlight) {
				rerunRequested = true;
				return;
			}
			inFlight = (async () => {
				try {
					await task();
				} finally {
					inFlight = null;
					if (rerunRequested) {
						rerunRequested = false;
						run();
					}
				}
			})();
		};
		return run;
	};

	const ChangeStatus = {
		confirmed: 'confirmed',
		pending: 'pending',
		superseded: 'superseded'
	};
	const isKnownReaction = value => main_core.Type.isStringFilled(value) && Object.values(ui_reaction_item.ReactionName).includes(value);
	const isValidPendingChange = value => main_core.Type.isPlainObject(value) && main_core.Type.isStringFilled(value.id) && isKnownReaction(value.value) && isKnownReaction(value.baseValue);
	class MessageDefaultReactionManager {
		static #instance;
		#settingsService = new im_v2_provider_service_settings.SettingsService();
		#operationWaiters = new Map();
		#pendingOperation = null;
		#unsubscribePullStatus = () => {};
		#unsubscribeSettingsUpdate = () => {};
		#inFlightRequest = null;
		#isInitialized = false;
		#generation = 0;
		#serverAlignQueued = false;
		#alignWithServer = singleFlight(() => this.#pullServerValue());
		static getInstance() {
			MessageDefaultReactionManager.#instance ??= new MessageDefaultReactionManager();
			return MessageDefaultReactionManager.#instance;
		}
		init() {
			if (this.#isInitialized) {
				return;
			}
			this.#isInitialized = true;
			this.#pendingOperation = this.#getPendingOperation();
			if (this.#pendingOperation) {
				this.#applyToStore(this.#pendingOperation.value);
				void this.#sync();
			}
			this.#subscribeToPullClient();
		}
		destroy() {
			this.#unsubscribeSettingsUpdate();
			this.#unsubscribeSettingsUpdate = () => {};
			this.#unsubscribePullStatus();
			this.#unsubscribePullStatus = () => {};
			this.#isInitialized = false;
		}
		changeDefaultReaction(reaction) {
			this.init();
			this.#generation += 1;
			const baseValue = this.#supersedePreviousChange();
			const pendingChange = this.#stagePendingChange(reaction, baseValue);
			const result = this.#registerWaiter(pendingChange.id);
			this.#applyToStore(reaction);
			if (im_v2_application_core.Core.isOnline()) {
				void this.#sync();
			} else {
				this.#resolveWaiter(pendingChange.id, {
					status: ChangeStatus.pending
				});
			}
			return result;
		}
		#applyToStore(reaction) {
			void im_v2_application_core.Core.getStore().dispatch('application/settings/set', {
				[im_v2_const.Settings.message.defaultReaction]: reaction
			});
		}
		#supersedePreviousChange() {
			const previous = this.#pendingOperation;
			if (previous) {
				this.#resolveWaiter(previous.id, {
					status: ChangeStatus.superseded
				});
			}
			return previous?.baseValue ?? im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.message.defaultReaction);
		}
		#stagePendingChange(reaction, baseValue) {
			const pendingChange = {
				id: main_core.Text.getRandom(16),
				value: reaction,
				baseValue
			};
			this.#pendingOperation = pendingChange;
			this.#savePendingOperation();
			return pendingChange;
		}
		#registerWaiter(id) {
			return new Promise((resolve, reject) => {
				this.#operationWaiters.set(id, {
					resolve,
					reject
				});
			});
		}
		onDefaultReactionPull(reaction) {
			this.init();
			if (this.#pendingOperation || this.#inFlightRequest) {
				this.#serverAlignQueued = true;
				if (this.#pendingOperation) {
					this.#applyToStore(this.#pendingOperation.value);
				}
				return;
			}
			this.#generation += 1;
			this.#serverAlignQueued = false;
			this.#applyToStore(reaction);
		}
		onOnline() {
			void this.#sync();
		}
		#getPendingOperation() {
			let pending = null;
			try {
				pending = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.defaultReactionPending);
			} catch {
				return null;
			}
			if (!isValidPendingChange(pending)) {
				im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(im_v2_const.LocalStorageKey.defaultReactionPending);
				return null;
			}
			return pending;
		}
		#subscribeToPullClient() {
			const pullClient = im_v2_application_core.Core.getPullClient();
			if (!pullClient) {
				return;
			}
			this.#unsubscribePullStatus();
			this.#unsubscribeSettingsUpdate();
			this.#unsubscribePullStatus = pullClient.subscribe({
				type: pull_client.PullClient.SubscriptionType.Status,
				callback: ({
					status
				}) => {
					if (status === pull_client.PullClient.PullStatus.Online) {
						this.onOnline();
					}
				}
			});
			this.#unsubscribeSettingsUpdate = pullClient.subscribe({
				type: pull_client.PullClient.SubscriptionType.Server,
				moduleId: 'im',
				command: 'settingsUpdate',
				callback: params => {
					if (!main_core.Type.isPlainObject(params)) {
						return;
					}
					const reaction = params[im_v2_const.Settings.message.defaultReaction];
					if (!isKnownReaction(reaction)) {
						return;
					}
					this.onDefaultReactionPull(reaction);
				}
			});
		}
		async #pullServerValue() {
			if (this.#pendingOperation || this.#inFlightRequest) {
				return;
			}
			const generation = ++this.#generation;
			let defaultReaction = '';
			try {
				defaultReaction = await this.#settingsService.getDefaultReaction();
			} catch {
				return;
			}
			if (generation !== this.#generation || this.#pendingOperation || this.#inFlightRequest) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('application/settings/set', {
				[im_v2_const.Settings.message.defaultReaction]: defaultReaction
			});
		}
		#savePendingOperation() {
			im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.defaultReactionPending, this.#pendingOperation);
		}
		#resolveWaiter(operationId, result) {
			const waiter = this.#operationWaiters.get(operationId);
			if (!waiter) {
				return;
			}
			this.#operationWaiters.delete(operationId);
			waiter.resolve(result);
		}
		#rejectWaiter(operationId, error) {
			const waiter = this.#operationWaiters.get(operationId);
			if (!waiter) {
				return false;
			}
			this.#operationWaiters.delete(operationId);
			waiter.reject(error);
			return true;
		}
		async #sync() {
			if (!this.#pendingOperation || this.#inFlightRequest) {
				return;
			}
			if (!im_v2_application_core.Core.isOnline()) {
				this.#resolveWaiter(this.#pendingOperation.id, {
					status: ChangeStatus.pending
				});
				return;
			}
			const operation = this.#pendingOperation;
			this.#inFlightRequest = this.#settingsService.updateDefaultReaction(operation.value);
			try {
				await this.#inFlightRequest;
				this.#handleSuccess(operation);
			} catch (error) {
				if (!im_v2_application_core.Core.isOnline()) {
					this.#resolveWaiter(operation.id, {
						status: ChangeStatus.pending
					});
					return;
				}
				await this.#finalizeFailure(operation, error);
			} finally {
				this.#inFlightRequest = null;
				if (this.#pendingOperation && this.#pendingOperation.id !== operation.id) {
					void this.#sync();
				} else if (!this.#pendingOperation && this.#serverAlignQueued) {
					this.#serverAlignQueued = false;
					this.#alignWithServer();
				}
			}
		}
		#handleSuccess(operation) {
			if (!this.#pendingOperation) {
				return;
			}
			if (this.#pendingOperation?.id !== operation.id) {
				this.#pendingOperation.baseValue = operation.value;
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.defaultReactionPending, this.#pendingOperation);
				return;
			}
			this.#pendingOperation = null;
			this.#resolveWaiter(operation.id, {
				status: ChangeStatus.confirmed
			});
			im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(im_v2_const.LocalStorageKey.defaultReactionPending);
		}
		async #finalizeFailure(operation, error) {
			if (operation.id !== this.#pendingOperation?.id) {
				return;
			}
			const generation = ++this.#generation;
			let confirmedReaction = operation.baseValue;
			try {
				confirmedReaction = await this.#settingsService.getDefaultReaction();
			} catch {
				confirmedReaction = operation.baseValue;
			}
			if (operation.id !== this.#pendingOperation?.id || generation !== this.#generation) {
				return;
			}
			this.#pendingOperation = null;
			im_v2_lib_localStorage.LocalStorageManager.getInstance().remove(im_v2_const.LocalStorageKey.defaultReactionPending);
			void im_v2_application_core.Core.getStore().dispatch('application/settings/set', {
				[im_v2_const.Settings.message.defaultReaction]: confirmedReaction
			});
			if (!this.#rejectWaiter(operation.id, error)) {
				im_v2_lib_notifier.Notifier.onDefaultError();
			}
		}
	}

	class ReactionService {
		setReaction(messageId, reaction) {
			im_v2_lib_logger.Logger.warn('ReactionService: setReaction', messageId, reaction);
			const payload = {
				data: {
					messageId,
					reaction
				}
			};
			void im_v2_application_core.Core.getStore().dispatch('messages/reactions/setReaction', {
				messageId,
				reaction,
				userId: im_v2_application_core.Core.getUserId()
			});
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageReactionAdd, payload).catch(([error]) => {
				console.error('ReactionService: error setting reaction', error);
			});
		}
		removeReaction(messageId, reaction) {
			im_v2_lib_logger.Logger.warn('ReactionService: removeReaction', messageId, reaction);
			const payload = {
				data: {
					messageId,
					reaction
				}
			};
			void im_v2_application_core.Core.getStore().dispatch('messages/reactions/removeReaction', {
				messageId,
				reaction,
				userId: im_v2_application_core.Core.getUserId()
			});
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageReactionDelete, payload).catch(([error]) => {
				console.error('ReactionService: error removing reaction', error);
			});
		}
	}

	const ReactionUser = ui_vue3.defineComponent({
		name: 'ReactionUser',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar
		},
		props: {
			userId: {
				type: Number,
				required: true
			}
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			user() {
				return this.$store.getters['users/get'](this.userId);
			},
			avatarStyle() {
				if (!this.user.avatar) {
					return {};
				}
				return {
					backgroundImage: `url('${this.user.avatar}')`
				};
			}
		},
		template: `
		<div class="bx-im-reaction-list__user_avatar">
			<ChatAvatar 
				:avatarDialogId="userId" 
				:size="AvatarSize.XS" 
				:withAvatarLetters="false"
				:withTooltip="false"
			/>
		</div>
	`
	});

	class UserService extends im_v2_provider_service_user.BaseUserService {
		#reaction;
		constructor(reaction) {
			super();
			this.#reaction = reaction;
		}
		getRequestFilter(firstPage = false) {
			return {
				...super.getRequestFilter(firstPage),
				reaction: this.#reaction
			};
		}
		getRestMethodName() {
			return im_v2_const.RestMethod.imV2ChatMessageReactionTail;
		}
		getLastId(result) {
			const {
				reactions
			} = result;
			if (!reactions || reactions.length === 0) {
				return 0;
			}
			const sortedReactions = [...reactions].sort((a, b) => b.id - a.id);
			return sortedReactions[sortedReactions.length - 1].id;
		}
	}

	const AdditionalUsers = ui_vue3.defineComponent({
		components: {
			UserListPopup: im_v2_component_elements_userListPopup.UserListPopup
		},
		props: {
			messageId: {
				type: [String, Number],
				required: true
			},
			reaction: {
				type: String,
				required: true
			},
			show: {
				type: Boolean,
				required: true
			},
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				userService: null
			};
		},
		data() {
			return {
				showPopup: false,
				loadingAdditionalUsers: false,
				additionalUsers: []
			};
		},
		watch: {
			show(newValue, oldValue) {
				if (!oldValue && newValue) {
					this.showPopup = true;
					this.loadUsers();
				}
			}
		},
		methods: {
			async loadUsers() {
				this.loadingAdditionalUsers = true;
				try {
					this.additionalUsers = await this.getUserService().loadFirstPage(this.messageId);
					this.loadingAdditionalUsers = false;
				} catch {
					this.loadingAdditionalUsers = false;
				}
			},
			async onScroll(event) {
				if (!im_v2_lib_utils.Utils.dom.isOneScreenRemaining(event.target) || !this.getUserService().hasMoreItemsToLoad()) {
					return;
				}
				const userIds = await this.getUserService().loadNextPage(this.messageId);
				if (!userIds) {
					return;
				}
				this.additionalUsers = [...this.additionalUsers, ...userIds];
			},
			onPopupClose() {
				this.showPopup = false;
				this.$emit('close');
			},
			prepareAdditionalUsers(userIds) {
				const firstViewerId = this.dialog.lastMessageViews.firstViewer.userId;
				return userIds.filter(userId => {
					return userId !== im_v2_application_core.Core.getUserId() && userId !== firstViewerId;
				});
			},
			getUserService() {
				if (!this.userService) {
					this.userService = new UserService(this.reaction);
				}
				return this.userService;
			}
		},
		template: `
		<UserListPopup
			id="bx-im-message-reaction-users"
			:showPopup="showPopup"
			:loading="loadingAdditionalUsers"
			:userIds="additionalUsers"
			:bindElement="bindElement || {}"
			:withAngle="false"
			:offsetLeft="-112"
			:forceTop="true"
			@close="onPopupClose"
			@scroll="onScroll"
		/>
	`
	});

	const USERS_TO_SHOW = 5;
	const REACTION_SIZE = 16;
	const SHOW_USERS_DELAY = 500;
	const ReactionItem = ui_vue3.defineComponent({
		components: {
			ReactionUser,
			AdditionalUsers,
			Reaction: ui_reaction_item_vue.Reaction
		},
		props: {
			messageId: {
				type: [String, Number],
				required: true
			},
			type: {
				type: String,
				required: true
			},
			counter: {
				type: Number,
				required: true
			},
			users: {
				type: Array,
				required: true
			},
			selected: {
				type: Boolean,
				required: true
			},
			animate: {
				type: Boolean,
				required: true
			},
			showAvatars: {
				type: Boolean,
				required: false,
				default: true
			}
		},
		emits: ['click', 'animationFinish'],
		setup() {
			return {
				showUsersTimeout: 0
			};
		},
		data() {
			return {
				showAdditionalUsers: false
			};
		},
		computed: {
			REACTION_SIZE: () => REACTION_SIZE,
			needToShowUsers() {
				if (!this.showAvatars) {
					return false;
				}
				const userLimitIsNotReached = this.counter <= USERS_TO_SHOW;
				const weHaveUsersData = this.counter === this.users.length;
				return userLimitIsNotReached && weHaveUsersData;
			},
			preparedUsers() {
				return [...this.users].sort((a, b) => b - a);
			}
		},
		methods: {
			startShowUsersTimer() {
				this.showUsersTimeout = setTimeout(() => {
					this.showAdditionalUsers = true;
				}, SHOW_USERS_DELAY);
			},
			clearShowUsersTimer() {
				clearTimeout(this.showUsersTimeout);
			},
			onClick() {
				this.clearShowUsersTimer();
				this.$emit('click');
			}
		},
		template: `
		<div
			@click="onClick" 
			@mouseenter="startShowUsersTimer"
			@mouseleave="clearShowUsersTimer"
			class="bx-im-reaction-list__item"
			:class="{'--selected': selected}"
		>
			<div class="bx-im-reaction-list__item_icon">
				<Reaction
					:size="REACTION_SIZE"
					:name="type"
					:animate="animate"
					@animationFinish="$emit('animationFinish')"
				/>
			</div>
			<div v-if="needToShowUsers" class="bx-im-reaction-list__user_container" ref="users">
				<TransitionGroup name="bx-im-reaction-list__user_animation">
					<ReactionUser 
						v-for="user in preparedUsers" 
						:key="type + user" 
						:userId="user"
					/>
				</TransitionGroup>
			</div>
			<div v-else class="bx-im-reaction-list__item_counter" ref="counter">{{ counter }}</div>
			<AdditionalUsers
				:show="showAdditionalUsers"
				:bindElement="$refs['users'] || $refs['counter'] || {}"
				:messageId="messageId"
				:reaction="type"
				@close="showAdditionalUsers = false"
			/>
		</div>
	`
	});

	const ReactionList = ui_vue3.defineComponent({
		name: 'ReactionList',
		components: {
			ReactionItem
		},
		props: {
			messageId: {
				type: [String, Number],
				required: true
			}
		},
		setup() {
			return {
				reactionService: null
			};
		},
		data() {
			return {
				reactionsToAnimate: new Set()
			};
		},
		computed: {
			message() {
				return this.$store.getters['messages/getById'](this.messageId);
			},
			dialog() {
				return this.$store.getters['chats/getByChatId'](this.message.chatId);
			},
			reactionsData() {
				return this.$store.getters['messages/reactions/getByMessageId'](this.messageId);
			},
			reactionCounters() {
				return this.reactionsData?.reactionCounters ?? {};
			},
			ownReactions() {
				return this.reactionsData?.ownReactions ?? new Set();
			},
			reactionListToShow() {
				return Object.keys(ui_reaction_item.ReactionName).filter(reaction => {
					return Boolean(this.reactionCounters[reaction]);
				});
			},
			needToShowReactionsContainer() {
				return Object.keys(this.reactionCounters).length > 0;
			},
			isChannel() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialog.dialogId);
			},
			showAvatars() {
				return !this.isChannel;
			}
		},
		watch: {
			reactionCounters(newCounters, oldCounters) {
				const newReactions = Object.keys(newCounters);
				const oldReactions = Object.keys(oldCounters);
				for (const reaction of newReactions) {
					if (!oldReactions.includes(reaction)) {
						this.reactionsToAnimate.add(reaction);
					}
				}
			},
			needToShowReactionsContainer(newValue, oldValue) {
				if (!oldValue && newValue) {
					main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.scrollToBottom, {
						chatId: this.message.chatId,
						threshold: im_v2_const.DialogScrollThreshold.nearTheBottom,
						animation: false
					});
				}
			}
		},
		mounted() {
			const MAX_LISTENERS = 500;
			this.getEmitter().setMaxListeners(im_v2_const.EventType.reaction.onReactionSelected, MAX_LISTENERS);
			this.getEmitter().subscribe(im_v2_const.EventType.reaction.onReactionSelected, this.onPickerReactionSelected);
		},
		beforeUnmount() {
			this.getEmitter().unsubscribe(im_v2_const.EventType.reaction.onReactionSelected, this.onPickerReactionSelected);
		},
		methods: {
			onReactionClick(reaction) {
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				if (!permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.setReaction, this.dialog.dialogId)) {
					return;
				}
				if (this.ownReactions.has(reaction)) {
					this.getReactionService().removeReaction(this.messageId, reaction);
					return;
				}
				this.reactionsToAnimate.add(reaction);
				this.getReactionService().setReaction(this.messageId, reaction);
			},
			async onPickerReactionSelected(event) {
				const {
					messageId,
					reaction
				} = event.getData();
				if (this.messageId !== messageId) {
					return;
				}
				this.onReactionClick(reaction);
			},
			getReactionUsers(reaction) {
				const users = this.reactionsData.reactionUsers[reaction];
				if (!users) {
					return [];
				}
				return [...users];
			},
			getReactionService() {
				if (!this.reactionService) {
					this.reactionService = new ReactionService();
				}
				return this.reactionService;
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div v-if="needToShowReactionsContainer" class="bx-im-reaction-list__container bx-im-reaction-list__scope">
			<ReactionItem
				v-for="reactionType in reactionListToShow"
				:key="reactionType + messageId"
				:messageId="messageId"
				:type="reactionType"
				:counter="reactionCounters[reactionType]"
				:users="getReactionUsers(reactionType)"
				:selected="ownReactions.has(reactionType)"
				:animate="reactionsToAnimate.has(reactionType)"
				:showAvatars="showAvatars"
				@click="onReactionClick(reactionType)"
				@animationFinish="reactionsToAnimate.delete(reactionType)"
			/>
		</div>
	`
	});

	const POPUP_OFFSET_LEFT = 40;
	const MainReactionOnboarding = ui_vue3.defineComponent({
		name: 'MainReactionOnboarding',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			geometry: {
				type: Object,
				default: null
			},
			messageId: {
				type: [String, Number],
				required: true
			}
		},
		emits: ['mouseEnter', 'mouseLeave'],
		data() {
			return {
				isClosed: false,
				isDisplayConfirmed: false
			};
		},
		computed: {
			closeIcon() {
				return ui_iconSet_api_vue.Outline.CROSS_M;
			},
			isVisible() {
				return this.geometry !== null && !this.isClosed && (this.isDisplayConfirmed || im_v2_lib_promo.PromoManager.getInstance().needToShow(im_v2_const.PromoId.mainReactionOnboarding));
			},
			popupId() {
				return `im-main-reaction-onboarding-popup-${this.messageId}`;
			},
			position() {
				const {
					popoverRect,
					selectorRect
				} = this.geometry;
				return popoverRect.bottom <= selectorRect.top ? 'top' : 'bottom';
			},
			width() {
				return this.geometry.popoverRect.width;
			},
			config() {
				return {
					bindElement: this.geometry.popoverRect,
					bindOptions: {
						position: this.position
					},
					width: this.width,
					...(this.position === 'top' ? {
						offsetTop: 0
					} : {}),
					offsetLeft: POPUP_OFFSET_LEFT,
					angle: true,
					autoHide: true,
					className: 'bx-im-main-reaction-onboarding-popup'
				};
			}
		},
		watch: {
			isVisible(isVisible) {
				if (isVisible && !this.isDisplayConfirmed) {
					void this.confirmDisplay();
				}
			},
			geometry(newGeometry) {
				if (newGeometry) {
					this.isClosed = false;
					this.isDisplayConfirmed = false;
				}
			}
		},
		methods: {
			async confirmDisplay() {
				await ui_vue3.nextTick();
				await new Promise(resolve => {
					requestAnimationFrame(resolve);
				});
				const content = this.$refs.content;
				if (!this.isVisible || !content?.isConnected) {
					return;
				}
				this.isDisplayConfirmed = im_v2_lib_promo.PromoManager.getInstance().confirmShown(im_v2_const.PromoId.mainReactionOnboarding);
				if (!this.isDisplayConfirmed) {
					this.isClosed = true;
				}
			},
			close() {
				this.isClosed = true;
			},
			complete() {
				this.isClosed = true;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<MessengerPopup
			v-if="isVisible"
			:id="popupId"
			:config="config"
			@close="close"
		>
			<div
				ref="content"
				class="bx-im-main-reaction-onboarding-popup__container --ui-context-content-light"
				data-testid="im-message-main-reaction-onboarding"
				@mouseenter="$emit('mouseEnter')"
				@mouseleave="$emit('mouseLeave')"
			>
				<div class="bx-im-main-reaction-onboarding-popup__content">
					<div class="bx-im-main-reaction-onboarding-popup__content-title">
						{{ loc('IM_MESSENGER_MESSAGE_REACTION_SELECTOR_MAIN_REACTION_ONBOARDING-PART1') }}
					</div>
					<div class="bx-im-main-reaction-onboarding-popup__content-description">
						{{ loc('IM_MESSENGER_MESSAGE_REACTION_SELECTOR_MAIN_REACTION_ONBOARDING-PART2') }}
					</div>
				</div>
				<button
					type="button"
					class="bx-im-main-reaction-onboarding-popup__close"
					data-testid="im-message-main-reaction-onboarding-close"
					@click="complete"
				>
					<BIcon
						:name="closeIcon"
						color="var(--ui-color-accent-main-primary-alt-2)"
					/>
				</button>
			</div>
		</MessengerPopup>
	`
	});

	const SHOW_DELAY = 250;
	const HIDE_DELAY$1 = 500;
	const ReactionSelector = ui_vue3.defineComponent({
		name: 'ReactionSelector',
		components: {
			MainReactionOnboarding,
			Reaction: ui_reaction_item_vue.Reaction
		},
		props: {
			messageId: {
				type: [String, Number],
				required: true
			}
		},
		setup() {
			return {
				picker: null,
				showTimeout: 0,
				hideTimeout: 0
			};
		},
		data() {
			return {
				mainReactionOnboardingGeometry: null
			};
		},
		computed: {
			message() {
				return this.$store.getters['messages/getById'](this.messageId);
			},
			dialog() {
				return this.$store.getters['chats/getByChatId'](this.message.chatId);
			},
			currentReaction() {
				const mainReaction = this.$store.getters['application/settings/get'](im_v2_const.Settings.message.defaultReaction);
				if (main_core.Type.isStringFilled(mainReaction)) {
					return mainReaction;
				}
				return ui_reaction_item.ReactionName.like;
			},
			isChatWithBot() {
				const user = this.$store.getters['users/get'](this.dialog.dialogId);
				return user?.type === im_v2_const.UserType.bot;
			},
			areBotReactionsEnabled() {
				const bot = this.$store.getters['users/bots/getByUserId'](this.message.authorId);
				if (!bot) {
					return false;
				}
				return bot.reactionsEnabled;
			},
			hasError() {
				return this.message.error;
			},
			isRealMessage() {
				return this.$store.getters['messages/isRealMessage'](this.messageId);
			},
			canSetReactions() {
				if (!this.isRealMessage || !this.canSetReactionsByRole || this.hasError) {
					return false;
				}
				if (this.isChatWithBot) {
					return this.areBotReactionsEnabled;
				}
				return true;
			},
			canSetReactionsByRole() {
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.setReaction, this.dialog.dialogId);
			}
		},
		created() {
			MessageDefaultReactionManager.getInstance().init();
		},
		beforeUnmount() {
			clearTimeout(this.showTimeout);
			this.clearHideTimer();
			this.picker?.hide();
		},
		methods: {
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			startShowTimer() {
				this.clearHideTimer();
				if (this.picker?.isShown()) {
					return;
				}
				this.showTimeout = setTimeout(() => {
					this.showSelector();
				}, SHOW_DELAY);
			},
			clearShowTimer() {
				clearTimeout(this.showTimeout);
				if (!this.picker?.isShown()) {
					this.mainReactionOnboardingGeometry = null;
				}
				this.startHideTimer();
			},
			showSelector() {
				this.picker = new ui_reaction_picker.ReactionPicker({
					target: this.$refs.selector,
					priorityReaction: this.currentReaction,
					contextAction: {
						title: this.loc('IM_MESSENGER_MESSAGE_REACTION_SELECTOR_MAIN_REACTION'),
						onClick: reaction => this.setMainReaction(reaction)
					}
				});
				this.subscribeToSelectorEvents();
				this.picker.show();
			},
			async setMainReaction(reaction) {
				const isMainReactionChanged = reaction !== this.currentReaction;
				try {
					const result = await MessageDefaultReactionManager.getInstance().changeDefaultReaction(reaction);
					const isSavedOrPending = result.status === ChangeStatus.confirmed || result.status === ChangeStatus.pending;
					if (isMainReactionChanged && isSavedOrPending) {
						im_v2_lib_notifier.Notifier.message.onSelectMainReaction();
					}
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
				}
			},
			subscribeToSelectorEvents() {
				this.picker.subscribe('select', this.onSelectorSelect);
				this.picker.subscribe('mouseleave', this.startHideTimer);
				this.picker.subscribe('mouseenter', this.clearHideTimer);
				this.picker.subscribe('expand', this.onSelectorExpand);
				this.picker.subscribe('hide', this.onSelectorHide);
			},
			onSelectorSelect(selectEvent) {
				const {
					reaction
				} = selectEvent.getData();
				this.getEmitter().emit(im_v2_const.EventType.reaction.onReactionSelected, {
					messageId: this.messageId,
					reaction
				});
				this.picker?.hide();
			},
			onSelectorExpand() {
				const popoverRect = this.picker?.getPopoverRect();
				if (!popoverRect) {
					return;
				}
				const selectorRect = main_core.Dom.getPosition(this.$refs.selector);
				this.mainReactionOnboardingGeometry = {
					popoverRect,
					selectorRect
				};
			},
			onSelectorHide() {
				clearTimeout(this.hideTimeout);
				this.mainReactionOnboardingGeometry = null;
				this.picker = null;
			},
			startHideTimer() {
				this.hideTimeout = setTimeout(() => {
					this.picker?.hide();
				}, HIDE_DELAY$1);
			},
			clearHideTimer() {
				clearTimeout(this.hideTimeout);
			},
			onIconClick() {
				this.clearShowTimer();
				this.getEmitter().emit(im_v2_const.EventType.reaction.onReactionSelected, {
					messageId: this.messageId,
					reaction: this.currentReaction
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div
			v-if="canSetReactions"
			class="bx-im-reaction-selector__container"
			data-testid="im-message-reaction-selector"
		>
			<div
				@click="onIconClick"
				@mouseenter="startShowTimer"
				@mouseleave="clearShowTimer"
				class="bx-im-reaction-selector__selector"
				ref="selector"
				data-testid="im-message-reaction-selector-trigger"
			>
				<Reaction
					class="bx-im-reaction-selector__icon"
					:key="currentReaction"
					:name="currentReaction"
				>
				</Reaction>
			</div>
			<MainReactionOnboarding
				:geometry="mainReactionOnboardingGeometry"
				:message-id="messageId"
				@mouseEnter="clearHideTimer"
				@mouseLeave="startHideTimer"
			/>
		</div>
	`
	});

	const NO_CONTEXT_TAG = 'none';
	const NAME_MAX_LENGTH = 40;
	const GALLERY_STACK_MAX = 3;
	const Reply = ui_vue3.defineComponent({
		name: 'ReplyComponent',
		components: {
			BaseUiAvatar: im_v2_component_elements_avatar.BaseUiAvatar
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			replyId: {
				type: Number,
				required: true
			},
			isForward: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				isExpanded: false,
				isExpandable: false
			};
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			replyMessage() {
				return this.$store.getters['messages/getById'](this.replyId);
			},
			replyMessageChat() {
				return this.$store.getters['chats/getByChatId'](this.replyMessage?.chatId);
			},
			replyAuthor() {
				return this.$store.getters['users/get'](this.replyMessage.authorId);
			},
			replyTitle() {
				return this.replyAuthor ? this.replyAuthor.name : this.loc('IM_DIALOG_CHAT_QUOTE_DEFAULT_TITLE');
			},
			messageFiles() {
				if (!this.replyMessage) {
					return [];
				}
				return this.$store.getters['messages/getMessageFiles'](this.replyMessage.id);
			},
			messageFile() {
				if (this.isContactMessage) {
					return this.messageFiles.find(file => file.type === im_v2_const.FileType.image) ?? null;
				}
				return this.messageFiles[0] ?? null;
			},
			contactAvatarTitle() {
				const params = this.replyMessage?.componentParams ?? {};
				const name = [params.lastName, params.firstName].filter(Boolean).join(' ').trim();
				const phone = params.phones?.[0] ?? '';
				return name || phone;
			},
			contactAvatarUrl() {
				return this.messageFile?.mediaUrl?.preview?.[250] || this.messageFile?.urlPreview || this.messageFile?.urlShow || '';
			},
			isImage() {
				return Boolean(this.messageFile && this.messageFile.type === im_v2_const.FileType.image);
			},
			isVideo() {
				return Boolean(this.messageFile && this.messageFile.type === im_v2_const.FileType.video);
			},
			isVideoNote() {
				return Boolean(this.messageFile && this.messageFile.isVideoNote);
			},
			isFile() {
				return Boolean(this.messageFile && this.messageFile.type === im_v2_const.FileType.file);
			},
			isAudio() {
				return Boolean(this.messageFile && this.messageFile.type === im_v2_const.FileType.audio);
			},
			isSticker() {
				if (!this.replyMessage) {
					return false;
				}
				return this.$store.getters['stickers/messages/isSticker'](this.replyMessage.id);
			},
			stickerImageUri() {
				if (!this.replyMessage || !this.isSticker) {
					return null;
				}
				const stickerId = this.$store.getters['stickers/messages/getStickerByMessageId'](this.replyMessage.id);
				const sticker = this.$store.getters['stickers/get'](stickerId);
				return sticker?.uri ?? null;
			},
			galleryCount() {
				return this.messageFiles.length;
			},
			galleryThumbnails() {
				return this.messageFiles.slice(0, GALLERY_STACK_MAX);
			},
			galleryRemainingCount() {
				return Math.max(this.galleryCount - this.galleryThumbnails.length, 0);
			},
			galleryStackModifier() {
				return `--count-${this.galleryThumbnails.length}`;
			},
			isGallery() {
				return !this.isContactMessage && (this.isImage || this.isVideo) && this.galleryCount > 1 && !this.isDeleted;
			},
			showGalleryStack() {
				return this.isGallery && !this.showIcon;
			},
			mediaCountText() {
				return main_core.Loc.getMessagePlural('IM_MESSAGE_REPLY_MEDIA_COUNT', this.galleryCount, {
					'#COUNT#': String(this.galleryCount)
				}) ?? '';
			},
			showIcon() {
				if (this.isContactMessage) {
					return false;
				}
				if (!this.messageFile) {
					return false;
				}
				return !this.messageFile.urlPreview;
			},
			truncatedFileName() {
				if (!this.messageFile?.name) {
					return '';
				}
				return im_v2_lib_utils.Utils.file.getShortFileName(this.messageFile.name, NAME_MAX_LENGTH);
			},
			iconClass() {
				if (!this.messageFile?.name) {
					return 'ui-icon-file-file';
				}
				const iconType = im_v2_lib_utils.Utils.file.getIconTypeByFilename(this.messageFile.name);
				return `ui-icon-file-${iconType}`;
			},
			fileSize() {
				if (!this.messageFile?.size) {
					return '';
				}
				return im_v2_lib_utils.Utils.file.formatFileSize(this.messageFile.size);
			},
			isMessageDeleted() {
				return Boolean(this.replyMessage?.isDeleted);
			},
			replyText() {
				if (!this.replyMessage) {
					return '';
				}
				if (this.isContactMessage) {
					const contactText = im_v2_lib_parser.Parser.getContactPreviewText(this.replyMessage, true);
					if (contactText !== null) {
						return im_v2_lib_parser.Parser.decodeText(contactText);
					}
				}
				let text = im_v2_lib_parser.Parser.prepareQuote(this.replyMessage);
				text = im_v2_lib_parser.Parser.decodeText(text);
				return text;
			},
			isQuoteFromTheSameChat() {
				return this.replyMessage?.chatId === this.dialog.chatId;
			},
			replyContext() {
				if (!this.isQuoteFromTheSameChat) {
					return NO_CONTEXT_TAG;
				}
				if (!this.isForward) {
					return `${this.dialogId}/${this.replyId}`;
				}
				return `${this.replyMessageChat.dialogId}/${this.replyId}`;
			},
			canShowReply() {
				return this.replyId !== 0;
			},
			isActiveQuote() {
				return this.replyContext !== NO_CONTEXT_TAG;
			},
			quoteClasses() {
				return {
					'--expanded': this.isExpanded,
					'--collapsed': !this.isExpanded,
					'--clickable': this.isActiveQuote || this.isExpandable,
					'--contact-message': this.useCompactContactLayout
				};
			},
			toggleLabel() {
				return this.isExpanded ? this.loc('IM_PARSER_QUOTE_COLLAPSE') : this.loc('IM_PARSER_QUOTE_EXPAND');
			},
			isUnavailable() {
				return main_core.Type.isNil(this.replyMessage);
			},
			hasOriginal() {
				return !main_core.Type.isNil(this.replyMessage) && !this.isMessageDeleted;
			},
			isDeleted() {
				return !main_core.Type.isNil(this.replyMessage) && this.isMessageDeleted;
			},
			showMediaPreview() {
				return this.hasOriginal && Boolean(this.isContactMessage || this.messageFile || this.isSticker);
			},
			useCompactContactLayout() {
				return this.isContactMessage;
			},
			isContactMessage() {
				return this.replyMessage?.componentId === im_v2_const.MessageComponent.contactMessage;
			},
			showVideoNoteTypeLabel() {
				return this.isVideoNote && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isVideoNoteCaptionAvailable);
			},
			previewText() {
				if (this.isContactMessage) {
					return this.replyText;
				}
				if (!this.showVideoNoteTypeLabel && (this.isImage || this.isVideo) && !this.showIcon) {
					const caption = im_v2_lib_parser.Parser.purify({
						text: this.replyMessage?.text ?? ''
					});
					return im_v2_lib_parser.Parser.decodeText(caption);
				}
				if (this.isSticker && this.stickerImageUri) {
					return '';
				}
				if (this.isFile) {
					const caption = im_v2_lib_parser.Parser.purify({
						text: this.replyMessage?.text ?? ''
					});
					return im_v2_lib_parser.Parser.decodeText(caption);
				}
				return this.replyText;
			}
		},
		watch: {
			replyText() {
				void this.updateToggleAvailability();
			}
		},
		mounted() {
			void this.updateToggleAvailability();
		},
		methods: {
			toggleExpanded() {
				if (!this.isExpandable) {
					return;
				}
				this.isExpanded = !this.isExpanded;
			},
			async updateToggleAvailability() {
				await this.$nextTick();
				const textNode = this.$refs.text;
				if (!textNode) {
					return;
				}
				const isOverflowing = textNode.scrollHeight > textNode.clientHeight + 1;
				this.isExpandable = isOverflowing;
				if (!isOverflowing) {
					this.isExpanded = false;
				}
			},
			hasSelectedText() {
				const selection = window.getSelection().toString().trim();
				return main_core.Type.isStringFilled(selection);
			},
			hasPreview(file) {
				return main_core.Type.isStringFilled(file.urlPreview);
			},
			onQuoteClick(event) {
				const isInteractiveClick = event.target instanceof HTMLElement && event.target.closest('a');
				if (isInteractiveClick) {
					event.stopPropagation();
					return;
				}
				if (this.hasSelectedText()) {
					event.stopPropagation();
					return;
				}
				if (this.isActiveQuote || !this.isExpandable) {
					return;
				}
				this.toggleExpanded();
			},
			onNavigateToOriginal() {
				if (!this.isActiveQuote) {
					return;
				}
				const [dialogId, messageId] = this.replyContext.split('/');
				this.$Bitrix.eventEmitter.emit(im_v2_const.EventType.dialog.goToMessageContext, {
					messageId: Number.parseInt(messageId, 10),
					dialogId: dialogId.toString()
				});
			},
			onQuoteKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.onNavigateToOriginal();
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div
			v-if="canShowReply"
			class="bx-im-message-quote --reply"
			:class="quoteClasses"
			:data-context="replyContext"
			data-testid="im-message-reply-root"
			@click="onQuoteClick"
		>
			<div class="bx-im-message-quote__wrap">
				<div
					class="bx-im-message-quote__name"
					:tabindex="isActiveQuote ? 0 : -1"
					:role="isActiveQuote ? 'button' : undefined"
					:aria-label="isActiveQuote ? loc('IM_MESSAGE_REPLY_GO_TO_ORIGINAL') : undefined"
					data-testid="im-message-reply-navigate-btn"
					@keydown="isActiveQuote ? onQuoteKeydown($event) : undefined"
				>
					<div class="bx-im-message-quote__name-text">{{ replyTitle }}</div>
				</div>

				<!-- Original is inaccessible to the current user (server did not bundle it) -->
				<div v-if="isUnavailable" class="bx-im-message-quote__text" data-testid="im-message-reply-state-unavailable">{{ loc('IM_MESSAGE_REPLY_UNAVAILABLE') }}</div>

				<!-- Original is deleted -->
				<div v-else-if="isDeleted" ref="text" class="bx-im-message-quote__text" data-testid="im-message-reply-state-deleted" v-html="replyText"></div>

				<!-- Original with media preview -->
				<template v-else-if="showMediaPreview">
					<!-- Visual preview (file chip / thumbnail / icon / sticker) -->
					<div
							class="bx-im-message-quote__preview"
							:class="{ 'bx-im-message-quote__preview--media-offset': isFile || showGalleryStack }"
							data-testid="im-message-reply-preview"
						>
						<!-- File: file-type icon + name + size chip -->
						<template v-if="isContactMessage">
							<div class="bx-im-message-quote__contact-avatar" data-testid="im-message-reply-contact-avatar">
								<BaseUiAvatar
									type="default"
									:size="AvatarSize.L"
									:url="contactAvatarUrl"
									:title="contactAvatarTitle"
									:withDefaultUserpic="false"
								/>
							</div>
						</template>

						<!-- File: file-type icon + name + size chip -->
						<template v-else-if="isFile">
							<div class="bx-im-message-quote__file-icon" data-testid="im-message-reply-file-icon">
								<div :class="iconClass" class="ui-icon" aria-hidden="true"><i></i></div>
							</div>
							<div class="bx-im-message-quote__file-caption">
								<span class="bx-im-message-quote__file-name" data-testid="im-message-reply-file-name">{{ truncatedFileName }}</span>
								<span
									v-if="fileSize"
									class="bx-im-message-quote__file-size"
									data-testid="im-message-reply-file-size"
								>{{ fileSize }}</span>
							</div>
						</template>

						<!-- Gallery: overlapped stack of first thumbnails + "+N" badge + "Gallery / N media" caption -->
						<template v-else-if="showGalleryStack">
							<div class="bx-im-message-quote__gallery-stack" :class="galleryStackModifier" data-testid="im-message-reply-gallery-stack">
								<div
									v-for="file in galleryThumbnails"
									:key="file.id"
									class="bx-im-message-quote__gallery-stack-item"
								>
									<img
										v-if="hasPreview(file)"
										class="bx-im-message-quote__gallery-stack-img"
										:src="file.urlPreview"
										:alt="file.name"
										loading="lazy"
									>
								</div>
								<span
									v-if="galleryRemainingCount > 0"
									class="bx-im-message-quote__gallery-badge"
									data-testid="im-message-reply-gallery-badge"
								>+{{ galleryRemainingCount }}</span>
							</div>
							<div class="bx-im-message-quote__gallery-caption" data-testid="im-message-reply-gallery-caption">
								<span class="bx-im-message-quote__gallery-caption-title">{{ loc('IM_PARSER_ICON_TYPE_GALLERY') }}</span>
								<span class="bx-im-message-quote__gallery-caption-count">{{ mediaCountText }}</span>
							</div>
						</template>

						<!-- Video note (round video message): round thumbnail (poster) only; the type label goes to the text row below (alt keeps the IM_PARSER_ICON_TYPE_VIDEO_NOTE a11y label) -->
						<template v-else-if="isVideoNote && !showIcon">
							<div class="bx-im-message-quote__preview-video-note" data-testid="im-message-reply-preview-video-note">
								<img
									class="bx-im-message-quote__preview-video-note_img"
									:src="messageFile.urlPreview"
									:alt="loc('IM_PARSER_ICON_TYPE_VIDEO_NOTE')"
									loading="lazy"
								>
							</div>
						</template>

						<!-- Image / Video: single thumbnail (urlPreview only) -->
						<template v-else-if="(isImage || isVideo) && !showIcon">
							<div class="bx-im-message-quote__preview-image" data-testid="im-message-reply-preview-image">
								<img
									class="bx-im-message-quote__preview-image_img"
									:src="messageFile.urlPreview"
									:alt="messageFile.name"
									loading="lazy"
								>
							</div>
						</template>

						<!-- Image / Video without preview: type icon -->
						<template v-else-if="isImage || isVideo">
							<div class="bx-im-message-quote__preview-file-icon" data-testid="im-message-reply-preview-icon">
								<div :class="iconClass" class="ui-icon" aria-hidden="true"><i></i></div>
							</div>
						</template>

						<!-- Audio: no icon; text label shown below -->
						<template v-else-if="isAudio"></template>

						<!-- Sticker: mini-thumbnail (falls back to text label when uri is absent) -->
						<template v-else-if="isSticker && stickerImageUri">
							<div class="bx-im-message-quote__preview-sticker" data-testid="im-message-reply-preview-sticker">
								<img
									class="bx-im-message-quote__preview-sticker_img"
									:src="stickerImageUri"
									:alt="replyText"
									loading="lazy"
								>
							</div>
						</template>
					</div>
					<div v-if="previewText" ref="text" class="bx-im-message-quote__text" v-html="previewText"></div>
					<button
						v-if="isExpandable"
						type="button"
						class="bx-im-message-quote__toggle"
						data-testid="im-message-reply-toggle-btn"
						@click.stop="toggleExpanded"
					>
						{{ toggleLabel }}
					</button>
				</template>

				<!-- Original, text only -->
				<template v-else>
					<div ref="text" class="bx-im-message-quote__text" v-html="replyText"></div>
					<button
						v-if="isExpandable"
						type="button"
						class="bx-im-message-quote__toggle"
						data-testid="im-message-reply-toggle-btn"
						@click.stop="toggleExpanded"
					>
						{{ toggleLabel }}
					</button>
				</template>
			</div>
		</div>
	`
	});

	const AuthorTitle = ui_vue3.defineComponent({
		name: 'AuthorTitle',
		components: {
			MessageAuthorTitle: im_v2_component_elements_chatTitle.MessageAuthorTitle
		},
		props: {
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			dialog() {
				return this.$store.getters['chats/getByChatId'](this.message.chatId);
			},
			user() {
				return this.$store.getters['users/get'](this.message.authorId, true);
			},
			isSystemMessage() {
				return this.message.authorId === 0;
			},
			isSelfMessage() {
				return this.message.authorId === im_v2_application_core.Core.getUserId();
			},
			isUserChat() {
				return this.dialog.type === im_v2_const.ChatType.user && !this.isBotWithFakeAuthorNames;
			},
			isBotWithFakeAuthorNames() {
				return this.isSupportBot || this.isNetworkBot;
			},
			isNetworkBot() {
				return this.$store.getters['users/bots/isNetwork'](this.dialog.dialogId);
			},
			isSupportBot() {
				return this.$store.getters['users/bots/isSupport'](this.dialog.dialogId);
			},
			showTitle() {
				return !this.isSystemMessage && !this.isSelfMessage && !this.isUserChat;
			},
			authorDialogId() {
				if (this.message.authorId) {
					return this.message.authorId.toString();
				}
				return this.dialogId;
			},
			isCopilot() {
				const authorId = Number.parseInt(this.authorDialogId, 10);
				return this.$store.getters['users/bots/isCopilot'](authorId);
			},
			canMentionByClick() {
				if (!this.isCopilot) {
					return false;
				}
				return new im_v2_lib_copilot.CopilotManager().isMentionByClickAvailable(this.dialog.dialogId, this.authorDialogId);
			}
		},
		methods: {
			onAuthorNameClick() {
				const authorId = Number.parseInt(this.authorDialogId, 10);
				if (!authorId || authorId === im_v2_application_core.Core.getUserId()) {
					return;
				}
				if (this.isCopilot && !this.canMentionByClick) {
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.textarea.insertMention, {
					mentionText: this.user.name,
					mentionReplacement: im_v2_lib_utils.Utils.text.getMentionBbCode(this.user.id, this.user.name),
					mentionedUserId: this.user.id,
					dialogId: this.dialog.dialogId,
					isMentionSymbol: false
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<div 
			v-if="showTitle" 
			@click="onAuthorNameClick" 
			class="bx-im-message-author-title__container" 
			:class="{'--clickable': !isCopilot || canMentionByClick}"
			data-testid="im-message-author-title"
		>
			<MessageAuthorTitle
				:dialogId="authorDialogId"
				:messageId="message.id"
				:showItsYou="false"
				:withColor="true"
				:withLeftIcon="!isCopilot"
			/>
		</div>
	`
	});

	const ContextMenu = ui_vue3.defineComponent({
		name: 'ContextMenu',
		props: {
			dialogId: {
				type: String,
				required: true
			},
			message: {
				type: Object,
				required: true
			},
			showContextMenu: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			menuTitle() {
				return this.$Bitrix.Loc.getMessage('IM_MESSENGER_MESSAGE_MENU_TITLE', {
					'#SHORTCUT#': im_v2_lib_utils.Utils.platform.isMac() ? 'CMD' : 'CTRL'
				});
			},
			messageItem() {
				return this.message;
			},
			canShowContextMenu() {
				return this.showContextMenu && !im_v2_lib_message.messageHasError(this.messageItem);
			},
			isBulkActionsMode() {
				return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
			}
		},
		methods: {
			onMenuClick(event) {
				this.getEmitter().emit(im_v2_const.EventType.dialog.onClickMessageContextMenu, {
					message: this.message,
					dialogId: this.dialogId,
					bindElement: event.currentTarget,
					event
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			}
		},
		template: `
		<template v-if="!isBulkActionsMode">
			<div v-if="canShowContextMenu" class="bx-im-message-context-menu__container bx-im-message-context-menu__scope">
				<button
					:title="menuTitle"
					@click="onMenuClick"
					@contextmenu.prevent
					class="bx-im-message-context-menu__button"
				></button>
			</div>
			<div v-else class="bx-im-message-base__context-menu-placeholder"></div>
		</template>
	`
	});

	class RetryContextMenu extends im_v2_lib_menu.BaseMenu {
		constructor() {
			super();
			this.id = 'bx-im-message-retry-context-menu';
		}
		getMenuItems() {
			return [this.getRetryItem(), this.getDeleteItem()];
		}
		getRetryItem() {
			if (!this.#isOwnMessage() || !this.#hasError()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_MESSAGE_CONTEXT_MENU_RETRY') ?? '',
				onClick: () => {
					this.#retrySend();
					this.menuInstance.close();
				}
			};
		}
		getDeleteItem() {
			if (!this.#isOwnMessage() || !this.#hasError()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('IM_MESSENGER_MESSAGE_CONTEXT_MENU_DELETE') ?? '',
				design: ui_system_menu.MenuItemDesign.Alert,
				onClick: () => {
					const messageService = new im_v2_provider_service_message.MessageService({
						chatId: this.context.chatId
					});
					messageService.deleteMessages([this.context.id]);
					this.menuInstance.close();
				}
			};
		}
		#isOwnMessage() {
			return this.context.authorId === im_v2_application_core.Core.getUserId();
		}
		#hasError() {
			return this.context.error;
		}
		#hasFiles() {
			return this.context.files.length > 0;
		}
		#retrySend() {
			if (this.#hasFiles()) {
				const uploadingService = im_v2_provider_service_uploading.UploadingService.getInstance();
				const uploaderId = uploadingService.getUploaderIdByFileId(this.context.files[0]);
				uploadingService.retry(uploaderId);
				return;
			}
			this.#retrySendMessage();
		}
		#retrySendMessage() {
			void new im_v2_provider_service_sending.SendingService().retrySendMessage({
				tempMessageId: this.context.id,
				dialogId: this.context.dialogId
			});
		}
	}

	const RetryButton = ui_vue3.defineComponent({
		name: 'RetryButton',
		props: {
			message: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				contextMenu: null
			};
		},
		computed: {
			messageItem() {
				return this.message;
			},
			menuTitle() {
				return this.$Bitrix.Loc.getMessage('IM_MESSENGER_MESSAGE_CONTEXT_MENU_RETRY');
			}
		},
		created() {
			this.contextMenu = new RetryContextMenu();
		},
		methods: {
			onClick(event) {
				const context = {
					dialogId: this.dialogId,
					...this.messageItem
				};
				this.contextMenu.openMenu(context, event.currentTarget);
			}
		},
		template: `
		<div class="bx-im-message-retry-button__container bx-im-message-retry-button__scope">
			<button
				:title="menuTitle"
				@click="onClick"
				class="bx-im-message-retry-button__arrow"
			></button>
		</div>
	`
	});

	const FORWARD_ICON_SIZE = 20;
	const MessageHeader = ui_vue3.defineComponent({
		name: 'MessageHeader',
		components: {
			AuthorTitle,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			withTitle: {
				type: Boolean,
				default: false
			},
			isOverlay: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			Color: () => im_v2_const.Color,
			FORWARD_ICON_SIZE: () => FORWARD_ICON_SIZE,
			message() {
				return this.item;
			},
			forwardAuthorId() {
				return this.message.forward.userId;
			},
			forwardContextId() {
				return this.message.forward.id;
			},
			isForwarded() {
				return this.$store.getters['messages/isForward'](this.message.id);
			},
			isChannelForward() {
				return im_v2_lib_channel.ChannelManager.channelTypes.has(this.message.forward.chatType);
			},
			isDiscussionForward() {
				return main_core.Text.toNumber(this.message.forward.parentChatId) > 0;
			},
			isCommentsForwardParent() {
				return im_v2_lib_channel.ChannelManager.channelTypes.has(this.message.forward.parentChatType);
			},
			forwardParentName() {
				return main_core.Type.isStringFilled(this.message.forward.chatTitle) ? this.message.forward.chatTitle : null;
			},
			forwardAuthorName() {
				const copilotManager = new im_v2_lib_copilot.CopilotManager();
				if (copilotManager.isCopilotBot(this.forwardAuthorId)) {
					const forwardMessageId = this.forwardContextId.split('/')[1];
					return copilotManager.getNameWithRole(forwardMessageId);
				}
				return this.$store.getters['users/get'](this.forwardAuthorId, true).name;
			},
			forwardChatName() {
				return this.message.forward.chatTitle ?? this.loc('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_CLOSED_CHANNEL');
			},
			isSystemMessage() {
				return this.message.forward.userId === 0;
			},
			isSystemAuthor() {
				return this.message.authorId === 0;
			},
			shouldShowAuthorTitle() {
				return this.withTitle && !this.isSystemAuthor && !this.isForwarded;
			},
			forwardAuthorTitle() {
				return main_core.Loc.getMessage('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_CHAT', {
					'[user_name]': '<span class="bx-im-message-header__author-name">',
					'#USER_NAME#': main_core.Text.encode(this.forwardAuthorName),
					'[/user_name]': '</span>'
				}) ?? '';
			},
			forwardDiscussionNoNamePhraseCode() {
				if (!main_core.Type.isStringFilled(this.message.forward.parentChatType)) {
					return 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_DISCUSSION';
				}
				return this.isCommentsForwardParent ? 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_COMMENTS_NO_NAME' : 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_THREAD_NO_NAME';
			},
			forwardDiscussionTitle() {
				const authorMarkers = {
					'[user_name]': '<span class="bx-im-message-header__author-name">',
					'[/user_name]': '</span>'
				};
				const authorName = {
					'#USER_NAME#': main_core.Text.encode(this.forwardAuthorName)
				};
				if (this.forwardParentName === null) {
					return main_core.Loc.getMessage(this.forwardDiscussionNoNamePhraseCode, {
						...authorMarkers,
						...authorName
					}) ?? '';
				}
				const phraseCode = this.isCommentsForwardParent ? 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_COMMENTS' : 'IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_THREAD';
				return main_core.Loc.getMessage(phraseCode, {
					...authorMarkers,
					'[chat_name]': '<span class="bx-im-message-header__author-name">',
					'[/chat_name]': '</span>',
					...authorName,
					'#CHAT_NAME#': main_core.Text.encode(this.forwardParentName)
				}) ?? '';
			},
			forwardChannelTitle() {
				return main_core.Loc.getMessage('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_CHANNEL', {
					'[user_name]': '<span class="bx-im-message-header__author-name">',
					'#USER_NAME#': main_core.Text.encode(this.forwardAuthorName),
					'[/user_name]': '</span>',
					'[channel_name]': '<span class="bx-im-message-header__author-name">',
					'#CHANNEL_NAME#': main_core.Text.encode(this.forwardChatName),
					'[/channel_name]': '</span>'
				}) ?? '';
			},
			iconColor() {
				return this.isOverlay ? im_v2_const.Color.white : im_v2_const.Color.blue60;
			}
		},
		methods: {
			onForwardClick() {
				const contextCode = im_v2_lib_parser.Parser.getContextCodeFromForwardId(this.forwardContextId);
				if (contextCode.length === 0) {
					return;
				}
				const [dialogId, messageId] = contextCode.split('/');
				this.getEmitter().emit(im_v2_const.EventType.dialog.goToMessageContext, {
					messageId: Number.parseInt(messageId, 10),
					dialogId: dialogId.toString()
				});
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div 
			v-if="isForwarded" 
			:class="{'--overlay': isOverlay}"
			class="bx-im-message-header__container"
			data-testid="im-message-header-forward-root"
			@click="onForwardClick"
		>
			<BIcon
				:name="OutlineIcons.FORWARD"
				:color="iconColor"
				:size="FORWARD_ICON_SIZE"
			/>
			<span v-if="isSystemMessage" class="--ellipsis">
				{{ loc('IM_MESSENGER_MESSAGE_HEADER_FORWARDED_FROM_SYSTEM')}}
			</span>
			<span
				v-else-if="isDiscussionForward"
				v-html="forwardDiscussionTitle"
				class="--ellipsis"
				data-testid="im-message-header-forward-discussion"
			></span>
			<span v-else-if="isChannelForward" v-html="forwardChannelTitle" class="--ellipsis"></span>
			<span v-else v-html="forwardAuthorTitle" class="--ellipsis"></span>
		</div>
		<AuthorTitle v-else-if="shouldShowAuthorTitle" :item="item" />
	`
	});

	const CommentsPanel = ui_vue3.defineComponent({
		name: 'CommentsPanel',
		components: {
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			FadeAnimation: im_v2_component_animation.FadeAnimation
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId);
			},
			message() {
				return this.item;
			},
			commentInfo() {
				return this.$store.getters['messages/comments/getByMessageId'](this.message.id);
			},
			commentsChatId() {
				return this.commentInfo.chatId;
			},
			commentsCount() {
				if (this.commentInfo.messageCount > 0) {
					return this.commentInfo.messageCount - 1;
				}
				return this.commentInfo.messageCount;
			},
			commentsCountText() {
				return main_core.Loc.getMessagePlural('IM_MESSAGE_COMMENTS_PANEL_COMMENT_COUNT', this.commentsCount, {
					'#COUNT#': String(this.commentsCount)
				}) ?? '';
			},
			noComments() {
				return this.commentsCount === 0;
			},
			lastUsers() {
				return [...this.commentInfo.lastUserIds].map(userId => {
					return this.$store.getters['users/get'](userId);
				}).reverse();
			},
			unreadCount() {
				const counter = this.$store.getters['counters/getCounterByChatId'](this.commentsChatId);
				if (!counter) {
					return '';
				}
				return `+${counter}`;
			},
			isSubscribed() {
				return this.$store.getters['messages/comments/isUserSubscribed'](this.message.id);
			},
			showSubscribeIcon() {
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				return permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.subscribeToComments, this.dialogId);
			},
			subscribeIconTitle() {
				if (this.isSubscribed) {
					return this.loc('IM_MESSAGE_COMMENTS_PANEL_ICON_UNSUBSCRIBE');
				}
				return this.loc('IM_MESSAGE_COMMENTS_PANEL_ICON_SUBSCRIBE');
			},
			isRealMessage() {
				return this.$store.getters['messages/isRealMessage'](this.message.id);
			}
		},
		methods: {
			onCommentsClick() {
				if (!this.isRealMessage) {
					return;
				}
				const permissionManager = im_v2_lib_permission.PermissionManager.getInstance();
				if (!permissionManager.canPerformActionByRole(im_v2_const.ActionByRole.openComments, this.dialogId)) {
					return;
				}
				this.getEmitter().emit(im_v2_const.EventType.dialog.openComments, {
					messageId: this.message.id
				});
			},
			onSubscribeIconClick() {
				if (this.isSubscribed) {
					im_v2_provider_service_comments.CommentsService.unsubscribe(this.message.id);
					return;
				}
				im_v2_provider_service_comments.CommentsService.subscribe(this.message.id);
			},
			getEmitter() {
				return this.$Bitrix.eventEmitter;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<slot :totalCount="commentsCount" :unreadCount="unreadCount" :onCommentsClick="onCommentsClick">
			<div class="bx-im-message-comments-panel__container" @click="onCommentsClick">
				<div class="bx-im-message-comments-panel__left">
					<div v-if="noComments" class="bx-im-message-comments-panel__empty_container">
						<div class="bx-im-message-comments-panel__empty_icon"></div>
						<div class="bx-im-message-comments-panel__text">{{ loc('IM_MESSAGE_COMMENTS_PANEL_EMPTY_TEXT') }}</div>
					</div>
					<div v-else class="bx-im-message-comments-panel__meta_container">
						<div class="bx-im-message-comments-panel__user_container">
							<TransitionGroup name="bx-im-message-comments-panel__user_animation">
								<div v-for="(user, index) in lastUsers" :key="user.id" class="bx-im-message-comments-panel__user_avatar" :class="'--image-' + (index + 1)">
									<ChatAvatar
										:avatarDialogId="user.id"
										:contextDialogId="dialogId"
										:size="AvatarSize.S"
										:withTooltip="false"
									/>
								</div>
							</TransitionGroup>
						</div>
						<div class="bx-im-message-comments-panel__text">{{ commentsCountText }}</div>
						<FadeAnimation :duration="200">
							<div v-if="unreadCount" class="bx-im-message-comments-panel__unread-counter">{{ unreadCount }}</div>
						</FadeAnimation>
					</div>
				</div>
				<div v-if="showSubscribeIcon" :title="subscribeIconTitle" class="bx-im-message-comments-panel__right">
					<div
						@click.stop="onSubscribeIconClick"
						class="bx-im-message-comments-panel__subscribe-icon"
						:class="{'--active': isSubscribed}"
					></div>
				</div>
			</div>
		</slot>
	`
	});

	const MessageFooter = ui_vue3.defineComponent({
		name: 'MessageFooter',
		components: {
			CommentsPanel
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {};
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId);
			},
			message() {
				return this.item;
			},
			isChannelPost() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
			},
			isSystemMessage() {
				return this.message.authorId === 0;
			},
			showCommentsPanel() {
				return this.isChannelPost && !this.isSystemMessage;
			}
		},
		template: `
		<CommentsPanel v-if="showCommentsPanel" :dialogId="dialogId" :item="item" />
	`
	});

	const SLIDER_ID_PREFIX = 'im:source-list-slider';
	const SLIDER_WIDTH = 546;
	const buildSliderId = messageId => `${SLIDER_ID_PREFIX}:${messageId}`;
	const SourceListSlider = ui_vue3.defineComponent({
		name: 'SourceListSlider',
		props: {
			messageBlocks: {
				type: Array,
				required: true
			},
			messageId: {
				type: [Number, String],
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				sliderId: '',
				contentContainer: null
			};
		},
		computed: {
			blocks() {
				return this.messageBlocks;
			},
			title() {
				return this.loc('IM_MESSAGE_BUILDER_SOURCES_SLIDER_TITLE');
			},
			allSources() {
				return this.blocks.filter(block => block.sources).flatMap(block => Object.values(block.sources)).map(source => ({
					url: source.url ?? '',
					title: source.metaData?.title ?? '',
					description: source.metaData?.description ?? ''
				}));
			}
		},
		created() {
			this.sliderId = buildSliderId(this.messageId);
			this.contentContainer = main_core.Tag.render`<div></div>`;
			this.openSlider();
		},
		beforeUnmount() {
			this.closeSlider();
		},
		methods: {
			openSlider() {
				main_sidepanel.SidePanel.Instance.open(this.sliderId, {
					cacheable: false,
					width: SLIDER_WIDTH,
					contentCallback: () => {
						return this.createLayoutContent();
					},
					events: {
						onCloseComplete: () => {
							this.$emit('close');
						}
					}
				});
			},
			closeSlider() {
				const slider = main_sidepanel.SidePanel.Instance.getSlider(this.sliderId);
				if (!slider) {
					return;
				}
				slider.close();
			},
			createLayoutContent() {
				return ui_sidepanel_layout.Layout.createContent({
					title: this.title,
					design: {
						margin: null,
						section: false,
						alignButtonsLeft: true
					},
					content: () => this.contentContainer,
					buttons: () => []
				});
			},
			getSourceTitle(source) {
				if (source.title) {
					return source.title;
				}
				return im_v2_lib_utils.Utils.text.getHostFromUrl(source.url);
			},
			loc(phraseCode) {
				return main_core.Loc.getMessage(phraseCode) ?? '';
			}
		},
		template: `
		<Teleport :to="contentContainer">
			<div class="bx-im-message-source-list-slider__container bx-im-messenger__scope">
				<div
					v-for="(source, index) in allSources"
					:key="index"
					class="bx-im-message-source-list-slider__item"
				>
					<div class="bx-im-message-source-list-slider__item-title --line-clamp-2">
						{{ getSourceTitle(source) }}
					</div>
					<div
						v-if="source.description"
						class="bx-im-message-source-list-slider__item-description --line-clamp-2"
					>
						{{ source.description }}
					</div>
					<a :href="source.url" target="_blank" class="bx-im-message-source-list-slider__item-link --ellipsis">
						{{ source.url }}
					</a>
				</div>
			</div>
		</Teleport>
	`
	});

	let openMessageId = null;
	const SourceListButton = ui_vue3.defineComponent({
		name: 'SourceListButton',
		components: {
			Chip: ui_system_chip_vue.Chip,
			SourceListSlider,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			messageBlocks: {
				type: Array,
				required: true
			},
			messageId: {
				type: [Number, String],
				required: true
			}
		},
		data() {
			return {
				showSlider: false
			};
		},
		computed: {
			ChipSize: () => ui_system_chip_vue.ChipSize,
			ChipDesign: () => ui_system_chip_vue.ChipDesign,
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			hasSources() {
				return this.messageBlocks.some(block => {
					return block.sources && Object.keys(block.sources).length > 0;
				});
			}
		},
		beforeUnmount() {
			if (openMessageId === this.messageId) {
				openMessageId = null;
			}
		},
		methods: {
			handleButtonClick() {
				if (this.showSlider) {
					main_sidepanel.SidePanel.Instance.getSlider(buildSliderId(this.messageId))?.close();
					return;
				}
				if (openMessageId !== null && openMessageId !== this.messageId) {
					main_sidepanel.SidePanel.Instance.getSlider(buildSliderId(openMessageId))?.close();
				}
				openMessageId = this.messageId;
				this.showSlider = true;
			},
			handleSliderClose() {
				this.showSlider = false;
				if (openMessageId === this.messageId) {
					openMessageId = null;
				}
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<span
			v-if="hasSources"
			:title="loc('IM_MESSAGE_BUILDER_SOURCES_BUTTON')"
			class="bx-im-message-source-list-button__container --ui-hoverable"
			@click="handleButtonClick"
		>
			<BIcon :name="OutlineIcons.EARTH" />
			<span class="--ellipsis">{{ loc('IM_MESSAGE_BUILDER_SOURCES_BUTTON') }}</span>
		</span>
		<SourceListSlider v-if="showSlider" :messageBlocks="messageBlocks" :messageId="messageId" @close="handleSliderClose"/>
	`
	});

	var fr = 60;
	var v = "5.9.6";
	var ip = 0;
	var op = 119;
	var w = 20;
	var h = 20;
	var nm = "bitrixgpt animation";
	var ddd = 0;
	var markers = [
	];
	var assets = [
		{
			nm: "[FRAME] bitrixgpt animation - Null / color - Null / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030 / Rectangle 240665030 - Null / Rectangle 240665030",
			fr: 60,
			id: "mn7jaykx8d3pzo8h",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 8,
					hd: false,
					nm: "bitrixgpt animation - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 9,
					hd: false,
					nm: "color - Null",
					sr: 1,
					parent: 8,
					ks: {
						a: {
							a: 0,
							k: [
								8,
								8
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								10,
								10
							]
						},
						r: {
							a: 1,
							k: [
								{
									t: 0.486,
									s: [
										0
									],
									o: {
										x: [
											0.5
										],
										y: [
											0.25
										]
									},
									i: {
										x: [
											0.5
										],
										y: [
											0.75
										]
									}
								},
								{
									t: 119.736,
									s: [
										360
									]
								}
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 10,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								-0.4422,
								6.9658
							]
						},
						r: {
							a: 0,
							k: -9.7722
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 11,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 10,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.2175,
												0.26666666666666666,
												0.6588235294117647,
												1,
												1,
												0.26666666666666666,
												0.48627450980392156,
												1,
												0.2175,
												1,
												1,
												0.4
											]
										}
									},
									s: {
										a: 0,
										k: [
											2.621579473192672,
											0.3766901861601525
										]
									},
									e: {
										a: 0,
										k: [
											4.815379404212134,
											9.99663191633054
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 12,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								6.2525,
								-0.61
							]
						},
						r: {
							a: 0,
							k: 62.5152
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 13,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 12,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.2175,
												0.3843137254901961,
												0.8431372549019608,
												0.996078431372549,
												1,
												0.3843137254901961,
												0.8431372549019608,
												0.996078431372549,
												0.2175,
												1,
												1,
												0.4
											]
										}
									},
									s: {
										a: 0,
										k: [
											3.104028036851783,
											0.7722080398253591
										]
									},
									e: {
										a: 0,
										k: [
											5.976973099035836,
											9.875584482622632
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 14,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								15.414,
								3.3644
							]
						},
						r: {
							a: 0,
							k: 133.8219
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 15,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 14,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.1621,
												1,
												0.6509803921568628,
												0,
												0.8136,
												1,
												0.6509803921568628,
												0,
												0.1621,
												1,
												0.8136,
												0.3
											]
										}
									},
									s: {
										a: 0,
										k: [
											3.3854617405731235,
											0.4432974655054862
										]
									},
									e: {
										a: 0,
										k: [
											6.031566431255089,
											9.33843307341526
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 16,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								14.4785,
								13.4146
							]
						},
						r: {
							a: 0,
							k: -154.0824
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 17,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 16,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.2272,
												0.8549019607843137,
												0.36470588235294116,
												1,
												1,
												0.7803921568627451,
												0.3254901960784314,
												0.9137254901960784,
												0.2272,
												1,
												1,
												0
											]
										}
									},
									s: {
										a: 0,
										k: [
											3.187980422349081,
											-0.25433631245205346
										]
									},
									e: {
										a: 0,
										k: [
											5.419462905652353,
											10.057472459776616
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ty: 3,
					ddd: 0,
					ind: 18,
					hd: false,
					nm: "Rectangle 240665030 - Null",
					sr: 1,
					parent: 9,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								4.6642,
								15.6651
							]
						},
						r: {
							a: 0,
							k: -81.7154
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 19,
					hd: false,
					nm: "Rectangle 240665030",
					sr: 1,
					parent: 18,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 3,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													1.0314,
													0.9437
												],
												[
													6.4632,
													0.1242
												],
												[
													6.8698,
													4.0407
												],
												[
													5.8091,
													10.2505
												],
												[
													4.3857,
													8.2917
												],
												[
													2.9919,
													6.4803
												],
												[
													1.3848,
													4.7547
												],
												[
													1.0313,
													0.9436
												],
												[
													1.0314,
													0.9437
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0,
													0
												],
												[
													0.0002,
													-2.9807
												],
												[
													0,
													0
												],
												[
													0.7831,
													1.0547
												],
												[
													0.274,
													0.3202
												],
												[
													0.3591,
													0.3654
												],
												[
													-2.3462,
													1.4146
												],
												[
													0,
													0
												]
											],
											o: [
												[
													2.34621,
													-1.41457
												],
												[
													0,
													0
												],
												[
													-21000000000004349e-20,
													2.98067
												],
												[
													0,
													0
												],
												[
													-0.4820500000000001,
													-0.6492199999999997
												],
												[
													-0.7191000000000001,
													-0.8402700000000003
												],
												[
													-0.3591200000000001,
													-0.3653599999999999
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100
									},
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0.226,
												0.23137254901960785,
												0.4627450980392157,
												1,
												1,
												0.3058823529411765,
												0.5019607843137255,
												1,
												0.226,
												1,
												1,
												0.1
											]
										}
									},
									s: {
										a: 0,
										k: [
											0.5311314392758093,
											0.7672309962979321
										]
									},
									e: {
										a: 0,
										k: [
											7.366772246863869,
											7.079478423523419
										]
									},
									t: 1,
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				}
			]
		},
		{
			nm: "bitrixgpt animation",
			fr: 60,
			id: "mn7jaykuz286myi4",
			layers: [
				{
					ty: 3,
					ddd: 0,
					ind: 20,
					hd: false,
					nm: "bitrixgpt animation - Null",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 3,
					ddd: 0,
					ind: 21,
					hd: false,
					nm: "stars - Null",
					sr: 1,
					parent: 20,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						o: {
							a: 0,
							k: 100
						},
						p: {
							a: 0,
							k: [
								5.25,
								4.5
							]
						},
						r: {
							a: 0,
							k: 0
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0
				},
				{
					ty: 4,
					ddd: 0,
					ind: 22,
					hd: false,
					nm: "stars",
					sr: 1,
					parent: 21,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					ip: 0,
					op: 120,
					st: 0,
					bm: 0,
					shapes: [
						{
							ty: "gr",
							nm: "Group",
							hd: false,
							np: 4,
							it: [
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													4.1551,
													1.3058
												],
												[
													5.1153,
													1.3058
												],
												[
													5.4979,
													2.714
												],
												[
													7.5434,
													4.8244
												],
												[
													8.9068,
													5.2203
												],
												[
													8.9068,
													6.2105
												],
												[
													7.5435,
													6.6055
												],
												[
													5.498,
													8.7169
												],
												[
													5.1154,
													10.1251
												],
												[
													4.1552,
													10.1251
												],
												[
													3.7726,
													8.7169
												],
												[
													1.7271,
													6.6055
												],
												[
													0.3638,
													6.2105
												],
												[
													0.3638,
													5.2203
												],
												[
													1.7272,
													4.8244
												],
												[
													3.7727,
													2.714
												],
												[
													4.1551,
													1.3058
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.1362,
													-0.5003
												],
												[
													0,
													0
												],
												[
													-0.9917,
													-0.2874
												],
												[
													0,
													0
												],
												[
													0.4847,
													-0.1406
												],
												[
													0,
													0
												],
												[
													0.2785,
													-1.0236
												],
												[
													0,
													0
												],
												[
													0.1364,
													0.5
												],
												[
													0,
													0
												],
												[
													0.9918,
													0.2874
												],
												[
													0,
													0
												],
												[
													-0.4849,
													0.1405
												],
												[
													0,
													0
												],
												[
													-0.2785,
													1.0236
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.1362899999999998,
													-0.50022
												],
												[
													0,
													0
												],
												[
													0.27853999999999957,
													1.02358
												],
												[
													0,
													0
												],
												[
													0.4847199999999994,
													0.1406200000000002
												],
												[
													0,
													0
												],
												[
													-0.9917300000000004,
													0.28739000000000026
												],
												[
													0,
													0
												],
												[
													-0.1362899999999998,
													0.5001099999999994
												],
												[
													0,
													0
												],
												[
													-0.27848000000000006,
													-1.0236799999999997
												],
												[
													0,
													0
												],
												[
													-0.48492,
													-0.14052000000000042
												],
												[
													0,
													0
												],
												[
													0.9916600000000002,
													-0.28742
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "sh",
									nm: "Path",
									hd: false,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													7.9913,
													0.2547
												],
												[
													8.643,
													0.2547
												],
												[
													8.7154,
													0.5195
												],
												[
													9.4968,
													1.326
												],
												[
													9.7534,
													1.4008
												],
												[
													9.7534,
													2.0735
												],
												[
													9.4968,
													2.1473
												],
												[
													8.7154,
													2.9538
												],
												[
													8.643,
													3.2186
												],
												[
													7.9913,
													3.2186
												],
												[
													7.9198,
													2.9538
												],
												[
													7.1384,
													2.1473
												],
												[
													6.8818,
													2.0735
												],
												[
													6.8818,
													1.4008
												],
												[
													7.1384,
													1.3261
												],
												[
													7.9198,
													0.5196
												],
												[
													7.9913,
													0.2547
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.0926,
													-0.3396
												],
												[
													0,
													0
												],
												[
													-0.3788,
													-0.1098
												],
												[
													0,
													0
												],
												[
													0.3289,
													-0.0956
												],
												[
													0,
													0
												],
												[
													0.1064,
													-0.3909
												],
												[
													0,
													0
												],
												[
													0.0925,
													0.3399
												],
												[
													0,
													0
												],
												[
													0.3787,
													0.1098
												],
												[
													0,
													0
												],
												[
													-0.3293,
													0.0954
												],
												[
													0,
													0
												],
												[
													-0.1063,
													0.3909
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.09255999999999975,
													-0.3396
												],
												[
													0,
													0
												],
												[
													0.10636000000000045,
													0.39105
												],
												[
													0,
													0
												],
												[
													0.3288100000000007,
													0.09566999999999992
												],
												[
													0,
													0
												],
												[
													-0.37875999999999976,
													0.10976000000000008
												],
												[
													0,
													0
												],
												[
													-0.09244999999999948,
													0.33991000000000016
												],
												[
													0,
													0
												],
												[
													-0.10635999999999957,
													-0.39094000000000007
												],
												[
													0,
													0
												],
												[
													-0.32930999999999955,
													-0.0954299999999999
												],
												[
													0,
													0
												],
												[
													0.37868999999999975,
													-0.10986999999999991
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									o: {
										a: 0,
										k: 100
									},
									c: {
										a: 0,
										k: [
											1,
											1,
											1,
											1
										]
									},
									nm: "Fill",
									hd: false,
									r: 1
								},
								{
									ty: "tr",
									a: {
										a: 0,
										k: [
											0,
											0
										]
									},
									p: {
										a: 0,
										k: [
											0,
											0
										]
									},
									s: {
										a: 0,
										k: [
											100,
											100
										]
									},
									sk: {
										a: 0,
										k: 0
									},
									sa: {
										a: 0,
										k: 0
									},
									r: {
										a: 0,
										k: 0
									},
									o: {
										a: 0,
										k: 100
									}
								}
							]
						}
					]
				},
				{
					ddd: 0,
					ind: 23,
					ty: 0,
					nm: "color",
					refId: "mn7jaykx8d3pzo8h",
					sr: 1,
					ks: {
						a: {
							a: 0,
							k: [
								0,
								0
							]
						},
						p: {
							a: 0,
							k: [
								0,
								0
							]
						},
						s: {
							a: 0,
							k: [
								100,
								100
							]
						},
						sk: {
							a: 0,
							k: 0
						},
						sa: {
							a: 0,
							k: 0
						},
						r: {
							a: 0,
							k: 0
						},
						o: {
							a: 0,
							k: 100
						}
					},
					ao: 0,
					w: 20,
					h: 20,
					ip: 0,
					op: 120,
					st: 0,
					hd: false,
					bm: 0
				}
			]
		}
	];
	var layers = [
		{
			ty: 3,
			ddd: 0,
			ind: 20,
			hd: false,
			nm: "bitrixgpt animation - Null",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				o: {
					a: 0,
					k: 100
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				r: {
					a: 0,
					k: 0
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				}
			},
			ao: 0,
			ip: 0,
			op: 120,
			st: 0,
			bm: 0
		},
		{
			ddd: 0,
			ind: 2,
			ty: 0,
			nm: "bitrixgpt animation",
			refId: "mn7jaykuz286myi4",
			sr: 1,
			ks: {
				a: {
					a: 0,
					k: [
						0,
						0
					]
				},
				p: {
					a: 0,
					k: [
						0,
						0
					]
				},
				s: {
					a: 0,
					k: [
						100,
						100
					]
				},
				sk: {
					a: 0,
					k: 0
				},
				sa: {
					a: 0,
					k: 0
				},
				r: {
					a: 0,
					k: 0
				},
				o: {
					a: 0,
					k: 100
				}
			},
			ao: 0,
			w: 20,
			h: 20,
			ip: 0,
			op: 120,
			st: 0,
			hd: false,
			bm: 0
		}
	];
	var meta = {
		a: "",
		d: "",
		tc: "",
		g: "Aninix"
	};
	var AiAssistantAnimation = {
		fr: fr,
		v: v,
		ip: ip,
		op: op,
		w: w,
		h: h,
		nm: nm,
		ddd: ddd,
		markers: markers,
		assets: assets,
		layers: layers,
		meta: meta
	};

	const MIN_VALUE = 0;
	const MAX_VALUE = 100;
	const DEFAULT_COLOR_TOKEN = im_v2_const.MessageBuilderGradientColorToken['ai-assistant'];
	const FALLBACK_COLOR_TOKEN = im_v2_const.MessageBuilderPlainColorToken.base;
	const resolveColorToken = colorToken => {
		if (!colorToken) {
			return DEFAULT_COLOR_TOKEN;
		}
		const plainKey = colorToken;
		const gradientKey = colorToken;
		if (!im_v2_const.MessageBuilderPlainColorToken[plainKey] && !im_v2_const.MessageBuilderGradientColorToken[gradientKey]) {
			return FALLBACK_COLOR_TOKEN;
		}
		return colorToken;
	};
	const AiAssistantSearchProgressBar = ui_vue3.defineComponent({
		name: 'AiAssistantSearchProgressBar',
		props: {
			progress: {
				type: Object,
				required: true
			},
			label: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				MIN_VALUE,
				MAX_VALUE
			};
		},
		computed: {
			value() {
				if (!main_core.Type.isNumber(this.progress.value)) {
					return MIN_VALUE;
				}
				return Math.min(MAX_VALUE, Math.max(MIN_VALUE, this.progress.value));
			},
			colorClass() {
				return `--color-${resolveColorToken(this.progress.colorToken)}`;
			},
			isComplete() {
				return this.value >= MAX_VALUE;
			},
			fillStyle() {
				return {
					width: `${this.value}%`
				};
			}
		},
		template: `
		<div
			class="bx-im-message-block-ai-assistant-search-progress__container"
			role="progressbar"
			:aria-label="label"
			:aria-valuenow="value"
			:aria-valuemin="MIN_VALUE"
			:aria-valuemax="MAX_VALUE"
			data-testid="im-message-block-ai-assistant-search-progress"
		>
			<div
				class="bx-im-message-block-ai-assistant-search-progress__fill"
				:class="colorClass"
				:style="fillStyle"
			>
				<div
					v-if="!isComplete"
					class="bx-im-message-block-ai-assistant-search-progress__glance"
				></div>
			</div>
		</div>
	`
	});

	const BaseBlock = ui_vue3.defineComponent({
		name: 'BaseBlock',
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="bx-im-message-block-base__container">
			<slot></slot>
		</div>
	`
	});

	const AiAssistantSearch = ui_vue3.defineComponent({
		name: 'AiAssistantSearch',
		components: {
			BaseBlock,
			BIcon: ui_iconSet_api_vue.BIcon,
			AiAssistantSearchProgressBar
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				currentAnimation: null
			};
		},
		data() {
			return {
				isExpanded: false,
				isExpandable: false
			};
		},
		computed: {
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			aiAssistantSearchBlock() {
				return this.block;
			},
			chevronIcon() {
				return this.isExpanded ? ui_iconSet_api_vue.Outline.CHEVRON_TOP_L : ui_iconSet_api_vue.Outline.CHEVRON_DOWN_L;
			},
			hasProgress() {
				return Boolean(this.aiAssistantSearchBlock.progress);
			},
			chevronLabel() {
				return this.isExpanded ? this.loc('IM_MESSAGE_BUILDER_AI_ASSISTANT_SEARCH_COLLAPSE') : this.loc('IM_MESSAGE_BUILDER_AI_ASSISTANT_SEARCH_EXPAND');
			},
			textClasses() {
				return {
					'bx-im-message-block-ai-assistant-search__text': true,
					'--ellipsis': !this.isExpanded,
					'--expanded': this.isExpanded,
					'--has-chevron': this.isExpandable && !this.isExpanded
				};
			}
		},
		watch: {
			'aiAssistantSearchBlock.text': function () {
				void this.updateToggleAvailability();
			}
		},
		mounted() {
			this.currentAnimation = ui_lottie.Lottie.loadAnimation({
				animationData: AiAssistantAnimation,
				container: this.$refs.animationContainer,
				renderer: 'svg',
				loop: true,
				autoplay: true
			});
			void this.updateToggleAvailability();
		},
		beforeUnmount() {
			if (!this.currentAnimation) {
				return;
			}
			this.currentAnimation.destroy();
		},
		methods: {
			toggleExpanded() {
				if (!this.isExpandable) {
					return;
				}
				this.isExpanded = !this.isExpanded;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			},
			async updateToggleAvailability() {
				await this.$nextTick();
				const textNode = this.$refs.text;
				if (!textNode) {
					return;
				}
				main_core.Dom.style(textNode, 'white-space', 'nowrap');
				const containerWidth = textNode.parentElement?.clientWidth ?? textNode.clientWidth;
				const isOverflowing = textNode.scrollWidth > containerWidth;
				main_core.Dom.style(textNode, 'white-space', '');
				this.isExpandable = isOverflowing;
				if (!isOverflowing) {
					this.isExpanded = false;
				}
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="aiAssistantSearchBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-ai-assistant-search__container">
				<div class="bx-im-message-block-ai-assistant-search__width-anchor" aria-hidden="true"></div>
				<div class="bx-im-message-block-ai-assistant-search__title-container">
					<div class="bx-im-message-block-ai-assistant-search__icon" ref="animationContainer"></div>
					<div
						:title="aiAssistantSearchBlock.title"
						class="bx-im-message-block-ai-assistant-search__title --ellipsis"
					>
						{{ aiAssistantSearchBlock.title }}
					</div>
				</div>
				<AiAssistantSearchProgressBar
					v-if="hasProgress"
					:progress="aiAssistantSearchBlock.progress"
					:label="aiAssistantSearchBlock.title"
				/>
				<div class="bx-im-message-block-ai-assistant-search__text-container">
					<div
						ref="text"
						:title="aiAssistantSearchBlock.text"
						:class="textClasses"
						data-testid="im-message-block-ai-assistant-search-text"
					>
						{{ aiAssistantSearchBlock.text }}
					</div>
					<button
						v-if="isExpandable"
						type="button"
						class="bx-im-message-block-ai-assistant-search__chevron"
						:aria-label="chevronLabel"
						:aria-expanded="isExpanded"
						data-testid="im-message-block-ai-assistant-search-expand-btn"
						@click.stop="toggleExpanded"
					>
						<BIcon
							:name="chevronIcon"
							aria-hidden="true"
						/>
					</button>
				</div>
			</div>
		</BaseBlock>
	`
	});

	const AudioItem = ui_vue3.defineComponent({
		name: 'AudioItem',
		components: {
			AudioPlayer: im_v2_component_elements_player.AudioPlayer,
			ProgressBar: im_v2_component_elements_progressbar.ProgressBar
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			messageId: {
				type: [String, Number],
				required: true
			},
			withTranscription: {
				type: Boolean,
				default: true
			}
		},
		emits: ['cancelClick'],
		computed: {
			ProgressBarSize: () => im_v2_component_elements_progressbar.ProgressBarSize,
			file() {
				return this.item;
			}
		},
		methods: {
			onCancelClick(event) {
				this.$emit('cancelClick', event);
			}
		},
		template: `
		<div class="bx-im-media-audio__container" data-testid="im-message-audio">
			<ProgressBar 
				:item="file"
				:size="ProgressBarSize.S"
				@cancelClick="onCancelClick"
			/>
			<AudioPlayer
				:messageId="messageId"
				:src="file.urlDownload"
				:file="file"
				:authorId="file.authorId"
				:withContextMenu="false"
				:withAvatar="false"
				:withTranscription="withTranscription"
				withPlaybackRateControl
			/>
		</div>
	`
	});

	const AudioBlock = ui_vue3.defineComponent({
		name: 'AudioBlock',
		components: {
			BaseBlock,
			AudioItem
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			audioBlock() {
				return this.block;
			},
			file() {
				return this.$store.getters['files/get'](this.audioBlock.fileId);
			}
		},
		template: `
		<BaseBlock
			v-if="file"
			:message="message"
			:block="audioBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-audio__container" data-testid="im-message-block-audio">
				<AudioItem
					:item="file"
					:messageId="message.id"
					:withTranscription="false"
					data-testid="im-message-block-audio-item"
				/>
			</div>
		</BaseBlock>
	`
	});

	const handlerRegistry = {
	};

	const ButtonTypeHandler = {
		eventButton: eventButtonHandler,
		linkButton: linkButtonHandler,
		requestButton: requestButtonHandler
	};
	const handleClick = params => {
		const {
			button: {
				type
			}
		} = params;
		if (!ButtonTypeHandler[type]) {
			return;
		}
		ButtonTypeHandler[type](params);
	};
	function eventButtonHandler(params) {
		const {
			button,
			message,
			dialogId
		} = params;
		const {
			actionId,
			actionParams
		} = button;
		const handler = handlerRegistry[actionId];
		if (handler) {
			handler({
				actionId,
				actionParams,
				message,
				dialogId
			});
		}
	}
	function requestButtonHandler() {
	}
	function linkButtonHandler(params) {
		const {
			url
		} = params.button;
		const isUrl = im_v2_lib_utils.Utils.text.checkUrl(url);
		if (!isUrl) {
			return;
		}
		const a = main_core.Dom.create({
			tag: 'a',
			style: {
				display: 'none'
			},
			attrs: {
				href: url
			}
		});
		main_core.Dom.append(a, document.body);
		a.click();
		main_core.Dom.remove(a);
	}

	const ButtonBlock = ui_vue3.defineComponent({
		name: 'ButtonBlock',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		inheritAttrs: false,
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			loading: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			wide: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		computed: {
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			button() {
				return this.block;
			},
			buttonStyle() {
				return ui_vue3_components_button.AirButtonStyle[this.button.design] ?? ui_vue3_components_button.AirButtonStyle.FILLED;
			}
		},
		methods: {
			onButtonClick(event) {
				handleClick({
					event,
					message: this.message,
					dialogId: this.dialogId,
					button: this.button
				});
				this.$emit('click', event);
			}
		},
		template: `
		<UiButton
			:text="button.title"
			:style="buttonStyle"
			:size="ButtonSize.MEDIUM"
			:loading="loading"
			:disabled="disabled"
			:wide="wide"
			@click="onButtonClick"
		/>
	`
	});

	const CardBlock = ui_vue3.defineComponent({
		name: 'CardBlock',
		components: {
			BaseBlock,
			TextContent,
			ButtonBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			cardBlock() {
				return this.block;
			},
			imageSource() {
				const isImage = im_v2_lib_utils.Utils.text.isUrlImageLike(this.cardBlock.imageUrl);
				if (!isImage) {
					return '';
				}
				return this.cardBlock.imageUrl;
			},
			hasTitle() {
				return main_core.Type.isStringFilled(this.cardBlock.title);
			},
			hasText() {
				return main_core.Type.isStringFilled(this.formattedText);
			},
			hasButtons() {
				return main_core.Type.isArrayFilled(this.cardBlock.buttons);
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeText(this.cardBlock.text);
			},
			purifiedText() {
				return im_v2_lib_parser.Parser.purifyText(this.cardBlock.text);
			},
			buttons() {
				return this.cardBlock.buttons ?? [];
			}
		},
		methods: {
			getButtonUniqueKey(button) {
				const b = button;
				return [b.type, b.title ?? '', b.actionId ?? '', b.url ?? ''].join('|');
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="cardBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-card__container">
				<img
					v-if="imageSource" 
					:src="imageSource"
					alt=""
					class="bx-im-message-block-card__image"
				> 
				<div class="bx-im-message-block-card__content">
					<div class="bx-im-message-block-card__text">
						<div
							v-if="hasTitle"
							:title="cardBlock.title"
							class="bx-im-message-block-card__title --line-clamp-2"
						>
							{{ cardBlock.title }}
						</div>
						<div 
							v-if="hasText" 
							:title="purifiedText"
							class="bx-im-message-block-card__description" 
						>
							<TextContent :text="formattedText" />
						</div>
					</div>
					<div v-if="hasButtons" class="bx-im-message-block-card__buttons">
						<div 
							v-for="(buttonsRow, rowIndex) in buttons" 
							:key="rowIndex" 
							class="bx-im-message-block-card__buttons-row"
						>
							<ButtonBlock
								v-for="button in buttonsRow"
								:key="getButtonUniqueKey(button)"
								:block="button"
								:dialogId="dialogId"
								:message="message"
							/>
						</div>
					</div>
				</div>
			</div>
		</BaseBlock>
	`
	});

	const BaseFileItem = ui_vue3.defineComponent({
		name: 'BaseFileItem',
		components: {
			ProgressBar: im_v2_component_elements_progressbar.ProgressBar,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			id: {
				type: [String, Number],
				required: true
			},
			messageId: {
				type: [String, Number],
				required: true
			}
		},
		emits: ['cancelClick', 'openContextMenu'],
		computed: {
			ProgressBarSize: () => im_v2_component_elements_progressbar.ProgressBarSize,
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			file() {
				return this.$store.getters['files/get'](this.id, true);
			},
			fileShortName() {
				const NAME_MAX_LENGTH = 20;
				return im_v2_lib_utils.Utils.file.getShortFileName(this.file.name, NAME_MAX_LENGTH);
			},
			fileSize() {
				return im_v2_lib_utils.Utils.file.formatFileSize(this.file.size);
			},
			iconClass() {
				const iconType = im_v2_lib_utils.Utils.file.getIconTypeByFilename(this.file.name);
				return `ui-icon-file-${iconType}`;
			},
			canBeOpenedWithViewer() {
				return Boolean(this.file.viewerAttrs && BX.UI?.Viewer);
			},
			viewerAttributes() {
				return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
					viewerAttributes: this.file.viewerAttrs,
					previewImageSrc: this.file.urlPreview,
					context: im_v2_const.FileViewerContext.dialog
				});
			},
			isLoaded() {
				return this.file.progress === 100;
			},
			imageStyles() {
				return {
					backgroundImage: `url(${this.file.urlPreview})`
				};
			},
			hasPreview() {
				return main_core.Type.isStringFilled(this.file.urlPreview);
			}
		},
		methods: {
			download() {
				if (this.file.progress !== 100 || this.canBeOpenedWithViewer) {
					return;
				}
				window.open(this.file.urlDownload, '_blank');
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			},
			openContextMenu(event) {
				this.$emit('openContextMenu', {
					event,
					fileId: this.id
				});
			},
			onCancelClick(event) {
				this.$emit('cancelClick', event);
			}
		},
		template: `
		<div class="bx-im-base-file-item__container">
			<div class="bx-im-base-file-item__viewer-container" v-bind="viewerAttributes" @click="download">
				<div class="bx-im-base-file-item__icon-container" ref="loader-icon">
					<ProgressBar 
						v-if="!isLoaded" 
						:item="file"
						:size="ProgressBarSize.S"
						@cancelClick="onCancelClick"
					/>
				<div v-if="hasPreview" :style="imageStyles" class="bx-im-base-file-item__image"></div>
					<div v-else :class="iconClass" class="bx-im-base-file-item__type-icon ui-icon"><i></i></div>
				</div>
				<div class="bx-im-base-file-item__content">
					<span :title="file.name" class="bx-im-base-file-item__title">
						{{ fileShortName }}
					</span>
					<div class="bx-im-base-file-item__size">{{ fileSize }}</div>
				</div>
			</div>
			<BIcon
				:name="OutlineIcons.DOWNLOAD"
				:class="{'--not-active': !isLoaded}"
				:hoverable="isLoaded"
				class="bx-im-base-file-item__download-icon"
				@click.stop="openContextMenu"
			/>
		</div>
	`
	});

	const FileBlock = ui_vue3.defineComponent({
		name: 'FileBlock',
		components: {
			BaseBlock,
			BaseFileItem
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				contextMenu: null
			};
		},
		computed: {
			fileBlock() {
				return this.block;
			},
			files() {
				const fileIds = main_core.Type.isArrayFilled(this.fileBlock.fileIds) ? this.fileBlock.fileIds : [];
				return fileIds.map(fileId => {
					return this.$store.getters['files/get'](fileId);
				}).filter(file => {
					return file !== null;
				});
			},
			hasFiles() {
				return this.files.length > 0;
			},
			hasDownloadAllLink() {
				return this.files.length > 1 && this.downloadAllText !== '';
			},
			downloadAllText() {
				const totalSize = this.files.reduce((size, file) => size + file.size, 0);
				return main_core.Loc.getMessagePlural('IM_MESSAGE_BUILDER_FILE_DOWNLOAD_ALL', this.files.length, {
					'#COUNT#': String(this.files.length),
					'#SIZE#': im_v2_lib_utils.Utils.file.formatFileSize(totalSize)
				}) ?? '';
			}
		},
		created() {
			this.contextMenu = new im_v2_lib_menu.BaseFileContextMenu();
		},
		beforeUnmount() {
			this.contextMenu?.destroy();
		},
		methods: {
			onOpenContextMenu({
				event,
				fileId
			}) {
				const file = this.files.find(item => item.id === fileId);
				if (!file) {
					return;
				}
				const context = {
					dialogId: this.dialogId,
					fileId,
					files: [fileId]
				};
				this.contextMenu?.openMenu(context, event.target);
			},
			async onDownloadAllClick() {
				im_v2_lib_utils.Utils.file.downloadFiles(this.files);
				const promoManager = im_v2_lib_promo.PromoManager.getInstance();
				const needToShowPopup = promoManager.needToShow(im_v2_const.PromoId.downloadSeveralFiles);
				if (!needToShowPopup || !im_v2_lib_utils.Utils.browser.isChrome() || im_v2_lib_utils.Utils.platform.isBitrixDesktop()) {
					return;
				}
				await im_v2_lib_confirm.showDownloadAllFilesConfirm();
				void promoManager.markAsWatched(im_v2_const.PromoId.downloadSeveralFiles);
			}
		},
		template: `
		<BaseBlock
			v-if="hasFiles"
			:message="message"
			:block="fileBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-file__container" data-testid="im-message-block-file">
				<BaseFileItem
					v-for="file in files"
					:key="file.id"
					:id="file.id"
					:messageId="message.id"
					data-testid="im-message-block-file-item"
					@openContextMenu="onOpenContextMenu"
				/>
				<template v-if="hasDownloadAllLink">
					<div class="bx-im-message-block-file__divider"></div>
					<button
						type="button"
						class="bx-im-message-block-file__download-all"
						data-testid="im-message-block-file-download-all"
						@click="onDownloadAllClick"
					>{{ downloadAllText }}</button>
				</template>
			</div>
		</BaseBlock>
	`
	});

	const Checkbox = ui_system_checkbox.Vue.Checkbox;
	const FormFieldCheckbox = ui_vue3.defineComponent({
		name: 'FormFieldCheckbox',
		components: {
			Checkbox
		},
		props: {
			field: {
				type: Object,
				required: true
			},
			value: {
				type: Array,
				default: () => []
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value'],
		computed: {
			options() {
				return this.field.options ?? [];
			}
		},
		methods: {
			isChecked(optionId) {
				return this.value.includes(optionId);
			},
			handleToggle(optionId, checked) {
				const selected = new Set(this.value);
				if (checked) {
					selected.add(optionId);
				} else {
					selected.delete(optionId);
				}
				const nextValue = this.options.filter(option => selected.has(option.id)).map(option => option.id);
				this.$emit('update:value', nextValue);
			}
		},
		template: `
		<div class="bx-im-message-block-form__field bx-im-message-block-form__field--group" :data-testid="'im-message-form-field-' + field.id">
			<div v-if="field.label" :id="'im-form-group-' + field.id" class="bx-im-message-block-form__field-label">{{ field.label }}</div>
			<div
				class="bx-im-message-block-form__options"
				role="group"
				:aria-labelledby="field.label ? 'im-form-group-' + field.id : null"
			>
				<div
					v-for="option in options"
					:key="option.id"
					class="bx-im-message-block-form__option"
					:data-testid="'im-message-form-option-' + option.id"
				>
					<Checkbox
						:modelValue="isChecked(option.id)"
						:disabled="disabled"
						:aria-label="option.label"
						@update:modelValue="handleToggle(option.id, $event)"
					/>
					<span class="bx-im-message-block-form__option-label">{{ option.label }}</span>
				</div>
			</div>
		</div>
	`
	});

	const RadioButton = ui_system_radiobutton.Vue.RadioButton;
	const FormFieldRadio = ui_vue3.defineComponent({
		name: 'FormFieldRadio',
		components: {
			RadioButton
		},
		props: {
			field: {
				type: Object,
				required: true
			},
			value: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value'],
		computed: {
			options() {
				return this.field.options ?? [];
			},
			groupName() {
				return `field-${this.field.id}`;
			}
		},
		methods: {
			handleChange(optionId, checked) {
				if (checked) {
					this.$emit('update:value', optionId);
				}
			}
		},
		template: `
		<div class="bx-im-message-block-form__field bx-im-message-block-form__field--group" :data-testid="'im-message-form-field-' + field.id">
			<div v-if="field.label" :id="'im-form-group-' + field.id" class="bx-im-message-block-form__field-label">{{ field.label }}</div>
			<div
				class="bx-im-message-block-form__options"
				role="radiogroup"
				:aria-labelledby="field.label ? 'im-form-group-' + field.id : null"
			>
				<div
					v-for="option in options"
					:key="option.id"
					class="bx-im-message-block-form__option"
					:data-testid="'im-message-form-option-' + option.id"
				>
					<RadioButton
						:modelValue="option.id === value"
						:group="groupName"
						:disabled="disabled"
						:aria-label="option.label"
						@update:modelValue="handleChange(option.id, $event)"
					/>
					<span class="bx-im-message-block-form__option-label">{{ option.label }}</span>
				</div>
			</div>
		</div>
	`
	});

	const FormFieldSelect = ui_vue3.defineComponent({
		name: 'FormFieldSelect',
		components: {
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			field: {
				type: Object,
				required: true
			},
			value: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value'],
		data() {
			return {
				isShown: false
			};
		},
		computed: {
			options() {
				return this.field.options ?? [];
			},
			selectedLabel() {
				const selected = this.options.find(option => option.id === this.value);
				return selected ? selected.label : '';
			},
			design() {
				return this.disabled ? ui_system_input_vue.InputDesign.Disabled : ui_system_input_vue.InputDesign.Grey;
			},
			menuOptions() {
				return {
					bindElement: this.$refs.input.$el,
					closeOnItemClick: false,
					targetContainer: document.body,
					items: this.options.map(option => {
						return {
							title: option.label,
							isSelected: option.id === this.value,
							design: ui_system_menu_vue.MenuItemDesign.Default,
							onClick: () => {
								this.$emit('update:value', option.id);
								this.isShown = false;
							}
						};
					})
				};
			}
		},
		methods: {
			handleInputClick() {
				if (this.disabled) {
					return;
				}
				this.isShown = true;
			}
		},
		template: `
		<div class="bx-im-message-block-form__field" :data-testid="'im-message-form-field-' + field.id">
			<BInput
				:modelValue="selectedLabel"
				:label="field.label"
				dropdown
				clickable
				readonly
				stretched
				:active="isShown"
				:design="design"
				ref="input"
				:data-testid="'im-message-form-select-' + field.id"
				@click="handleInputClick"
			/>
			<BMenu
				v-if="isShown"
				:options="menuOptions"
				@close="isShown = false"
			/>
		</div>
	`
	});

	const MULTILINE_ROWS = 4;
	const FormFieldText = ui_vue3.defineComponent({
		name: 'FormFieldText',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			field: {
				type: Object,
				required: true
			},
			value: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:value'],
		computed: {
			fieldValue: {
				get() {
					return this.value;
				},
				set(nextValue) {
					this.$emit('update:value', nextValue);
				}
			},
			rowsQuantity() {
				return this.field.type === im_v2_const.FormFieldType.multilineText ? MULTILINE_ROWS : 1;
			},
			design() {
				return this.disabled ? ui_system_input_vue.InputDesign.Disabled : ui_system_input_vue.InputDesign.Grey;
			}
		},
		template: `
		<div class="bx-im-message-block-form__field" :data-testid="'im-message-form-field-' + field.id">
			<BInput
				v-model="fieldValue"
				:rowsQuantity="rowsQuantity"
				:label="field.label"
				:placeholder="field.placeholder"
				:design="design"
				stretched
			/>
		</div>
	`
	});

	const FIELD_COMPONENT_BY_TYPE = {
		[im_v2_const.FormFieldType.singleLineText]: FormFieldText,
		[im_v2_const.FormFieldType.multilineText]: FormFieldText,
		[im_v2_const.FormFieldType.select]: FormFieldSelect,
		[im_v2_const.FormFieldType.radio]: FormFieldRadio,
		[im_v2_const.FormFieldType.checkbox]: FormFieldCheckbox
	};
	const FormBlock = ui_vue3.defineComponent({
		name: 'FormBlock',
		components: {
			BaseBlock,
			ButtonBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			const values = {};
			const elements = this.block.elements ?? [];
			for (const field of elements) {
				values[field.id] = field.type === im_v2_const.FormFieldType.checkbox ? [] : '';
			}
			return {
				values,
				isSubmitting: false,
				hasSubmitError: false
			};
		},
		computed: {
			formBlock() {
				return this.block;
			},
			elements() {
				return this.formBlock.elements ?? [];
			},
			buttonRows() {
				return this.formBlock.buttons ?? [];
			},
			resolvedFields() {
				return this.elements.map(field => {
					return {
						field,
						component: this.getFieldComponent(field.type)
					};
				});
			}
		},
		watch: {
			block() {
				this.isSubmitting = false;
				this.hasSubmitError = false;
			}
		},
		methods: {
			getFieldComponent(type) {
				return FIELD_COMPONENT_BY_TYPE[type] ?? null;
			},
			isFieldDisabled(field) {
				return field.disabled || this.isSubmitting;
			},
			onFieldValueUpdate(fieldId, value) {
				this.values[fieldId] = value;
			},
			async onSubmitClick(button) {
				if (this.isSubmitting || button.disabled) {
					return;
				}
				this.isSubmitting = true;
				this.hasSubmitError = false;
				const values = {};
				for (const field of this.elements) {
					const value = this.values[field.id];
					if (!field.disabled && value !== undefined && value !== '') {
						values[field.id] = value;
					}
				}
				const payload = {
					messageId: this.message.id,
					blockId: this.block.id,
					buttonId: button.id,
					values
				};
				try {
					await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMessageBlockFormSubmit, {
						data: payload
					});
					this.isSubmitting = false;
				} catch (errors) {
					this.isSubmitting = false;
					this.hasSubmitError = true;
					this.logSubmitErrors(errors);
				}
			},
			logSubmitErrors(errors) {
				const list = Array.isArray(errors) ? errors : [errors];
				list.forEach(error => {
					console.error(`FormBlock: submit error: code: ${error?.code} message: ${error?.message}`);
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="formBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-form__container" data-testid="im-message-form">
				<div v-if="elements.length > 0" class="bx-im-message-block-form__fields" data-testid="im-message-form-fields">
					<template v-for="{ field, component } in resolvedFields" :key="field.id">
						<component
							v-if="component"
							:is="component"
							:field="field"
							:value="values[field.id]"
							:disabled="isFieldDisabled(field)"
							@update:value="onFieldValueUpdate(field.id, $event)"
						/>
					</template>
				</div>
				<div v-if="buttonRows.length > 0" class="bx-im-message-block-form__buttons" data-testid="im-message-form-buttons">
					<div
						v-for="(buttonsRow, rowIndex) in buttonRows"
						:key="rowIndex"
						class="bx-im-message-block-form__buttons-row"
					>
						<!-- ButtonBlock has inheritAttrs: false, so data-testid can't pass through to its root.
							 The transparent (display: contents) wrapper carries the testid without changing the wide layout. -->
						<div
							v-for="button in buttonsRow"
							:key="button.id"
							style="display: contents;"
							data-testid="im-message-form-submit"
						>
							<ButtonBlock
								:block="button"
								:dialogId="dialogId"
								:message="message"
								:loading="isSubmitting"
								:disabled="button.disabled || isSubmitting"
								:wide="true"
								@click="onSubmitClick(button)"
							/>
						</div>
					</div>
					<div v-if="hasSubmitError" class="bx-im-message-block-form__error" role="alert" data-testid="im-message-form-error">
						{{ loc('IM_MESSAGE_BUILDER_FORM_SUBMIT_ERROR') }}
					</div>
				</div>
			</div>
		</BaseBlock>
	`
	});

	const GalleryBlock = ui_vue3.defineComponent({
		name: 'GalleryBlock',
		components: {
			BaseBlock,
			MediaGallery: im_v2_component_elements_mediaGallery.MediaGallery
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			galleryBlock() {
				return this.block;
			},
			mediaFiles() {
				return this.galleryBlock.fileIds.map(fileId => {
					return this.$store.getters['files/get'](fileId);
				}).filter(file => {
					return file !== null;
				});
			},
			hasMediaFiles() {
				return this.mediaFiles.length > 0;
			}
		},
		template: `
		<BaseBlock
			v-if="hasMediaFiles"
			:message="message"
			:block="galleryBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-gallery-card__container">
				<MediaGallery
					:files="mediaFiles"
					:viewerGroupBy="galleryBlock.id"
				/>
			</div>
		</BaseBlock>
	`
	});

	const LineDivider = ui_vue3.defineComponent({
		name: 'LineDivider',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			lineDividerBlock() {
				return this.block;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="lineDividerBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-line-divider__container">
				<div class="bx-im-message-block-line-divider__line"></div>
			</div>
		</BaseBlock>
	`
	});

	const SourcePopup = ui_vue3.defineComponent({
		name: 'SourcePopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup
		},
		props: {
			id: {
				type: String,
				required: true
			},
			source: {
				type: Object,
				required: true
			},
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close', 'mouseEnter', 'mouseLeave'],
		computed: {
			sourceItem() {
				return this.source;
			},
			popupConfig() {
				return {
					bindElement: this.bindElement,
					targetContainer: document.body,
					autoHide: true,
					angle: {
						offset: 50
					},
					bindOptions: {
						position: 'top'
					},
					padding: 0
				};
			},
			metaData() {
				return this.sourceItem.metaData;
			},
			title() {
				if (this.metaData?.title) {
					return this.metaData.title;
				}
				return im_v2_lib_utils.Utils.text.getHostFromUrl(this.sourceItem.url);
			},
			description() {
				return this.metaData?.description;
			}
		},
		template: `
		<MessengerPopup
			:id="id"
			:config="popupConfig"
			@close="$emit('close')"
		>
			<div
				class="bx-im-source-popup__container"
				@mouseenter="$emit('mouseEnter')"
				@mouseleave="$emit('mouseLeave')"
			>
				<a :href="sourceItem.url" target="_blank" class="bx-im-source-popup__link">
					<div class="bx-im-source-popup__title --ellipsis">
						{{ title }}
					</div>
					<div 
						v-if="description" 
						class="bx-im-source-popup__description --line-clamp-2"
					>
						{{ description }}
					</div>
					<div class="bx-im-source-popup__url --ellipsis">{{ sourceItem.url }}</div>
				</a>
			</div>
		</MessengerPopup>
	`
	});

	const HIDE_DELAY = 100;
	const SourceHandler = ui_vue3.defineComponent({
		name: 'SourceHandler',
		components: {
			SourcePopup
		},
		props: {
			block: {
				type: Object,
				required: true
			},
			messageId: {
				type: Number,
				required: true
			}
		},
		setup() {
			return {
				hideTimeout: 0
			};
		},
		data() {
			return {
				showPopup: false,
				currentSource: null,
				bindElement: null
			};
		},
		computed: {
			popupId() {
				const uuid = im_v2_lib_utils.Utils.text.getUuidV4();
				return `im-source-popup-${uuid}`;
			}
		},
		methods: {
			onClick(event) {
				const sourceElement = event.target.closest('[data-source-id]');
				if (!sourceElement) {
					return;
				}
				const source = this.getSourceForId(sourceElement.dataset.sourceId);
				if (!source) {
					return;
				}
				const isUrl = im_v2_lib_utils.Utils.text.checkUrl(source.url);
				if (!isUrl) {
					return;
				}
				im_v2_lib_utils.Utils.browser.openLink(source.url);
			},
			onMouseOver(event) {
				const sourceElement = event.target.closest('[data-source-id]');
				if (!sourceElement) {
					this.startHideTimer();
					return;
				}
				const hasActivePopupForElement = this.bindElement === sourceElement && this.showPopup;
				if (hasActivePopupForElement) {
					this.clearHideTimer();
					return;
				}
				const source = this.getSourceForId(sourceElement.dataset.sourceId);
				if (!source) {
					return;
				}
				this.clearHideTimer();
				this.showPopup = false;
				this.currentSource = source;
				this.bindElement = sourceElement;
				void this.$nextTick(() => {
					this.showPopup = true;
				});
			},
			onMouseLeave() {
				this.startHideTimer();
			},
			onPopupMouseEnter() {
				this.clearHideTimer();
			},
			startHideTimer() {
				clearTimeout(this.hideTimeout);
				this.hideTimeout = setTimeout(() => {
					this.showPopup = false;
				}, HIDE_DELAY);
			},
			clearHideTimer() {
				clearTimeout(this.hideTimeout);
			},
			getSourceForId(sourceId) {
				const blockSources = this.block.sources ?? {};
				const rawSource = blockSources[sourceId];
				if (!rawSource) {
					return null;
				}
				return rawSource;
			}
		},
		template: `
		<div @click="onClick" @mouseover="onMouseOver" @mouseleave="onMouseLeave">
			<slot></slot>
		</div>
		<SourcePopup
			v-if="showPopup"
			:id="popupId"
			:source="currentSource"
			:bindElement="bindElement"
			@close="showPopup = false"
			@mouseEnter="onPopupMouseEnter"
			@mouseLeave="onMouseLeave"
		/>
	`
	});

	const BuilderTextContent = ui_vue3.defineComponent({
		name: 'BuilderTextContent',
		components: {
			TextContent
		},
		props: {
			text: {
				type: String,
				required: true
			}
		},
		computed: {
			formattedText() {
				return im_v2_lib_parser.Parser.decodeInlineSourceLinks(this.text);
			}
		},
		template: `
		<TextContent :text="formattedText" />
	`
	});

	const getTextColorClass = (listItem, listBlock) => {
		const color = listItem.color || listBlock.color || null;
		const plainKey = color;
		const gradientKey = color;
		if (!im_v2_const.MessageBuilderPlainColorToken[plainKey] && !im_v2_const.MessageBuilderGradientColorToken[gradientKey]) {
			return '';
		}
		return color ? `--color-${color}` : '';
	};

	const getIconColorClass = (listItem, listBlock) => {
		const itemIconColor = listItem.icon?.color;
		const blockIconColor = listBlock.icon?.color;
		const itemColor = listItem.color;
		const blockColor = listBlock.color;
		const color = itemIconColor || blockIconColor || itemColor || blockColor;
		if (!im_v2_const.MessageBuilderPlainColorToken[color]) {
			return '';
		}
		return color ? `--color-${color}` : '';
	};

	const IconMap = {
		chevron_to_the_left: ui_iconSet_api_vue.Outline.CHEVRON_LEFT_L,
		chevron_to_the_right: ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_L,
		chevron_up: ui_iconSet_api_vue.Outline.CHEVRON_TOP_L,
		chevron_down: ui_iconSet_api_vue.Outline.CHEVRON_DOWN_L,
		arrow_to_the_left: ui_iconSet_api_vue.Outline.ARROW_LEFT_L,
		arrow_to_the_right: ui_iconSet_api_vue.Outline.ARROW_RIGHT_L,
		arrow_top: ui_iconSet_api_vue.Outline.ARROW_TOP_L,
		arrow_down: ui_iconSet_api_vue.Outline.ARROW_DOWN_L,
		circle_check: ui_iconSet_api_vue.Outline.CIRCLE_CHECK,
		alert_accent: ui_iconSet_api_vue.Outline.ALERT_ACCENT,
		clock: ui_iconSet_api_vue.Outline.CLOCK,
		search: ui_iconSet_api_vue.Outline.SEARCH,
		fire: ui_iconSet_api_vue.Outline.FIRE,
		task: ui_iconSet_api_vue.Outline.TASK,
		crm: ui_iconSet_api_vue.Outline.CRM,
		file: ui_iconSet_api_vue.Outline.FILE,
		mail: ui_iconSet_api_vue.Outline.MAIL,
		message: ui_iconSet_api_vue.Outline.MESSAGE,
		phone_up: ui_iconSet_api_vue.Outline.PHONE_UP,
		calendar_with_slots: ui_iconSet_api_vue.Outline.CALENDAR_WITH_SLOTS,
		attach: ui_iconSet_api_vue.Outline.ATTACH,
		location: ui_iconSet_api_vue.Outline.LOCATION,
		person: ui_iconSet_api_vue.Outline.PERSON,
		graduation_cap: ui_iconSet_api_vue.Outline.GRADUATION_CAP,
		shopping_cart: ui_iconSet_api_vue.Outline.SHOPPING_CART,
		wallet: ui_iconSet_api_vue.Outline.WALLET,
		collab: ui_iconSet_api_vue.Outline.COLLAB,
		developer_resources: ui_iconSet_api_vue.Outline.DEVELOPER_RESOURCES,
		services: ui_iconSet_api_vue.Outline.SERVICES,
		idea_lamp: ui_iconSet_api_vue.Outline.IDEA_LAMP,
		gift: ui_iconSet_api_vue.Outline.GIFT,
		cloud: ui_iconSet_api_vue.Outline.CLOUD,
		notification: ui_iconSet_api_vue.Outline.NOTIFICATION
	};

	const DEFAULT_ICON = 'bullet';
	const ListItem = ui_vue3.defineComponent({
		name: 'ListItem',
		components: {
			BuilderTextContent,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			block: {
				type: Object,
				required: true
			},
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			listBlock() {
				return this.block;
			},
			listItem() {
				return this.item;
			},
			iconColorClass() {
				return getIconColorClass(this.listItem, this.listBlock);
			},
			textColorClass() {
				return getTextColorClass(this.listItem, this.listBlock);
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeInlineText(this.listItem.text);
			},
			itemIconType() {
				const iconType = this.listItem.icon?.type || this.listBlock.icon?.type;
				if (!IconMap[iconType]) {
					return DEFAULT_ICON;
				}
				return IconMap[iconType];
			},
			isDefaultIcon() {
				return this.itemIconType === DEFAULT_ICON;
			}
		},
		template: `
		<li class="bx-im-message-block-unordered-list-item__container" data-testid="message-builder-unordered-list-item">
			<span
				class="bx-im-message-block-unordered-list-item__marker"
				:class="iconColorClass"
			>
				<span 
					v-if="isDefaultIcon" 
					class="bx-im-message-block-unordered-list-item__bullet"
				>
					&bull;
				</span>
				<BIcon
					v-else
					:name="itemIconType"
					class="bx-im-message-block-unordered-list-item__icon"
				/>
			</span>
			<span :class="textColorClass">
				<BuilderTextContent :text="formattedText" />
			</span>
		</li>
	`
	});

	const UnorderedList = ui_vue3.defineComponent({
		name: 'UnorderedList',
		components: {
			ListItem
		},
		props: {
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			listBlock() {
				return this.block;
			}
		},
		template: `
		<ul class="bx-im-message-block-unordered-list__container">
			<ListItem
				v-for="(item, index) in listBlock.elements"
				:key="index"
				:block="listBlock"
				:item="item"
			/>
		</ul>
	`
	});

	const OrderedList = ui_vue3.defineComponent({
		name: 'OrderedList',
		components: {
			BuilderTextContent
		},
		props: {
			block: {
				type: Object,
				required: true
			}
		},
		computed: {
			listBlock() {
				return this.block;
			}
		},
		methods: {
			getFormattedText(text) {
				return im_v2_lib_parser.Parser.decodeInlineText(text);
			},
			getTextColorClass(item) {
				return getTextColorClass(item, this.listBlock);
			},
			getIconColorClass(item) {
				return getIconColorClass(item, this.listBlock);
			}
		},
		template: `
		<ol class="bx-im-message-block-ordered-list__container" data-testid="message-builder-ordered-list">
			<li
				v-for="(item, index) in listBlock.elements"
				:key="index"
				class="bx-im-message-block-ordered-list__item"
				data-testid="message-builder-ordered-list-item"
			>
				<span
					class="bx-im-message-block-ordered-list__marker"
					:class="getIconColorClass(item)"
				>{{ index + 1 }}.</span>
				<span :class="getTextColorClass(item)">
					<BuilderTextContent :text="getFormattedText(item.text)" />
				</span>
			</li>
		</ol>
	`
	});

	const ListBlock = ui_vue3.defineComponent({
		name: 'ListBlock',
		components: {
			BaseBlock,
			ExpandAnimation: im_v2_component_animation.ExpandAnimation,
			BIcon: ui_iconSet_api_vue.BIcon,
			SourceHandler
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isOpened: true
			};
		},
		computed: {
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			listBlock() {
				return this.block;
			},
			listComponent() {
				const typeToComponent = {
					orderedList: OrderedList,
					unorderedList: UnorderedList
				};
				return typeToComponent[this.listBlock.type] ?? UnorderedList;
			},
			fold() {
				return this.listBlock.fold;
			},
			isFoldable() {
				return main_core.Type.isPlainObject(this.fold);
			},
			foldTitle() {
				return this.fold?.title ?? '';
			}
		},
		created() {
			this.isOpened = this.fold?.isOpened ?? true;
		},
		methods: {
			toggle() {
				this.isOpened = !this.isOpened;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="listBlock"
			:dialogId="dialogId"
		>
			<div
				v-if="isFoldable"
				class="bx-im-message-block-list-fold__header"
				@click="toggle"
			>
				<div class="bx-im-message-block-list-fold__title">{{ foldTitle }}</div>
				<BIcon
					:name="OutlineIcons.CHEVRON_DOWN_L"
					:class="{ '--folded': !isOpened }"
					class="bx-im-message-block-list-fold__icon"
				/>
			</div>
			<ExpandAnimation>
				<div v-if="isOpened">
					<SourceHandler :block="listBlock" :messageId="message.id">
						<component :is="listComponent" :block="listBlock" />
					</SourceHandler>
				</div>
			</ExpandAnimation>
		</BaseBlock>
	`
	});

	const MapBlock = ui_vue3.defineComponent({
		name: 'MapBlock',
		components: {
			BaseBlock,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			OutlineIcons() {
				return ui_iconSet_api_vue.Outline;
			},
			mapBlock() {
				return this.block;
			},
			hasStatus() {
				return main_core.Type.isStringFilled(this.mapBlock.status);
			},
			hasText() {
				return main_core.Type.isStringFilled(this.mapBlock.text);
			},
			imageSource() {
				const isImage = im_v2_lib_utils.Utils.text.isUrlImageLike(this.mapBlock.imageUrl);
				if (!isImage) {
					return '';
				}
				return this.mapBlock.imageUrl;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="block"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-map__container">
				<div class="bx-im-message-block-map__image-container">
					<img :src="imageSource" :alt="mapBlock.text" class="bx-im-message-block-map__image">
					<div
						v-if="hasStatus"
						:title="mapBlock.status"
						class="bx-im-message-block-map__location-status --ellipsis"
					>
						{{ mapBlock.status }}
					</div>
				</div>
				<div v-if="hasText" class="bx-im-message-block-map__location">
					<BIcon :name="OutlineIcons.LOCATION" class="bx-im-message-block-map__location-icon" />
					<div
						:title="mapBlock.text" 
						class="bx-im-message-block-map__location-text --line-clamp-2"
					>
						{{ mapBlock.text }}
					</div>
				</div>
			</div>
		</BaseBlock>
	`
	});

	const SpaceDivider = ui_vue3.defineComponent({
		name: 'SpaceDivider',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			spaceDividerBlock() {
				return this.block;
			},
			containerClasses() {
				return [`--size-${this.spaceDividerBlock.size}`];
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="spaceDividerBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-space-divider__container" :class="containerClasses"></div>
		</BaseBlock>
	`
	});

	const TableBlock = ui_vue3.defineComponent({
		name: 'TableBlock',
		components: {
			BaseBlock,
			BuilderTextContent,
			SourceHandler
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				naturalWidth: 0,
				resizeObserver: null
			};
		},
		data() {
			return {
				isNarrow: false
			};
		},
		computed: {
			tableBlock() {
				return this.block;
			},
			columnCount() {
				return this.tableBlock.rows[0].length ?? 1;
			}
		},
		mounted() {
			this.naturalWidth = this.measureNaturalWidth();
			this.initResizeObserver();
		},
		beforeUnmount() {
			this.resizeObserver.disconnect();
		},
		methods: {
			initResizeObserver() {
				this.resizeObserver = new ResizeObserver(([entry]) => {
					this.isNarrow = entry.contentRect.width < this.naturalWidth;
				});
				this.resizeObserver.observe(this.$refs.container.closest('.bx-im-message-base__wrap'));
			},
			measureNaturalWidth() {
				const COLUMN_GAP = 10;
				const tbody = this.$refs.container.querySelector('tbody');
				const gridTemplateColumns = getComputedStyle(tbody).gridTemplateColumns.split(' ');
				const [firstColumn, secondColumn] = gridTemplateColumns.map(element => {
					return parseFloat(element);
				});
				if (secondColumn) {
					return firstColumn + secondColumn + COLUMN_GAP;
				}
				return firstColumn;
			},
			getFormattedText(text) {
				return im_v2_lib_parser.Parser.decodeInlineText(text);
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="tableBlock"
			:dialogId="dialogId"
		>
			<SourceHandler :block="block" :messageId="message.id">
				<div
					:class="{ '--narrow': isNarrow }"
					:style="{ '--im-message-builder-table-cols': columnCount }"
					ref="container"
					class="bx-im-message-block-table__container"
					data-testid="message-builder-table"
				>
					<table class="bx-im-message-block-table__table">
						<tbody>
							<tr
								v-for="(row, rowIndex) in tableBlock.rows"
								:key="rowIndex"
							>
								<td
									v-for="(cell, cellIndex) in row"
									:key="cellIndex"
									data-testid="message-builder-table-cell"
								>
									<BuilderTextContent
										:text="getFormattedText(cell.text)"
										class="--line-clamp-3"
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</SourceHandler>
		</BaseBlock>
	`
	});

	const TextBlock = ui_vue3.defineComponent({
		name: 'TextBlock',
		components: {
			BaseBlock,
			BuilderTextContent,
			SourceHandler
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			textBlock() {
				return this.block;
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeText(this.textBlock.text);
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="textBlock"
			:dialogId="dialogId"
		>
			<SourceHandler :block="block" :messageId="message.id">
				<BuilderTextContent :text="formattedText" />
			</SourceHandler>
		</BaseBlock>
	`
	});

	const TitleBlock = ui_vue3.defineComponent({
		name: 'TitleBlock',
		components: {
			BaseBlock
		},
		props: {
			message: {
				type: Object,
				required: true
			},
			block: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			titleBlock() {
				return this.block;
			},
			containerClasses() {
				const classes = [];
				if (this.titleBlock.color) {
					classes.push(`--color-${this.titleBlock.color}`);
				}
				if (this.titleBlock.size) {
					classes.push(`--size-${this.titleBlock.size}`);
				}
				return classes;
			}
		},
		template: `
		<BaseBlock
			:message="message"
			:block="titleBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-header__container" :class="containerClasses">
				<span
					:title="titleBlock.text"
					class="bx-im-message-block-header__text --line-clamp-3"
				>
					{{ titleBlock.text }}
				</span>
			</div>
		</BaseBlock>
	`
	});

	const UNKNOWN_BLOCK_TYPE = 'unknown';
	const BLOCK_COMPONENT_MAP = {
		title: TitleBlock,
		text: TextBlock,
		unorderedList: ListBlock,
		orderedList: ListBlock,
		map: MapBlock,
		table: TableBlock,
		lineDivider: LineDivider,
		spaceDivider: SpaceDivider,
		aiAssistantSearch: AiAssistantSearch,
		card: CardBlock,
		gallery: GalleryBlock
	};
	const GATED_BLOCK_COMPONENT_MAP = {
		form: {
			feature: im_v2_lib_feature.Feature.isMessageFormBlockAvailable,
			component: FormBlock
		},
		file: {
			feature: im_v2_lib_feature.Feature.isMessageFileAudioBlockAvailable,
			component: FileBlock
		},
		audio: {
			feature: im_v2_lib_feature.Feature.isMessageFileAudioBlockAvailable,
			component: AudioBlock
		}
	};
	const BuilderContent = ui_vue3.defineComponent({
		name: 'BuilderContent',
		components: {
			SourceListButton,
			CardBlock
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			messageBlocks() {
				return this.$store.getters['messages/builder/getBlocks'](this.message.id);
			},
			hasBlocks() {
				return this.messageBlocks.length > 0;
			},
			maxWidthStyles() {
				const REDUCED_WIDTH = 460;
				const blocksWithConstraints = new Set(['gallery', 'map']);
				const needMaxWidth = this.messageBlocks.some(block => blocksWithConstraints.has(block.type));
				return needMaxWidth ? {
					maxWidth: `${REDUCED_WIDTH}px`
				} : {};
			}
		},
		methods: {
			getComponentNameByType(type) {
				const gatedBlock = GATED_BLOCK_COMPONENT_MAP[type];
				if (gatedBlock) {
					const {
						feature,
						component
					} = gatedBlock;
					return component && im_v2_lib_feature.FeatureManager.isFeatureAvailable(feature) ? component : UNKNOWN_BLOCK_TYPE;
				}
				return BLOCK_COMPONENT_MAP[type] || UNKNOWN_BLOCK_TYPE;
			}
		},
		template: `
		<div v-if="hasBlocks" :style="maxWidthStyles" data-testid="im-message-builder-content">
			<component
				v-for="block in messageBlocks"
				:is="getComponentNameByType(block.type)"
				:key="block.id"
				:message="message"
				:block="block"
				:dialogId="dialogId"
			/>
			<SourceListButton :messageBlocks="messageBlocks" :messageId="message.id" />
		</div>
	`
	});

	const DefaultMessageContent = ui_vue3.defineComponent({
		name: 'DefaultMessageContent',
		components: {
			AiTaskStatusRow,
			MessageStatus,
			MessageAttach,
			ReactionList,
			Reply,
			TextContent,
			BuilderContent
		},
		inject: {
			aiTaskLayout: {
				from: AiTaskIndicationLayoutKey,
				default: null
			}
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			},
			withMessageStatus: {
				type: Boolean,
				default: true
			},
			withText: {
				type: Boolean,
				default: true
			},
			withAttach: {
				type: Boolean,
				default: true
			},
			withReply: {
				type: Boolean,
				default: true
			},
			withBuilder: {
				type: Boolean,
				default: false
			},
			withReactions: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			message() {
				return this.item;
			},
			isReply() {
				return this.message.replyId !== 0;
			},
			formattedText() {
				return im_v2_lib_parser.Parser.decodeMessage(this.item);
			},
			canSetReactions() {
				return main_core.Type.isNumber(this.message.id);
			},
			isForward() {
				return this.$store.getters['messages/isForward'](this.message.id);
			},
			hasBuilderBlocks() {
				if (!this.withBuilder) {
					return false;
				}
				return this.$store.getters['messages/builder/hasBlocks'](this.message.id);
			},
			aiTaskStatusLayout() {
				const layout = this.aiTaskLayout;
				return isAiTaskStatusInTimeRow(layout) ? layout : null;
			}
		},
		template: `
		<div class="bx-im-message-default-content__container" :class="{'--no-text': !withText || hasBuilderBlocks}">
			<Reply v-if="isReply && withReply" :dialogId="dialogId" :replyId="message.replyId" :isForward="isForward" />
			<TextContent v-if="withText && !hasBuilderBlocks" :text="formattedText" />
			<BuilderContent v-else :item="item" :dialogId="dialogId"/>
			<div v-if="withAttach && message.attach.length > 0" class="bx-im-message-default-content__attach">
				<MessageAttach :item="message" :dialogId="dialogId" />
			</div>
			<div class="bx-im-message-default-content__bottom-panel">
				<ReactionList
					v-if="withReactions && canSetReactions"
					:messageId="message.id"
					class="bx-im-message-default-content__reaction-list"
				/>
				<AiTaskStatusRow v-if="aiTaskStatusLayout" :message="message" :layout="aiTaskStatusLayout" />
				<div v-if="withMessageStatus" class="bx-im-message-default-content__status-container">
					<MessageStatus :item="message" />
				</div>
			</div>
		</div>
	`
	});

	const CompactCommentsPanel = ui_vue3.defineComponent({
		name: 'CompactCommentsPanel',
		components: {
			CommentsPanel
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			dialogId: {
				type: String,
				required: true
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId);
			},
			message() {
				return this.item;
			},
			isChannelPost() {
				return im_v2_lib_channel.ChannelManager.isChannel(this.dialogId);
			},
			isSystemMessage() {
				return this.message.authorId === 0;
			},
			showCommentsPanel() {
				return this.isChannelPost && !this.isSystemMessage;
			}
		},
		methods: {
			hasComments(totalCount) {
				return totalCount > 0;
			},
			hasUnreadComments(unreadCount) {
				return main_core.Type.isStringFilled(unreadCount);
			}
		},
		template: `
		<CommentsPanel 
			v-if="showCommentsPanel"
			v-slot="{ onCommentsClick, totalCount, unreadCount }"
			:item="item"
			:dialogId="dialogId"
		>
			<div 
				:class="{'--has-comments': hasComments(totalCount)}"
				class="bx-im-message-compact-comments-panel__container"
				@click="onCommentsClick"
			>
				<div class="bx-im-message-compact-comments-panel__icon"></div>
				<div v-if="hasComments(totalCount)" class="bx-im-message-compact-comments-panel__counter-container">
					<div class="bx-im-message-compact-comments-panel__total-counter">
						{{ totalCount }}
					</div>
					<div v-if="hasUnreadComments(unreadCount)" class="bx-im-message-compact-comments-panel__unread-counter">
						{{ unreadCount }}
					</div>
				</div>
			</div>
		</CommentsPanel>
	`
	});

	const VIDEO_SIZE_TO_AUTOPLAY = 5_000_000;
	const MAX_WIDTH = 460;
	const MAX_HEIGHT = 380;
	const MIN_WIDTH = 200;
	const MIN_HEIGHT = 100;
	const DEFAULT_WIDTH = 320;
	const DEFAULT_HEIGHT = 180;
	const VideoItem = ui_vue3.defineComponent({
		name: 'VideoItem',
		components: {
			DefaultVideoPlayer: im_v2_component_elements_player.DefaultVideoPlayer,
			ProgressBar: im_v2_component_elements_progressbar.ProgressBar
		},
		props: {
			id: {
				type: [String, Number],
				required: true
			},
			message: {
				type: Object,
				required: true
			}
		},
		emits: ['cancelClick'],
		computed: {
			messageItem() {
				return this.message;
			},
			file() {
				return this.$store.getters['files/get'](this.id, true);
			},
			autoplay() {
				return this.file.size < VIDEO_SIZE_TO_AUTOPLAY;
			},
			canBeOpenedWithViewer() {
				return Boolean(this.file.viewerAttrs && BX.UI?.Viewer);
			},
			viewerAttributes() {
				return im_v2_lib_utils.Utils.file.getViewerDataAttributes({
					viewerAttributes: this.file.viewerAttrs,
					previewImageSrc: this.file.urlPreview,
					context: im_v2_const.FileViewerContext.dialog
				});
			},
			imageSize() {
				const image = this.file.image;
				let newWidth = image.width;
				let newHeight = image.height;
				if (!newHeight || !newWidth) {
					return {
						width: `${DEFAULT_WIDTH}px`,
						height: `${DEFAULT_HEIGHT}px`
					};
				}
				if (image.width > MAX_WIDTH || image.height > MAX_HEIGHT) {
					const aspectRatio = image.width / image.height;
					if (image.width > MAX_WIDTH) {
						newWidth = MAX_WIDTH;
						newHeight = Math.round(MAX_WIDTH / aspectRatio);
					}
					if (newHeight > MAX_HEIGHT) {
						newWidth = Math.round(MAX_HEIGHT * aspectRatio);
						newHeight = MAX_HEIGHT;
					}
				}
				const sizes = {
					width: Math.max(newWidth, MIN_WIDTH),
					height: Math.max(newHeight, MIN_HEIGHT)
				};
				return {
					width: `${sizes.width}px`,
					height: `${sizes.height}px`,
					'object-fit': sizes.width < 100 || sizes.height < 100 ? 'cover' : 'contain'
				};
			},
			isLoaded() {
				return this.file.progress === 100;
			},
			isForward() {
				return main_core.Type.isStringFilled(this.messageItem.forward.id);
			}
		},
		methods: {
			download() {
				if (this.file.progress !== 100 || this.canBeOpenedWithViewer) {
					return;
				}
				window.open(this.file.urlDownload, '_blank');
			},
			onCancelClick(event) {
				this.$emit('cancelClick', event);
			},
			getHandleStatus() {
				return [im_v2_const.FileStatus.preparing, im_v2_const.FileStatus.progress, im_v2_const.FileStatus.upload];
			},
			getStatusMap() {
				return {
					[im_v2_const.FileStatus.preparing]: {
						iconClass: ui_iconSet_api_vue.Outline.CLOUD,
						labelText: this.$Bitrix.Loc.getMessage('IM_MESSAGE_FILE_PREPARING_PROGRESS_LABEL')
					}
				};
			}
		},
		template: `
		<div
			class="bx-im-video-item__container bx-im-video-item__scope"
			:class="{'--with-forward': isForward}"
			@click="download"
		>
			<ProgressBar 
				:item="file"
				:handleStatus="getHandleStatus()"
				:statusMap="getStatusMap()"
				@cancelClick="onCancelClick"
			/>
			<DefaultVideoPlayer
				:fileId="file.id"
				:src="file.urlDownload"
				:previewImageUrl="file.urlPreview"
				:elementStyle="imageSize"
				:withAutoplay="autoplay"
				:withPlayerControls="isLoaded"
				:viewerAttributes="viewerAttributes"
			/>
		</div>
	`
	});

	exports.AiTaskIndication = AiTaskIndication;
	exports.AiTaskIndicationLayout = AiTaskIndicationLayout;
	exports.AiTaskIndicationLayoutKey = AiTaskIndicationLayoutKey;
	exports.AiTaskStatusRow = AiTaskStatusRow;
	exports.AudioItem = AudioItem;
	exports.AuthorTitle = AuthorTitle;
	exports.BaseFileItem = BaseFileItem;
	exports.BuilderContent = BuilderContent;
	exports.BuilderTextContent = BuilderTextContent;
	exports.ChangeStatus = ChangeStatus;
	exports.CompactCommentsPanel = CompactCommentsPanel;
	exports.ContextMenu = ContextMenu;
	exports.DefaultMessageContent = DefaultMessageContent;
	exports.MessageAttach = MessageAttach;
	exports.MessageDefaultReactionManager = MessageDefaultReactionManager;
	exports.MessageFooter = MessageFooter;
	exports.MessageHeader = MessageHeader;
	exports.MessageKeyboard = MessageKeyboard;
	exports.MessageStatus = MessageStatus;
	exports.ReactionList = ReactionList;
	exports.ReactionSelector = ReactionSelector;
	exports.Reply = Reply;
	exports.RetryButton = RetryButton;
	exports.SourceHandler = SourceHandler;
	exports.SourceListButton = SourceListButton;
	exports.TextContent = TextContent;
	exports.VideoItem = VideoItem;
	exports.hasAiTaskIndication = hasAiTaskIndication;

})(this.BX.Messenger.v2.Component.Message = this.BX.Messenger.v2.Component.Message || {}, BX.Vue3, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.UI.Accessibility, BX.UI.IconSet, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.UI.Reaction.Item, BX.Event, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.Reaction.Item.Vue, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.UI.Reaction.Picker, window, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Lib, BX.UI.System, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Service, BX.Messenger.v2.Component.Animation, BX.Messenger.v2.Service, BX.SidePanel, BX.UI.System.Chip.Vue, BX.UI.SidePanel, BX.UI, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements, BX.Vue3.Components, BX.Messenger.v2.Lib, BX, BX.UI.System.Checkbox, BX.UI.System.RadioButton, BX.UI.System.Input.Vue, BX.UI.System.Menu, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=registry.bundle.js.map
