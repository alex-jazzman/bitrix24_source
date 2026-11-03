/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons, socialnetwork_postForm, tasks_result) {
	'use strict';

	class Utils {
		static setStyle(node, styles) {
			Object.entries(styles).forEach(([key, value]) => {
				node.style[key] = value;
			});
		}
	}

	class PinnedPanel {
		constructor() {
			this.class = {
				pin: 'feed-post-pin',
				post: 'feed-item-wrap',
				postHide: 'feed-item-wrap-hide',
				postComments: 'feed-comments-block',
				postPinned: 'feed-post-block-pinned',
				postPinnedHide: 'feed-post-block-pinned-hide',
				postPinActive: 'feed-post-block-pin-active',
				postUnfollowed: 'feed-post-block-unfollowed',
				postExpanding: 'feed-post-block-expand',
				panelCollapsed: 'feed-pinned-panel-collapsed',
				panelNonEmpty: 'feed-pinned-panel-nonempty',
				panelPosts: 'feed-pinned-panel-posts',
				collapsedPanel: 'feed-post-collapsed-panel',
				collapsedPanelExpand: 'feed-post-collapsed-panel-right',
				collapsedPanelCounterPostsValue: 'feed-post-collapsed-panel-count-posts',
				collapsedPanelCounterComments: 'feed-post-collapsed-panel-box-comments',
				collapsedPanelCounterCommentsValue: 'feed-post-collapsed-panel-count-comments-value',
				collapsedPanelCounterCommentsShown: 'feed-post-collapsed-panel-box-shown',
				collapsedPanelCounterCommentsValueNew: 'feed-inform-comments-pinned-new',
				collapsedPanelCounterCommentsValueNewValue: 'feed-inform-comments-pinned-new-value',
				collapsedPanelCounterCommentsValueNewActive: 'feed-inform-comments-pinned-new-active',
				collapsedPanelCounterCommentsValueOld: 'feed-inform-comments-pinned-old',
				collapsedPanelCounterCommentsValueAll: 'feed-inform-comments-pinned-all',
				collapsedPanelShow: 'feed-post-collapsed-panel--show',
				collapsedPanelHide: 'feed-post-collapsed-panel--hide',
				cancelPanel: 'feed-post-cancel-pinned-panel',
				cancelPanelButton: 'feed-post-cancel-pinned-btn',
				cancelPanelLabel: 'feed-post-cancel-pinned-label'
			};
			this.panelInitialized = false;
			this.postsInitialized = false;
			this.handlePostClick = this.handlePostClick.bind(this);
			this.options = {};
			main_core.Event.ready(() => {
				/* for detail page without pinned panel */
				this.initPosts();
			});
		}
		resetFlags() {
			this.panelInitialized = false;
			this.postsInitialized = false;
		}
		init() {
			/* for list page in composite mode */
			this.initPanel();
			this.initPosts();
			this.initEvents();
		}
		setOptions(options) {
			this.options = {
				...this.options,
				...options
			};
		}
		getOption(optionName) {
			return this.options[optionName];
		}
		initPanel() {
			if (this.panelInitialized) {
				return;
			}
			const pinnedPanelNode = this.getPanelNode();
			if (!pinnedPanelNode) {
				return;
			}
			this.panelInitialized = true;
			this.adjustCollapsedPostsPanel();
			main_core.Event.bind(this.getCollapsedPanelNode(), 'click', () => {
				const pinnedPanelNode = this.getPanelNode();
				if (!pinnedPanelNode) {
					return;
				}
				const collapsedHeight = pinnedPanelNode.offsetHeight;
				Utils.setStyle(pinnedPanelNode, {
					height: collapsedHeight + 'px',
					transition: 'height .5s'
				});
				setTimeout(() => {
					pinnedPanelNode.style = '';
				}, 550);
				this.hideCollapsedPanel();
			});
			main_core.Event.bind(pinnedPanelNode, 'click', event => {
				const likeClicked = event.target.classList.contains('feed-inform-ilike') || event.target.closest('.feed-inform-ilike') !== null;
				const followClicked = event.target.classList.contains('feed-inform-follow') || event.target.closest('.feed-inform-follow') !== null;
				const menuClicked = event.target.classList.contains('feed-post-more-link') || event.target.closest('.feed-post-more-link') !== null || event.target.classList.contains('feed-post-right-top-menu');
				const contentViewClicked = event.target.classList.contains('feed-inform-contentview') || event.target.closest('.feed-inform-contentview') !== null;
				const pinClicked = event.target.classList.contains(`${this.class.pin}`) || event.target.closest(`.${this.class.pin}`) !== null;
				const collapseClicked = event.target.classList.contains('feed-post-pinned-link-collapse');
				const commentsClicked = event.target.classList.contains('feed-inform-comments-pinned') || event.target.closest('.feed-inform-comments-pinned') !== null;
				let postNode = null;
				if (event.target.classList.contains('feed-post-block')) {
					postNode = event.target;
				} else {
					postNode = event.target.closest('.feed-post-block');
				}
				if (!postNode) {
					return;
				}
				if (postNode.classList.contains(`${this.class.postPinned}`)) {
					if (!likeClicked && !followClicked && !menuClicked && !contentViewClicked && !pinClicked) {
						postNode.classList.remove(`${this.class.postPinned}`);
						const menuId = postNode.getAttribute('data-menu-id');
						if (menuId) {
							main_popup.MenuManager.destroy(menuId);
						}
						const event = new main_core_events.BaseEvent({
							compatData: [{
								rootNode: postNode
							}],
							data: {
								rootNode: postNode
							}
						});
						main_core_events.EventEmitter.emit('BX.Livefeed:recalculateComments', event);
					}
					if (commentsClicked) {
						const anchorNode = postNode.querySelector(`.${this.class.postComments} a[name=comments]`);
						if (anchorNode) {
							const position = main_core.Dom.getPosition(anchorNode);
							window.scrollTo(0, position.top - 200);
						}
					}
					event.stopPropagation();
					event.preventDefault();
				} else if (collapseClicked) {
					postNode.classList.add(`${this.class.postPinned}`);
					event.stopPropagation();
					event.preventDefault();
				}
			});
		}
		initPosts() {
			if (this.postsInitialized) {
				return;
			}
			const postList = document.querySelectorAll('[data-livefeed-post-pinned]');
			if (postList.length > 0) {
				this.postsInitialized = true;
			}
			Array.from(postList).forEach(post => {
				main_core.Event.unbind(post, 'click', this.handlePostClick);
				main_core.Event.bind(post, 'click', this.handlePostClick);
			});
		}
		handlePostClick(event) {
			if (!event.target.classList.contains(`${this.class.pin}`)) {
				return;
			}
			const post = event.target.closest('[data-livefeed-id]');
			if (!post) {
				return;
			}
			const newState = post.getAttribute('data-livefeed-post-pinned') === 'Y' ? 'N' : 'Y';
			const logId = parseInt(post.getAttribute('data-livefeed-id'));
			if (logId <= 0) {
				return;
			}
			this.changePinned({
				logId: logId,
				newState: newState,
				event: event
			}).then(() => {});
		}
		initEvents() {
			main_core_events.EventEmitter.subscribe('OnUCCommentWasRead', event => {
				const [xmlId, id, options] = event.getData();
				const {
					oldValue,
					newValue
				} = this.getCommentsData(xmlId);
				if (!!options.new) {
					this.setCommentsData(xmlId, {
						newValue: main_core.Type.isInteger(newValue) ? newValue - 1 : 0,
						oldValue: main_core.Type.isInteger(oldValue) ? oldValue + 1 : 1
					});
				}
			});
			main_core_events.EventEmitter.incrementMaxListeners('OnUCCommentWasPulled');
			main_core_events.EventEmitter.subscribe('OnUCCommentWasPulled', event => {
				const [id, data, params] = event.getData();
				const [xmlId, commentId] = id;
				const {
					newValue,
					oldValue,
					allValue,
					follow
				} = this.getCommentsData(xmlId);
				const commentsData = {
					allValue: main_core.Type.isInteger(allValue) ? allValue + 1 : 1
				};
				if (parseInt(params.AUTHOR.ID) !== parseInt(BX.message('USER_ID'))) {
					commentsData.newValue = main_core.Type.isInteger(newValue) ? newValue + 1 : 1;
				} else {
					commentsData.oldValue = main_core.Type.isInteger(oldValue) ? oldValue + 1 : 1;
				}
				this.setCommentsData(xmlId, commentsData);
			});
			main_core_events.EventEmitter.subscribe('OnUCommentWasDeleted', event => {
				const [xmlId, id, data] = event.getData();
				const {
					oldValue,
					allValue
				} = this.getCommentsData(xmlId);
				this.setCommentsData(xmlId, {
					allValue: main_core.Type.isInteger(allValue) ? allValue - 1 : 0,
					oldValue: main_core.Type.isInteger(oldValue) ? oldValue - 1 : 0
				});
			});
		}
		changePinned(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			const event = params.event ? params.event : null;
			let node = params.node ? params.node : null;
			let newState = params.newState ? params.newState : null;
			const panelNode = this.getPanelNode();
			if (!node && !event && logId > 0 && panelNode) {
				node = panelNode.querySelector(`.${this.class.post} > [data-livefeed-id="${logId}"]`);
			}
			if (!node && event) {
				node = event.target;
			}
			return new Promise((resolve, reject) => {
				if (!!this.getOption('pinBlocked') || !node || !newState) {
					return resolve();
				}
				this.setPostState({
					node: node,
					state: newState
				});
				const action = newState === 'Y' ? 'socialnetwork.api.livefeed.logentry.pin' : 'socialnetwork.api.livefeed.logentry.unpin';
				main_core.ajax.runAction(action, {
					data: {
						params: {
							logId: logId
						}
					},
					analyticsLabel: {
						b24statAction: newState === 'Y' ? 'pinLivefeedEntry' : 'unpinLivefeedEntry'
					}
				}).then(response => {
					if (!response.data.success) {
						this.setPostState({
							node: node,
							state: newState === 'Y' ? 'N' : 'Y'
						});
						return resolve();
					} else {
						this.movePost({
							node: node,
							state: newState
						}).then(() => {
							return resolve();
						});
					}
				}, response => {
					this.setPostState({
						node: node,
						state: newState === 'Y' ? 'N' : 'Y'
					});
					return resolve();
				});
			});
		}
		setPostState(params) {
			const state = params.state ? params.state : null;
			const node = params.node ? params.node : null;
			if (!node || !['Y', 'N'].includes(state)) {
				return;
			}
			const post = node.closest('[data-livefeed-post-pinned]');
			if (!post) {
				return;
			}
			post.setAttribute('data-livefeed-post-pinned', state);
			if (state === 'Y') {
				post.classList.add(`${this.class.postPinActive}`);
			} else {
				post.classList.remove(`${this.class.postPinActive}`);
			}
			const pin = post.querySelector(`.${this.class.pin}`);
			if (pin) {
				pin.setAttribute('title', main_core.Loc.getMessage(`SONET_EXT_LIVEFEED_PIN_TITLE_${state}`));
			}
		}
		getPanelNode() {
			return document.querySelector('[data-livefeed-pinned-panel]');
		}
		getPinnedData(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			if (logId <= 0) {
				return Promise.reject();
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('socialnetwork.api.livefeed.logentry.getPinData', {
					data: {
						params: {
							logId: logId
						}
					},
					headers: [{
						name: main_core.Loc.getMessage('SONET_EXT_LIVEFEED_AJAX_ENTITY_HEADER_NAME'),
						value: params.entityValue || ''
					}, {
						name: main_core.Loc.getMessage('SONET_EXT_LIVEFEED_AJAX_TOKEN_HEADER_NAME'),
						value: params.tokenValue || ''
					}]
				}).then(response => {
					return resolve(response.data);
				}, response => {
					return reject();
				});
			});
		}
		movePost(params) {
			const state = params.state ? params.state : null;
			const node = params.node ? params.node : null;
			return new Promise((resolve, reject) => {
				if (!node || !['Y', 'N'].includes(state)) {
					return resolve();
				}
				const post = node.closest('[data-livefeed-post-pinned]');
				if (!post) {
					return resolve();
				}
				const logId = parseInt(post.getAttribute('data-livefeed-id'));
				if (!logId) {
					return resolve();
				}
				const pinnedPanelNode = this.getPanelNode();
				if (!pinnedPanelNode) {
					return resolve();
				}
				const postToMove = post.parentNode.classList.contains(`${this.class.post}`) ? post.parentNode : post;
				const entityValue = post.getAttribute('data-security-entity-pin');
				const tokenValue = post.getAttribute('data-security-token-pin');
				if (state === 'Y') {
					const originalPostHeight = postToMove.offsetHeight;
					postToMove.setAttribute('bx-data-height', originalPostHeight);
					this.getPinnedData({
						logId: logId,
						entityValue: entityValue,
						tokenValue: tokenValue
					}).then(data => {
						const pinnedPanelTitleNode = post.querySelector('.feed-post-pinned-title');
						const pinnedPanelDescriptionNode = post.querySelector('.feed-post-pinned-desc');
						const pinnedPanelPinNode = post.querySelector(`.${this.class.pin}`);
						if (pinnedPanelTitleNode) {
							pinnedPanelTitleNode.innerHTML = data.TITLE;
						}
						if (pinnedPanelDescriptionNode) {
							pinnedPanelDescriptionNode.innerHTML = data.DESCRIPTION;
						}
						if (pinnedPanelPinNode) {
							pinnedPanelPinNode.title = main_core.Loc.getMessage('SONET_EXT_LIVEFEED_PIN_TITLE_Y');
						}
						post.classList.add(`${this.class.postPinnedHide}`);
						const cancelPinnedPanel = this.getCancelPinnedPanel({
							logId
						});
						const anchor = postToMove.nextSibling;
						anchor.parentNode.insertBefore(cancelPinnedPanel, anchor);
						this.centerCancelPinnedPanelElements({
							cancelPinnedPanel
						});
						cancelPinnedPanel.setAttribute('bx-data-height', originalPostHeight);
						const cancelPanelHeight = cancelPinnedPanel.getAttribute('bx-data-height');
						Utils.setStyle(cancelPinnedPanel, {
							height: cancelPanelHeight + 'px'
						});
						Utils.setStyle(postToMove, {
							position: 'absolute',
							width: '100%',
							height: originalPostHeight + 'px',
							backgroundColor: 'transparent',
							opacity: 0
						});
						const panelNode = this.getPanelNode();
						if (panelNode) {
							this.setOptions({
								panelHeight: panelNode.offsetHeight
							});
						}

						// list.post::hide.start, cancelPanel::show.start
						setTimeout(() => {
							postToMove.classList.add(`${this.class.postHide}`);
							Utils.setStyle(cancelPinnedPanel, {
								height: '53px'
							});
							Utils.setStyle(postToMove, {
								height: 0,
								opacity: 0
							});
							this.setOptions({
								pinBlocked: true
							});
						}, 100);

						// list.post::hide.end
						main_core.Event.unbindAll(postToMove, 'transitionend');
						main_core.Event.bind(postToMove, 'transitionend', event => {
							if (!this.checkTransitionProperty(event, 'height')) {
								return;
							}
							main_core.Event.unbindAll(postToMove, 'transitionend');
							const panelPostsNode = pinnedPanelNode.querySelector(`.${this.class.panelPosts}`);
							panelPostsNode.insertBefore(postToMove, panelPostsNode.firstChild);
							this.adjustCollapsedPostsPanel();
							postToMove.classList.remove(`${this.class.postHide}`);
							post.classList.remove(`${this.class.postPinnedHide}`);
							this.adjustPanel();
							this.showCollapsedPostsPanel();

							// pinnedPanel.post::show.start
							setTimeout(() => {
								post.classList.add(`${this.class.postPinned}`);
								Utils.setStyle(postToMove, {
									position: '',
									width: '',
									height: '80px',
									backgroundColor: '',
									opacity: 1
								});
								this.setOptions({
									pinBlocked: false
								});
								setTimeout(() => {
									postToMove.classList.remove(`${this.class.postHide}`);
									Utils.setStyle(postToMove, {
										position: '',
										width: '',
										height: '',
										backgroundColor: '',
										opacity: ''
									});
								}, 600); // 600 > transition 0.5
							}, 300);
						});
						return resolve();
					});
				} else {
					const height = postToMove.getAttribute('bx-data-height');
					const pinnedHeight = postToMove.scrollHeight;
					Utils.setStyle(postToMove, {
						transition: ''
					});
					const cancelPinnedPanel = document.querySelector(`.${this.class.cancelPanel}[bx-data-log-id="${logId}"]`);
					if (main_core.Type.isDomNode(cancelPinnedPanel)) {
						Utils.setStyle(postToMove, {
							height: pinnedHeight + 'px'
						});

						// pinnedPanel.post::hide.start, cancelPanel::show.start
						requestAnimationFrame(() => {
							postToMove.classList.add(`${this.class.postExpanding}`);
							cancelPinnedPanel.classList.add(`${this.class.postExpanding}`);
							Utils.setStyle(postToMove, {
								opacity: 0,
								height: 0
							});
							Utils.setStyle(cancelPinnedPanel, {
								opacity: 0,
								height: 0
							});
						});
						const collapsed = pinnedPanelNode.classList.contains(`${this.class.panelCollapsed}`);
						if (collapsed) {
							cancelPinnedPanel.parentNode.insertBefore(postToMove, cancelPinnedPanel.nextSibling);
							this.adjustCollapsedPostsPanel();
							this.adjustPanel();
						}
						const showCollapsed = this.getCollapsedPanelNode().classList.contains(`${this.class.collapsedPanelShow}`);
						if (showCollapsed) {
							this.hideCollapsedPostsPanel();

							// cancelPanel::show.end
							main_core.Event.unbindAll(cancelPinnedPanel, 'transitionend');
							main_core.Event.bind(cancelPinnedPanel, 'transitionend', event => {
								if (!this.checkTransitionProperty(event, 'height')) {
									return;
								}
								Utils.setStyle(postToMove, {
									transform: '',
									display: 'block'
								});
								this.animateCancel({
									post,
									postToMove,
									cancelPinnedPanel,
									height
								});
							});
						}

						// pinnedPanel.post::hide.end
						main_core.Event.unbindAll(postToMove, 'transitionend');
						main_core.Event.bind(postToMove, 'transitionend', event => {
							if (!this.checkTransitionProperty(event, 'opacity')) {
								return;
							}
							if (!collapsed) {
								cancelPinnedPanel.parentNode.insertBefore(postToMove, cancelPinnedPanel.nextSibling);
								this.adjustCollapsedPostsPanel();
								this.adjustPanel();
							}
							this.animateCancel({
								post,
								postToMove,
								cancelPinnedPanel,
								height
							});
						});
					} else {
						post.classList.remove(`${this.class.postPinned}`);
						pinnedPanelNode.parentNode.insertBefore(postToMove, pinnedPanelNode.nextSibling);
						this.adjustPanel();
						const originalPostHeight = postToMove.scrollHeight;
						postToMove.setAttribute('bx-data-height', originalPostHeight);
						Utils.setStyle(postToMove, {
							opacity: 0,
							height: '80px'
						});

						// list.post::show.start
						setTimeout(() => {
							Utils.setStyle(postToMove, {
								opacity: 1,
								height: originalPostHeight + 'px'
							});
						}, 100);

						// list.post::show.end
						main_core.Event.unbindAll(postToMove, 'transitionend');
						main_core.Event.bind(postToMove, 'transitionend', event => {
							if (!this.checkTransitionProperty(event, 'height')) {
								return;
							}
							Utils.setStyle(postToMove, {
								height: ''
							});
						});
					}
					return resolve();
				}
			});
		}
		animateCancel({
			post,
			postToMove,
			cancelPinnedPanel,
			height
		}) {
			post.classList.remove(`${this.class.postPinned}`);

			// post.list:show.start, cancelPanel::hide.start
			setTimeout(() => {
				Utils.setStyle(postToMove, {
					opacity: 1,
					height: height + 'px'
				});
				Utils.setStyle(cancelPinnedPanel, {
					height: 0
				});
				setTimeout(() => {
					cancelPinnedPanel.remove();
				}, 100);
			}, 100);

			// post.list:show.end
			main_core.Event.unbindAll(postToMove, 'transitionend');
			main_core.Event.bind(postToMove, 'transitionend', event => {
				if (!this.checkTransitionProperty(event, 'height')) {
					return;
				}
				post.classList.remove(`${this.class.postPinnedHide}`);
				Utils.setStyle(postToMove, {
					marginBottom: '',
					height: ''
				});
				Utils.setStyle(cancelPinnedPanel, {
					marginBottom: '',
					height: ''
				});
				postToMove.classList.remove(`${this.class.postExpanding}`);
				cancelPinnedPanel.classList.remove(`${this.class.postExpanding}`);
			});
		}
		getCancelPinnedPanel(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			if (logId <= 0) {
				return null;
			}
			let cancelPinnedPanel = document.querySelector(`.${this.class.cancelPanel}[bx-data-log-id="${logId}"]`);
			if (!main_core.Type.isDomNode(cancelPinnedPanel)) {
				cancelPinnedPanel = main_core.Tag.render`
				<div class="${this.class.cancelPanel}" bx-data-log-id="${logId}">
					<div class="feed-post-cancel-pinned-panel-inner">
						<div class="feed-post-cancel-pinned-content">
							<span class="${this.class.cancelPanelLabel}">${main_core.Loc.getMessage('SONET_EXT_LIVEFEED_PINNED_CANCEL_TITLE')}</span>
							<span class="feed-post-cancel-pinned-text">${main_core.Loc.getMessage('SONET_EXT_LIVEFEED_PINNED_CANCEL_DESCRIPTION')}</span>
						</div>
						<button class="ui-btn ui-btn-light-border ui-btn-round ui-btn-sm ${this.class.cancelPanelButton}">${main_core.Loc.getMessage('SONET_EXT_LIVEFEED_PINNED_CANCEL_BUTTON')}</button>
					</div>
				</div>	
				`;
				main_core.Event.bind(cancelPinnedPanel.querySelector(`.${this.class.cancelPanelButton}`), 'click', () => {
					this.changePinned({
						logId: logId,
						newState: 'N'
					}).then(() => {
						Utils.setStyle(cancelPinnedPanel, {
							opacity: 0,
							height: 0
						});
					});
				});
			}
			return cancelPinnedPanel;
		}
		centerCancelPinnedPanelElements({
			cancelPinnedPanel
		}) {
			if (!main_core.Type.isDomNode(cancelPinnedPanel)) {
				return;
			}

			// cancelPanel::show.start
			setTimeout(() => {
				Utils.setStyle(cancelPinnedPanel, {
					opacity: 1
				});
			}, 100);
			Utils.setStyle(cancelPinnedPanel.querySelector(`.${this.class.cancelPanelLabel}`), {
				marginLeft: cancelPinnedPanel.querySelector(`.${this.class.cancelPanelButton}`).getBoundingClientRect().width + 'px'
			});
		}
		getPostsCount() {
			const panelNode = this.getPanelNode();
			return panelNode ? Array.from(panelNode.getElementsByClassName(`${this.class.post}`)).length : 0;
		}
		hidePinnedItems() {
			const pinnedPanelNode = this.getPanelNode();
			if (!pinnedPanelNode) {
				return;
			}
			Utils.setStyle(pinnedPanelNode, {
				height: parseInt(this.getOption('panelHeight')) + 'px'
			});
			Array.from(pinnedPanelNode.getElementsByClassName(`${this.class.post}`)).reduce((count, item) => {
				count += item.offsetHeight;
				Utils.setStyle(item, {
					transition: 'opacity .1s linear, transform .2s .1s linear, height .5s linear'
				});
				Utils.setStyle(pinnedPanelNode, {
					transition: 'height .5s .1s linear'
				});

				// pinnedPanel.post::hide.start
				requestAnimationFrame(() => {
					Utils.setStyle(item, {
						opacity: '0!important',
						transform: `translateY(-${count}px)`
					});
					Utils.setStyle(pinnedPanelNode, {
						height: '58px'
					});
				});

				// pinnedPanel.post::hide.end
				main_core.Event.unbindAll(item, 'transitionend');
				main_core.Event.bind(item, 'transitionend', event => {
					if (!this.checkTransitionProperty(event, 'transform')) {
						return;
					}
					Utils.setStyle(item, {
						display: 'none',
						opacity: '',
						transform: '',
						transition: ''
					});
					Utils.setStyle(pinnedPanelNode, {
						transition: ''
					});
				});
				return count;
			}, 0);
		}
		showPinnedItems() {
			const pinnedPanelNode = this.getPanelNode();
			if (!pinnedPanelNode) {
				return;
			}
			Array.from(pinnedPanelNode.getElementsByClassName(`${this.class.post}`)).map((item, currentIndex, originalItemsList) => {
				Utils.setStyle(item, {
					display: 'block',
					opacity: 0
				});

				// pinnedPanel.post::show.start
				requestAnimationFrame(() => {
					Utils.setStyle(pinnedPanelNode, {
						height: 84 * (currentIndex + 1) - 4 + 'px'
					});
					Utils.setStyle(item, {
						transform: `translateY(${0}px)`,
						opacity: 1
					});
				});

				// pinnedPanel.post::show.end
				main_core.Event.unbindAll(item, 'transitionend');
				main_core.Event.bind(item, 'transitionend', event => {
					if (!this.checkTransitionProperty(event, 'transform')) {
						return;
					}
					Utils.setStyle(item, {
						display: 'block',
						height: '',
						transform: ''
					});
					Utils.setStyle(pinnedPanelNode, {
						height: ''
					});
					if (currentIndex + 1 === originalItemsList.length) {
						Utils.setStyle(pinnedPanelNode, {
							transition: '',
							height: ''
						});
					}
				});
			});
		}
		animateCollapsedPanel() {
			// collapsedPanel::hide.start
			requestAnimationFrame(() => {
				const collapsedPanel = this.getCollapsedPanelNode();
				Utils.setStyle(collapsedPanel, {
					position: 'absolute',
					top: 0,
					width: '100%',
					opacity: 0
				});
				collapsedPanel.classList.remove(`${this.class.collapsedPanelHide}`);
				collapsedPanel.classList.add(`${this.class.collapsedPanelShow}`);

				// collapsedPanel::show.start
				requestAnimationFrame(() => {
					Utils.setStyle(collapsedPanel, {
						position: 'relative',
						opacity: 1
					});
				});
			});
		}
		adjustCollapsedPostsPanel() {
			const postsCounter = this.getPostsCount();
			const postsCounterNode = this.getCollapsedPanelNode().querySelector(`.${this.class.collapsedPanelCounterPostsValue}`);
			if (postsCounterNode) {
				postsCounterNode.innerHTML = parseInt(postsCounter);
			}
			const commentsCounterNode = this.getCollapsedPanelNode().querySelector(`.${this.class.collapsedPanelCounterComments}`);
			const commentsCounterValueNode = this.getCollapsedPanelNode().querySelector(`.${this.class.collapsedPanelCounterCommentsValue}`);
			const panelNode = this.getPanelNode();
			if (commentsCounterNode && commentsCounterValueNode && panelNode) {
				const newCommentCounter = Array.from(panelNode.querySelectorAll(`.${this.class.collapsedPanelCounterCommentsValueNewValue}`)).reduce((acc, node) => {
					return acc + (node.closest(`.${this.class.postUnfollowed}`) ? 0 : parseInt(node.innerHTML));
				}, 0);
				commentsCounterValueNode.innerHTML = newCommentCounter;
				if (newCommentCounter > 0) {
					commentsCounterNode.classList.add(`${this.class.collapsedPanelCounterCommentsShown}`);
				} else {
					commentsCounterNode.classList.remove(`${this.class.collapsedPanelCounterCommentsShown}`);
				}
			}
		}
		adjustPanel() {
			const panelNode = this.getPanelNode();
			if (!panelNode) {
				return;
			}
			setTimeout(() => {
				if (this.getPostsCount() > 0) {
					panelNode.classList.add(`${this.class.panelNonEmpty}`);
				} else {
					panelNode.classList.remove(`${this.class.panelNonEmpty}`);
				}
			}, 0);
		}
		showCollapsedPostsPanel() {
			if (this.getPostsCount() >= main_core.Loc.getMessage('SONET_EXT_LIVEFEED_COLLAPSED_PINNED_PANEL_ITEMS_LIMIT')) {
				this.showCollapsedPanel();
				this.hidePinnedItems();
			}
		}
		hideCollapsedPostsPanel() {
			if (this.getPostsCount() < main_core.Loc.getMessage('SONET_EXT_LIVEFEED_COLLAPSED_PINNED_PANEL_ITEMS_LIMIT')) {
				this.getPanelNode().classList.remove(`${this.class.panelCollapsed}`);
				this.removeCollapsedPanel();
				this.showPinnedItems();
			}
		}
		showCollapsedPanel() {
			this.getPanelNode().classList.add(`${this.class.panelCollapsed}`);
			this.animateCollapsedPanel();
		}
		hideCollapsedPanel() {
			this.getPanelNode().classList.remove(`${this.class.panelCollapsed}`);
			this.showPinnedItems();
			this.removeCollapsedPanel();
		}
		removeCollapsedPanel() {
			const collapsedPanel = this.getCollapsedPanelNode();
			Utils.setStyle(collapsedPanel, {
				position: 'absolute',
				top: 0,
				width: '100%'
			});
			collapsedPanel.classList.remove(`${this.class.collapsedPanelShow}`);
			collapsedPanel.classList.add(`${this.class.collapsedPanelHide}`);
		}
		getCommentsNodes(xmlId) {
			const result = {
				follow: true,
				newNode: null,
				newValueNode: null,
				oldNode: null,
				allNode: null
			};
			if (!main_core.Type.isStringFilled(xmlId)) {
				return result;
			}
			const commentsNode = document.querySelector(`.${this.class.postComments}[data-bx-comments-entity-xml-id="${xmlId}"]`);
			if (!commentsNode) {
				return result;
			}
			const postNode = commentsNode.closest(`.${this.class.postPinActive}`);
			if (!postNode) {
				return result;
			}
			const newPinnedCommentsNode = postNode.querySelector(`.${this.class.collapsedPanelCounterCommentsValueNew}`);
			const newValuePinnedCommentsNode = postNode.querySelector(`.${this.class.collapsedPanelCounterCommentsValueNewValue}`);
			const oldPinnedCommentsNode = postNode.querySelector(`.${this.class.collapsedPanelCounterCommentsValueOld}`);
			const allPinnedCommentsNode = postNode.querySelector(`.${this.class.collapsedPanelCounterCommentsValueAll}`);
			if (!newPinnedCommentsNode || !newValuePinnedCommentsNode || !oldPinnedCommentsNode || !allPinnedCommentsNode) {
				return result;
			}
			result.newNode = newPinnedCommentsNode;
			result.newValueNode = newValuePinnedCommentsNode;
			result.oldNode = oldPinnedCommentsNode;
			result.allNode = allPinnedCommentsNode;
			result.follow = commentsNode.getAttribute('data-bx-follow') !== 'N';
			return result;
		}
		getCommentsData(xmlId) {
			const result = {
				newValue: null,
				oldValue: null,
				allValue: null
			};
			if (!main_core.Type.isStringFilled(xmlId)) {
				return result;
			}
			const {
				newValueNode,
				oldNode,
				allNode,
				follow
			} = this.getCommentsNodes(xmlId);
			result.follow = follow;
			if (!main_core.Type.isDomNode(newValueNode) || !main_core.Type.isDomNode(oldNode)) {
				return result;
			}
			let newCommentsValue = 0;
			let oldCommentsValue = 0;
			let allCommentsValue = 0;
			let matches = newValueNode.innerHTML.match(/(\d+)/);
			if (matches) {
				newCommentsValue = parseInt(matches[1]);
			}
			matches = oldNode.innerHTML.match(/(\d+)/);
			if (matches) {
				oldCommentsValue = parseInt(matches[1]);
			}
			matches = allNode.innerHTML.match(/(\d+)/);
			if (matches) {
				allCommentsValue = parseInt(matches[1]);
			}
			result.oldValue = oldCommentsValue;
			result.newValue = newCommentsValue;
			result.allValue = allCommentsValue;
			return result;
		}
		setCommentsData(xmlId, value) {
			if (!main_core.Type.isStringFilled(xmlId)) {
				return;
			}
			const {
				newNode,
				newValueNode,
				oldNode,
				allNode
			} = this.getCommentsNodes(xmlId);
			if (!main_core.Type.isDomNode(newNode) || !main_core.Type.isDomNode(newValueNode) || !main_core.Type.isDomNode(oldNode) || !main_core.Type.isDomNode(allNode)) {
				return;
			}
			if (main_core.Type.isInteger(value.newValue)) {
				newValueNode.innerHTML = `${value.newValue}`;
				if (value.newValue > 0 && !newNode.classList.contains(`${this.class.collapsedPanelCounterCommentsValueNewActive}`)) {
					newNode.classList.add(`${this.class.collapsedPanelCounterCommentsValueNewActive}`);
				} else if (value.newValue <= 0 && newNode.classList.contains(`${this.class.collapsedPanelCounterCommentsValueNewActive}`)) {
					newNode.classList.remove(`${this.class.collapsedPanelCounterCommentsValueNewActive}`);
				}
			}
			if (main_core.Type.isInteger(value.oldValue)) {
				oldNode.innerHTML = value.oldValue;
			}
			if (main_core.Type.isInteger(value.allValue)) {
				allNode.innerHTML = value.allValue;
			}
			this.adjustCollapsedPostsPanel();
		}
		getCollapsedPanelNode() {
			return this.getPanelNode().querySelector(`.${this.class.collapsedPanel}`);
		}
		checkTransitionProperty(event, propertyName) {
			return event.propertyName === propertyName;
		}
	}

	class Api {
		static async getTaskLinkData(createParams) {
			try {
				const {
					data: taskLinkData
				} = await main_core.ajax.runAction('intranet.controlbutton.getTaskLink', {
					data: {
						entityType: createParams.entityType,
						entityId: createParams.entityId,
						postEntityType: createParams.postEntityType
					}
				});
				return taskLinkData;
			} catch (error) {
				console.error('TaskCreator: getTaskLinkData error', error);
				return null;
			}
		}
		static async clearNewTaskFiles(signedFiles) {
			try {
				await main_core.ajax.runAction('intranet.controlbutton.clearNewTaskFiles', {
					data: {
						signedFiles
					}
				});
			} catch (error) {
				console.error('TaskCreator: Failed to clear files:', error);
			}
		}
		static async createEntityComment(taskId, createParams) {
			try {
				const postEntityType = createParams.postEntityType;
				await main_core.ajax.runAction('socialnetwork.api.livefeed.createEntityComment', {
					data: {
						params: {
							postEntityType: main_core.Type.isStringFilled(postEntityType) ? postEntityType : createParams.entityType,
							sourceEntityType: createParams.entityType,
							sourceEntityId: createParams.entityId,
							entityType: 'TASK',
							entityId: taskId,
							logId: createParams.logId
						}
					}
				});
			} catch (error) {
				console.error('TaskCreator: createEntityComment error', error);
			}
		}
	}

	const Context = Object.freeze({
		Feed: 'feed'
	});
	const Element = Object.freeze({
		PostContextMenu: 'post_context_menu',
		CommentContextMenu: 'comment_context_menu'
	});
	const Analytics = Object.freeze({
		Context,
		Element
	});

	class CardBuilder {
		static buildCardParams(createParams, requestData) {
			const isFromComment = main_core.Type.isStringFilled(createParams.postEntityType);
			return {
				taskId: `${createParams.entityType}_${Date.now()}`,
				createParams,
				requestData,
				title: requestData.TITLE,
				description: this.#formatTaskDescription(createParams.entityType, requestData),
				groupId: Number(requestData.GROUP_ID) || null,
				parentId: Number(requestData.PARENT_ID) || null,
				auditorsIds: requestData.AUDITORS.split(',').filter(id => id).map(Number),
				fileIds: requestData.UF_TASK_WEBDAV_FILES,
				source: this.#buildSourceParams(createParams),
				analytics: this.#buildAnalyticsParams(isFromComment)
			};
		}
		static #buildAnalyticsParams(isFromComment) {
			return {
				context: Analytics.Context.Feed,
				element: isFromComment ? Analytics.Element.CommentContextMenu : Analytics.Element.PostContextMenu
			};
		}
		static #buildSourceParams(createParams) {
			return {
				type: createParams.entityType,
				entityId: Number(createParams.entityId),
				subEntityId: Number(createParams.logId) || null
			};
		}
		static #formatTaskDescription(entityType, requestData) {
			const text = main_core.Text.decode(requestData.DESCRIPTION);
			const url = new URL(requestData.URL, location).toString();
			const suffix = main_core.Type.isStringFilled(requestData.SUFFIX) ? `_${requestData.SUFFIX}` : '';
			const headerLoc = `SONET_EXT_COMMENTAUX_CREATE_TASK_${entityType}${suffix}`;
			const headerText = main_core.Loc.getMessage(headerLoc).replace('#A_BEGIN#', `[URL=${url}]`).replace('#A_END#', '[/URL]');
			return `[QUOTE]${headerText}\n\n${text}[/QUOTE]`;
		}
	}

	const createdTasks = new Set();
	const eventHandler = new class {
		#inited = false;
		init() {
			if (this.#inited) {
				return;
			}
			main_core_events.EventEmitter.subscribe('tasks:card:taskAdded', this.#handleTaskAdded);
			main_core_events.EventEmitter.subscribe('tasks:full-card:closed', this.#handleCardClosed);
			main_core_events.EventEmitter.subscribe('tasks:card:closed', this.#handleCardClosed);
			this.#inited = true;
		}
		#handleTaskAdded = event => {
			const {
				task,
				initialTask
			} = event.getData();
			createdTasks.add(initialTask.id);
			void Api.createEntityComment(task.id, initialTask.createParams);
		};
		#handleCardClosed = event => {
			const cardParams = event.getData();
			if (createdTasks.has(cardParams.taskId)) {
				return;
			}
			void Api.clearNewTaskFiles(cardParams.requestData.UF_TASK_WEBDAV_FILES_SIGN);
		};
	}();

	const createFromContent = async createParams => {
		eventHandler.init();
		const taskLinkData = await Api.getTaskLinkData(createParams);
		const cardParams = CardBuilder.buildCardParams(createParams, taskLinkData);
		const {
			TaskCard
		} = await top.BX.Runtime.loadExtension('tasks.v2.application.task-card');
		const isFromComment = main_core.Type.isStringFilled(createParams.postEntityType);
		if (isFromComment) {
			TaskCard.showCompactCard(cardParams);
		} else {
			TaskCard.showFullCard(cardParams);
		}
	};

	class TaskCreator {
		static cssClass = {
			popupContent: 'feed-create-task-popup-content',
			popupTitle: 'feed-create-task-popup-title',
			popupDescription: 'feed-create-task-popup-description'
		};
		static signedFiles = null;
		static sliderUrl = '';
		constructor() {
			this.initEvents();
		}
		initEvents() {
			if (main_core.Loc.getMessage('SONET_EXT_LIVEFEED_INTRANET_INSTALLED') === 'Y' && main_core.Loc.getMessage('SONET_EXT_LIVEFEED_isV2Form') === 'Y') {
				return;
			}
			main_core_events.EventEmitter.subscribe('tasksTaskEvent', event => {
				const [type, data] = event.getCompatData();
				if (type !== 'ADD' || !main_core.Type.isPlainObject(data.options) || !main_core.Type.isBoolean(data.options.STAY_AT_PAGE) || data.options.STAY_AT_PAGE) {
					return;
				}
				TaskCreator.signedFiles = null;
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', event => {
				const sliderInstance = event.getTarget();
				if (!sliderInstance) {
					return;
				}
				const sliderUrl = sliderInstance.getUrl();
				if (!main_core.Type.isStringFilled(sliderUrl) || sliderUrl !== TaskCreator.sliderUrl || !main_core.Type.isStringFilled(TaskCreator.signedFiles)) {
					return;
				}
				main_core.ajax.runAction('intranet.controlbutton.clearNewTaskFiles', {
					data: {
						signedFiles: TaskCreator.signedFiles
					}
				}).then(() => {
					TaskCreator.signedFiles = null;
				});
			});
		}
		static async create(params) {
			if (main_core.Loc.getMessage('SONET_EXT_LIVEFEED_INTRANET_INSTALLED') === 'Y' && main_core.Loc.getMessage('SONET_EXT_LIVEFEED_isV2Form') === 'Y') {
				void createFromContent(params);
			}
		}
	}

	class Post {
		static showBackgroundWarning({
			urlToEdit,
			menuPopupWindow
		}) {
			const content = main_core.Tag.render`<div>${main_core.Loc.getMessage('SONET_EXT_LIVEFEED_POST_BACKGROUND_EDIT_WARNING_DESCRIPTION')}</div>`;
			const dialog = new main_popup.Popup('backgroundWarning', null, {
				autoHide: true,
				closeByEsc: true,
				offsetLeft: 0,
				offsetTop: 0,
				draggable: true,
				bindOnResize: false,
				titleBar: main_core.Loc.getMessage('SONET_EXT_LIVEFEED_POST_BACKGROUND_EDIT_WARNING_TITLE'),
				closeIcon: true,
				className: 'sonet-livefeed-popup-warning',
				content: content,
				events: {},
				cacheable: false,
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('SONET_EXT_LIVEFEED_POST_BACKGROUND_EDIT_WARNING_BUTTON_SUBMIT'),
					className: 'ui-btn ui-btn-primary',
					events: {
						click: () => {
							window.location = urlToEdit;
							dialog.close();
							if (menuPopupWindow) {
								menuPopupWindow.close();
							}
						}
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('SONET_EXT_LIVEFEED_POST_BACKGROUND_EDIT_WARNING_BUTTON_CANCEL'),
					className: 'ui-btn ui-btn-light',
					events: {
						click: () => {
							dialog.close();
							if (menuPopupWindow) {
								menuPopupWindow.close();
							}
						}
					}
				})]
			});
			dialog.show();
			return false;
		}
		static showMenu(params) {
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			const menuElement = params.menuElement;
			const ind = params.ind;
			const menuId = this.getMenuId(ind);
			main_popup.MenuManager.destroy(menuId);
			let log_id = !main_core.Type.isUndefined(params.log_id) ? parseInt(params.log_id) : 0;
			if (log_id <= 0) {
				log_id = parseInt(menuElement.getAttribute('data-log-entry-log-id'));
			}
			if (log_id <= 0) {
				return false;
			}
			let bFavorites = params.bFavorites;
			if (main_core.Type.isUndefined(bFavorites)) {
				bFavorites = menuElement.getAttribute('data-log-entry-favorites') === 'Y';
			}
			let arMenuItemsAdditional = params.arMenuItemsAdditional;
			if (main_core.Type.isUndefined(arMenuItemsAdditional)) {
				arMenuItemsAdditional = menuElement.getAttribute('data-bx-items');
				try {
					arMenuItemsAdditional = JSON.parse(arMenuItemsAdditional);
					if (!main_core.Type.isPlainObject(arMenuItemsAdditional)) {
						arMenuItemsAdditional = {};
					}
				} catch (e) {
					arMenuItemsAdditional = {};
				}
			}
			const bindElement = params.bindElement;
			let itemPinned = null;
			const pinnedPostNode = bindElement.closest('[data-livefeed-post-pinned]');
			if (pinnedPostNode) {
				const pinnedState = pinnedPostNode.getAttribute('data-livefeed-post-pinned') === 'Y';
				itemPinned = {
					text: pinnedState ? main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_PINNED_Y') : main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_PINNED_N'),
					className: 'menu-popup-no-icon',
					onclick: e => {
						PinnedPanelInstance.changePinned({
							logId: log_id,
							newState: pinnedState ? 'N' : 'Y',
							event: e,
							node: bindElement
						});
						main_popup.MenuManager.getMenuById(this.getMenuId(ind)).popupWindow.close();
						e.preventDefault();
					}
				};
			}
			const itemFavorites = main_core.Loc.getMessage('sonetLbUseFavorites') !== 'N' ? {
				text: bFavorites ? main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_Y') : main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_N'),
				className: 'menu-popup-no-icon',
				onclick: e => {
					__logChangeFavorites(log_id, `log_entry_favorites_${log_id}`, bFavorites ? 'N' : 'Y', true, e);
					e.preventDefault();
					e.stopPropagation();
				}
			} : null;
			let arItems = [itemPinned, itemFavorites, main_core.Type.isStringFilled(menuElement.getAttribute('data-log-entry-url')) ? {
				html: `<span id="${menuId}-href-text">${main_core.Loc.getMessage('sonetLMenuHref')}</span>`,
				className: 'menu-popup-no-icon feed-entry-popup-menu feed-entry-popup-menu-href',
				href: menuElement.getAttribute('data-log-entry-url')
			} : null, main_core.Type.isStringFilled(menuElement.getAttribute('data-log-entry-url')) ? {
				html: `<span id="${menuId}-link-text">${main_core.Loc.getMessage('sonetLMenuLink')}</span>` + `<span id="${menuId}-link-icon-animate" class="post-menu-link-icon-wrap">` + `<span class="post-menu-link-icon" id="${menuId}-link-icon-done" style="display: none;">` + '</span>' + '</span>',
				className: 'menu-popup-no-icon feed-entry-popup-menu feed-entry-popup-menu-link',
				onclick: e => {
					const menuItemText = document.getElementById(`${menuId}-link-text`);
					const menuItemIconDone = document.getElementById(`${menuId}-link-icon-done`);
					if (BX.clipboard.isCopySupported()) {
						if (menuItemText && menuItemText.getAttribute('data-block-click') === 'Y') {
							return;
						}
						BX.clipboard.copy(menuElement.getAttribute('data-log-entry-url'));
						if (menuItemText && menuItemIconDone) {
							menuItemIconDone.style.display = 'inline-block';
							document.getElementById(`${menuId}-link-icon-animate`).classList.remove('post-menu-link-icon-animate');
							main_core.Dom.adjust(document.getElementById(`${menuId}-link-text`), {
								attrs: {
									'data-block-click': 'Y'
								}
							});
							setTimeout(() => {
								document.getElementById(`${menuId}-link-icon-animate`).classList.add('post-menu-link-icon-animate');
							}, 1);
							setTimeout(() => {
								main_core.Dom.adjust(document.getElementById(`${menuId}-link-text`), {
									attrs: {
										'data-block-click': 'N'
									}
								});
							}, 500);
						}
						return;
					}
					const it = e.currentTarget;
					const height = parseInt(!!it.getAttribute('bx-height') ? it.getAttribute('bx-height') : it.offsetHeight);
					if (it.getAttribute('bx-status') !== 'shown') {
						it.setAttribute('bx-status', 'shown');
						const node = document.getElementById(`${menuId}-link-text`);
						if (!document.getElementById(`${menuId}-link`) && !!node) {
							const pos = BX.pos(node);
							const pos2 = BX.pos(node.parentNode);
							const pos3 = BX.pos(node.closest('.menu-popup-item'));
							pos.height = pos2.height - 1;
							main_core.Dom.adjust(it, {
								attrs: {
									'bx-height': it.offsetHeight
								},
								style: {
									overflow: 'hidden',
									display: 'block'
								},
								children: [main_core.Dom.create('BR'), main_core.Dom.create('DIV', {
									attrs: {
										id: `${menuId}-link`
									},
									children: [main_core.Dom.create('SPAN', {
										attrs: {
											className: 'menu-popup-item-left'
										}
									}), main_core.Dom.create('SPAN', {
										attrs: {
											className: 'menu-popup-item-icon'
										}
									}), main_core.Dom.create('SPAN', {
										attrs: {
											className: 'menu-popup-item-text'
										},
										children: [main_core.Dom.create('INPUT', {
											attrs: {
												id: `${menuId}-link-input`,
												type: 'text',
												value: menuElement.getAttribute('data-log-entry-url')
											},
											style: {
												height: `${pos.height}px`,
												width: `${pos3.width - 21}px`
											},
											events: {
												click: e => {
													e.currentTarget.select();
													e.stopPropagation();
													e.preventDefault();
												}
											}
										})]
									})]
								}), main_core.Dom.create('SPAN', {
									attrs: {
										className: 'menu-popup-item-right'
									}
								})]
							});
							Event.bind(document.getElementById(`${menuId}-link-input`), 'click', e => {
								e.currentTarget.select();
								e.preventDefault();
								e.stopPropagation();
							});
						}
						new BX.fx({
							time: 0.2,
							step: 0.05,
							type: 'linear',
							start: height,
							finish: height * 2,
							callback: function (height) {
								this.style.height = `${height}px`;
							}.bind(it)
						}).start();
						BX.fx.show(document.getElementById(`${menuId}-link`), 0.2);
						document.getElementById(`${menuId}-link-input`).select();
					} else {
						it.setAttribute('bx-status', 'hidden');
						new BX.fx({
							time: 0.2,
							step: 0.05,
							type: 'linear',
							start: it.offsetHeight,
							finish: height,
							callback: function (height) {
								this.style.height = `${height}px`;
							}.bind(it)
						}).start();
						BX.fx.hide(document.getElementById(`${menuId}-link`), 0.2);
					}
				}
			} : null, main_core.Loc.getMessage('sonetLCanDelete') === 'Y' ? {
				text: main_core.Loc.getMessage('sonetLMenuDelete'),
				className: 'menu-popup-no-icon',
				onclick: e => {
					if (confirm(main_core.Loc.getMessage('sonetLMenuDeleteConfirm'))) {
						FeedInstance.delete({
							logId: log_id,
							nodeId: `log-entry-${log_id}`,
							ind: ind
						});
					}
					e.stopPropagation();
					e.preventDefault();
				}
			} : null, menuElement.getAttribute('data-log-entry-createtask') === 'Y' ? {
				text: main_core.Loc.getMessage('sonetLMenuCreateTask'),
				className: 'menu-popup-no-icon',
				onclick: e => {
					TaskCreator.create({
						entryEntityType: menuElement.getAttribute('data-log-entry-entity-type'),
						entityType: menuElement.getAttribute('data-log-entry-entity-type'),
						entityId: menuElement.getAttribute('data-log-entry-entity-id'),
						logId: parseInt(menuElement.getAttribute('data-log-entry-log-id'))
					});
					main_popup.MenuManager.getMenuById(this.getMenuId(ind)).popupWindow.close();
					return e.preventDefault();
				}
			} : null, menuElement.getAttribute('data-log-entry-createtask') === 'Y' && menuElement.getAttribute('data-log-entry-entity-type') === 'TASK' ? {
				text: main_core.Loc.getMessage('sonetLMenuCreateSubTask'),
				className: 'menu-popup-no-icon',
				onclick: e => {
					TaskCreator.create({
						entryEntityType: menuElement.getAttribute('data-log-entry-entity-type'),
						entityType: menuElement.getAttribute('data-log-entry-entity-type'),
						entityId: menuElement.getAttribute('data-log-entry-entity-id'),
						logId: parseInt(menuElement.getAttribute('data-log-entry-log-id')),
						parentTaskId: parseInt(menuElement.getAttribute('data-log-entry-entity-id'))
					});
					main_popup.MenuManager.getMenuById(this.getMenuId(ind)).popupWindow.close();
					return e.preventDefault();
				}
			} : null];
			if (!!arMenuItemsAdditional && main_core.Type.isArray(arMenuItemsAdditional)) {
				arMenuItemsAdditional.forEach(item => {
					if (main_core.Type.isUndefined(item.className)) {
						item.className = 'menu-popup-no-icon';
					}
				});
				arItems = arItems.concat(arMenuItemsAdditional);
			}
			const arParams = {
				offsetLeft: -14,
				offsetTop: 4,
				lightShadow: false,
				angle: {
					position: 'top',
					offset: 50
				},
				events: {
					onPopupShow: ob => {
						if (document.getElementById(`log_entry_favorites_${log_id}`)) {
							let favoritesMenuItem = null;
							const menuItems = ob.contentContainer.querySelectorAll('.menu-popup-item-text');
							menuItems.forEach(menuItem => {
								if (menuItem.innerHTML === main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_Y') || menuItem.innerHTML === main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_N')) {
									favoritesMenuItem = menuItem;
								}
							});
							if (main_core.Type.isDomNode(favoritesMenuItem)) {
								favoritesMenuItem.innerHTML = document.getElementById(`log_entry_favorites_${log_id}`).classList.contains('feed-post-important-switch-active') ? main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_Y') : main_core.Loc.getMessage('SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_N');
							}
						}
						if (document.getElementById(`${menuId}-link`)) {
							const linkMenuItem = ob.popupContainer.querySelector('.feed-entry-popup-menu-link');
							if (linkMenuItem) {
								const height = parseInt(!!linkMenuItem.getAttribute('bx-height') ? linkMenuItem.getAttribute('bx-height') : 0);
								if (height > 0) {
									document.getElementById(`${menuId}-link`).style.display = 'none';
									linkMenuItem.setAttribute('bx-status', 'hidden');
									linkMenuItem.style.height = `${height}px`;
								}
							}
						}
					}
				}
			};
			main_popup.MenuManager.show(this.getMenuId(ind), bindElement, arItems, arParams);
		}
		static getMenuId(ind) {
			return `post-menu-${ind}`;
		}
		static editSpacesPost(postId, groupId) {
			const postForm = new socialnetwork_postForm.PostForm({
				postId,
				groupId
			});
			postForm.show();
		}
	}

	class Informer {
		constructor() {
			this.container = null;
			this.wrap = null;
			this.plus = null;
			this.value = null;
			this.currentSiteId = null;
			this.currentCounterType = null;
			this.counterDecrementStack = 0;
			this.counterValue = 0;
			this.lockCounterAnimation = null;
			this.isSpaceFeatureEnabled = null;
			this.currentUserId = null;
			this.currentSpaceId = null;
			this.class = {
				informerFixed: 'feed-new-message-informer-fixed',
				informerAnimation: 'feed-new-message-informer-anim',
				informerFixedAnimation: 'feed-new-message-informer-fix-anim',
				counterText: 'feed-new-message-inf-text',
				counterContainer: 'feed-new-message-inf-text-counter',
				reloadContainer: 'feed-new-message-inf-text-reload',
				icon: 'feed-new-message-icon',
				iconRotating: 'new-message-balloon-icon-rotating',
				plusHidden: 'feed-new-message-informer-counter-plus-hidden'
			};
		}
		init(props = {}) {
			const defaultValues = {
				isSpaceFeatureEnabled: false,
				userId: null,
				spaceId: null
			};
			const {
				isSpaceFeatureEnabled,
				userId,
				spaceId
			} = props || defaultValues;
			this.isSpaceFeatureEnabled = isSpaceFeatureEnabled;
			this.currentUserId = userId;
			this.currentSpaceId = spaceId;
			this.initNodes();
			this.initEvents();
		}
		initNodes() {
			this.currentCounterType = main_core.Loc.hasMessage('sonetLCounterType') ? main_core.Loc.getMessage('sonetLCounterType') : '**';
			this.currentSiteId = main_core.Loc.getMessage('SITE_ID');
			this.container = document.getElementById('sonet_log_counter_2_container');
			if (this.container) {
				this.container.addEventListener('click', this.showReloadAnimation.bind(this));
			}
			this.wrap = document.getElementById('sonet_log_counter_2_wrap');
			this.plus = document.getElementById('sonet_log_counter_2_plus');
			this.value = document.getElementById('sonet_log_counter_2');
		}
		initEvents() {
			main_core_events.EventEmitter.subscribe('onGoUp', event => {
				this.unfixWrap();
			});
			this.isSpaceFeatureEnabled ? this.subscribeOnSpaceCounters() : this.subscribeOnLiveFeedCounters();
			main_core_events.EventEmitter.subscribe('onImUpdateCounter', event => {
				const [counterData] = event.getCompatData();
				if (this.isSpaceFeatureEnabled || !main_core.Type.isObjectLike(counterData) || main_core.Type.isUndefined(counterData[this.currentCounterType])) {
					return;
				}
				this.changeCounter(counterData[this.currentCounterType]);
			});
			main_core_events.EventEmitter.subscribe('OnUCCommentWasRead', event => {
				if (this.isSpaceFeatureEnabled) {
					return;
				}
				const [xmlId, id, options] = event.getData();
				if (!main_core.Type.isObjectLike(options) || !options.live || !options.new) {
					return;
				}
				main_core_events.EventEmitter.emit('onCounterDecrement', new main_core_events.BaseEvent({
					compatData: [1]
				}));
				this.decrementCounter(1);
			});
		}
		subscribeOnSpaceCounters() {
			main_core_events.EventEmitter.subscribe('onPullEvent-socialnetwork', event => {
				const [command, eventParams] = event.getData();
				const userFromEvent = eventParams.userId ?? null;
				const spaces = eventParams.spaces ?? [];
				if (command !== 'user_spaces_counter' || parseInt(this.currentUserId) !== parseInt(userFromEvent)) {
					return;
				}
				const currentSpace = spaces.find(space => space.id === parseInt(this.currentSpaceId));
				const currentSpaceCounter = currentSpace && currentSpace.metrics && currentSpace.metrics.countersLiveFeedTotal ? currentSpace.metrics.countersLiveFeedTotal : 0;
				this.changeCounter(currentSpaceCounter);
			});
		}
		subscribeOnLiveFeedCounters() {
			main_core_events.EventEmitter.subscribe('onPullEvent-main', event => {
				const [command, eventParams] = event.getData();
				if (command !== 'user_counter' || !eventParams[this.currentSiteId] || !eventParams[this.currentSiteId][this.currentCounterType]) {
					return;
				}
				this.changeCounter(main_core.Runtime.clone(eventParams[this.currentSiteId][this.currentCounterType]));
			});
		}
		changeCounter(count) {
			this.counterValue = parseInt(count);
			if (this.counterValue <= 0) {
				this.counterDecrementStack = 0;
			}
			const valueToShow = this.counterValue - this.counterDecrementStack;
			this.changeAnimate({
				show: valueToShow > 0,
				counter: valueToShow,
				zeroCounterFromDb: valueToShow <= 0
			});
		}
		changeAnimate(params) {
			const show = !!params.show;
			const counterValue = parseInt(params.counter);
			const zeroCounterFromDb = !!params.zeroCounterFromDb;
			if (!this.container) {
				return;
			}
			const counterTextNode = this.container.querySelector(`span.${this.class.counterText}`);
			const reloadNode = this.container.querySelector(`span.${this.class.reloadContainer}`);
			if (this.lockCounterAnimation) {
				setTimeout(() => {
					this.changeAnimate({
						show: show,
						counter: counterValue
					});
				}, 200);
				return false;
			}
			if (show) {
				if (this.value) {
					this.value.innerHTML = counterValue;
				}
				this.showWrapAnimation();
				if (this.plus && reloadNode && !reloadNode.classList.contains('--hidden') && counterTextNode) {
					reloadNode.classList.add('--hidden');
					counterTextNode.classList.remove('--hidden');
					this.plus.classList.remove(`${this.class.plusHidden}`);
				}
			} else if (this.wrap) {
				if (zeroCounterFromDb && this.wrap.classList.contains(`${this.class.informerAnimation}`)) {
					if (counterTextNode && reloadNode) {
						counterTextNode.classList.add('--hidden');
						reloadNode.classList.remove('--hidden');
						this.hideReloadAnimation();
					}
				} else {
					setTimeout(() => {
						this.hideWrapAnimation();
					}, 400);
				}
			}
		}
		showWrapAnimation() {
			if (!this.wrap) {
				return;
			}
			this.wrap.style.visibility = 'visible';
			this.wrap.classList.add(`${this.class.informerAnimation}`);
		}
		hideWrapAnimation() {
			if (!this.wrap) {
				return;
			}
			this.wrap.classList.remove(`${this.class.informerAnimation}`);
			this.wrap.style.visibility = 'hidden';
		}
		showReloadAnimation() {
			if (!this.container) {
				return;
			}
			const counterWaiterNode = this.container.querySelector(`span.${this.class.icon}`);
			if (counterWaiterNode) {
				counterWaiterNode.classList.add(this.class.iconRotating);
			}
		}
		hideReloadAnimation() {
			if (!this.container) {
				return;
			}
			const counterNodeWaiter = this.container.querySelector(`span.${this.class.icon}`);
			if (counterNodeWaiter) {
				counterNodeWaiter.classList.remove(this.class.iconRotating);
			}
		}
		onFeedScroll() {
			if (!this.container || !this.wrap) {
				return;
			}
			const top = this.wrap.parentNode.getBoundingClientRect().top;
			//		const counterRect = this.container.getBoundingClientRect();

			if (top <= 53) {
				/*
							if (!this.wrap.classList.contains(`${this.class.informerFixed}`))
							{
								this.container.style.left = `${(counterRect.left + (counterRect.width / 2))}px`;
							}
				*/
				this.fixWrap();
			} else {
				this.unfixWrap();
				//			this.container.style.left = 'auto';
			}
		}
		fixWrap() {
			if (!this.wrap) {
				return;
			}
			this.wrap.classList.add(`${this.class.informerFixed}`, `${this.class.informerFixedAnimation}`);
		}
		unfixWrap() {
			if (!this.wrap) {
				return;
			}
			this.wrap.classList.remove(`${this.class.informerFixed}`, `${this.class.informerFixedAnimation}`);
		}
		recover() {
			if (!this.container) {
				return;
			}
			const counterContainerNode = this.container.querySelector(`span.${this.class.counterContainer}`);
			if (!counterContainerNode) {
				return;
			}
			counterContainerNode.classList.remove('--hidden');
			this.hideReloadNode();
			if (this.plus) {
				this.plus.classList.add(`${this.class.plusHidden}`);
			}
		}
		hideReloadNode() {
			if (!this.container) {
				return;
			}
			const reloadNode = this.container.querySelector(`span.${this.class.reloadContainer}`);
			if (!reloadNode) {
				return;
			}
			reloadNode.classList.add('--hidden');
		}
		decrementCounter(value) {
			this.counterDecrementStack += parseInt(value);
			if (!this.value) {
				return;
			}
			const counterValue = this.counterValue - this.counterDecrementStack;
			if (counterValue > 0) {
				this.value.innerHTML = counterValue;
			} else {
				this.changeAnimate({
					show: false,
					counter: 0
				});
			}
		}
		getWrap() {
			return this.wrap;
		}
	}

	class Loader {
		static cssClass = {
			feedMask: 'log-internal-mask',
			feedNoMask: 'log-internal-nomask',
			showLoader: 'livefeed-show-loader',
			hideLoader: 'livefeed-hide-loader'
		};
		static onAnimationEnd = event => {
			if ('animationName' in event && event.animationName && event.animationName === 'hideLoader') {
				const loaderContainer = document.getElementById('feed-loader-container');
				if (!loaderContainer) {
					return;
				}
				loaderContainer.classList.remove(this.cssClass.showLoader);
				loaderContainer.classList.remove(this.cssClass.hideLoader);
				loaderContainer.style.display = '';
			}
		};
		static showRefreshFade() {
			const feedContainer = document.getElementById('log_internal_container');
			if (feedContainer) {
				feedContainer.classList.add(this.cssClass.feedMask);
				feedContainer.classList.remove(this.cssClass.feedNoMask);
			}
			const loaderContainer = document.getElementById('feed-loader-container');
			if (loaderContainer) {
				loaderContainer.style.display = 'block';
				loaderContainer.classList.remove(this.cssClass.hideLoader);
				setTimeout(() => {
					loaderContainer.classList.add(this.cssClass.showLoader);
				}, 0);
			}
		}
		static hideRefreshFade() {
			const feedContainer = document.getElementById('log_internal_container');
			if (feedContainer) {
				feedContainer.classList.remove(this.cssClass.feedMask);
				feedContainer.classList.add(this.cssClass.feedNoMask);
			}
			const loaderContainer = document.getElementById('feed-loader-container');
			if (loaderContainer) {
				loaderContainer.classList.remove(this.cssClass.showLoader);
				loaderContainer.classList.add(this.cssClass.hideLoader);
			}
		}
	}

	class MoreButton {
		static cssClass = {
			post: 'feed-post-block',
			postShort: 'feed-post-block-short',
			postSeparator: 'feed-post-block-separator',
			postText: 'feed-post-text-block',
			postTextInner: 'feed-post-text-block-inner',
			postTextInnerInner: 'feed-post-text-block-inner-inner',
			more: 'feed-post-text-more',
			comment: 'feed-com-text'
		};
		constructor() {
			main_core_events.EventEmitter.subscribe('BX.Livefeed:recalculateComments', this.onRecalculateLivefeedComments.bind(this));
		}
		onRecalculateLivefeedComments(baseEvent) {
			const [data] = baseEvent.getCompatData();
			if (!main_core.Type.isDomNode(data.rootNode)) {
				return;
			}
			const informerBlock = data.rootNode;
			const moreBlock = informerBlock.querySelector(`.${MoreButton.cssClass.more}`);
			if (moreBlock) {
				informerBlock.classList.remove(MoreButton.cssClass.postSeparator);
			}
			MoreButton.recalcPost({
				arPos: {
					height: data.rootNode.offsetHeight + data.rootNode.offsetTop
				},
				informerBlock
			});
		}
		static recalcPost(params) {
			if (!main_core.Type.isDomNode(params.informerBlock)) {
				return;
			}
			const blockHeight = !main_core.Type.isUndefined(params.arPos) ? params.arPos.height : params.bodyBlock.offsetHeight;
			const postBlock = params.informerBlock.closest(`.${this.cssClass.post}`);
			if (!postBlock) {
				return;
			}
			if (blockHeight <= 284) {
				postBlock.classList.add(this.cssClass.postShort);
				postBlock.classList.add(this.cssClass.postSeparator);
			} else {
				postBlock.classList.remove(this.cssClass.postShort);
			}
		}
		static recalcPostsList() {
			const buttonsList = FeedInstance.getMoreButtons();
			buttonsList.forEach((buttonData, key) => {
				if (!main_core.Type.isPlainObject(buttonData) || !main_core.Type.isStringFilled(buttonData.bodyBlockID)) {
					return;
				}
				const bodyNode = document.getElementById(buttonData.bodyBlockID);
				if (!bodyNode) {
					return;
				}
				if (main_core.Type.isStringFilled(buttonData.outerBlockID)) {
					const outerNode = document.getElementById(buttonData.outerBlockID);
					if (outerNode) {
						if (outerNode.offsetWidth < bodyNode.offsetWidth) {
							const innerNode = outerNode.querySelector(`div.${this.cssClass.postTextInner}`);
							innerNode.style.overflowX = 'scroll';
						}
						const moreButton = outerNode.querySelector(`.${this.cssClass.more}`);
						if (moreButton) {
							main_core.Event.unbindAll(moreButton, 'click');
							main_core.Event.bind(moreButton, 'click', e => {
								BX.UI.Animations.expand({
									moreButtonNode: e.currentTarget,
									type: 'post',
									classBlock: this.cssClass.postText,
									classOuter: this.cssClass.postTextInner,
									classInner: this.cssClass.postTextInnerInner,
									heightLimit: 300,
									callback: textBlock => {
										this.expand(textBlock);
									}
								});
							});
							moreButton.hasClickListener = true;
						}
					}
				}
				this.recalcPost({
					arPos: {
						height: bodyNode.offsetHeight + bodyNode.offsetTop
					},
					informerBlock: main_core.Type.isStringFilled(buttonData.informerBlockID) ? document.getElementById(buttonData.informerBlockID) : null
				});
				buttonsList.delete(key);
			});
			FeedInstance.setMoreButtons(buttonsList);
			const feedContainer = document.getElementById('log_internal_container');
			if (!feedContainer) {
				return;
			}
			const onLoadImageList = feedContainer.querySelectorAll('[data-bx-onload="Y"]');
			onLoadImageList.forEach(imageNode => {
				imageNode.addEventListener('load', e => {
					let outerBlock = e.currentTarget.closest(`.${this.cssClass.comment}`);
					if (!outerBlock)
						// post
						{
							outerBlock = e.currentTarget.closest(`.${this.cssClass.post}`);
							if (outerBlock) {
								const bodyBlock = outerBlock.querySelector(`.${this.cssClass.postTextInnerInner}`);
								if (bodyBlock) {
									this.recalcPost({
										bodyBlock: bodyBlock,
										informerBlock: outerBlock.querySelector(`.${this.cssClass.more}`)
									});
								}
							}
						}
					e.currentTarget.setAttribute('data-bx-onload', 'N');
				});
			});
		}
		static recalcCommentsList() {
			main_core_events.EventEmitter.emit('OnUCMoreButtonListRecalc', new main_core_events.BaseEvent({
				compatData: []
			}));
		}
		static clearCommentsList() {
			main_core_events.EventEmitter.emit('OnUCMoreButtonListClear', new main_core_events.BaseEvent({
				compatData: []
			}));
		}
		static expand(textBlock) {
			if (!main_core.Type.isDomNode(textBlock)) {
				return;
			}
			const postBlock = textBlock.closest(`.${this.cssClass.post}`);
			if (!postBlock) {
				return;
			}
			postBlock.classList.add(this.cssClass.postShort);
			postBlock.classList.add(this.cssClass.postSeparator);
		}

		/*
		is not used actually by disk uf
		*/
		static lazyLoadCheckVisibility(image) {
			if (!main_core.Type.isPlainObject(image) || !main_core.Type.isDomNode(image.node)) {
				return true;
			}
			const imageNode = image.node;
			let textType = 'comment';
			let textBlock = imageNode.closest(`.${this.cssClass.comment}`);
			if (!textBlock) {
				textType = 'post';
				textBlock = imageNode.closest(`.${this.cssClass.postText}`);
			}
			if (!textBlock) {
				return true;
			}
			const moreBlock = textBlock.querySelector(`div.${this.cssClass.more}`);
			if (!moreBlock || moreBlock.style.display === 'none') {
				return true;
			}
			return imageNode.parentNode.parentNode.offsetTop < (textType === 'comment' ? 220 : 270);
		}
	}

	class Forum {
		static cssClass = {};
		static processSpoilerToggle(event) {
			let [params] = event.getCompatData();
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			if (!main_core.Type.isDomNode(params.node)) {
				return;
			}
			const outerBlock = params.node.closest('.feed-post-block');
			if (!outerBlock) {
				return;
			}
			const bodyBlock = outerBlock.querySelector('.feed-post-text-block-inner-inner');
			if (!bodyBlock) {
				return;
			}
			const moreBlock = outerBlock.querySelector('.feed-post-text-more');
			MoreButton.recalcPost({
				bodyBlock: bodyBlock,
				informerBlock: moreBlock
			});
		}
	}

	class Filter {
		constructor() {
			this.filterId = '';
			this.filterApi = null;
		}
		init(params) {
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			if (main_core.Type.isStringFilled(params.filterId) && !main_core.Type.isUndefined(BX.Main) && !main_core.Type.isUndefined(BX.Main.filterManager)) {
				const filterManager = BX.Main.filterManager.getById(params.filterId);
				this.filterId = params.filterId;
				if (filterManager) {
					this.filterApi = filterManager.getApi();
				}
			}
			this.initEvents();
		}
		initEvents() {
			main_core_events.EventEmitter.subscribe('BX.Livefeed.Filter:beforeApply', event => {
				Loader.showRefreshFade();
			});
			main_core_events.EventEmitter.subscribe('BX.Livefeed.Filter:apply', event => {
				const [filterValues, filterPromise, filterParams] = event.getCompatData();
				if (typeof filterParams != 'undefined') {
					filterParams.autoResolve = false;
				}
				PageInstance.refresh({
					useBXMainFilter: 'Y'
				}, filterPromise);
			});
			main_core_events.EventEmitter.subscribe('BX.Livefeed.Filter:searchInput', event => {
				const [searchString] = event.getCompatData();
				if (main_core.Type.isStringFilled(searchString)) {
					Loader.showRefreshFade();
				} else {
					Loader.hideRefreshFade();
				}
			});
		}
		initEventsCrm() {
			main_core_events.EventEmitter.subscribe('BX.Livefeed.Filter:searchInput', () => {
				PageInstance.refresh();
			});
		}
		clickTag(tagValue) {
			if (!main_core.Type.isStringFilled(tagValue) || !this.filterApi) {
				return false;
			}
			this.filterApi.setFields({
				TAG: tagValue
			});
			this.filterApi.apply();
			if (main_core.Type.isStringFilled(this.filterId) && !main_core.Type.isUndefined(BX.Main) && !main_core.Type.isUndefined(BX.Main.filterManager)) {
				const filterContainer = document.getElementById(`${this.filterId}_filter_container`);
				if (filterContainer && BX.Main.filterManager.getById(this.filterId) && (BX.Main.filterManager.getById(this.filterId).getSearch().getSquares().length > 0 || BX.Main.filterManager.getById(this.filterId).getSearch().getSearchString().length > 0)) {
					const pagetitleContainer = filterContainer.closest('.pagetitle-wrap');
					if (pagetitleContainer) {
						pagetitleContainer.classList.add('pagetitle-wrap-filter-opened');
					}
				}
			}
			new BX.easing({
				duration: 500,
				start: {
					scroll: window.pageYOffset
				},
				finish: {
					scroll: 0
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: state => {
					window.scrollTo(0, state.scroll);
				},
				complete: () => {}
			}).animate();
			return true;
		}
	}

	class ContentView {
		static registerAreaList() {
			var container = BX('log_internal_container'),
				fullContentArea = null;
			if (container) {
				var viewAreaList = BX.findChildren(container, {
					tag: 'div',
					className: 'feed-post-contentview'
				}, true);
				for (var i = 0, length = viewAreaList.length; i < length; i++) {
					if (viewAreaList[i].id.length > 0) {
						fullContentArea = BX.findChild(viewAreaList[i], {
							tag: 'div',
							className: 'feed-post-text-block-inner-inner'
						});
						BX.UserContentView.registerViewArea(viewAreaList[i].id, fullContentArea ? fullContentArea : null);
					}
				}
			}
		}
	}

	class Page {
		constructor() {
			this.loadStarted = null;
			this.stopTrackNextPage = null;
			this.requestMode = null;
			this.nextPageFirst = null;
			this.nextPageUrl = null;
			this.scrollInitialized = null;
			this.firstPageLastTS = 0;
			this.firstPageLastId = 0;
			this.useBXMainFilter = 'N';
			this.commentFormUID = '';
			this.blogCommentFormUID = '';
			this.signedParameters = '';
			this.componentName = '';
			this.context = '';
			this.class = {};
			main_core.Event.ready(() => {
				this.init();
			});
		}
		init() {
			this.loadStarted = false;
			this.stopTrackNextPage = false;
			this.requestMode = false;
			this.nextPageFirst = true;
			this.nextPageUrl = false;
			this.scrollInitialized = false;
		}
		refresh(params, filterPromise) {
			if (this.loadStarted) {
				return;
			}
			this.setRequestModeNew();
			params = main_core.Type.isPlainObject(params) ? params : {};
			params.siteTemplateId = main_core.Loc.getMessage('SONET_EXT_LIVEFEED_SITE_TEMPLATE_ID');
			params.assetsCheckSum = main_core.Loc.getMessage('sonetLAssetsCheckSum');
			params.context = main_core.Type.isStringFilled(params.context) ? params.context : this.context;
			this.loadStarted = true;
			Loader.showRefreshFade();
			MoreButton.clearCommentsList();
			FeedInstance.clearMoreButtons();
			if (main_core.Type.isStringFilled(this.commentFormUID)) {
				params.commentFormUID = this.commentFormUID;
			}
			if (!main_core.Type.isStringFilled(params.useBXMainFilter) || params.useBXMainFilter !== 'Y') {
				main_core_events.EventEmitter.emit('BX.Livefeed:refresh', new main_core_events.BaseEvent({
					compatData: []
				}));
			}
			InformerInstance.hideReloadNode();
			InformerInstance.lockCounterAnimation = true;
			this.loadStarted = false;
			main_core.ajax.runAction('socialnetwork.api.livefeed.refresh', {
				signedParameters: this.getSignedParameters(),
				data: {
					c: this.getComponentName(),
					logajax: 'Y',
					// compatibility
					RELOAD: 'Y',
					// compatibility
					params: params
				}
			}).then(response => {
				const responseData = main_core.Type.isPlainObject(response.data) ? response.data : {};
				this.loadStarted = false;
				Loader.hideRefreshFade();
				if (filterPromise) {
					filterPromise.fulfill();
				}
				const emptyLivefeed = main_core.Type.isPlainObject(responseData.componentResult) && main_core.Type.isStringFilled(responseData.componentResult.EMPTY) ? responseData.componentResult.EMPTY : 'N';
				const forcePageRefresh = main_core.Type.isPlainObject(responseData.componentResult) && main_core.Type.isStringFilled(responseData.componentResult.FORCE_PAGE_REFRESH) ? responseData.componentResult.FORCE_PAGE_REFRESH : 'N';
				const isFilterUsed = main_core.Type.isPlainObject(responseData.componentResult) && main_core.Type.isStringFilled(responseData.componentResult.FILTER_USED) && responseData.componentResult.FILTER_USED === 'Y';
				if (forcePageRefresh === 'Y') {
					top.window.location.reload();
					return;
				}
				const loaderContainer = document.getElementById('feed-loader-container');
				InformerInstance.lockCounterAnimation = false;
				const feedContainer = document.getElementById('log_internal_container');
				if (!feedContainer) {
					return;
				}
				main_core.Dom.clean(feedContainer);
				const emptyBlock = document.getElementById('feed-empty-wrap');
				if (emptyBlock) {
					if (emptyLivefeed === 'Y') {
						emptyBlock.style.display = 'block';
						const emptyTextNode = emptyBlock.querySelector('.feed-wrap-empty');
						if (emptyTextNode) {
							emptyTextNode.innerHTML = isFilterUsed ? main_core.Loc.getMessage('SONET_C30_T_EMPTY_SEARCH') : main_core.Loc.getMessage('SONET_C30_T_EMPTY');
						}
					} else {
						emptyBlock.style.display = 'none';
					}
				}
				if (loaderContainer) {
					feedContainer.appendChild(loaderContainer);
				}
				if (responseData.html.length > 0) {
					this.clearContainerExternal();
					BX.LazyLoad.clearImages();
					const pageNode = main_core.Tag.render`<div id="content_block_${Math.floor(Math.random() * 1000)}" class="feed-wrap" style="display: block;"></div>`;
					feedContainer.appendChild(pageNode);
					main_core.Runtime.html(pageNode, responseData.html).then(() => {
						MoreButton.recalcPostsList();
						MoreButton.recalcCommentsList();
						ContentView.registerAreaList();
						PinnedPanelInstance.resetFlags();
						PinnedPanelInstance.initPanel();
						PinnedPanelInstance.initPosts();
					});
					this.stopTrackNextPage = false;
					MoreButton.clearCommentsList();
					const informerWrap = InformerInstance.getWrap();
					if (informerWrap && informerWrap.classList.contains(InformerInstance.class.informerFixed)) {
						new BX.easing({
							duration: 500,
							start: {
								scroll: window.pageYOffset
							},
							finish: {
								scroll: 0
							},
							transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
							step: state => {
								window.scrollTo(0, state.scroll);
							},
							complete: () => {
								main_core_events.EventEmitter.emit('onGoUp', []);
							}
						}).animate();
					}
				}
			}, () => {
				this.loadStarted = false;
				if (filterPromise) {
					filterPromise.reject();
				}
				Loader.hideRefreshFade();
				this.showRefreshError();
			});
			return false;
		}
		getNextPage() {
			const stubContainer = document.getElementById('feed-new-message-inf-wrap');
			const stubFirstContainer = document.getElementById('feed-new-message-inf-wrap-first');
			if (this.loadStarted) {
				return false;
			}
			this.setRequestModeMore();
			this.loadStarted = true;
			InformerInstance.lockCounterAnimation = true;
			FeedInstance.clearMoreButtons();
			if (!this.nextPageFirst && stubContainer) {
				stubContainer.style.display = 'block';
			} else if (this.nextPageFirst && stubFirstContainer) {
				stubFirstContainer.classList.add('feed-new-message-inf-wrap-first-visible');
			}
			const nextUrlParamsList = new main_core.Uri(this.getNextPageUrl()).getQueryParams();
			let pageNumber = 1;
			let prevPageLogId = '';
			let ts = 0;
			let noblog = 'N';
			Object.entries(nextUrlParamsList).forEach(([key, value]) => {
				if (key.match(/^PAGEN_(\d+)$/i)) {
					pageNumber = parseInt(value);
				} else if (key === 'pplogid') {
					prevPageLogId = decodeURI(value);
				} else if (key === 'ts') {
					ts = value;
				} else if (key === 'noblog') {
					noblog = value;
				}
			});
			const queryParams = {
				PAGE_NUMBER: pageNumber,
				LAST_LOG_TIMESTAMP: ts,
				PREV_PAGE_LOG_ID: prevPageLogId,
				siteTemplateId: main_core.Loc.getMessage('SONET_EXT_LIVEFEED_SITE_TEMPLATE_ID'),
				useBXMainFilter: this.useBXMainFilter,
				preset_filter_top_id: main_core.Type.isStringFilled(nextUrlParamsList.preset_filter_top_id) && nextUrlParamsList.preset_filter_top_id !== '0' ? nextUrlParamsList.preset_filter_top_id : '',
				preset_filter_id: main_core.Type.isStringFilled(nextUrlParamsList.preset_filter_id) && nextUrlParamsList.preset_filter_id !== '0' ? nextUrlParamsList.preset_filter_id : ''
			};
			if (main_core.Type.isStringFilled(this.commentFormUID)) {
				queryParams.commentFormUID = this.commentFormUID;
			}
			if (main_core.Type.isStringFilled(this.blogCommentFormUID)) {
				queryParams.blogCommentFormUID = this.blogCommentFormUID;
			}
			queryParams.context = this.context;
			const queryData = {
				c: this.getComponentName(),
				logajax: 'Y',
				// compatibility with socialnetwork.blog.post.comment
				noblog: noblog,
				// compatibility with socialnetwork.blog.post.comment
				params: queryParams
			};
			if (!main_core.Type.isUndefined(nextUrlParamsList.CREATED_BY_ID)) {
				queryData.flt_created_by_id = parseInt(nextUrlParamsList.CREATED_BY_ID);
			}
			if (!main_core.Type.isUndefined(nextUrlParamsList.flt_date_datesel)) {
				queryData.flt_date_datesel = nextUrlParamsList.flt_date_datesel;
			}
			if (!main_core.Type.isUndefined(nextUrlParamsList.flt_date_from)) {
				queryData.flt_date_from = decodeURIComponent(nextUrlParamsList.flt_date_from);
			}
			if (!main_core.Type.isUndefined(nextUrlParamsList.flt_date_to)) {
				queryData.flt_date_to = decodeURIComponent(nextUrlParamsList.flt_date_to);
			}
			main_core.ajax.runAction('socialnetwork.api.livefeed.getNextPage', {
				signedParameters: this.getSignedParameters(),
				data: queryData
			}).then(response => {
				const responseData = main_core.Type.isPlainObject(response.data) ? response.data : {};
				this.loadStarted = false;
				const stubContainer = document.getElementById('feed-new-message-inf-wrap');
				if (stubContainer) {
					main_core.Dom.clean(stubContainer);
					main_core.Dom.remove(stubContainer);
				}
				InformerInstance.lockCounterAnimation = false;
				const lastEntryTimestamp = main_core.Type.isPlainObject(responseData.componentResult) && !main_core.Type.isUndefined(responseData.componentResult.LAST_TS) ? parseInt(responseData.componentResult.LAST_TS) : 0;
				const lastEntryId = main_core.Type.isPlainObject(responseData.componentResult) && !main_core.Type.isUndefined(responseData.componentResult.LAST_ID) ? parseInt(responseData.componentResult.LAST_ID) : null;
				if (responseData.html.length > 0 && lastEntryTimestamp > 0 && (parseInt(this.firstPageLastTS) <= 0 || lastEntryTimestamp < parseInt(this.firstPageLastTS) || lastEntryTimestamp == parseInt(this.firstPageLastTS) && !main_core.Type.isNull(lastEntryId) && lastEntryId < parseInt(this.firstPageLastId))) {
					MoreButton.clearCommentsList();
					const contentBlockId = `content_block_${Math.floor(Math.random() * 1000)}`;
					const pageNode = main_core.Tag.render`<div id="${contentBlockId}" class="feed-wrap" style="display:${this.nextPageFirst ? 'none' : 'block'};"></div>`;
					const feedContainer = document.getElementById('log_internal_container');
					if (!feedContainer) {
						return;
					}
					feedContainer.appendChild(pageNode);
					main_core.Runtime.html(pageNode, responseData.html).then(() => {
						if (pageNumber > 2) {
							this.stopTrackNextPage = false;
							MoreButton.recalcPostsList();
							ContentView.registerAreaList();
							MoreButton.recalcCommentsList();
							PinnedPanelInstance.resetFlags();
							PinnedPanelInstance.initPosts();
						}
					});
					this.clearContainerExternal();
					if (pageNumber === 2) {
						document.getElementById('feed-new-message-inf-text-first').style.display = 'block';
						document.getElementById('feed-new-message-inf-loader-first').style.display = 'none';
						stubFirstContainer.classList.add('feed-new-message-inf-wrap-first-active');
						const f = () => {
							this.stopTrackNextPage = false;
							if (pageNode) {
								pageNode.style.display = 'block';
							}
							main_core.Event.unbind(document.getElementById('sonet_log_more_container_first'), 'click', f);
							stubFirstContainer.style.display = 'none';
							MoreButton.recalcPostsList();
							ContentView.registerAreaList();
							MoreButton.recalcCommentsList();
							main_core_events.EventEmitter.emit('BX.Livefeed:recalculateComments', new main_core_events.BaseEvent({
								compatData: [{
									rootNode: pageNode
								}]
							}));
							PinnedPanelInstance.resetFlags();
							PinnedPanelInstance.initPosts();
						};
						main_core.Event.bind(document.getElementById('sonet_log_more_container_first'), 'click', f);
					} else {
						if (pageNode) {
							pageNode.style.display = 'block';
						}
					}
					this.nextPageFirst = false;
				} else if (document.getElementById('feed-new-message-inf-wrap-first')) {
					document.getElementById('feed-new-message-inf-wrap-first').style.display = 'none';
				}
			}, () => {
				this.loadStarted = false;
				this.stopTrackNextPage = false;
				const stubContainer = document.getElementById('feed-new-message-inf-wrap');
				if (stubContainer) {
					stubContainer.style.display = 'none';
				}
				InformerInstance.lockCounterAnimation = false;
				this.clearContainerExternal();
			});
			return false;
		}
		clearContainerExternal() {
			if (this.requestMode === 'new') {
				InformerInstance.hideWrapAnimation();
				InformerInstance.recover();
			}
			InformerInstance.hideReloadAnimation();
			const counterPreset = document.getElementById('sonet_log_counter_preset');
			if (counterPreset && this.requestMode === 'new') {
				counterPreset.style.display = 'none';
			}
		}
		setRequestModeNew() {
			this.requestMode = 'new';
		}
		setRequestModeMore() {
			this.requestMode = 'more';
		}
		showRefreshError() {
			InformerInstance.lockCounterAnimation = false;
			this.clearContainerExternal();
		}
		setSignedParameters(value) {
			this.signedParameters = value;
		}
		setContext(context) {
			this.context = context;
		}
		getSignedParameters() {
			return this.signedParameters;
		}
		setComponentName(value) {
			this.componentName = value;
		}
		getComponentName() {
			return this.componentName;
		}
		setNextPageUrl(value) {
			this.nextPageUrl = value;
		}
		getNextPageUrl() {
			return this.nextPageUrl;
		}
		initScroll() {
			if (this.scrollInitialized) {
				return;
			}
			this.scrollInitialized = true;
			document.addEventListener('scroll', this.onFeedScroll.bind(this), true);
		}
		onFeedScroll() {
			if (!this.stopTrackNextPage) {
				const maxScroll = document.documentElement.scrollHeight - window.innerHeight - 500;
				if (window.pageYOffset >= maxScroll && this.getNextPageUrl()) {
					this.stopTrackNextPage = true;
					this.getNextPage();
				}
			}
			InformerInstance.onFeedScroll();
		}
	}

	class CommentForm {
		static resultFieldTaskIdList = [];
		static taskResultCommentsData = {};
		static appendResultFieldTaskIds(taskIdList) {
			if (!main_core.Type.isArray(taskIdList)) {
				return;
			}
			taskIdList = taskIdList.map(value => {
				return parseInt(value);
			});
			this.resultFieldTaskIdList = [...this.resultFieldTaskIdList, ...taskIdList];
		}
		static appendTaskResultComments(data) {
			if (main_core.Type.isUndefined(tasks_result.ResultManager)) {
				return;
			}
			this.taskResultCommentsData = Object.assign(this.taskResultCommentsData, data);
			Object.entries(this.taskResultCommentsData).forEach(([taskId, commentsIdList]) => {
				tasks_result.ResultManager.getInstance().initResult({
					context: 'task',
					taskId: parseInt(taskId),
					comments: commentsIdList
				});
			});
		}
		static onAfterShow(obj, text, data) {
			if (!main_core.Type.isPlainObject(data)) {
				data = {};
			}
			main_core_events.EventEmitter.emit('OnBeforeSocialnetworkCommentShowedUp', new main_core_events.BaseEvent({
				compatData: ['socialnetwork']
			}));
			const postData = {
				ENTITY_XML_ID: obj.currentEntity.ENTITY_XML_ID,
				ENTITY_TYPE: obj.currentEntity.ENTITY_XML_ID.split('_')[0],
				ENTITY_ID: obj.currentEntity.ENTITY_XML_ID.split('_')[1],
				parentId: obj.id[1],
				comment_post_id: obj.currentEntity.ENTITY_XML_ID.split('_')[1],
				edit_id: obj.id[1],
				act: obj.id[1] > 0 ? 'edit' : 'add'
			};
			Object.entries(postData).forEach(([key, value]) => {
				if (!obj.form[key]) {
					obj.form.appendChild(main_core.Tag.render`<input type="hidden" name="${key}">`);
				}
				obj.form[key].value = value;
			});
			this.onLightEditorShow(text, data);
			if (!BX.Type.isUndefined(BX.Tasks)) {
				const matches = obj.currentEntity.ENTITY_XML_ID.match(/^TASK_(\d+)$/i);
				if (matches && this.resultFieldTaskIdList.includes(parseInt(matches[1]))) {
					BX.Tasks.ResultManager.showField();
				} else {
					BX.Tasks.ResultManager.hideField();
				}
			}
		}
		static onLightEditorShow(content, data) {
			if (!main_core.Type.isPlainObject(data)) {
				data = {};
			}
			let result = {};
			if (main_core.Type.isPlainObject(data.UF)) {
				result = data.UF;
			} else {
				if (data.arFiles) {
					const value = {};
					data.arFiles.forEach((fileId, index) => {
						const container = document.getElementById(`wdif-doc-${fileId}`);
						const name = container.querySelector('.feed-com-file-name');
						const size = container.querySelector('.feed-con-file-size');
						value[`F${index}`] = {
							FILE_ID: fileId,
							FILE_NAME: name ? name.innerHTML : 'noname',
							FILE_SIZE: size ? size.innerHTML : 'unknown',
							CONTENT_TYPE: 'notimage/xyz'
						};
					});
					result.UF_SONET_COM_DOC = {
						USER_TYPE_ID: 'file',
						FIELD_NAME: 'UF_SONET_COM_FILE[]',
						VALUE: value
					};
				}
				if (data.arDocs) {
					result.UF_SONET_COM_FILE = {
						USER_TYPE_ID: 'webdav_element',
						FIELD_NAME: 'UF_SONET_COM_DOC[]',
						VALUE: main_core.Runtime.clone(data.arDocs)
					};
				}
				if (data.arDFiles) {
					result.UF_SONET_COM_FILE = {
						USER_TYPE_ID: 'disk_file',
						FIELD_NAME: 'UF_SONET_COM_DOC[]',
						VALUE: main_core.Runtime.clone(data.arDFiles)
					};
				}
			}
			LHEPostForm.reinitData(window.SLEC.editorId, content, result);
		}
	}

	class Feed {
		constructor() {
			this.entryData = {};
			this.feedInitialized = false;
			this.moreButtonDataList = new Map();
			this.currentScrollPosition = 0;
		}
		initOnce(params) {
			const loaderContainer = document.getElementById('feed-loader-container');
			if (!main_core.Type.isPlainObject(params)) {
				params = {};
			}
			if (main_core.Type.isStringFilled(params.signedParameters)) {
				PageInstance.setSignedParameters(params.signedParameters);
			}
			if (main_core.Type.isStringFilled(params.context)) {
				PageInstance.setContext(params.context);
			}
			if (main_core.Type.isStringFilled(params.componentName)) {
				PageInstance.setComponentName(params.componentName);
			}
			if (main_core.Type.isStringFilled(params.commentFormUID)) {
				PageInstance.commentFormUID = params.commentFormUID;
			}
			if (loaderContainer) {
				main_core.Event.bind(loaderContainer, 'animationend', Loader.onAnimationEnd);
				main_core.Event.bind(loaderContainer, 'webkitAnimationEnd', Loader.onAnimationEnd);
				main_core.Event.bind(loaderContainer, 'oanimationend', Loader.onAnimationEnd);
				main_core.Event.bind(loaderContainer, 'MSAnimationEnd', Loader.onAnimationEnd);
			}
			main_core_events.EventEmitter.subscribe('BX.Forum.Spoiler:toggle', Forum.processSpoilerToggle);
			FilterInstance.init({
				filterId: params.filterId
			});
			InformerInstance.init({
				isSpaceFeatureEnabled: params.isSpaceEnabled,
				userId: params.userId,
				spaceId: params.spaceId
			});
			if (main_core.Type.isStringFilled(params.crmEntityTypeName) && !main_core.Type.isUndefined(params.crmEntityId) && parseInt(params.crmEntityId) > 0) {
				FilterInstance.initEventsCrm();
			}
			BX.UserContentView.init();
			document.getElementById('log_internal_container').addEventListener('click', e => {
				const tagValue = e.target.getAttribute('bx-tag-value');
				if (!main_core.Type.isStringFilled(tagValue)) {
					return;
				}
				if (FilterInstance.clickTag(tagValue)) {
					e.preventDefault();
					e.stopPropagation();
				}
			}, true);
			const noTasksNotificationCloseIcon = document.getElementById('feed-notification-notasks-close-btn');
			const noTasksNotificationReadButton = document.getElementById('feed-notification-notasks-read-btn');
			if (noTasksNotificationCloseIcon) {
				main_core.Event.bind(noTasksNotificationCloseIcon, 'click', this.setNoTasksNotificationRead.bind(this));
			}
			if (noTasksNotificationReadButton) {
				main_core.Event.bind(noTasksNotificationReadButton, 'click', this.setNoTasksNotificationRead.bind(this));
			}
			main_core.Event.bind(document, 'fullscreenchange', this.handleFullScreenChange.bind(this));
			main_core.Event.bind(document, 'scroll', this.handleScrollChange.bind(this));
		}
		handleFullScreenChange() {
			if (!this.getFullScreenElement()) {
				window.scrollTo(0, this.currentScrollPosition);
			}
		}
		handleScrollChange() {
			if (!this.getFullScreenElement()) {
				this.currentScrollPosition = window.scrollY;
			}
		}
		getFullScreenElement() {
			return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
		}
		init() {
			if (this.feedInitialized) {
				return;
			}
			PinnedPanelInstance.init();
			this.feedInitialized = true;
		}
		changeFollow(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			if (!logId) {
				return false;
			}
			const followNode = document.getElementById('log_entry_follow_' + logId);
			const valueOld = followNode && followNode.getAttribute('data-follow') === 'Y' ? 'Y' : 'N';
			const valueNew = valueOld === 'Y' ? 'N' : 'Y';
			this.renderFollow({
				logId: logId,
				value: valueNew
			});
			main_core.ajax.runAction('socialnetwork.api.livefeed.changeFollow', {
				data: {
					logId: logId,
					value: valueNew
				},
				analyticsLabel: {
					b24statAction: valueNew === 'Y' ? 'setFollow' : 'setUnfollow'
				}
			}).then(response => {
				if (!response.data.success) {
					this.renderFollow({
						logId: logId,
						value: valueOld
					});
				}
			}, () => {
				this.renderFollow({
					logId: logId,
					value: valueOld
				});
			});
			return false;
		}
		renderFollow(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			if (!logId) {
				return;
			}
			const followNode = document.getElementById('log_entry_follow_' + logId);
			const value = params.value && params.value === 'Y' ? 'Y' : 'N';
			if (followNode) {
				followNode.setAttribute('data-follow', value);
			}
			const textNode = followNode ? followNode.querySelector('a') : null;
			if (textNode) {
				textNode.innerHTML = main_core.Loc.getMessage('SONET_EXT_LIVEFEED_FOLLOW_TITLE_' + value);
			}
			const postNode = followNode ? followNode.closest('.feed-post-block') : null;
			if (postNode) {
				if (value === 'N') {
					postNode.classList.add('feed-post-block-unfollowed');
				} else if (value === 'Y') {
					postNode.classList.remove('feed-post-block-unfollowed');
				}
			}
		}
		changeFavorites(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			const event = params.event ? params.event : null;
			let node = params.node ? params.node : null;
			let newState = params.newState ? params.newState : null;
			if (main_core.Type.isStringFilled(node)) {
				node = document.getElementById(node);
			}
			if (!logId) {
				return;
			}
			let menuItem = null;
			if (event) {
				menuItem = event.target;
				if (!menuItem.classList.contains('menu-popup-item-text')) {
					menuItem = menuItem.querySelector('.menu-popup-item-text');
				}
			}
			let nodeToAdjust = null;
			if (main_core.Type.isDomNode(node)) {
				nodeToAdjust = node.classList.contains('feed-post-important-switch') ? node : node.querySelector('.feed-post-important-switch');
			}
			if (typeof this.entryData[logId] == 'undefined') {
				this.entryData[logId] = {};
			}
			if (typeof this.entryData[logId].favorites != 'undefined') {
				newState = this.entryData[logId].favorites ? 'N' : 'Y';
				this.entryData[logId].favorites = !this.entryData[logId].favorites;
			} else if (nodeToAdjust) {
				newState = nodeToAdjust.classList.contains('feed-post-important-switch-active') ? 'N' : 'Y';
				this.entryData[logId].favorites = newState == 'Y';
			}
			if (!newState) {
				return;
			}
			this.adjustFavoritesControlItem(nodeToAdjust, newState);
			this.adjustFavoritesMenuItem(menuItem, newState);
			main_core.ajax.runAction('socialnetwork.api.livefeed.changeFavorites', {
				data: {
					logId: logId,
					value: newState
				},
				analyticsLabel: {
					b24statAction: newState == 'Y' ? 'addFavorites' : 'removeFavorites'
				}
			}).then(response => {
				if (main_core.Type.isStringFilled(response.data.newValue) && ['Y', 'N'].includes(response.data.newValue)) {
					this.entryData[logId].favorites = response.data.newValue == 'Y';
				}
				this.adjustFavoritesControlItem(nodeToAdjust, response.data.newValue);
				this.adjustFavoritesMenuItem(menuItem, response.data.newValue);
			}, () => {
				this.entryData[logId].favorites = !this.entryData[logId].favorites;
			});
		}
		adjustFavoritesMenuItem(menuItemNode, state) {
			if (!main_core.Type.isDomNode(menuItemNode) || !['Y', 'N'].includes(state)) {
				return;
			}
			menuItemNode.innerHTML = this.getMenuTitle(state === 'Y');
		}
		adjustFavoritesControlItem(node, state) {
			if (!main_core.Type.isDomNode(node) || !['Y', 'N'].includes(state)) {
				return;
			}
			node.title = this.getMenuTitle(state === 'Y');
			if (state == 'Y') {
				node.classList.add('feed-post-important-switch-active');
			} else {
				node.classList.remove('feed-post-important-switch-active');
			}
		}
		getMenuTitle(state) {
			return main_core.Loc.getMessage(`SONET_EXT_LIVEFEED_MENU_TITLE_FAVORITES_${state ? 'Y' : 'N'}`);
		}
		delete(params) {
			const logId = params.logId ? parseInt(params.logId) : 0;
			const node = main_core.Type.isStringFilled(params.nodeId) ? document.getElementById(params.nodeId) : null;
			const ind = params.ind ? params.ind : '';
			if (logId <= 0 || !node) {
				return;
			}
			main_core.ajax.runAction('socialnetwork.api.livefeed.deleteEntry', {
				data: {
					logId: logId
				},
				analyticsLabel: {
					b24statAction: 'deleteLogEntry'
				}
			}).then(response => {
				if (response.data.success) {
					if (!main_core.Type.isUndefined(ind)) {
						main_popup.MenuManager.destroy(Post.getMenuId(ind));
					}
					this.deleteSuccess(node);
				} else {
					this.deleteFailure(node);
				}
			}, () => {
				this.deleteFailure(node);
			});
		}
		deleteSuccess(node) {
			if (!main_core.Type.isDomNode(node)) {
				return;
			}
			new BX.fx({
				time: 0.5,
				step: 0.05,
				type: 'linear',
				start: node.offsetHeight,
				finish: 56,
				callback: height => {
					node.style.height = `${height}px`;
				},
				callback_start: () => {
					node.style.overflow = 'hidden';
					node.style.minHeight = 0;
				},
				callback_complete: () => {
					node.style.marginBottom = 0;
					main_core.Dom.clean(node);
					node.classList.add('feed-post-block-deleted');
					node.appendChild(main_core.Tag.render`<div class="feed-add-successfully"><span class="feed-add-info-text"><span class="feed-add-info-icon"></span><span>${main_core.Loc.getMessage('SONET_EXT_LIVEFEED_DELETE_SUCCESS')}</span></span></span></div>`);
				}
			}).start();
		}
		deleteFailure(node) {
			if (!main_core.Type.isDomNode(node)) {
				return;
			}
			node.insertBefore(main_core.Tag.render`<div class="feed-add-error" style="margin: 18px 37px 4px 84px;"><span class="feed-add-info-text"><span class="feed-add-info-icon"></span><span>${main_core.Loc.getMessage('sonetLMenuDeleteFailure')}</span></span></div>`, node.firstChild);
		}
		setMoreButtons(value) {
			this.moreButtonDataList = value;
		}
		getMoreButtons() {
			return this.moreButtonDataList;
		}
		clearMoreButtons() {
			for (const buttonData of this.moreButtonDataList) {
				const moreButton = document.getElementById(buttonData.outerBlockID)?.querySelector(`.${MoreButton.cssClass.more}`);
				if (!moreButton?.hasClickListener) {
					return;
				}
			}
			this.moreButtonDataList.clear();
		}
		addMoreButton(key, data) {
			this.moreButtonDataList.set(key, data);
		}
		setNoTasksNotificationRead(event) {
			const notificationNode = event.currentTarget.closest('.feed-notification-container');
			if (!notificationNode) {
				return;
			}
			main_core.ajax.runAction('socialnetwork.api.livefeed.readNoTasksNotification', {
				data: {}
			}).then(response => {
				if (!response.data.success) {
					return;
				}
				notificationNode.style.height = notificationNode.offsetHeight + 'px';
				setTimeout(() => {
					notificationNode.classList.add('feed-notification-container-collapsed');
				}, 10);
				setTimeout(() => {
					notificationNode.parentNode.removeChild(notificationNode);
				}, 250);
			}, () => {});
		}
	}
	const FeedInstance = new Feed();
	const PinnedPanelInstance = new PinnedPanel();
	const InformerInstance = new Informer();
	const FilterInstance = new Filter();
	const PageInstance = new Page();
	const MoreButtonInstance = new MoreButton();
	new TaskCreator();

	exports.CommentForm = CommentForm;
	exports.ContentView = ContentView;
	exports.FeedInstance = FeedInstance;
	exports.FilterInstance = FilterInstance;
	exports.InformerInstance = InformerInstance;
	exports.Loader = Loader;
	exports.MoreButton = MoreButton;
	exports.MoreButtonInstance = MoreButtonInstance;
	exports.PageInstance = PageInstance;
	exports.PinnedPanelInstance = PinnedPanelInstance;
	exports.Post = Post;
	exports.TaskCreator = TaskCreator;

})(this.BX.Livefeed = this.BX.Livefeed || {}, BX, BX.Event, BX.Main, BX.UI, BX.Socialnetwork, BX.Tasks);
//# sourceMappingURL=livefeed.bundle.js.map
