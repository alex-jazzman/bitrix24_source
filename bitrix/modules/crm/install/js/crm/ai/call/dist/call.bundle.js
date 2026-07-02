/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, ui_vue3, crm_ai_nameService, crm_ai_slider, crm_ai_textbox, crm_audioPlayer, ui_notification, ui_designTokens, crm_timeline_tools, pull_client, pull_queuemanager, ui_lottie, crm_copilot_callAssessmentSelector, crm_router, ui_bbcode_formatter_htmlFormatter) {
	'use strict';

	const ActivityProvider = Object.freeze({
		call: 'VOXIMPLANT_CALL',
		openLine: 'IMOPENLINES_SESSION'
	});
	class Base {
		languageTitle = null;
		activityProvider = null;
		audioPlayerApp = null;
		topElementNode = null;
		constructor(data) {
			this.initDefaultOptions();
			this.activityId = data.activityId;
			this.ownerTypeId = data.ownerTypeId;
			this.ownerId = data.ownerId;
			this.languageTitle = data.languageTitle ?? null;
			this.activityProvider = data.activityProvider ?? null;
			this.jobId = data.jobId ?? null;
			this.textbox = new crm_ai_textbox.Textbox({
				title: this.textboxTitle,
				previousTextContent: this.getTopElementNode(),
				attentions: this.getTextboxAttentions()
			});
			this.sliderId = `${this.id}-${this.activityId}-${this.jobId ?? '0'}`;
			this.wrapperSlider = new crm_ai_slider.Slider({
				url: this.sliderId,
				sliderTitle: this.sliderTitle,
				sliderContentClass: this.getSliderContentClass(),
				width: this.sliderWidth,
				extensions: this.getExtensions(),
				design: this.getSliderDesign(),
				events: this.getSliderEvents(),
				toolbar: this.getSliderToolbar()
			});
		}
		getExtensions() {
			return ['crm.ai.textbox', 'crm.audio-player'];
		}
		getSliderContentClass() {
			return null;
		}
		getSliderDesign() {
			return null;
		}
		getSliderToolbar() {
			return null;
		}
		getSliderEvents() {
			return {
				onLoad: () => {
					this.audioPlayerApp?.attachTemplate();
				},
				onClose: () => {
					this.audioPlayerApp?.detachTemplate();
				}
			};
		}
		open() {
			const content = new Promise((resolve, reject) => {
				this.getAiData().then(response => {
					if (this.activityProvider === ActivityProvider.call) {
						this.audioPlayerApp?.setAudioProps(this.prepareAudioProps(response));
					} else if (this.activityProvider === ActivityProvider.openLine) {
						main_core.Dom.append(this.getOpenLineElementNode(response.data.openline), this.topElementNode);
					}
					const aiJobResult = this.prepareAiJobResult(response);
					this.textbox.setText(aiJobResult);
					this.textbox.render();
					resolve(this.textbox.get());
				}).catch(response => {
					this.showError(response);
					this.wrapperSlider.destroy();
				});
			});
			this.wrapperSlider.setContent(content);
			this.wrapperSlider.open();
		}
		getAiData() {
			const actionData = {
				data: {
					activityId: this.activityId,
					ownerTypeId: this.ownerTypeId,
					ownerId: this.ownerId,
					jobId: this.jobId
				}
			};
			return BX.ajax.runAction(this.aiDataAction, actionData);
		}
		showError(response) {
			ui_notification.UI.Notification.Center.notify({
				content: response.errors[0].message,
				autoHideDelay: 5000
			});
		}
		prepareAiJobResult(response) {
			return '';
		}
		prepareAudioProps(response) {
			const callRecord = response.data.callRecord;
			return {
				id: callRecord.id,
				src: callRecord.src,
				title: callRecord.title,
				context: window.top
			};
		}
		getTextboxAttentions() {
			const attentions = [this.getNotAccurateAttention()];
			const jobLanguageAttention = this.getJobLanguageAttention();
			if (jobLanguageAttention !== null) {
				attentions.push(jobLanguageAttention);
			}
			return attentions;
		}
		getNotAccurateAttention() {
			const helpdeskCode = '20412666';
			const content = main_core.Loc.getMessage(this.getNotAccuratePhraseCode(), {
				'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${helpdeskCode}');">`,
				'[/helpdesklink]': '</a>'
			});
			return new crm_ai_textbox.Attention({
				content
			});
		}
		getJobLanguageAttention() {
			if (!main_core.Type.isStringFilled(this.languageTitle)) {
				return null;
			}
			const helpdeskCode = '20423978';
			const content = main_core.Loc.getMessage('CRM_COPILOT_CALL_JOB_LANGUAGE_ATTENTION', {
				'#LANGUAGE_TITLE#': `<span style="text-transform: lowercase">${main_core.Text.encode(this.languageTitle)}</span>`,
				'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${helpdeskCode}');">`,
				'[/helpdesklink]': '</a>',
				'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
			});
			return new crm_ai_textbox.Attention({
				preset: crm_ai_textbox.AttentionPresets.COPILOT,
				content
			});
		}
		getTopElementNode() {
			if (this.activityProvider === ActivityProvider.call) {
				this.topElementNode = main_core.Tag.render`<div id="crm-textbox-audio-player"></div>`;

				// by default, we attach audio player to the top element node
				this.audioPlayerApp = new crm_audioPlayer.AudioPlayer({
					rootNode: this.topElementNode
				});
			} else if (this.activityProvider === ActivityProvider.openLine) {
				this.topElementNode = main_core.Tag.render`<div id="crm-copilot-textbox__top-container"></div>`;
			}
			return this.topElementNode;
		}
		getOpenLineElementNode(openlineData) {
			const openMessengerSliderFn = dialogId => {
				return () => {
					if (main_core.Type.isStringFilled(dialogId)) {
						top.BXIM.openMessenger(dialogId);
					} else {
						throw new Error('Dialog ID is empty');
					}
				};
			};
			return main_core.Tag.render`
			<a
				style="cursor: pointer; word-break: break-all;"
				onclick="${openMessengerSliderFn(openlineData.dialogId)}"
			>
				${openlineData.name}
			</a>
		`;
		}
		getNotAccuratePhraseCode() {
			return '';
		}
		getSliderTitle() {
			return '';
		}
		getTextboxTitle() {
			return '';
		}
		initDefaultOptions() {}
	}

	const CALL_SCORING_ADD_COMMAND = 'call_scoring_add';
	const CALL_ASSESSMENT_UPDATE_COMMAND = 'call_assessment_update';
	class Pull {
		#callScoringCallback;
		#callAssessmentCallback;
		#unsubscribeFromCallScoring = null;
		#unsubscribeFromCallAssessment = null;
		constructor(callScoringCallback, callAssessmentCallback) {
			this.#callScoringCallback = callScoringCallback;
			this.#callAssessmentCallback = callAssessmentCallback;
		}
		init() {
			if (!pull_client.PULL) {
				console.error('pull is not initialized');
				return;
			}

			// @todo use only one subscribe with many actions in callback
			this.#unsubscribeFromCallScoring = pull_client.PULL.subscribe({
				moduleId: 'crm',
				command: CALL_SCORING_ADD_COMMAND,
				callback: params => {
					if (main_core.Type.isStringFilled(params.eventId) && pull_queuemanager.QueueManager.eventIds.has(params.eventId)) {
						return;
					}
					this.#callScoringCallback(params);
				}
			});
			this.#unsubscribeFromCallAssessment = pull_client.PULL.subscribe({
				moduleId: 'crm',
				command: CALL_ASSESSMENT_UPDATE_COMMAND,
				callback: params => {
					if (main_core.Type.isStringFilled(params.eventId) && pull_queuemanager.QueueManager.eventIds.has(params.eventId)) {
						return;
					}
					this.#callAssessmentCallback(params);
				}
			});
			pull_client.PULL.extendWatch(CALL_SCORING_ADD_COMMAND);
			pull_client.PULL.extendWatch(CALL_ASSESSMENT_UPDATE_COMMAND);
		}
		unsubscribe() {
			this.#unsubscribeFromCallScoring();
			this.#unsubscribeFromCallAssessment();
		}
	}

	/*
	* @readonly
	* @enum {string}
	*/
	const ViewMode = Object.freeze({
		usedNotAssessmentScript: 'usedNotAssessmentScript',
		usedCurrentVersionOfScript: 'usedCurrentVersionOfScript',
		usedOtherVersionOfScript: 'usedOtherVersionOfScript',
		emptyScriptList: 'emptyScriptList',
		assessmentSettingsPending: 'assessmentSettingsPending',
		pending: 'pending',
		error: 'error'
	});

	const Compliance = {
		props: {
			title: {
				type: String,
				required: true
			},
			assessment: {
				type: Number,
				default: null
			},
			lowBorder: {
				type: Number,
				default: 30
			},
			highBorder: {
				type: Number,
				default: 70
			},
			viewMode: {
				type: String,
				default: null
			}
		},
		mounted() {
			this.startAnimate();
		},
		methods: {
			startAnimate() {
				if (this.$refs.assessment) {
					this.animateCounter(this.$refs.assessment, this.assessment);
				}
			},
			animateCounter(counterElement, targetNumber) {
				let startNumber = 0;
				const duration = 1500;
				const increment = targetNumber / (duration / 50);
				const interval = setInterval(() => {
					startNumber += increment;
					if (startNumber >= targetNumber) {
						startNumber = targetNumber;
						clearInterval(interval);
					}

					// eslint-disable-next-line no-param-reassign
					counterElement.textContent = Math.floor(startNumber);
				}, 50);
			}
		},
		computed: {
			classList() {
				return {
					'call-quality__compliance__container': true,
					'--empty-state': !this.isUsedCurrentVersionOfScript,
					'--low': this.assessment <= this.lowBorder,
					'--high': this.assessment >= this.highBorder
				};
			},
			isUsedCurrentVersionOfScript() {
				return this.viewMode === ViewMode.usedCurrentVersionOfScript;
			},
			infoTitle() {
				return this.viewMode === ViewMode.emptyScriptList ? main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_COMPLIANCE_EMPTY_SCRIPT_LIST_TITLE', crm_ai_nameService.NameService.copilotNameReplacement()) : main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_COMPLIANCE_TITLE');
			},
			valueTitle() {
				return this.viewMode === ViewMode.emptyScriptList ? main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_COMPLIANCE_EMPTY_SCRIPT_LIST_VALUE') : this.title;
			}
		},
		template: `
		<div :class="classList">
			<div class="call-quality__compliance">
				<div
					v-if="isUsedCurrentVersionOfScript"
					class="call-quality__compliance__assessment"
				>
					<span ref="assessment" class="call-quality__compliance__assessment-value">
						{{ assessment }}
					</span>
					<div class="call-quality__compliance__assessment-measure">
					</div>
				</div>
				<div class="call-quality__compliance__info">
					<span class="call-quality__compliance__info-title">
						{{ infoTitle }}
					</span>
					<span class="call-quality__compliance__info-value">
						{{ valueTitle }}
					</span>
				</div>
			</div>
		</div>
	`
	};

	const Loader = {
		mounted() {
			this.renderLottieAnimation();
		},
		methods: {
			renderLottieAnimation() {
				const mainAnimation = ui_lottie.Lottie.loadAnimation({
					path: this.getAnimationPath(),
					container: this.$refs.lottie,
					renderer: 'svg',
					loop: true,
					autoplay: true
				});
				mainAnimation.setSpeed(0.75);
				return this.$refs.lottie.root;
			},
			getAnimationPath() {
				return '/bitrix/js/crm/ai/call/src/call-quality/lottie/loader.json';
			}
		},
		template: `
		<div ref="lottie" class="call-quality__explanation-loader__lottie"></div>
	`
	};

	const AssessmentSettingsPendingBlock = {
		components: {
			Loader
		},
		computed: {
			pendingTitle() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ASSESSMENT_SETTINGS_PENDING_TITLE', crm_ai_nameService.NameService.copilotNameReplacement());
			}
		},
		// language=Vue
		template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container">
				<div class="call-quality__explanation-title">
					{{ pendingTitle }}
				</div>
				<div class="call-quality__explanation-text">
					<div class="call-quality__explanation-loader__container">
						<Loader />
						<div class="call-quality__explanation-loader__lottie-text">
							{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ASSESSMENT_SETTINGS_PENDING_TEXT') }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const EmptyScriptListBlock = {
		computed: {
			title() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EMPTY_SCRIPT_LIST_TITLE');
			},
			text() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EMPTY_SCRIPT_LIST_TEXT', crm_ai_nameService.NameService.copilotNameReplacement());
			}
		},
		// language=Vue
		template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container">
				<div class="call-quality__explanation-title">
					{{ title }}
				</div>
				<div class="call-quality__explanation-text" v-html="text">
				</div>
			</div>
		</div>
	`
	};

	const ErrorBlock = {
		data() {
			return {
				errorText: null
			};
		},
		methods: {
			setErrorMessage(message) {
				this.errorText = message;
			}
		},
		computed: {
			explanationText() {
				return main_core.Type.isStringFilled(this.errorText) ? this.errorText : main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ERROR_TEXT', crm_ai_nameService.NameService.copilotNameReplacement());
			},
			errorTitle() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_ERROR_TITLE', crm_ai_nameService.NameService.copilotNameReplacement());
			}
		},
		// language=Vue
		template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container --error">
				<div class="call-quality__explanation-title">
					{{ errorTitle }}
				</div>
				<div 
					class="call-quality__explanation-text"
					v-html="explanationText"
				></div>
			</div>
		</div>
	`
	};

	const NotAssessmentScriptBlock = {
		methods: {
			doAssessment() {
				this.$emit('doAssessment');
			}
		},
		computed: {
			title() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_NO_EXPLANATION_TITLE');
			},
			text() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_NO_EXPLANATION_TEXT', crm_ai_nameService.NameService.copilotNameReplacement());
			},
			buttonText() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_NO_EXPLANATION_ASSESSMENT');
			}
		},
		template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container ">
				<div class="call-quality__explanation-title">
					{{ title }}
				</div>
				<div class="call-quality__explanation-text" v-html="text">
				</div>
			</div>
			<div class="call-quality__explanation__buttons-container">
				<button
					class="ui-btn ui-btn-md ui-btn-no-caps ui-btn-color-ai ui-btn-round ui-btn-active"
					@click="doAssessment"
				>
					{{ buttonText }}
				</button>
			</div>
		</div>
	`
	};

	const OtherScriptBlock = {
		methods: {
			showAssessment() {
				this.$emit('showAssessment');
			},
			doAssessment() {
				this.$emit('doAssessment');
			}
		},
		computed: {
			title() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_OLD_EXPLANATION_TITLE');
			},
			text() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_OLD_EXPLANATION_TEXT', crm_ai_nameService.NameService.copilotNameReplacement());
			},
			buttonShowText() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_OLD_EXPLANATION_SHOW_ASSESSMENT');
			},
			buttonDoText() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_OLD_EXPLANATION_ASSESSMENT');
			}
		},
		template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container ">
				<div class="call-quality__explanation-title" v-html="title">
				</div>
				<div class="call-quality__explanation-text" v-html="text">
				</div>
			</div>
			<div class="call-quality__explanation__buttons-container">
				<button
					class="ui-btn ui-btn-md ui-btn-no-caps ui-btn-color-ai ui-btn-round ui-btn-active"
					@click="doAssessment"
				>
					{{ buttonDoText }}
				</button>
				<button
					class="ui-btn ui-btn-md ui-btn-no-caps ui-btn-light-border ui-btn-round"
					@click="showAssessment"
				>
					{{ buttonShowText }}
				</button>
			</div>
		</div>
	`
	};

	const PendingBlock = {
		components: {
			Loader
		},
		computed: {
			pendingTitle() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_PENDING_TITLE', crm_ai_nameService.NameService.copilotNameReplacement());
			}
		},
		// language=Vue
		template: `
		<div class="call-quality__explanation">
			<div class="call-quality__explanation__container">
				<div class="call-quality__explanation-title">
					{{ pendingTitle }}
				</div>
				<div class="call-quality__explanation-text">
					<div class="call-quality__explanation-loader__container">
						<Loader />
						<div class="call-quality__explanation-loader__lottie-text">
							{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_PENDING_TEXT') }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const ARTICLE_CODE$2 = '23240682';
	const DISCLAIMER_ARTICLE_RU_CODE = '20412666';
	const DISCLAIMER_ARTICLE_CODE = '25775495';
	const RecommendationBlock = {
		props: {
			recommendations: {
				type: String,
				default: null
			},
			summary: {
				type: String,
				default: null
			},
			useInRating: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			showArticle() {
				window.top.BX?.Helper?.show(`redirect=detail&code=${ARTICLE_CODE$2}`);
			}
		},
		computed: {
			disclaimer() {
				const language = main_core.Loc.getMessage('LANGUAGE_ID');
				const region = main_core.Extension.getSettings('crm.ai.call').get('region');
				let code = DISCLAIMER_ARTICLE_CODE;
				if (['ru', 'by', 'kz', 'uz'].includes(language ?? region)) {
					code = DISCLAIMER_ARTICLE_RU_CODE;
				}
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EXPLANATION_DISCLAIMER_MSGVER_1', {
					'#LINK_START#': `<a onclick='window.top.BX?.Helper?.show(\`redirect=detail&code=${code}\`)' href="#">`,
					'#LINK_END#': '</a>',
					'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
				});
			},
			explanationTitle() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EXPLANATION_TITLE', crm_ai_nameService.NameService.copilotNameReplacement());
			}
		},
		// language=Vue
		template: `
		<div class="call-quality__explanation --copilot-content">
			<div class="call-quality__explanation__container ">
				<div class="call-quality__explanation-title">
					{{ explanationTitle }}
				</div>
				<div class="call-quality__explanation-text">
					<div 
						v-if="!useInRating"
						class="call-quality__explanation-badge"
					>
						<div>
							{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EXPLANATION_NOT_IN_RATING') }}
							<div
								class="call-quality__explanation-badge-article ui-icon-set --help"
								@click="showArticle"
							></div>
						</div>
					</div>
					<p>
						{{ summary }}
					</p>
					<p>
						{{ recommendations }}
					</p>
				</div>
				<div class="call-quality__explanation-disclaimer" v-html="disclaimer">
				</div>
			</div>
		</div>
	`
	};

	class ScriptSelectorDisplayStrategy {
		#container;
		#isLoading = false;
		constructor() {
			this.#container = this.#createContainer();
		}
		getTargetNode() {
			return this.titleNode;
		}
		updateTitle(title) {
			this.innerTitleNode.innerText = title;
			this.innerTitleNode.title = title;
		}
		setLoading(isLoading) {
			if (this.#isLoading === isLoading) {
				return;
			}
			this.#isLoading = isLoading;
			main_core.Dom.toggleClass(this.#container, '--loading');
		}
		#createContainer() {
			this.innerTitleNode = main_core.Tag.render`<span></span>`;
			this.titleNode = main_core.Tag.render`
			<div class="call-quality__script-selector">
				${this.innerTitleNode}
			</div>
		`;
			return this.titleNode;
		}
	}

	const ARTICLE_CODE$1 = '23240682';
	const SUCCESS_STATUS = 'SUCCESS';
	const PENDING_STATUS = 'PENDING';
	const ScriptSelector = {
		props: {
			assessmentSettingsId: {
				type: Number,
				required: true
			},
			assessmentSettingsStatus: {
				type: String,
				default: SUCCESS_STATUS
			},
			assessmentSettingsTitle: {
				type: String,
				required: true
			},
			isPromptChanged: {
				type: Boolean,
				required: true
			},
			promptUpdatedAt: {
				type: String,
				required: true
			},
			prompt: {
				type: String,
				required: true
			},
			viewMode: {
				type: String,
				default: ''
			}
		},
		callAssessmentSelector: null,
		htmlFormatter: null,
		data() {
			return {};
		},
		created() {
			this.callAssessmentSelector = this.getCallAssessmentSelector();
			this.htmlFormatter = new ui_bbcode_formatter_htmlFormatter.HtmlFormatter();
		},
		methods: {
			getCallAssessmentSelector() {
				return new crm_copilot_callAssessmentSelector.CallAssessmentSelector({
					currentCallAssessment: {
						id: this.assessmentSettingsId,
						title: this.assessmentSettingsId > 0 ? this.assessmentSettingsTitle : main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EMPTY_SCRIPT_LIST_SCRIPT_TITLE')
					},
					emptyScriptListTitle: main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EMPTY_SCRIPT_LIST_SCRIPT_TITLE'),
					displayStrategy: new ScriptSelectorDisplayStrategy(),
					additionalSelectorOptions: {
						dialog: {
							events: {
								'Item:onBeforeSelect': this.onBeforeSelect.bind(this)
							}
						}
					}
				});
			},
			onBeforeSelect(event) {
				this.$emit('onBeforeSelect', this.callAssessmentSelector.getCurrentCallAssessmentItem()?.id);
			},
			onEditCallAssessmentSettings({
				target
			}) {
				if (this.assessmentSettingsStatus === PENDING_STATUS) {
					this.showDisabledButtonHint(target);
					return;
				}
				crm_router.Router.openSlider(`/crm/copilot-call-assessment/details/${this.assessmentSettingsId}/`, {
					width: 700,
					cacheable: false
				});
			},
			onShowActualPrompt() {
				this.$emit('onShowActualPrompt');
			},
			showArticle() {
				window.top.BX?.Helper?.show(`redirect=detail&code=${ARTICLE_CODE$1}`);
			},
			formatHtml(source) {
				return this.htmlFormatter.format({
					source
				});
			},
			close() {
				this.callAssessmentSelector?.close();
			},
			disable() {
				this.callAssessmentSelector?.disable();
			},
			enable() {
				this.callAssessmentSelector?.enable();
			},
			doAssessment({
				target
			}) {
				if (this.assessmentSettingsStatus === PENDING_STATUS) {
					this.showDisabledButtonHint(target);
					return;
				}
				this.$emit('doAssessment');
			},
			showDisabledButtonHint(target) {
				top.BX.UI.Hint.popupParameters = {
					closeByEsc: true,
					autoHide: true,
					angle: null,
					events: {}
				};
				main_core.Runtime.debounce(() => {
					top.BX.UI.Hint.show(target, main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SCRIPT_DISABLED_DO_ASSESSMENT_HINT', crm_ai_nameService.NameService.copilotNameReplacement()), true);
				}, 150, this)();
			},
			isDisabledAssessmentButton() {
				return this.assessmentSettingsStatus !== SUCCESS_STATUS;
			},
			isDisabledEditButton() {
				return this.assessmentSettingsStatus === PENDING_STATUS;
			}
		},
		mounted() {
			main_core.Dom.append(this.callAssessmentSelector.getContainer(), this.$refs.container);
			if (this.$refs.prompt) {
				main_core.Dom.append(this.formattedPrompt, this.$refs.prompt);
			}
		},
		computed: {
			scriptUpdatedAt() {
				const date = new Date(this.promptUpdatedAt);
				const datetimeConverter = new crm_timeline_tools.DatetimeConverter(date);
				const dateString = datetimeConverter.toDatetimeString({
					withDayOfWeek: false,
					delimiter: ', '
				});
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SCRIPT_INFO_UPDATED', {
					'#UPDATED_AT#': dateString
				});
			},
			formattedPrompt() {
				return this.formatHtml(this.prompt);
			},
			isShowFooterButtons() {
				return this.viewMode !== ViewMode.usedOtherVersionOfScript && this.viewMode !== ViewMode.usedNotAssessmentScript && this.viewMode !== ViewMode.pending && this.assessmentSettingsId > 0;
			},
			footerButtonClassList() {
				return ['ui-btn', 'ui-btn-xs', 'ui-btn-no-caps', 'ui-btn-light-border', 'ui-btn-round', {
					'ui-btn-disabled': this.isDisabledAssessmentButton()
				}];
			},
			footerEditButtonClassList() {
				return ['ui-btn', 'ui-btn-xs', 'ui-btn-no-caps', 'ui-btn-round', 'ui-btn-light', 'edit-button', {
					'ui-btn-disabled': this.isDisabledEditButton()
				}];
			},
			isEmptyScriptListViewMode() {
				return this.viewMode === ViewMode.emptyScriptList;
			}
		},
		watch: {
			prompt() {
				main_core.Dom.clean(this.$refs.prompt);
				main_core.Dom.append(this.formattedPrompt, this.$refs.prompt);
			}
		},
		// language=Vue
		template: `
		<div>
			<div class="call-quality__script-selector__container">
				<div class="call-quality__script-selector__title">
					<div>
						{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SCRIPT_SELECTOR_TITLE') }}
					</div>
					<div class="call-quality__script-selector__selector-container" ref="container"></div>
					<div 
						class="call-quality__script-selector__article ui-icon-set --help"
						@click="showArticle"
					></div>
				</div>
			</div>
			<div
				v-if="this.isPromptChanged && isShowFooterButtons"
				class="call-quality__script-info__container"
			>
				<span>{{scriptUpdatedAt}}</span>
				<button
					class="ui-btn ui-btn-xs ui-btn-no-caps ui-btn-round ui-btn-link ui-btn-active"
					@click="onShowActualPrompt"
				>
					{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SCRIPT_INFO_SHOW_NEW_PROMPT') }}
				</button>
			</div>
			<div class="call-quality__script-container">
				<div
					v-if="isEmptyScriptListViewMode"
					class="call-quality__script-text"
				>
					{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_EMPTY_SCRIPT_LIST_PROMPT_TEXT') }}
				</div>
				<div v-else class="call-quality__script-text" ref="prompt">
				</div>

				<div
					v-if="isShowFooterButtons"
					class="call-quality__script-footer"
				>
					<button 
						:class="footerButtonClassList"
						@click="doAssessment"
					>
						{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SCRIPT_ASSESSMENT_REPLY') }}
					</button>
					<button 
						:class="footerEditButtonClassList"
						@click="onEditCallAssessmentSettings"
					>
						{{ $Bitrix.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SCRIPT_EDIT') }}
					</button>
				</div>
			</div>
		</div>
	`
	};

	const CallQuality$1 = {
		components: {
			AudioPlayerComponent: crm_audioPlayer.AudioPlayerComponent,
			ScriptSelectorComponent: ScriptSelector,
			RecommendationBlock,
			OtherScriptBlock,
			NotAssessmentScriptBlock,
			AssessmentSettingsPendingBlock,
			PendingBlock,
			ErrorBlock,
			EmptyScriptListBlock,
			ComplianceComponent: Compliance
		},
		props: {
			client: {
				type: Object,
				required: true
			},
			data: {
				type: Object,
				required: true
			},
			audioProps: {
				type: Object,
				required: true
			},
			context: {
				type: Object,
				required: true
			}
		},
		data() {
			const quality = this.getPreparedQualityProps(this.data);
			let prompt = quality.prompt;
			const currentQualityAssessmentId = quality.id ?? null;
			let viewMode = null;
			if (this.data.viewMode === ViewMode.usedNotAssessmentScript) {
				viewMode = ViewMode.usedNotAssessmentScript;
			} else if (this.data.viewMode === ViewMode.pending) {
				viewMode = ViewMode.pending;
			} else if (this.data.viewMode === ViewMode.emptyScriptList) {
				viewMode = ViewMode.emptyScriptList;
			} else if (quality.id) {
				viewMode = this.data.viewMode ?? ViewMode.usedCurrentVersionOfScript;
			} else {
				viewMode = ViewMode.error;
			}
			return {
				quality,
				currentQualityAssessmentId,
				viewMode,
				prompt,
				isShowAudioPlayer: false,
				direction: this.data.callDirection
			};
		},
		mounted() {
			top.BX.Event.EventEmitter.subscribe('crm:copilot:callAssessment:beforeSave', this.onBeforeAssessmentSettingsChange);
			top.BX.Event.EventEmitter.subscribe('crm:copilot:callAssessment:save', this.onAssessmentSettingsChange);
			this.pull = new Pull(this.onPullChangeScript, this.onPullChangeAssessment);
			this.pull.init();
		},
		methods: {
			onBeforeAssessmentSettingsChange(event) {
				const {
					data
				} = event.getData();
				if (!this.isPromptChanged(data.prompt)) {
					return;
				}
				this.quality.assessmentSettingsStatus = 'PENDING';
			},
			onAssessmentSettingsChange(event) {
				const {
					id,
					data
				} = event.getData();
				if (!this.isPromptChanged(data.prompt)) {
					return;
				}
				this.onChangeScript(id);
			},
			isPromptChanged(newPrompt) {
				return this.quality.actualPrompt !== newPrompt;
			},
			showAudioPlayer() {
				this.isShowAudioPlayer = true;
			},
			onShowActualPrompt() {
				this.viewMode = ViewMode.usedOtherVersionOfScript;
				this.prompt = this.quality.actualPrompt;
			},
			onShowCurrentAssessment() {
				this.viewMode = ViewMode.usedCurrentVersionOfScript;
				this.prompt = this.quality.prompt;
			},
			onDoAssessment() {
				this.viewMode = ViewMode.pending;
				this.$refs.scriptSelector?.disable();
				const config = {
					data: {
						...this.context,
						assessmentSettingsId: this.quality.assessmentSettingsId
					}
				};
				main_core.ajax.runAction('crm.copilot.callqualityassessment.doAssessment', config).then(response => {
					const {
						status,
						data
					} = response;
					this.$refs.scriptSelector?.enable();
					if (status !== 'success') {
						this.showError(response);
						return;
					}
					main_core_events.EventEmitter.emit('crm.ai.callQuality:doAssessment', {
						data
					});
				}).catch(response => {
					this.showError(response);
					this.$refs.scriptSelector?.enable();
				});
			},
			onChangeScript(assessmentSettingsId) {
				const config = {
					data: {
						...this.context,
						assessmentSettingsId
					}
				};
				main_core.ajax.runAction('crm.copilot.callqualityassessment.get', config).then(response => {
					this.$refs.scriptSelector?.enable();
					const {
						status,
						data
					} = response;
					if (status !== 'success') {
						this.showError(response);
						return;
					}
					if (main_core.Type.isObject(data)) {
						this.quality = this.getPreparedQualityProps(data);
						if (!(this.quality.isPromptChanged && data.viewMode === ViewMode.assessmentSettingsPending
						//&& this.viewMode === ViewMode.usedCurrentVersionOfScript
						)) {
							this.viewMode = data.viewMode;
						}
					}
				}).catch(response => {
					this.$refs.scriptSelector?.enable();
					top.BX.UI.Notification.Center.notify({
						content: response.errors[0].message,
						autoHideDelay: 5000
					});
				});
			},
			showError(response) {
				this.viewMode = ViewMode.error;
				this.$nextTick(() => {
					this.$refs.errorBlock?.setErrorMessage(response.errors[0]?.message);
				});
			},
			getPreparedQualityProps({
				callQuality: quality
			}) {
				if (!main_core.Type.isPlainObject(quality)) {
					// eslint-disable-next-line no-param-reassign
					quality = {};
				}
				return {
					id: Number(quality.ID ?? 0),
					createdAt: quality.CREATED_AT ?? null,
					assessmentSettingsId: Number(quality.ASSESSMENT_SETTING_ID ?? 0),
					assessmentSettingsStatus: quality.ASSESSMENT_SETTINGS_STATUS ?? null,
					assessment: Number(quality.ASSESSMENT ?? 0),
					assessmentAvg: Number(quality.ASSESSMENT_AVG ?? 0),
					prevAssessmentAvg: Number(quality.PREV_ASSESSMENT_AVG ?? 0),
					isPromptChanged: Boolean(quality.IS_PROMPT_CHANGED ?? false),
					useInRating: Boolean(quality.USE_IN_RATING ?? false),
					prompt: quality.PROMPT ?? '',
					actualPrompt: quality.ACTUAL_PROMPT ?? '',
					promptUpdatedAt: quality.PROMPT_UPDATED_AT ?? '',
					title: quality.TITLE ?? '',
					recommendations: quality.RECOMMENDATIONS ?? '',
					summary: quality.SUMMARY ?? '',
					lowBorder: Number(quality.LOW_BORDER ?? 30),
					highBorder: Number(quality.HIGH_BORDER ?? 70)
				};
			},
			close() {
				this.$refs.scriptSelector?.close();
				this.pull.unsubscribe();
				top.BX.Event.EventEmitter.unsubscribe('crm:copilot:callAssessment:beforeSave', this.onBeforeAssessmentSettingsChange);
				top.BX.Event.EventEmitter.unsubscribe('crm:copilot:callAssessment:save', this.onAssessmentSettingsChange);
			},
			onPullChangeScript(params) {
				if (this.context.activityId !== params.activityId) {
					return;
				}
				if (params.status === 'error' || !main_core.Type.isNumber(params.assessmentSettingsId)) {
					this.viewMode = ViewMode.error;
				} else {
					this.onChangeScript(params.assessmentSettingsId);
				}
			},
			onPullChangeAssessment(params) {
				const assessmentSettingsId = params.assessmentSettingsId ?? null;
				const currentAssessmentSettingsId = this.quality.assessmentSettingsId;
				if (assessmentSettingsId !== currentAssessmentSettingsId) {
					return;
				}
				this.onChangeScript(assessmentSettingsId);
			}
		},
		watch: {
			quality: {
				handler(quality) {
					this.prompt = quality.prompt;
				},
				deep: true
			}
		},
		computed: {
			clientNameClassList() {
				return {
					'call-quality__call-client-name': true,
					'--incoming': Number(this.direction) === 1,
					'--outgoing': Number(this.direction) === 2
				};
			},
			clientName() {
				return main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_AI_CALL_TITLE', {
					'[clientname]': `<a href="${this.client.detailUrl}">`,
					'[/clientname]': '</a>',
					'#CLIENT_NAME#': main_core.Text.encode(this.client.fullName)
				});
			},
			formattedDate() {
				const datetimeConverter = crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.client.activityCreated);
				return datetimeConverter.toDatetimeString({
					withDayOfWeek: false,
					delimiter: ', '
				});
			},
			isUsedCurrentVersionOfScriptViewMode() {
				return this.viewMode === ViewMode.usedCurrentVersionOfScript;
			},
			isUsedOtherVersionOfScriptViewMode() {
				return this.viewMode === ViewMode.usedOtherVersionOfScript;
			},
			isUsedNotAssessmentScriptViewMode() {
				return this.viewMode === ViewMode.usedNotAssessmentScript;
			},
			isAssessmentSettingsPendingViewMode() {
				return this.viewMode === ViewMode.assessmentSettingsPending;
			},
			isPendingViewMode() {
				return this.viewMode === ViewMode.pending;
			},
			isErrorViewMode() {
				return this.viewMode === ViewMode.error;
			},
			isEmptyScriptListViewMode() {
				return this.viewMode === ViewMode.emptyScriptList;
			}
		},
		template: `
		<div class="call-quality__column --info">
			<div>
				<div class="call-quality__header">
					<div class="call-quality__header-row --flex">
						<div :class="clientNameClassList" v-html="clientName">
						</div>
						<div class="call-quality__call-date">
							{{ formattedDate }}
						</div>
					</div>
					<div class="call-quality__header-row">
						<div id="crm-textbox-audio-player" ref="audioPlayer">
							<AudioPlayerComponent v-if="isShowAudioPlayer" v-bind="audioProps" />
						</div>
					</div>
				</div>
				<ComplianceComponent 
					:assessment="quality.assessment"
					:title="quality.title"
					:viewMode="viewMode"
					:lowBorder="quality.lowBorder"
					:highBorder="quality.highBorder"
				/>
				<RecommendationBlock
					v-if="isUsedCurrentVersionOfScriptViewMode"
					:recommendations="quality.recommendations"
					:summary="quality.summary"
					:use-in-rating="quality.useInRating"
				/>
				<OtherScriptBlock
					v-if="isUsedOtherVersionOfScriptViewMode"
					@showAssessment="onShowCurrentAssessment"
					@doAssessment="onDoAssessment"
				/>
				<NotAssessmentScriptBlock
					v-if="isUsedNotAssessmentScriptViewMode"
					@doAssessment="onDoAssessment"
				/>
				<AssessmentSettingsPendingBlock v-if="isAssessmentSettingsPendingViewMode"/>
				<PendingBlock v-if="isPendingViewMode"/>
				<ErrorBlock v-if="isErrorViewMode" ref="errorBlock"/>
				<EmptyScriptListBlock v-if="isEmptyScriptListViewMode"/>
			</div>
		</div>
		<div class="call-quality__column --prompt">
			<ScriptSelectorComponent
				ref="scriptSelector"
				:assessmentSettingsId="quality.assessmentSettingsId"
				:assessmentSettingsStatus="quality.assessmentSettingsStatus"
				:assessmentSettingsTitle="quality.title"
				:isPromptChanged="quality.isPromptChanged"
				:promptUpdatedAt="quality.promptUpdatedAt"
				:prompt="prompt"
				:viewMode="viewMode"
				@onBeforeSelect="onChangeScript"
				@onShowActualPrompt="onShowActualPrompt"
				@doAssessment="onDoAssessment"
			/>
		</div>
	`
	};

	const Trend = Object.freeze({
		up: 1,
		down: -1,
		noChanges: 0
	});
	const ARTICLE_CODE = '23240682';
	const ARTICLE_ANCHOR = 'rate';
	class Rating {
		#id;
		#rating = null;
		#prevRating = null;
		#userPhotoUrl = null;
		#articleCode = ARTICLE_CODE;
		#articleAnchor = ARTICLE_ANCHOR;
		#useSkeletonMode = true;
		constructor() {
			this.#id = `crm.ai.call.quality-rating-${main_core.Text.getRandom()}`;
		}
		render() {
			const content = this.#useSkeletonMode ? this.#getSkeleton() : this.#getContent();
			return main_core.Tag.render`
			<div id="${this.#id}" class="call-quality__rating__container">
				${content}
			</div>
		`;
		}

		// @todo
		#getSkeleton() {
			return main_core.Tag.render`<div></div>`;
		}
		#getContent() {
			return main_core.Tag.render`
			<div class="call-quality__rating__text-container">
				${main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_RATING')}
				<div 
					class="call-quality__rating_article ui-icon-set --help"
					onclick="${this.#showArticle.bind(this)}"
				></div>
			</div>
			<div class="call-quality__rating__value-container">
				${this.#getAvatar()}
				<div class="call-quality__rating__value">
					${this.#rating}
					<span class="call-quality__rating__measure">%</span>
				</div>
				<div class="call-quality__rating__trend ${this.#getTrendClass()}"></div>
			</div>
		`;
		}
		#getAvatar() {
			if (main_core.Type.isStringFilled(this.#userPhotoUrl)) {
				return main_core.Tag.render`
				<div
					class="call-quality__rating__avatar"
					style="background-image: url('${encodeURI(main_core.Text.encode(this.#userPhotoUrl))}')"
				></div>
			`;
			}
			return main_core.Tag.render`
			<div class="call-quality__rating__avatar ui-icon ui-icon-common-user">
				<i style=""></i>
			</div>
		`;
		}
		#getTrendClass() {
			const trend = this.#getTrend();
			if (trend === Trend.up) {
				return '--up';
			}
			if (trend === Trend.down) {
				return '--down';
			}
			return '--no-changes';
		}
		#getTrend() {
			if (this.#rating > this.#prevRating) {
				return Trend.up;
			}
			if (this.#rating < this.#prevRating) {
				return Trend.down;
			}
			return Trend.noChanges;
		}
		#showArticle() {
			window.top.BX?.Helper?.show(`redirect=detail&code=${this.#articleCode}&anchor=${this.#articleAnchor}`);
		}
		setRating(rating) {
			this.#rating = rating;
		}
		setPrevRating(rating) {
			this.#prevRating = rating;
		}
		setUserPhotoUrl(userPhotoUrl) {
			this.#userPhotoUrl = userPhotoUrl;
		}
		setSkeletonMode(useSkeletonMode = true) {
			if (this.#useSkeletonMode !== useSkeletonMode) {
				this.#useSkeletonMode = useSkeletonMode;
				this.#layout();
			}
		}
		#layout() {
			const currentContent = document.getElementById(this.#id);
			if (currentContent === null) {
				return;
			}
			main_core.Dom.replace(currentContent, this.render());
		}
	}

	/**
	 * @memberOf BX.Crm.AI.Call
	 *
	 */
	class CallQuality extends Base {
		#layoutComponent = null;
		#app = null;
		#jobId;
		#clientDetailUrl;
		#clientFullName;
		#activityCreated;
		#userPhotoUrl;
		#assessmentSettingsId;
		constructor(data) {
			// eslint-disable-next-line no-param-reassign
			data.activityProvider = ActivityProvider.call; // for call only

			super(data);
			this.#jobId = main_core.Type.isNumber(data.jobId) ? data.jobId : null;
			this.sliderId = `${this.id}-${this.#jobId ?? this.activityId}`;
			this.#clientDetailUrl = main_core.Type.isStringFilled(data.clientDetailUrl) ? data.clientDetailUrl : null;
			this.#clientFullName = main_core.Type.isStringFilled(data.clientFullName) ? data.clientFullName : null;
			this.#userPhotoUrl = main_core.Type.isStringFilled(data.userPhotoUrl) ? data.userPhotoUrl : null;
			this.#activityCreated = main_core.Type.isNumber(data.activityCreated) ? data.activityCreated : null;
			this.#assessmentSettingsId = main_core.Type.isNumber(data.assessmentSettingsId) ? data.assessmentSettingsId : null;
			this.rating = new Rating();
		}
		initDefaultOptions() {
			this.id = 'crm-copilot-call-quality';
			this.sliderTitle = main_core.Loc.getMessage('CRM_COPILOT_CALL_QUALITY_SLIDER_TITLE');
			const width = Math.round(BX.SidePanel.Instance.getTopSlider().getWidth() * 0.75);
			this.sliderWidth = width > 0 ? width : Math.round(window.screen.width * 0.75);
			this.textboxTitle = main_core.Loc.getMessage('CRM_COPILOT_CALL_TRANSCRIPT_TITLE');
			this.aiDataAction = 'crm.timeline.ai.getCopilotCallQuality';
		}
		getExtensions() {
			const extensions = super.getExtensions();
			extensions.push('crm.ai.call');
			return extensions;
		}
		getSliderContentClass() {
			return 'crm-copilot-call-quality-wrapper';
		}
		getSliderDesign() {
			return {
				margin: 0
			};
		}
		getSliderToolbar() {
			return () => {
				return [this.rating.render()];
			};
		}
		getSliderEvents() {
			const events = super.getSliderEvents();
			events.onLoad = () => {
				this.#layoutComponent.showAudioPlayer();
			};
			events.onClose = () => {
				this.#layoutComponent.close();
			};
			return events;
		}

		/**
		 * @override
		 */
		open() {
			const content = new Promise((resolve, reject) => {
				this.getAiData().then(response => {
					const audioProps = this.prepareAudioProps(response);
					this.#prepareRating(response.data);
					const context = {
						activityId: this.activityId,
						ownerTypeId: this.ownerTypeId,
						ownerId: this.ownerId,
						jobId: this.#jobId
					};
					this.#app = ui_vue3.BitrixVue.createApp(CallQuality$1, {
						client: {
							detailUrl: this.#clientDetailUrl,
							fullName: this.#clientFullName,
							activityCreated: this.#activityCreated
						},
						data: response.data,
						audioProps,
						context
					});
					const container = main_core.Tag.render`<div class="call-quality__container"></div>`;
					this.#layoutComponent = this.#app.mount(container);
					main_core_events.EventEmitter.subscribe('crm.ai.callQuality:doAssessment', () => {
						// @todo will the slider close?
						//this.wrapperSlider?.close();
					});
					resolve(container);
				}).catch(response => {
					this.showError(response);
					this.wrapperSlider.destroy();
				});
			});
			this.wrapperSlider.setContent(content);
			this.wrapperSlider.open();
		}
		getAiData() {
			const actionData = {
				data: {
					activityId: this.activityId,
					ownerTypeId: this.ownerTypeId,
					ownerId: this.ownerId,
					jobId: this.#jobId,
					assessmentSettingsId: this.#assessmentSettingsId
				}
			};
			return BX.ajax.runAction(this.aiDataAction, actionData);
		}
		getNotAccuratePhraseCode() {
			return 'CRM_COPILOT_CALL_TRANSCRIPT_NOT_BE_ACCURATE';
		}
		#prepareRating({
			callQuality
		}) {
			if (!main_core.Type.isPlainObject(callQuality)) {
				return;
			}
			const {
				rating
			} = this;
			if (callQuality) {
				rating.setRating(callQuality?.ASSESSMENT_AVG);
				rating.setPrevRating(callQuality?.PREV_ASSESSMENT_AVG);
			}
			if (main_core.Type.isStringFilled(this.#userPhotoUrl)) {
				rating.setUserPhotoUrl(this.#userPhotoUrl);
			}
			rating.setSkeletonMode(false);
		}
	}

	/**
	 * @memberOf BX.Crm.AI.Call
	 */
	class Summary extends Base {
		initDefaultOptions() {
			this.id = 'crm-copilot-summary';
			this.aiDataAction = 'crm.timeline.ai.getCopilotSummary';
			this.sliderTitle = crm_ai_nameService.NameService.copilotName();
			this.sliderWidth = 520;
			this.textboxTitle = main_core.Loc.getMessage('CRM_COPILOT_CALL_SUMMARY_TITLE');
		}
		getNotAccuratePhraseCode() {
			return 'CRM_COPILOT_CALL_SUMMARY_NOT_BE_ACCURATE';
		}
		prepareAiJobResult(response) {
			return response.data.aiJobResult.summary;
		}
	}

	/**
	 * @memberOf BX.Crm.AI.Call
	 */
	class Transcription extends Base {
		constructor(data) {
			// eslint-disable-next-line no-param-reassign
			data.activityProvider = ActivityProvider.call; // for call only

			super(data);
		}
		initDefaultOptions() {
			this.id = 'crm-copilot-transcript';
			this.aiDataAction = 'crm.timeline.ai.getCopilotTranscript';
			this.sliderTitle = crm_ai_nameService.NameService.copilotName();
			this.sliderWidth = 730;
			this.textboxTitle = main_core.Loc.getMessage('CRM_COPILOT_CALL_TRANSCRIPT_TITLE');
		}
		getNotAccuratePhraseCode() {
			return 'CRM_COPILOT_CALL_TRANSCRIPT_NOT_BE_ACCURATE';
		}
		prepareAiJobResult(response) {
			return response.data.aiJobResult.transcription;
		}
	}

	const Call = {
		Summary,
		Transcription,
		CallQuality
	};

	exports.ActivityProvider = ActivityProvider;
	exports.Call = Call;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX, BX.Event, BX.Vue3, BX.Crm.AI, BX.Crm.AI, BX.Crm.AI, BX.Crm, BX, BX, BX.Crm.Timeline, BX, BX.Pull, BX.UI, BX.Crm.Copilot, BX.Crm, BX.UI.BBCode.Formatter);
//# sourceMappingURL=call.bundle.js.map
