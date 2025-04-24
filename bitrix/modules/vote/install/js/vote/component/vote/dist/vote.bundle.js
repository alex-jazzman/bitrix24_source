/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vote = this.BX.Vote || {};
(function (exports,ui_notification,vote_provider_service,vote_component_loader,main_core,ui_iconSet_animated,vote_application,main_popup,ui_vue3_components_popup) {
	'use strict';

	const getMessage = phraseCode => {
	  return main_core.Loc.getMessage(phraseCode);
	};
	const getMessageWithCount = (phraseCode, counter) => {
	  return main_core.Loc.getMessagePlural(phraseCode, counter, {
	    '#COUNT#': counter
	  });
	};

	// @vue/component
	const VoteQuestion = {
	  name: 'VoteQuestion',
	  props: {
	    contextId: {
	      type: String,
	      required: true
	    },
	    isLoading: {
	      type: Boolean,
	      default: false
	    },
	    /** @type {FormattedQuestionType} */
	    question: {
	      type: Object,
	      required: true
	    },
	    /** @type {FormattedAnswersType} */
	    answers: {
	      type: Object,
	      required: true
	    },
	    isUserVoted: {
	      type: Boolean,
	      default: false
	    },
	    isCompleted: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['answersSelected'],
	  data() {
	    return {
	      selectedRadioBtn: null,
	      selectedCheckboxes: []
	    };
	  },
	  computed: {
	    answersCollection() {
	      return this.app.getStore().getters['vote/getAnswerCollection'];
	    },
	    formattedAnswers() {
	      const formattedAnswers = {};
	      Object.keys(this.answers).forEach(key => {
	        const answer = this.answers[key];
	        const storeAnswer = this.answersCollection[answer.id] || {};
	        formattedAnswers[key] = {
	          ...answer,
	          counter: storeAnswer.counter || 0,
	          percent: storeAnswer.percent
	        };
	      });
	      return formattedAnswers;
	    },
	    getCurrentUserVotes() {
	      return this.app.getStore().getters['vote/getCurrentUserVotes'][this.question.id] || [];
	    },
	    canShowResults() {
	      return this.isUserVoted || this.isCompleted;
	    }
	  },
	  watch: {
	    isLoading(newValue) {
	      if (newValue) {
	        this.selectedCheckboxes = this.getCurrentUserVotes || [];
	        this.selectedRadioBtn = this.getCurrentUserVotes[0];
	      }
	    },
	    isUserVoted(voted) {
	      if (voted) {
	        return;
	      }
	      this.selectedCheckboxes = [];
	      this.selectedRadioBtn = null;
	    }
	  },
	  created() {
	    this.app = vote_application.VoteApplication.init();
	  },
	  methods: {
	    radioChanged() {
	      this.emitAnswersSelectedWithValue([this.selectedRadioBtn]);
	    },
	    checkboxChanged() {
	      this.emitAnswersSelectedWithValue(this.selectedCheckboxes);
	    },
	    emitAnswersSelectedWithValue(answerIds) {
	      const eventData = {
	        questionId: this.question.id,
	        answerIds
	      };
	      this.$emit('answersSelected', eventData);
	    },
	    hasCurrentUserVote(answerId) {
	      if (this.canShowResults) {
	        return this.app.getStore().getters['vote/hasCurrentUserVote'](this.question.id, answerId);
	      }
	      return this.selectedCheckboxes.includes(answerId);
	    },
	    getUniqueAnswerId(answerId) {
	      return `vote-answer-${answerId}-${this.contextId}`;
	    }
	  },
	  template: `
		<div class="vote__question">
			<div class="vote__question-text">{{ question.question }}</div>
		</div>
		<div :class="['vote__answers', { '--voted': canShowResults }]">
			<div v-for="(answer, answerKey) in formattedAnswers" 
				 :key="answerKey"
				 :class="['vote__answer', { '--selected': hasCurrentUserVote(answer.id) }]"
			>
				<input
					class="vote__answer-select"
					v-if="!isLoading && !question.isMultiple"
					type="radio"
					v-model="selectedRadioBtn"
					:value="answer.id"
					:id="getUniqueAnswerId(answer.id)"
					@change="radioChanged"
				/>
				<input
					class="vote__answer-select --checkbox"
					v-if="!isLoading && question.isMultiple"
					type="checkbox"
					v-model="selectedCheckboxes"
					:value="answer.id"
					:id="getUniqueAnswerId(answer.id)"
					@change="checkboxChanged"
				/>
				<div class="vote__progress-bar">
					<label class='vote__answer-text' :for="getUniqueAnswerId(answer.id)">{{ answer.message }}</label>
					<div v-if="canShowResults" class="vote__answer-percent">
						<span>{{ answer.percent }}</span>
						%
					</div>
					<div v-if="canShowResults" class="vote__progress-bar-fill"
						 :style="{
						width: answer.percent + '%'
					  }"
					></div>
				</div>
			</div>
		</div>
	`
	};

	const ButtonType = Object.freeze({
	  vote: 'vote',
	  disable: 'disable',
	  showResults: 'show'
	});

	// @vue/component
	const ButtonArea = {
	  name: 'ButtonArea',
	  components: {
	    VoteQuestion
	  },
	  props: {
	    /** @type {FormattedQuestionType} */
	    question: {
	      type: Object,
	      required: true
	    },
	    isLoading: {
	      type: Boolean,
	      required: true
	    },
	    isUserVoted: {
	      type: Boolean,
	      default: false
	    },
	    isCompleted: {
	      type: Boolean,
	      default: false
	    },
	    isBtnActive: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['onClickVoteButton', 'showResults'],
	  computed: {
	    isMultipleQuestion() {
	      if (this.isLoading) {
	        return false;
	      }
	      return this.app.getStore().getters['vote/getQuestionCollection'][this.question.id].isMultiple;
	    },
	    buttonType() {
	      if (this.isUserVoted || this.isCompleted) {
	        return ButtonType.showResults;
	      }
	      if (this.isMultipleQuestion) {
	        return ButtonType.vote;
	      }
	      return ButtonType.disable;
	    },
	    isBtnAvailableToVote() {
	      return this.isBtnActive && this.buttonType === ButtonType.vote;
	    },
	    buttonClass() {
	      return `--${this.buttonType}`;
	    },
	    getSummaryText() {
	      if (this.question.totalCounter > 0) {
	        return getMessageWithCount('VOTE_SUMMARY_COUNT', this.question.totalCounter);
	      }
	      return getMessage('VOTE_SUMMARY_NO_VOTES');
	    },
	    getButtonText() {
	      if (this.isUserVoted || !this.isMultipleQuestion || this.isCompleted) {
	        return this.getSummaryText;
	      }
	      return getMessage('VOTE_BUTTON');
	    }
	  },
	  created() {
	    this.app = vote_application.VoteApplication.init();
	  },
	  methods: {
	    handleButtonClick() {
	      if (this.buttonType === ButtonType.vote) {
	        this.$emit('onClickVoteButton');
	      } else if (this.buttonType === ButtonType.showResults) {
	        this.$emit('showResults');
	      }
	    }
	  },
	  template: `
		<div class="vote-display-btn-wrapper">
			<button class="vote-display-btn"
					@click="handleButtonClick"
					:class="[buttonClass, { '--active': isBtnAvailableToVote }]"
					type="button"
			>
				{{ getButtonText }}
			</button>
		</div>
	`
	};

	// @vue/component
	const VotePopup = {
	  name: 'VotePopup',
	  components: {
	    Popup: ui_vue3_components_popup.Popup
	  },
	  emits: ['confirm', 'cancel'],
	  computed: {
	    getMessage: () => getMessage,
	    popupOptions() {
	      return {
	        width: 374,
	        className: 'vote-display__popup'
	      };
	    }
	  },
	  template: `
		<Popup
			:options="popupOptions" @close="$emit('cancel')"
			id="vote-display-popup"
		>
			<div class="vote-display__popup-content">
				<div class="vote-display__popup-title">
					{{ getMessage('VOTE_POPUP_TITLE') }}
				</div>
				<div class="vote-display__popup-text">
					{{ getMessage('VOTE_POPUP_TEXT') }}
				</div>
			</div>
			<div class="vote-display__popup-footer">
				<button class="vote-display__popup-btn --complete" @click="$emit('confirm')">
					{{ getMessage('VOTE_POPUP_BTN_COMPLETE') }}
				</button>
				<button class="vote-display__popup-btn --cancel" @click="$emit('cancel')">
					{{ getMessage('VOTE_POPUP_BTN_CANCEL') }}
				</button>
			</div>
		</Popup>
	`
	};

	const ANONYMOUS_VOTE = 2;

	// @vue/component
	const VoteDisplay = {
	  name: 'VoteDisplay',
	  components: {
	    VoteQuestion,
	    ButtonArea,
	    Loader: vote_component_loader.Loader,
	    VotePopup
	  },
	  props: {
	    voteItem: {
	      type: Object,
	      required: true
	    },
	    entityId: {
	      type: Number,
	      required: true
	    },
	    entityType: {
	      type: String,
	      required: true
	    },
	    contextId: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['vote', 'revokeVote', 'copyLink'],
	  data() {
	    return {
	      isLoading: true,
	      isShowPopup: false,
	      questionAnswers: {}
	    };
	  },
	  computed: {
	    firstQuestion() {
	      var _this$voteItem$data, _this$voteItem$data2;
	      const firstKey = Object.keys((_this$voteItem$data = this.voteItem.data) == null ? void 0 : _this$voteItem$data.questions)[0];
	      return (_this$voteItem$data2 = this.voteItem.data) == null ? void 0 : _this$voteItem$data2.questions[firstKey];
	    },
	    questionCollection() {
	      return this.app.getStore().getters['vote/getQuestionCollection'];
	    },
	    voteCollection() {
	      return this.app.getStore().getters['vote/getVoteCollection'];
	    },
	    currentVote() {
	      return this.voteCollection[this.voteItem.id];
	    },
	    formattedQuestion() {
	      const storeQuestion = this.questionCollection[this.firstQuestion.id] || {};
	      return {
	        ...this.firstQuestion,
	        totalCounter: storeQuestion.totalCounter,
	        isMultiple: storeQuestion.isMultiple
	      };
	    },
	    isUserVoted() {
	      if (this.isLoading) {
	        return false;
	      }
	      return this.currentVote.isVoted;
	    },
	    canRevoke() {
	      if (this.isLoading) {
	        return false;
	      }
	      return this.currentVote.canRevoke && this.isUserVoted && !this.isCompleted;
	    },
	    canEdit() {
	      if (this.isLoading) {
	        return false;
	      }
	      return this.currentVote.canEdit;
	    },
	    isAnonymous() {
	      var _this$voteItem$data3;
	      return ((_this$voteItem$data3 = this.voteItem.data) == null ? void 0 : _this$voteItem$data3.anonymity) === ANONYMOUS_VOTE;
	    },
	    isCompleted() {
	      if (this.isLoading) {
	        return false;
	      }
	      return this.currentVote.isCompleted;
	    },
	    hasSelectedAnswers() {
	      return main_core.Type.isArrayFilled(this.questionAnswers[this.firstQuestion.id]);
	    },
	    getVoteTypeText() {
	      return this.isAnonymous ? getMessage('VOTE_ANONYMOUS') : getMessage('VOTE_PUBLIC');
	    },
	    getCompletionVoteText() {
	      return getMessage('VOTE_NOTICE_COMPLETED');
	    }
	  },
	  created() {
	    this.app = vote_application.VoteApplication.init();
	    this.voteService = new vote_provider_service.ImVoteService(this.entityType, this.entityId);
	  },
	  async mounted() {
	    this.loadAttach();
	  },
	  methods: {
	    notifyAjaxError(ex) {
	      if (main_core.Type.isObject(ex) && main_core.Type.isArrayFilled(ex.errors)) {
	        var _ex$errors$0$message, _ex$errors$;
	        const message = (_ex$errors$0$message = ex == null ? void 0 : (_ex$errors$ = ex.errors[0]) == null ? void 0 : _ex$errors$.message) != null ? _ex$errors$0$message : 'Unexpected error';
	        ui_notification.UI.Notification.Center.notify({
	          content: main_core.Text.encode(message),
	          autoHideDelay: 4000
	        });
	      } else {
	        console.error(ex);
	      }
	    },
	    async answersSelected(event) {
	      this.questionAnswers[event.questionId] = event.answerIds;
	      const currentQuestion = this.questionCollection[event.questionId];
	      if (currentQuestion.isMultiple || this.isUserVoted) {
	        return;
	      }
	      void this.submitVote();
	    },
	    async submitVote() {
	      this.isLoading = true;
	      try {
	        this.app.getStore().dispatch('vote/setUserVoted', {
	          voteId: this.currentVote.id
	        });
	        await this.voteService.sendVote(this.questionAnswers);
	        this.$emit('vote');
	        this.questionAnswers = {};
	      } catch (e) {
	        console.error('Vote: submit vote error', e);
	        this.app.getStore().dispatch('vote/resetUserVoted', {
	          voteId: this.currentVote.id
	        });
	        BX.UI.Notification.Center.notify({
	          content: getMessage('VOTE_NOTICE_ERROR_MESSAGE_SUBMIT'),
	          autoHideDelay: 4000
	        });
	      }
	      this.isLoading = false;
	    },
	    onClickVoteButton() {
	      if (main_core.Type.isArrayFilled(this.questionAnswers[this.formattedQuestion.id])) {
	        this.submitVote();
	      }
	    },
	    async showResults() {
	      BX.SidePanel.Instance.open(this.currentVote.resultUrl, {
	        cacheable: false,
	        width: 480,
	        copyLinkLabel: true,
	        events: {
	          onOpen: ({
	            slider
	          }) => {
	            const copyLink = slider.getCopyLinkLabel();
	            copyLink.setOnclick(() => {
	              this.$emit('copyLink');
	            });
	          }
	        }
	      });
	    },
	    async loadAttach() {
	      try {
	        await this.voteService.load();
	        this.isLoading = false;
	      } catch (e) {
	        this.notifyAjaxError(e);
	        // @TODO add error state;
	      }
	    },

	    async completeVote() {
	      try {
	        this.app.getStore().dispatch('vote/setVoteCompleted', {
	          voteId: this.currentVote.id
	        });
	        await this.voteService.completeVote();
	      } catch (e) {
	        console.error('Vote: complete vote error', e);
	        this.app.getStore().dispatch('vote/resetVoteCompleted', {
	          voteId: this.currentVote.id
	        });
	        BX.UI.Notification.Center.notify({
	          content: getMessage('VOTE_NOTICE_ERROR_MESSAGE_COMPLETE'),
	          autoHideDelay: 4000
	        });
	      }
	    },
	    onCompetePopupConfirm() {
	      this.isShowPopup = false;
	      this.completeVote();
	    },
	    onCompetePopupCancel() {
	      this.isShowPopup = false;
	    },
	    async recallVote() {
	      const previousSelectedAnswers = this.app.getStore().getters['vote/getCurrentUserVotes'][this.firstQuestion.id];
	      try {
	        this.app.getStore().dispatch('vote/clearVotes', {
	          questionId: this.firstQuestion.id,
	          voteId: this.currentVote.id
	        });
	        this.app.getStore().dispatch('vote/resetUserVoted', {
	          voteId: this.currentVote.id
	        });
	        await this.voteService.revokeVote();
	        this.$emit('revokeVote');
	      } catch (e) {
	        console.error('Vote: recall vote error', e);
	        this.app.getStore().dispatch('vote/updateCurrentUserVotes', {
	          questionId: this.firstQuestion.id,
	          answerIds: previousSelectedAnswers
	        });
	        this.app.getStore().dispatch('vote/setUserVoted', {
	          voteId: this.currentVote.id
	        });
	        BX.UI.Notification.Center.notify({
	          content: getMessage('VOTE_NOTICE_ERROR_MESSAGE_REVOKE'),
	          autoHideDelay: 4000
	        });
	      }
	    }
	  },
	  template: `
			<form class="vote-display">
				<div class="vote-display-inner">
					<VoteQuestion
						:key="formattedQuestion.id"
						:contextId="contextId"
						:isLoading="isLoading"
						:question="formattedQuestion"
						:isUserVoted="isUserVoted"
						:isCompleted="isCompleted"
						:answers="formattedQuestion.answers"
						@answersSelected="answersSelected"
					/>
					<div class="vote-display-bottom-container">
						<div v-if="isLoading" class="vote-display__loader">
							<Loader />
						</div>
						<ButtonArea v-else
							:question="formattedQuestion"
							:isLoading="isLoading"
							:isUserVoted="isUserVoted"
							:isCompleted="isCompleted"
							:isBtnActive="hasSelectedAnswers"
							@onClickVoteButton="onClickVoteButton"
							@showResults="showResults"
						/>
						<div class="vote__notice">
							<span class="vote__notice-text">{{ getVoteTypeText }}</span>
							<span v-if="isCompleted" class="vote__notice-text">{{ getCompletionVoteText }}</span>
						</div>

		<!--				temporary button for testing-->
						<div style="height:22px;display:none;">
							<button v-if="canRevoke" @click="recallVote" type="button">Переголосовать</button>
						</div>
						<div style="height:22px;display:none;">
							<button  v-if="!isCompleted && canEdit" @click="isShowPopup = true" type="button">Завершить</button>
						</div>
					</div>
				</div>
			</form>
			<VotePopup 
				v-if="isShowPopup" 
				@confirm="onCompetePopupConfirm"
				@cancel="onCompetePopupCancel"
			/>
	`
	};

	exports.VoteDisplay = VoteDisplay;

}((this.BX.Vote.Component = this.BX.Vote.Component || {}),BX,BX.Vote.Service,BX.Vote.Component,BX,BX,BX.Vote,BX.Main,BX.UI.Vue3.Components));
//# sourceMappingURL=vote.bundle.js.map
