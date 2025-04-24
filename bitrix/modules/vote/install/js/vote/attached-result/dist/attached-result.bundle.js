/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_vue3_components_popup,ui_iconSet_api_vue,ui_iconSet_main,ui_iconSet_animated,ui_vue3) {
	'use strict';

	var _signedAttachId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("signedAttachId");
	var _limit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("limit");
	class VoteResultBackend {
	  constructor(signedAttachId, limit = 10) {
	    Object.defineProperty(this, _signedAttachId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _limit, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _signedAttachId)[_signedAttachId] = signedAttachId;
	    babelHelpers.classPrivateFieldLooseBase(this, _limit)[_limit] = limit;
	  }
	  async loadAnswer(answerId, page = 1) {
	    var _response$data$items, _response$data;
	    const data = {
	      signedAttachId: babelHelpers.classPrivateFieldLooseBase(this, _signedAttachId)[_signedAttachId],
	      answerId
	    };
	    const navigation = {
	      size: babelHelpers.classPrivateFieldLooseBase(this, _limit)[_limit],
	      page
	    };
	    const response = await BX.ajax.runAction('vote.AttachedVote.getAnswerVoted', {
	      data,
	      navigation
	    });
	    return (_response$data$items = response == null ? void 0 : (_response$data = response.data) == null ? void 0 : _response$data.items) != null ? _response$data$items : [];
	  }
	}

	const VoteAnswerVoted = {
	  name: 'VoteAnswerVoted',
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    count: {
	      type: String,
	      required: true
	    },
	    firstPageVoted: {
	      /** @type BackendVotedUser[] */
	      type: Array,
	      required: true
	    },
	    signedAttachId: {
	      type: String,
	      required: true
	    },
	    answerId: {
	      type: String,
	      required: true
	    },
	    maxVisibleAvatarsCount: {
	      type: Number,
	      required: false,
	      default: 3
	    },
	    pageSize: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      voted: this.firstPageVoted,
	      page: 1,
	      loading: false,
	      expanded: false
	    };
	  },
	  computed: {
	    countNumber() {
	      return parseInt(this.count, 10);
	    },
	    votedCountTitle() {
	      return main_core.Loc.getMessagePlural('VOTE_JS_ATTACHED_RESULT_ANSWER_VOTED_COUNT', this.countNumber, {
	        '#COUNT#': this.countNumber
	      });
	    },
	    firstPageVotedWithAvatars() {
	      return this.firstPageVoted.filter(votedUser => Boolean(votedUser.IMAGE)).slice(0, this.maxVisibleAvatarsCount);
	    },
	    popupOptions() {
	      return {
	        bindElement: this.$refs.votedLink,
	        borderRadius: '18px',
	        autoHide: true
	      };
	    }
	  },
	  methods: {
	    async popupScrollHandler(event) {
	      if (this.loading) {
	        return;
	      }
	      if (this.countNumber <= this.voted.length) {
	        return;
	      }
	      if (event.target.scrollHeight - event.target.scrollTop > event.target.clientHeight) {
	        return;
	      }
	      this.loading = true;
	      const nextPage = this.page + 1;
	      const backend = new VoteResultBackend(this.signedAttachId, this.pageSize);
	      try {
	        const nextPageUsers = await backend.loadAnswer(this.answerId, nextPage);
	        this.page = nextPage;
	        this.voted = [...this.voted, ...nextPageUsers];
	      } catch (error) {
	        console.error(error);
	      } finally {
	        this.loading = false;
	      }
	    }
	  },
	  template: `
		<div class="vote-answer-voted">
			<div v-if="firstPageVotedWithAvatars.length > 0" class="vote-answer-avatars">
				<img class="vote-answer-avatar" v-for="(user, index) in firstPageVotedWithAvatars" :key="index" :src="user.IMAGE" :alt="user.NAME" />
			</div>
			<div class="vote-answer-voted-link" @click="expanded = true" ref="votedLink">
				<div class="vote-answer-voted-title">{{ votedCountTitle }}</div>
				<div class="vote-answer-voted-down"></div>
			</div>
			<Popup v-if="expanded" :options="popupOptions" @close="expanded = false">
				<div class="vote-answer-popup-container" @scroll="this.popupScrollHandler($event)">
					<div v-for="(user, index) in voted" :key="index" class="vote-answer-voted-user">
						<img v-if="user.IMAGE" class="vote-answer-popup-avatar" :src="user.IMAGE" />
						<BIcon v-if="!user.IMAGE"
							   class="vote-answer-popup-avatar"
							   :name="'person'"
							   :size="26"
						/>
						<div class="vote-answer-voted-user-name">{{ user.NAME }}</div>
					</div>
					<BIcon v-if="loading" :name="'loader-wait'" :size="20" />
				</div>
			</Popup>
		</div>
	`
	};

	const VoteResultDisplay = {
	  name: 'VoteResultDisplay',
	  components: {
	    VoteAnswerVoted
	  },
	  props: {
	    loadedData: {
	      /** @type {BackendResultAll} */
	      type: Object,
	      required: true
	    },
	    votedPageSize: {
	      type: Number,
	      required: true
	    }
	  },
	  computed: {
	    anonymityLabel() {
	      var _this$loadedData, _this$loadedData$atta;
	      return ((_this$loadedData = this.loadedData) == null ? void 0 : (_this$loadedData$atta = _this$loadedData.attach) == null ? void 0 : _this$loadedData$atta.ANONYMITY) > 1 ? this.$Bitrix.Loc.getMessage('VOTE_JS_ATTACHED_RESULT_ANONYMOUS') : this.$Bitrix.Loc.getMessage('VOTE_JS_ATTACHED_RESULT_PUBLIC');
	    }
	  },
	  methods: {
	    getVoted(answerId) {
	      var _this$loadedData$vote, _this$loadedData$vote2;
	      return (_this$loadedData$vote = (_this$loadedData$vote2 = this.loadedData.voted) == null ? void 0 : _this$loadedData$vote2[answerId]) != null ? _this$loadedData$vote : [];
	    },
	    isAnswerSelected(questionId, answerId) {
	      var _this$loadedData$atta2, _this$loadedData$atta3, _this$loadedData$atta4;
	      return (_this$loadedData$atta2 = (_this$loadedData$atta3 = this.loadedData.attach.userAnswerMap) == null ? void 0 : (_this$loadedData$atta4 = _this$loadedData$atta3[questionId]) == null ? void 0 : _this$loadedData$atta4[answerId]) != null ? _this$loadedData$atta2 : false;
	    },
	    getQuestionVoted(count) {
	      return main_core.Loc.getMessagePlural('VOTE_JS_ATTACHED_RESULT_QUESTION_VOTED_COUNT', parseInt(count, 10), {
	        '#COUNT#': count
	      });
	    }
	  },
	  template: `
		<div class="vote-result-wrapper">
			<div v-if="loadedData">
				<div class="ui-text-4">{{ anonymityLabel }}</div>
				<div v-for="(question, questionId) in loadedData?.attach?.QUESTIONS" :key="questionId">
					<div class="ui-title-3">{{ question.QUESTION }}</div>
					<div class="ui-text-4">{{ this.getQuestionVoted(question.COUNTER) }}</div>
					<div class="vote-result-answer" v-for="(answer, answerId) in question.ANSWERS" :key="answerId">
						<div class="vote-result-answer-inner" :class="{ 'vote-answer-user': this.isAnswerSelected(questionId, answerId) }">
							<div class="vote-answer-message">{{ answer.MESSAGE }}</div>
							<div class="vote-answer-percent">
								<span class="vote-answer-percent-digit">{{ Math.round(answer.PERCENT) }}</span>
								<span class="vote-answer-percent-symbol">%</span>
							</div>
							<div
								class="vote-result-answer-inner-percent"
								:style="{ width: answer.PERCENT + '%' }"
							></div>
						</div>
						<div v-if="this.getVoted(answerId).length > 0">
							<VoteAnswerVoted
								:count="answer.COUNTER"
								:firstPageVoted="getVoted(answerId)"
								:signedAttachId="loadedData.attach.signedAttachId"
								:answerId="answerId"
								:pageSize="votedPageSize"
							/>
						</div>
					</div>
				</div>
			</div>
			<div v-if="!loadedData">
				{{ this.$Bitrix.Loc.getMessage('VOTE_JS_ATTACHED_RESULT_LOAD_ERROR') }}
			</div>
		</div>
	`
	};

	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _votedPageSize = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("votedPageSize");
	class VoteAttachedResult {
	  constructor(options) {
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _votedPageSize, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _votedPageSize)[_votedPageSize] = options.votedPageSize || 10;
	  }
	  createApplicationWithResult(backendResult) {
	    return ui_vue3.BitrixVue.createApp({
	      name: 'VoteAttachedResultRoot',
	      components: {
	        VoteResultDisplay
	      },
	      props: {
	        loaded: {
	          type: Object,
	          required: true
	        },
	        votedPageSize: {
	          type: Number,
	          required: true
	        }
	      },
	      template: '<VoteResultDisplay :loadedData="loaded" :votedPageSize="votedPageSize"/>'
	    }, {
	      loaded: backendResult,
	      votedPageSize: babelHelpers.classPrivateFieldLooseBase(this, _votedPageSize)[_votedPageSize]
	    });
	  }
	  renderTo(backendResult, container) {
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = this.createApplicationWithResult(backendResult);
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(container);
	  }
	}

	exports.VoteAttachedResult = VoteAttachedResult;

}((this.BX.Vote = this.BX.Vote || {}),BX,BX.UI.Vue3.Components,BX.UI.IconSet,BX,BX,BX.Vue3));
//# sourceMappingURL=attached-result.bundle.js.map
