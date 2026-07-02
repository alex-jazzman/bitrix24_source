/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_core_events, tasks_v2_lib_showLimit, ui_vue3_vuex, ui_vue3_directives_hint, ui_vue3_components_menu, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_animated, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_lib_ahaMoments, tasks_v2_lib_fieldHighlighter, tasks_v2_component_elements_hint, tasks_v2_provider_service_resultService, tasks_v2_provider_service_taskService, tasks_v2_provider_service_stateService, ui_vue3, tasks_v2_lib_calendar, tasks_v2_component_elements_userAvatar, tasks_v2_component_entityText, tasks_v2_component_elements_userFieldWidgetComponent, tasks_v2_provider_service_userService, tasks_v2_provider_service_fileService, ui_vue3_components_button, tasks_v2_component_elements_bottomSheet, tasks_v2_lib_highlighter, ui_system_skeleton_vue, tasks_v2_component_dropZone, ui_textEditor, tasks_v2_lib_analytics, ui_system_chip_vue) {
	'use strict';

	const resultsMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Results,
		title: main_core.Loc.getMessage('TASKS_V2_RESULT_TITLE_META')
	});

	// @vue/component
	const ResultCardItem = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
			EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs,
			TextMd: ui_system_typography_vue.TextMd,
			Hint: tasks_v2_component_elements_hint.Hint
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			taskId: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			}
		},
		emits: ['titleClick', 'edit', 'highlightField'],
		setup(props) {
			const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
			const fileServiceRef = ui_vue3.shallowRef(fileServiceInstance);
			const uploaderAdapterRef = ui_vue3.shallowRef(fileServiceInstance.getAdapter());
			return {
				Outline: ui_iconSet_api_vue.Outline,
				resultsMeta,
				UserAvatarSize: tasks_v2_component_elements_userAvatar.UserAvatarSize,
				fileService: fileServiceRef,
				uploaderAdapter: uploaderAdapterRef
			};
		},
		data() {
			return {
				opened: false,
				isMenuShown: false,
				showResultFromMessageHint: false,
				files: this.fileService.getFiles()
			};
		},
		computed: {
			result() {
				return this.$store.getters["".concat(tasks_v2_const.Model.Results, "/getById")](this.resultId);
			},
			isEdit() {
				return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
			},
			resultTitle() {
				return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
					'#DATE#': this.resultDate
				});
			},
			resultDate() {
				if (!this.result.createdAtTs) {
					return '';
				}
				return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
			},
			resultText() {
				var _this$result$text;
				return (_this$result$text = this.result.text) !== null && _this$result$text !== void 0 ? _this$result$text : '';
			},
			resultAuthor() {
				return this.result.author;
			},
			filesCount() {
				return this.files.length;
			},
			widgetOptions() {
				return {
					isEmbedded: true,
					withControlPanel: false,
					canCreateDocuments: false,
					tileWidgetOptions: {
						compact: true,
						hideDropArea: true,
						readonly: true,
						enableDropzone: false,
						autoCollapse: false
					}
				};
			},
			menuOptions() {
				return {
					id: "result-action-menu-".concat(main_core.Text.getRandom()),
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.moreIcon.$el,
					targetContainer: document.body,
					offsetLeft: -100,
					minWidth: 250,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				return [this.result.rights.edit && this.isEdit && {
					title: this.loc('TASKS_V2_RESULT_EDIT'),
					icon: ui_iconSet_api_vue.Outline.EDIT_L,
					onClick: this.handleEditClick.bind(this),
					dataset: {
						id: "MenuResultEdit-".concat(this.resultId)
					}
				}, this.result.rights.remove && {
					design: 'alert',
					title: this.loc('TASKS_V2_RESULT_REMOVE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: this.handleDeleteClick.bind(this),
					dataset: {
						id: "MenuResultRemove-".concat(this.resultId)
					}
				}].filter(Boolean);
			},
			hasMenuItems() {
				return this.menuItems.length > 0;
			},
			tooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_RESULT_ADD'),
					popupOptions: {
						offsetLeft: this.$refs.addIcon.offsetWidth / 2
					}
				});
			}
		},
		watch: {
			resultId(newResultId) {
				this.fileService = tasks_v2_provider_service_fileService.fileService.get(newResultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
				this.uploaderAdapter = this.fileService.getAdapter();
				this.files = this.fileService.getFiles();
				this.opened = false;
			},
			resultText() {
				var _this$$refs$collapsib;
				void this.$nextTick((_this$$refs$collapsib = this.$refs.collapsible) === null || _this$$refs$collapsib === void 0 ? void 0 : _this$$refs$collapsib.updateIsOverflowing);
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
		},
		methods: {
			handleEditClick() {
				this.$emit('edit', this.resultId);
			},
			handleDeleteClick() {
				void tasks_v2_provider_service_resultService.resultService.delete(this.resultId);
			},
			handleAuthorClick() {
				BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.resultAuthor.id));
			},
			handleResultFromMessageAdded(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId !== taskId) {
					return;
				}
				this.$emit('highlightField');
				if (!tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaResultFromMessagePopup)) {
					return;
				}
				tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaResultFromMessagePopup);
				this.showResultFromMessageHint = true;
			},
			handleResultFromMessageHintClose() {
				this.showResultFromMessageHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaResultFromMessagePopup);
			},
			handleResultFromMessageHintCloseComplete() {
				if (!this.showResultFromMessageHint) {
					return;
				}
				this.showResultFromMessageHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaResultFromMessagePopup);
			}
		},
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-field-results-result --card print-no-border print-no-box-shadow\"\n\t\t\t:data-task-field-id=\"resultsMeta.id\"\n\t\t\tdata-field-container\n\t\t>\n\t\t\t<div\n\t\t\t\tclass=\"tasks-field-results-title\"\n\t\t\t\tref=\"title\"\n\t\t\t\t@click=\"$emit('titleClick', resultId)\"\n\t\t\t>\n\t\t\t\t<div class=\"tasks-field-results-title-main\">\n\t\t\t\t\t<BIcon :name=\"Outline.WINDOW_FLAG\"/>\n\t\t\t\t\t<TextMd accent>{{ resultTitle }}</TextMd>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"tasks-field-results-title-actions print-ignore\">\n\t\t\t\t\t<BIcon\n\t\t\t\t\t\tv-if=\"hasMenuItems\"\n\t\t\t\t\t\tclass=\"tasks-field-results-title-icon\"\n\t\t\t\t\t\t:name=\"Outline.MORE_L\"\n\t\t\t\t\t\thoverable\n\t\t\t\t\t\tref=\"moreIcon\"\n\t\t\t\t\t\t@click.stop=\"isMenuShown = true\"\n\t\t\t\t\t/>\n\t\t\t\t\t<BMenu v-if=\"isMenuShown\" :options=\"menuOptions\" @close=\"isMenuShown = false\"/>\n\t\t\t\t\t<Hint\n\t\t\t\t\t\tv-if=\"showResultFromMessageHint\"\n\t\t\t\t\t\t:bindElement=\"$refs.moreIcon.$el\"\n\t\t\t\t\t\t:options=\"{\n\t\t\t\t\t\t\tcloseIcon: true,\n\t\t\t\t\t\t\toffsetLeft: 10,\n\t\t\t\t\t\t\tminWidth: 340,\n\t\t\t\t\t\t\tmaxWidth: 340,\n\t\t\t\t\t\t\tbindOptions: {\n\t\t\t\t\t\t\t\tforceBindPosition: true,\n\t\t\t\t\t\t\t},\n\t\t\t\t\t\t}\"\n\t\t\t\t\t\t@close=\"handleResultFromMessageHintClose\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<div class=\"tasks-field-results-hint-info\">\n\t\t\t\t\t\t\t<TextMd className=\"tasks-field-results-hint-info-text\">\n\t\t\t\t\t\t\t\t{{ loc('TASKS_V2_RESULT_AHA_RESULT_FROM_MESSAGE') }}\n\t\t\t\t\t\t\t</TextMd>\n\t\t\t\t\t\t\t<TextXs\n\t\t\t\t\t\t\t\tclassName=\"tasks-field-results-hint-info-link\"\n\t\t\t\t\t\t\t\t@click.stop=\"handleResultFromMessageHintCloseComplete\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t\t\t{{ loc('TASKS_V2_RESULT_AHA_SHOW_NO_MORE') }}\n\t\t\t\t\t\t\t</TextXs>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</Hint>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div class=\"tasks-field-results-result-content\" ref=\"content\">\n\t\t\t\t<div class=\"tasks-field-results-result-author-border print-no-after\">\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"tasks-field-results-result-author-border-clickable\"\n\t\t\t\t\t\t@click=\"handleAuthorClick\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<UserAvatar\n\t\t\t\t\t\t\t:src=\"resultAuthor.image\"\n\t\t\t\t\t\t\t:type=\"resultAuthor.type\"\n\t\t\t\t\t\t\t:size=\"UserAvatarSize.XS\"\n\t\t\t\t\t\t\t:bx-tooltip-user-id=\"resultAuthor.id\"\n\t\t\t\t\t\t\tbx-tooltip-context=\"b24\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<TextSm\n\t\t\t\t\t\t\tclassName=\"tasks-field-results-result-author-name\"\n\t\t\t\t\t\t\t:bx-tooltip-user-id=\"resultAuthor.id\"\n\t\t\t\t\t\t\tbx-tooltip-context=\"b24\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t{{ resultAuthor.name }}\n\t\t\t\t\t\t</TextSm>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<EntityCollapsibleText\n\t\t\t\t\tref=\"collapsible\"\n\t\t\t\t\t:files\n\t\t\t\t\t:content=\"resultText\"\n\t\t\t\t\treadonly\n\t\t\t\t\t:showFilesIndicator=\"false\"\n\t\t\t\t\tv-model:opened=\"opened\"\n\t\t\t\t/>\n\t\t\t\t<div v-if=\"filesCount > 0\" class=\"tasks-field-results-result-files print-ignore\" :key=\"resultId\">\n\t\t\t\t\t<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	const ResultRequiredAha = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			Hint: tasks_v2_component_elements_hint.Hint,
			TextMd: ui_system_typography_vue.TextMd,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			popupWidth: {
				type: Number,
				default: 530
			},
			hasResults: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close', 'addResult'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			title() {
				return this.hasResults ? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_TITLE') : this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_TITLE');
			},
			description() {
				return this.hasResults ? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_DESC') : this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_DESC');
			}
		},
		template: "\n\t\t<Hint\n\t\t\t:bindElement\n\t\t\t:options=\"{\n\t\t\t\tcloseIcon: true,\n\t\t\t\tminWidth: popupWidth,\n\t\t\t\tmaxWidth: popupWidth,\n\t\t\t\tpadding: 0,\n\t\t\t}\"\n\t\t\t@close=\"$emit('close')\"\n\t\t>\n\t\t\t<div class=\"tasks-field-results-hint-container\">\n\t\t\t\t<div class=\"tasks-field-results-hint-icon\"/>\n\t\t\t\t<div class=\"tasks-field-results-hint-info\">\n\t\t\t\t\t<HeadlineSm className=\"tasks-field-results-hint-info-text\">{{ title }}</HeadlineSm>\n\t\t\t\t\t<TextMd className=\"tasks-field-results-hint-info-text\">{{ description }}</TextMd>\n\t\t\t\t\t<div class=\"tasks-field-results-hint-button\">\n\t\t\t\t\t\t<UiButton\n\t\t\t\t\t\t\t:text=\"loc('TASKS_V2_RESULT_ADD')\"\n\t\t\t\t\t\t\t:size=\"ButtonSize.SMALL\"\n\t\t\t\t\t\t\t:style=\"AirButtonStyle.TINTED\"\n\t\t\t\t\t\t\t:leftIcon=\"Outline.PLUS_L\"\n\t\t\t\t\t\t\t:wide=\"false\"\n\t\t\t\t\t\t\t@click=\"$emit('addResult')\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</Hint>\n\t"
	};

	// @vue/component
	const ResultListItem = {
		name: 'TaskResultListItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
			EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
			TextSm: ui_system_typography_vue.TextSm
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			embedded: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			showDelimiter: {
				type: Boolean,
				default: false
			},
			isResized: {
				type: Boolean,
				default: false
			}
		},
		emits: ['titleClick', 'edit', 'resize'],
		setup(props) {
			const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
			const fileServiceRef = ui_vue3.shallowRef(fileServiceInstance);
			const uploaderAdapterRef = ui_vue3.shallowRef(fileServiceInstance.getAdapter());
			return {
				Outline: ui_iconSet_api_vue.Outline,
				resultsMeta,
				UserAvatarSize: tasks_v2_component_elements_userAvatar.UserAvatarSize,
				fileService: fileServiceRef,
				uploaderAdapter: uploaderAdapterRef
			};
		},
		data() {
			return {
				isSticky: false,
				scrollContainer: null,
				mutationObserver: null,
				isMenuShown: false,
				files: this.fileService.getFiles()
			};
		},
		computed: {
			result() {
				return this.$store.getters["".concat(tasks_v2_const.Model.Results, "/getById")](this.resultId);
			},
			isEdit() {
				return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
			},
			resultTitle() {
				return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
					'#DATE#': this.resultDate
				});
			},
			resultDate() {
				if (!this.result.createdAtTs) {
					return '';
				}
				return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
			},
			resultText() {
				var _this$result$text;
				return (_this$result$text = this.result.text) !== null && _this$result$text !== void 0 ? _this$result$text : '';
			},
			resultAuthor() {
				return this.result.author;
			},
			filesCount() {
				return this.files.length;
			},
			widgetOptions() {
				return {
					isEmbedded: true,
					withControlPanel: false,
					canCreateDocuments: false,
					tileWidgetOptions: {
						compact: true,
						hideDropArea: true,
						readonly: true,
						enableDropzone: false,
						autoCollapse: false
					}
				};
			},
			menuOptions() {
				return {
					id: "result-action-menu-".concat(main_core.Text.getRandom()),
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.moreIcon.$el,
					targetContainer: document.body,
					offsetLeft: -100,
					minWidth: 250,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				return [this.result.rights.edit && this.isEdit && {
					title: this.loc('TASKS_V2_RESULT_EDIT'),
					icon: ui_iconSet_api_vue.Outline.EDIT_L,
					onClick: this.handleEditClick.bind(this),
					dataset: {
						id: "MenuResultEdit-".concat(this.resultId)
					}
				}, this.result.rights.remove && {
					design: 'alert',
					title: this.loc('TASKS_V2_RESULT_REMOVE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: this.handleDeleteClick.bind(this),
					dataset: {
						id: "MenuResultRemove-".concat(this.resultId)
					}
				}].filter(Boolean);
			},
			hasMenuItems() {
				return this.menuItems.length > 0;
			},
			resizeIcon() {
				return this.isResized ? ui_iconSet_api_vue.Outline.COLLAPSE_L : ui_iconSet_api_vue.Outline.EXPAND_L;
			}
		},
		watch: {
			resultId(newResultId) {
				this.fileService = tasks_v2_provider_service_fileService.fileService.get(newResultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
				this.uploaderAdapter = this.fileService.getAdapter();
				this.files = this.fileService.getFiles();
			}
		},
		mounted() {
			var _this$$el;
			this.scrollContainer = (_this$$el = this.$el) === null || _this$$el === void 0 ? void 0 : _this$$el.closest('.tasks-field-results-result-list-content');
			if (this.scrollContainer) {
				main_core.Event.bind(this.scrollContainer, 'scroll', this.handleScroll);
				void this.$nextTick(this.checkSticky);
				this.mutationObserver = new MutationObserver(() => this.checkSticky());
				this.mutationObserver.observe(this.scrollContainer, {
					childList: true,
					subtree: true
				});
			}
		},
		beforeUnmount() {
			if (this.scrollContainer) {
				main_core.Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
			}
			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
			}
		},
		methods: {
			handleEditClick() {
				this.$emit('edit', this.resultId);
			},
			handleDeleteClick() {
				void tasks_v2_provider_service_resultService.resultService.delete(this.resultId);
			},
			handleResizeClick() {
				this.$emit('resize');
			},
			handleScroll() {
				this.checkSticky();
			},
			checkSticky() {
				if (!this.scrollContainer || !this.$refs.title) {
					return;
				}
				const itemRect = this.$refs.title.getBoundingClientRect();
				const containerRect = this.scrollContainer.getBoundingClientRect();
				this.isSticky = itemRect.top <= containerRect.top + itemRect.height / 2;
			},
			handleAuthorClick() {
				BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.resultAuthor.id));
			}
		},
		template: "\n\t\t<div class=\"tasks-field-results-result --list-mode\">\n\t\t\t<div\n\t\t\t\tclass=\"tasks-field-results-title --list-mode\"\n\t\t\t\t:class=\"{ '--sticky': isSticky }\"\n\t\t\t\tref=\"title\"\n\t\t\t\t@click=\"$emit('titleClick', resultId)\"\n\t\t\t>\n\t\t\t\t<div class=\"tasks-field-results-title-main\">\n\t\t\t\t\t<BIcon :name=\"Outline.WINDOW_FLAG\"/>\n\t\t\t\t\t<HeadlineSm>{{ resultTitle }}</HeadlineSm>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"tasks-field-results-title-actions print-ignore\">\n\t\t\t\t\t<BIcon\n\t\t\t\t\t\tv-if=\"hasMenuItems\"\n\t\t\t\t\t\tclass=\"tasks-field-results-title-icon --big\"\n\t\t\t\t\t\t:name=\"Outline.MORE_L\"\n\t\t\t\t\t\thoverable\n\t\t\t\t\t\tref=\"moreIcon\"\n\t\t\t\t\t\t@click.stop=\"isMenuShown = true\"\n\t\t\t\t\t/>\n\t\t\t\t\t<BIcon\n\t\t\t\t\t\tv-if=\"isSticky && !embedded\"\n\t\t\t\t\t\tclass=\"tasks-field-results-title-icon --big\"\n\t\t\t\t\t\t:name=\"resizeIcon\"\n\t\t\t\t\t\thoverable\n\t\t\t\t\t\t@click.stop=\"handleResizeClick\"\n\t\t\t\t\t/>\n\t\t\t\t\t<div v-if=\"isSticky\" class=\"tasks-field-results-result-empty\"/>\n\t\t\t\t\t<BMenu\n\t\t\t\t\t\tv-if=\"isMenuShown\"\n\t\t\t\t\t\t:options=\"menuOptions\"\n\t\t\t\t\t\t@close=\"isMenuShown = false\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div\n\t\t\t\tclass=\"tasks-field-results-result-content\"\n\t\t\t\tref=\"content\"\n\t\t\t>\n\t\t\t\t<div\n\t\t\t\t\tclass=\"tasks-field-results-result-author\"\n\t\t\t\t\t@click=\"handleAuthorClick\"\n\t\t\t\t>\n\t\t\t\t\t<UserAvatar\n\t\t\t\t\t\t:src=\"resultAuthor.image\"\n\t\t\t\t\t\t:type=\"resultAuthor.type\"\n\t\t\t\t\t\t:size=\"UserAvatarSize.XS\"\n\t\t\t\t\t\t:bx-tooltip-user-id=\"resultAuthor.id\"\n\t\t\t\t\t\tbx-tooltip-context=\"b24\"\n\t\t\t\t\t/>\n\t\t\t\t\t<TextSm\n\t\t\t\t\t\tclassName=\"tasks-field-results-result-author-name\"\n\t\t\t\t\t\t:bx-tooltip-user-id=\"resultAuthor.id\"\n\t\t\t\t\t\tbx-tooltip-context=\"b24\"\n\t\t\t\t\t>\n\t\t\t\t\t\t{{ resultAuthor.name }}\n\t\t\t\t\t</TextSm>\n\t\t\t\t</div>\n\t\t\t\t<EntityCollapsibleText\n\t\t\t\t\tref=\"collapsible\"\n\t\t\t\t\t:content=\"resultText\"\n\t\t\t\t\t:files\n\t\t\t\t\treadonly\n\t\t\t\t\tshowFilesIndicator\n\t\t\t\t\topenByDefault\n\t\t\t\t\topened\n\t\t\t\t/>\n\t\t\t\t<div\n\t\t\t\t\tv-if=\"filesCount > 0\"\n\t\t\t\t\tclass=\"tasks-field-results-result-files --list-mode\"\n\t\t\t\t>\n\t\t\t\t\t<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div v-if=\"showDelimiter\" class=\"tasks-field-results-result-separator\"/>\n\t\t\t<div v-else class=\"tasks-field-results-result-last-padding\"/>\n\t\t</div>\n\t"
	};

	// @vue/component
	const ResultSkeleton = {
		components: {
			BLine: ui_system_skeleton_vue.BLine
		},
		template: "\n\t\t<div class=\"tasks-field-results-result-skeleton-container\">\n\t\t\t<BLine :width=\"460\" :height=\"12\" :radius=\"60\"/>\n\t\t\t<BLine :width=\"460\" :height=\"12\" :radius=\"60\"/>\n\t\t\t<BLine :width=\"460\" :height=\"12\" :radius=\"60\"/>\n\t\t\t<BLine :width=\"197\" :height=\"12\" :radius=\"60\"/>\n\t\t</div>\n\t"
	};

	// @vue/component
	const ResultEditor = {
		name: 'TaskResultEditor',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button,
			EntityTextArea: tasks_v2_component_entityText.EntityTextArea,
			CopilotButton: tasks_v2_component_entityText.CopilotButton,
			AttachButton: tasks_v2_component_entityText.AttachButton,
			MentionButton: tasks_v2_component_entityText.MentionButton,
			MoreButton: tasks_v2_component_entityText.MoreButton,
			NumberListButton: tasks_v2_component_entityText.NumberListButton,
			BulletListButton: tasks_v2_component_entityText.BulletListButton
		},
		inject: {
			taskId: {},
			task: {},
			analytics: {},
			cardType: {}
		},
		provide() {
			return {
				editor: () => this.editor,
				fileService: () => this.fileService
			};
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			content: {
				type: String,
				default: ''
			},
			isResized: {
				type: Boolean,
				default: false
			},
			showResize: {
				type: Boolean,
				default: true
			}
		},
		emits: ['close', 'resize'],
		setup(props) {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonColor: ui_vue3_components_button.ButtonColor,
				Outline: ui_iconSet_api_vue.Outline,
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes,
				EntityTextTypes: tasks_v2_component_entityText.EntityTextTypes,
				fileService: tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result),
				entityTextEditor: tasks_v2_component_entityText.entityTextEditor.get(props.resultId, tasks_v2_component_entityText.EntityTextTypes.Result, {
					content: props.content,
					blockSpaceInline: 'var(--ui-space-stack-xl)'
				})
			};
		},
		data() {
			return {
				isSaving: false,
				hasChanges: false,
				hasFilesChanges: false,
				buttonDisabled: !main_core.Type.isStringFilled(this.content)
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: "".concat(tasks_v2_const.Model.Interface, "/currentUserId")
			}),
			result() {
				return this.$store.getters["".concat(tasks_v2_const.Model.Results, "/getById")](this.resultId);
			},
			currentUser() {
				return this.$store.getters["".concat(tasks_v2_const.Model.Users, "/getById")](this.currentUserId);
			},
			isEdit() {
				return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
			},
			resultDate() {
				if (!this.result.createdAtTs) {
					return '';
				}
				return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
			},
			title() {
				if (this.isEdit) {
					return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
						'#DATE#': this.resultDate
					});
				}
				return this.loc('TASKS_V2_RESULT_ADD');
			},
			buttonTitle() {
				return this.isEdit ? this.loc('TASKS_V2_RESULT_BUTTON_SAVE') : this.loc('TASKS_V2_RESULT_BUTTON_SEND');
			},
			readonly() {
				var _this$result;
				if (!this.result) {
					var _this$task;
					return !((_this$task = this.task) !== null && _this$task !== void 0 && (_this$task = _this$task.rights) !== null && _this$task !== void 0 && _this$task.read);
				}
				return !((_this$result = this.result) !== null && _this$result !== void 0 && (_this$result = _this$result.rights) !== null && _this$result !== void 0 && _this$result.edit);
			},
			editor() {
				return this.entityTextEditor.getEditor();
			},
			hasEditorChanges() {
				return this.hasChanges || this.hasFilesChanges;
			},
			resizeIcon() {
				return this.isResized ? ui_iconSet_api_vue.Outline.COLLAPSE_L : ui_iconSet_api_vue.Outline.EXPAND_L;
			},
			isDiskModuleInstalled() {
				return tasks_v2_core.Core.getParams().features.disk;
			},
			isCopilotEnabled() {
				return tasks_v2_core.Core.getParams().features.isCopilotEnabled;
			}
		},
		mounted() {
			if (!this.task.filledFields[resultsMeta.id]) {
				void this.$store.dispatch("".concat(tasks_v2_const.Model.Tasks, "/setFieldFilled"), {
					id: this.taskId,
					fieldName: resultsMeta.id
				});
			}
			if (!main_core.Type.isStringFilled(this.content) || this.resultId === 0) {
				setTimeout(this.focusToEnd, 400);
			}
		},
		unmounted() {
			if (!this.isEdit && !this.isSaving) {
				void this.$store.dispatch("".concat(tasks_v2_const.Model.Results, "/delete"), this.resultId);
				tasks_v2_provider_service_fileService.fileService.delete(this.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
				tasks_v2_component_entityText.entityTextEditor.delete(this.resultId, tasks_v2_component_entityText.EntityTextTypes.Result);
			}
		},
		methods: {
			handleEditButtonClick() {
				if (this.isEdit) {
					this.handleClose();
				} else {
					this.handleAddResult();
				}
			},
			handleAddResult() {
				this.isSaving = true;
				const result = {
					...this.result,
					text: this.editor.getText(),
					author: this.currentUser,
					status: tasks_v2_const.ResultStatus.Open,
					createdAtTs: Date.now(),
					updatedAtTs: Date.now()
				};
				void this.addResult(result);
				this.handleClose();
				main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultAdded, {
					taskId: this.taskId
				});
			},
			async addResult(result) {
				const isSuccess = await tasks_v2_provider_service_resultService.resultService.add(this.taskId, result);
				this.sendAnalyticsResultAdd(isSuccess);
				if (isSuccess) {
					main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultSuccessfulAdded, {
						taskId: this.taskId
					});
				}
			},
			sendAnalyticsResultAdd(isSuccess) {
				tasks_v2_lib_analytics.analytics.sendStatusSummaryAdd(this.analytics, {
					isSuccess,
					cardType: this.cardType,
					taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
					element: tasks_v2_const.Analytics.Element.AddResult,
					subSection: tasks_v2_const.Analytics.SubSection.TaskCard
				});
			},
			handleUpdateResult() {
				if (!this.hasEditorChanges) {
					return;
				}
				const fields = {
					text: this.editor.getText(),
					updatedAtTs: Date.now() / 1000,
					status: tasks_v2_const.ResultStatus.Open
				};
				void tasks_v2_provider_service_resultService.resultService.update(this.resultId, fields);
				this.hasChanges = false;
				this.hasFilesChanges = false;
				main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultUpdated, {
					taskId: this.taskId,
					resultId: this.resultId
				});
			},
			handleEditorChange() {
				var _this$editor;
				const preparedOldText = this.getPreparedText(this.content);
				const preparedNewText = this.getPreparedText((_this$editor = this.editor) === null || _this$editor === void 0 ? void 0 : _this$editor.getText());
				this.hasChanges = preparedOldText !== preparedNewText;
				this.buttonDisabled = !main_core.Type.isStringFilled(preparedNewText);
			},
			getPreparedText(text) {
				return text.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '').trim();
			},
			focusToEnd() {
				var _this$editor2;
				(_this$editor2 = this.editor) === null || _this$editor2 === void 0 || _this$editor2.focus(null, {
					defaultSelection: 'rootEnd'
				});
			},
			handleClose() {
				if (this.isEdit) {
					this.handleUpdateResult();
				}
				this.$emit('close');
			}
		},
		template: "\n\t\t<div class=\"tasks-result-editor-wrapper\" ref=\"wrapper\">\n\t\t\t<div class=\"tasks-result-editor-header\" ref=\"resultHeader\">\n\t\t\t\t<div class=\"tasks-result-editor-title\">{{ title }}</div>\n\t\t\t\t<div class=\"tasks-result-editor-field-actions\">\n\t\t\t\t\t<BIcon\n\t\t\t\t\t\tv-if=\"showResize\"\n\t\t\t\t\t\tclass=\"tasks-result-editor-field-icon\"\n\t\t\t\t\t\t:name=\"resizeIcon\"\n\t\t\t\t\t\thoverable\n\t\t\t\t\t\t@click=\"$emit('resize')\"\n\t\t\t\t\t/>\n\t\t\t\t\t<BIcon\n\t\t\t\t\t\t:name=\"Outline.CROSS_L\"\n\t\t\t\t\t\thoverable\n\t\t\t\t\t\tclass=\"tasks-result-editor-field-icon\"\n\t\t\t\t\t\t@click=\"handleClose\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div class=\"tasks-result-editor-container\">\n\t\t\t\t<EntityTextArea\n\t\t\t\t\t:entityId=\"resultId\"\n\t\t\t\t\t:entityType=\"EntityTextTypes.Result\"\n\t\t\t\t\t:readonly\n\t\t\t\t\t:removeFromServer=\"!isEdit\"\n\t\t\t\t\tref=\"resultTextArea\"\n\t\t\t\t\t@change=\"handleEditorChange\"\n\t\t\t\t\t@filesChange=\"hasFilesChanges = true\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<div v-if=\"!readonly\" class=\"tasks-result-editor-footer\" ref=\"resultActions\">\n\t\t\t\t<div class=\"tasks-result-editor-action-list\">\n\t\t\t\t\t<AttachButton v-if=\"isDiskModuleInstalled\" :fileService/>\n\t\t\t\t\t<MentionButton :editor/>\n\t\t\t\t\t<BulletListButton :editor/>\n\t\t\t\t\t<NumberListButton :editor/>\n\t\t\t\t\t<MoreButton :editor/>\n\t\t\t\t\t<CopilotButton v-if=\"isCopilotEnabled\" :editor/>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"tasks-result-editor-footer-buttons\">\n\t\t\t\t\t<UiButton\n\t\t\t\t\t\t:text=\"buttonTitle\"\n\t\t\t\t\t\t:size=\"ButtonSize.MEDIUM\"\n\t\t\t\t\t\t:color=\"ButtonColor.PRIMARY\"\n\t\t\t\t\t\t:disabled=\"buttonDisabled || isSaving\"\n\t\t\t\t\t\t@click=\"handleEditButtonClick\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	const ResultEditorSheet = {
		components: {
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
			DropZone: tasks_v2_component_dropZone.DropZone,
			ResultEditor
		},
		inject: {
			taskId: {},
			embedded: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			showResize: {
				type: Boolean,
				default: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes
			};
		},
		data() {
			return {
				isResized: false,
				uniqueKey: main_core.Text.getRandom()
			};
		},
		computed: {
			result() {
				return this.$store.getters["".concat(tasks_v2_const.Model.Results, "/getById")](this.resultId);
			},
			bottomSheetContainer() {
				return document.getElementById("b24-bottom-sheet-".concat(this.uniqueKey)) || null;
			},
			isDiskModuleInstalled() {
				return tasks_v2_core.Core.getParams().features.disk;
			},
			shouldShowResize() {
				return this.showResize && !this.embedded;
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		methods: {
			handleOpenResultFromMessage(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId === taskId) {
					this.$emit('close');
				}
			}
		},
		template: "\n\t\t<BottomSheet\n\t\t\t:sheetBindProps\n\t\t\t:isExpanded=\"isResized\"\n\t\t\t:padding=\"0\"\n\t\t\t:popupPadding=\"0\"\n\t\t\t:uniqueKey\n\t\t\t@close=\"$emit('close')\"\n\t\t>\n\t\t\t<ResultEditor\n\t\t\t\t:resultId\n\t\t\t\t:isResized\n\t\t\t\t:content=\"result.text || ''\"\n\t\t\t\t:showResize=\"shouldShowResize\"\n\t\t\t\t@close=\"$emit('close')\"\n\t\t\t\t@resize=\"isResized = !isResized\"\n\t\t\t/>\n\t\t\t<DropZone\n\t\t\t\tv-if=\"isDiskModuleInstalled\"\n\t\t\t\t:container=\"bottomSheetContainer || {}\"\n\t\t\t\t:entityId=\"resultId || 0\"\n\t\t\t\t:entityType=\"EntityTypes.Result\"\n\t\t\t/>\n\t\t</BottomSheet>\n\t"
	};

	// @vue/component
	const ResultListEmpty = {
		name: 'ResultListEmpty',
		components: {
			TextLg: ui_system_typography_vue.TextLg,
			UiButton: ui_vue3_components_button.Button
		},
		emits: ['addResult'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		template: "\n\t\t<div class=\"tasks-field-results-result-list-empty\">\n\t\t\t<div class=\"tasks-field-results-result-list-empty-image\"/>\n\t\t\t<TextLg className=\"tasks-field-results-result-list-empty-title\">\n\t\t\t\t{{ loc('TASKS_V2_RESULT_LIST_EMPTY') }}\n\t\t\t</TextLg>\n\t\t\t<div class=\"tasks-field-results-result-list-empty-button\">\n\t\t\t\t<UiButton\n\t\t\t\t\t:text=\"loc('TASKS_V2_RESULT_ADD')\"\n\t\t\t\t\t:size=\"ButtonSize.MEDIUM\"\n\t\t\t\t\t:style=\"AirButtonStyle.FILLED\"\n\t\t\t\t\t:leftIcon=\"Outline.PLUS_L\"\n\t\t\t\t\t:wide=\"false\"\n\t\t\t\t\t@click=\"$emit('addResult')\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	const ResultListSheet = {
		components: {
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
			BIcon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button,
			ResultListItem,
			ResultSkeleton,
			ResultEditorSheet,
			ResultListEmpty,
			HeadlineMd: ui_system_typography_vue.HeadlineMd
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				editResultId: 0,
				isResultEditorShown: false,
				isResized: false
			};
		},
		computed: {
			results() {
				return this.task.results;
			},
			loadedResults() {
				return this.results.filter(resultId => this.isResultLoaded(resultId));
			},
			hasUnloadedResults() {
				return this.results.length !== this.loadedResults.length;
			},
			isEmptyState() {
				return this.results.length === 0;
			}
		},
		watch: {
			async resultId(newResultId) {
				await this.$nextTick();
				if (newResultId) {
					this.focusTo(newResultId);
				}
			}
		},
		mounted() {
			if (this.hasUnloadedResults) {
				void tasks_v2_provider_service_resultService.resultService.getAll(this.taskId);
			}
			this.focusTo(this.resultId);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultAdded, this.handleResultAdded);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultUpdated, this.handleResultUpdated);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultAdded, this.handleResultAdded);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultUpdated, this.handleResultUpdated);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		methods: {
			isResultLoaded(resultId) {
				return Boolean(this.$store.getters["".concat(tasks_v2_const.Model.Results, "/getById")](resultId));
			},
			focusTo(resultId) {
				if (!resultId) {
					return;
				}
				const scrollContainer = this.$refs.scrollContainer;
				if (!scrollContainer) {
					return;
				}
				const {
					targetId,
					offset,
					shouldHighlight
				} = this.calculateFocusTarget(resultId);
				this.scrollToTarget(targetId, offset, shouldHighlight);
			},
			calculateFocusTarget(resultId) {
				return {
					targetId: resultId,
					offset: 80,
					shouldHighlight: true
				};
			},
			scrollToTarget(targetId, offset, shouldHighlight) {
				setTimeout(() => {
					const targetNode = this.$refs.scrollContainer.querySelector("[data-result-id=\"".concat(targetId, "\"]"));
					if (!targetNode) {
						return;
					}
					if (shouldHighlight) {
						this.highlightResult(targetId);
					}
					this.$refs.scrollContainer.scrollTop = targetNode.offsetTop - offset;
				}, 0);
			},
			highlightResult(targetId) {
				const highlightElement = this.$refs.scrollContainer.querySelector("[data-result-id=\"".concat(targetId, "\"]"));
				if (highlightElement) {
					void tasks_v2_lib_highlighter.highlighter.highlight(highlightElement);
				}
			},
			openAddResultSheet() {
				this.editResultId = main_core.Text.getRandom();
				const payload = {
					id: this.editResultId,
					taskId: this.taskId,
					author: tasks_v2_core.Core.getParams().currentUser
				};
				void this.$store.dispatch("".concat(tasks_v2_const.Model.Results, "/insert"), payload);
				this.isResultEditorShown = true;
			},
			openEditResult(resultId) {
				this.editResultId = resultId;
				this.isResultEditorShown = true;
			},
			closeResultEditor() {
				this.isResultEditorShown = false;
				this.editResultId = 0;
			},
			handleResultAdded(event) {
				const {
					taskId
				} = event.getData();
				if (taskId !== this.taskId) {
					return;
				}
				this.$emit('close');
			},
			handleResultUpdated(event) {
				const {
					taskId,
					resultId
				} = event.getData();
				if (taskId !== this.taskId) {
					return;
				}
				this.focusTo(resultId);
			},
			handleOpenResultFromMessage(event) {
				const {
					taskId,
					resultId
				} = event.getData();
				if (this.taskId !== taskId || !this.isShown) {
					return;
				}
				this.focusTo(resultId);
			}
		},
		template: "\n\t\t<BottomSheet\n\t\t\t:sheetBindProps\n\t\t\t:isExpanded=\"isResized\"\n\t\t\t:padding=\"0\"\n\t\t\t:popupPadding=\"0\"\n\t\t\t@close=\"$emit('close')\"\n\t\t>\n\t\t\t<div class=\"tasks-field-results-result-list\" ref=\"main\">\n\t\t\t\t<div class=\"tasks-field-results-result-list-close-icon\">\n\t\t\t\t\t<BIcon :name=\"Outline.CROSS_L\" hoverable @click=\"$emit('close')\"/>\n\t\t\t\t</div>\n\t\t\t\t<div  v-if=\"isEmptyState\" class=\"tasks-field-results-result-list-header\">\n\t\t\t\t\t<HeadlineMd className=\"tasks-field-results-result-list-title\">\n\t\t\t\t\t\t{{ loc('TASKS_V2_RESULT_LIST_EMPTY_TITLE') }}\n\t\t\t\t\t</HeadlineMd>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"tasks-field-results-result-list-content\" ref=\"scrollContainer\">\n\t\t\t\t\t<ResultListEmpty v-if=\"isEmptyState\" @addResult=\"openAddResultSheet\"/>\n\t\t\t\t\t<div\n\t\t\t\t\t\tv-else\n\t\t\t\t\t\tv-for=\"(result, resultIndex) in results\"\n\t\t\t\t\t\t:key=\"result\"\n\t\t\t\t\t\t:data-result-id=\"result\"\n\t\t\t\t\t\tclass=\"tasks-field-results-result-item\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<ResultListItem\n\t\t\t\t\t\t\tv-if=\"isResultLoaded(result)\"\n\t\t\t\t\t\t\t:resultId=\"result\"\n\t\t\t\t\t\t\tlistMode\n\t\t\t\t\t\t\t:showDelimiter=\"resultIndex !== results.length - 1\"\n\t\t\t\t\t\t\t:isResized\n\t\t\t\t\t\t\t@edit=\"openEditResult\"\n\t\t\t\t\t\t\t@resize=\"isResized = !isResized\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<ResultSkeleton v-else/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div\n\t\t\t\tv-if=\"!isEmptyState\"\n\t\t\t\tclass=\"tasks-field-results-result-add-button\"\n\t\t\t>\n\t\t\t\t<UiButton\n\t\t\t\t\t:text=\"loc('TASKS_V2_RESULT_ADD')\"\n\t\t\t\t\t:style=\"AirButtonStyle.SELECTION\"\n\t\t\t\t\t:size=\"ButtonSize.SMALL\"\n\t\t\t\t\t@click=\"openAddResultSheet\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<ResultEditorSheet\n\t\t\t\tv-if=\"isResultEditorShown\"\n\t\t\t\t:resultId=\"editResultId\"\n\t\t\t\t:sheetBindProps\n\t\t\t\t:showResize=\"false\"\n\t\t\t\t@close=\"closeResultEditor\"\n\t\t\t/>\n\t\t</BottomSheet>\n\t"
	};

	// @vue/component
	const Results = {
		name: 'TaskResults',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			Hint: tasks_v2_component_elements_hint.Hint,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			ResultCardItem,
			ResultRequiredAha,
			ResultEditorSheet,
			ResultListSheet
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {},
			isTemplate: {}
		},
		props: {
			isSheetShown: {
				type: Boolean,
				default: false
			},
			isListSheetShown: {
				type: Boolean,
				default: false
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				resultsMeta,
				Outline: ui_iconSet_api_vue.Outline,
				Animated: ui_iconSet_api_vue.Animated
			};
		},
		data() {
			return {
				isMenuShown: false,
				isLoading: null,
				showCreatorResultHint: false,
				showResponsibleResultHint: false,
				sheetResultId: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				stateFlags: "".concat(tasks_v2_const.Model.Interface, "/stateFlags"),
				templateStateFlags: "".concat(tasks_v2_const.Model.Interface, "/templateStateFlags")
			}),
			requireResult() {
				var _this$task;
				return ((_this$task = this.task) === null || _this$task === void 0 ? void 0 : _this$task.requireResult) || false;
			},
			isCreator() {
				return tasks_v2_core.Core.getParams().currentUser.id === (this === null || this === void 0 ? void 0 : this.task.creatorId);
			},
			isResponsible() {
				var _this$task2, _this$task3;
				const userId = tasks_v2_core.Core.getParams().currentUser.id;
				return ((_this$task2 = this.task) === null || _this$task2 === void 0 || (_this$task2 = _this$task2.responsibleIds) === null || _this$task2 === void 0 ? void 0 : _this$task2.includes(userId)) || ((_this$task3 = this.task) === null || _this$task3 === void 0 ? void 0 : _this$task3.accomplicesIds.includes(userId));
			},
			containsResults() {
				return this.task.containsResults;
			},
			results() {
				return this.task.results || [];
			},
			hasResults() {
				return this.results.length > 0;
			},
			showMore() {
				return this.results.length > 1;
			},
			lastResultId() {
				return this.hasResults ? this.results[0] : null;
			},
			moreText() {
				const count = this.results.length - 1;
				return main_core.Loc.getMessagePlural('TASKS_V2_RESULT_SHOW_MORE', count, {
					'#COUNT#': count
				});
			},
			emptyResultTitle() {
				return this.requireResult ? main_core.Loc.getMessage('TASKS_V2_RESULT_TITLE_REQUIRED') : resultsMeta.title;
			},
			showMoreIcon() {
				return this.task.rights.edit;
			},
			menuOptions() {
				return {
					id: "result-field-menu-".concat(main_core.Text.getRandom()),
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.moreIcon.$el,
					targetContainer: document.body,
					minWidth: 240,
					offsetLeft: -100,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				const items = [];
				if (!this.isTemplate) {
					items.push({
						title: this.loc('TASKS_V2_RESULT_ADD'),
						icon: ui_iconSet_api_vue.Outline.PLUS_L,
						onClick: this.openAddResultSheet,
						dataset: {
							id: "MenuResultAdd-".concat(this.taskId)
						}
					});
				}
				if (this.requireResult) {
					items.push({
						title: this.loc('TASKS_V2_RESULT_NOT_REQUIRED'),
						design: 'alert',
						icon: ui_iconSet_api_vue.Outline.CROSS_L,
						onClick: this.handleUnrequireResult,
						dataset: {
							id: "MenuResultNotRequire-".concat(this.taskId)
						}
					});
				} else {
					items.push({
						title: this.loc('TASKS_V2_RESULT_REQUIRE'),
						icon: ui_iconSet_api_vue.Outline.WINDOW_FLAG,
						isLocked: this.isLocked,
						onClick: this.handleRequireResult,
						dataset: {
							id: "MenuResultRequire-".concat(this.taskId)
						}
					});
				}
				return items;
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.requiredResult.available;
			},
			featureId() {
				return tasks_v2_core.Core.getParams().restrictions.requiredResult.featureId;
			}
		},
		watch: {
			requireResult: {
				async handler(newVal) {
					if (newVal) {
						await this.$nextTick();
						this.tryShowResultHints();
					}
				},
				deep: true
			}
		},
		async created() {
			if (!this.isEdit || !this.containsResults) {
				return;
			}
			if (main_core.Type.isArrayFilled(this.results)) {
				return;
			}
			this.isLoading = true;
			await tasks_v2_provider_service_resultService.resultService.tail(this.taskId);
			this.isLoading = false;
		},
		mounted() {
			this.tryShowResultHints();
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.RequiredResultsMissing, this.showResponsibleHint);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.RequiredResultsMissing, this.showResponsibleHint);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		methods: {
			openMore() {
				this.openResultSheet(0);
			},
			handleTitleClick() {
				if (!this.isLoading && !this.isTemplate) {
					this.openAddResultSheet();
				}
			},
			openAddResultSheet() {
				const id = main_core.Text.getRandom();
				const payload = {
					id,
					taskId: this.taskId,
					author: tasks_v2_core.Core.getParams().currentUser
				};
				void this.$store.dispatch("".concat(tasks_v2_const.Model.Results, "/insert"), payload);
				this.openEditSheet(id);
			},
			handleResponsibleHintButtonClick() {
				this.handleResponsibleHintClose();
				this.openAddResultSheet();
			},
			handleRequireResult() {
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						code: "limit_".concat(this.featureId),
						bindElement: this.$refs.moreIcon.$el,
						analytics: {
							type: 'limit_tasks_status_summary'
						}
					});
					return;
				}
				this.setRequireResult(true);
			},
			handleUnrequireResult() {
				this.setRequireResult(false);
			},
			async setRequireResult(requireResult) {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					requireResult
				});
				if (this.isEdit) {
					return;
				}
				if (this.isTemplate) {
					await this.$store.dispatch("".concat(tasks_v2_const.Model.Interface, "/updateTemplateStateFlags"), {
						defaultRequireResult: requireResult
					});
					void tasks_v2_provider_service_stateService.stateService.setTemplateFlags(this.templateStateFlags);
				} else {
					await this.$store.dispatch("".concat(tasks_v2_const.Model.Interface, "/updateStateFlags"), {
						defaultRequireResult: requireResult
					});
					void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
				}
			},
			tryShowResultHints() {
				if (!this.requireResult || this.containsResults) {
					return;
				}
				if (!this.isEdit && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultCreatorPopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
					this.showCreatorHint();
					return;
				}
				if (this.isEdit && this.isResponsible && !this.isCreator && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
					setTimeout(() => {
						this.showResponsibleHint();
					}, 2000);
				}
			},
			showCreatorHint() {
				this.showCreatorResultHint = true;
				this.highlightField();
			},
			showResponsibleHint(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId !== taskId) {
					return;
				}
				this.showResponsibleResultHint = true;
				this.highlightField();
			},
			handleHighlightFieldAfterEdit(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId !== taskId) {
					return;
				}
				this.highlightField();
			},
			handleCreatorHintClose() {
				if (!this.showCreatorResultHint) {
					return;
				}
				this.showCreatorResultHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
			},
			handleResponsibleHintClose() {
				if (!this.showResponsibleResultHint) {
					return;
				}
				this.showResponsibleResultHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
				if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
				}
			},
			handleOpenResultFromMessage(event) {
				const {
					taskId,
					resultId
				} = event.getData();
				if (this.taskId !== taskId || this.isListSheetShown) {
					return;
				}
				this.openResultSheet(resultId);
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
			},
			getRequiredResultAhaWidth() {
				var _this$$refs;
				return main_core.Type.isNumber((_this$$refs = this.$refs) === null || _this$$refs === void 0 || (_this$$refs = _this$$refs.resultsContainer) === null || _this$$refs === void 0 ? void 0 : _this$$refs.offsetWidth) ? Math.min(this.$refs.resultsContainer.offsetWidth, 530) : 530;
			},
			openEditSheet(resultId) {
				this.sheetResultId = resultId;
				this.setSheetShown(true);
			},
			openResultSheet(resultId) {
				this.sheetResultId = resultId;
				this.setListSheetShown(true);
			},
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			},
			setListSheetShown(isShown) {
				this.$emit('update:isListSheetShown', isShown);
			}
		},
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-field-results print-no-box-shadow\"\n\t\t\t:data-task-id=\"taskId\"\n\t\t>\n\t\t\t<template v-if=\"lastResultId\">\n\t\t\t\t<div ref=\"resultsContainer\">\n\t\t\t\t\t<ResultCardItem\n\t\t\t\t\t\t:resultId=\"lastResultId\"\n\t\t\t\t\t\t@titleClick=\"openResultSheet\"\n\t\t\t\t\t\t@add=\"openAddResultSheet\"\n\t\t\t\t\t\t@edit=\"openEditSheet\"\n\t\t\t\t\t\t@highlightField=\"highlightField\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"tasks-field-results-more-container\">\n\t\t\t\t\t<div\n\t\t\t\t\t\tv-if=\"showMore\"\n\t\t\t\t\t\tclass=\"tasks-field-results-more\"\n\t\t\t\t\t\t@click=\"openMore\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<div class=\"tasks-field-results-more-text\">{{ moreText }}</div>\n\t\t\t\t\t\t<BIcon\n\t\t\t\t\t\t\tclass=\"tasks-field-results-title-icon --auto-left print-ignore\"\n\t\t\t\t\t\t\t:name=\"Outline.CHEVRON_RIGHT_L\"\n\t\t\t\t\t\t\thoverable\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"tasks-field-results-more print-ignore\"\n\t\t\t\t\t\t:class=\"{ '--border': showMore }\"\n\t\t\t\t\t\t@click=\"openAddResultSheet\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<div class=\"tasks-field-results-more-text\">{{ loc('TASKS_V2_RESULT_ADD_MORE') }}</div>\n\t\t\t\t\t\t<BIcon\n\t\t\t\t\t\t\tclass=\"tasks-field-results-title-icon --auto-left\"\n\t\t\t\t\t\t\t:name=\"Outline.PLUS_L\"\n\t\t\t\t\t\t\thoverable\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</template>\n\t\t\t<template v-else>\n\t\t\t\t<div\n\t\t\t\t\tclass=\"tasks-field-results-empty-container\"\n\t\t\t\t\t:data-task-field-id=\"resultsMeta.id\"\n\t\t\t\t\tdata-field-container\n\t\t\t\t\tref=\"resultsContainer\"\n\t\t\t\t>\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"tasks-field-results-title\"\n\t\t\t\t\t\t:class=\"{ '--non-clickable': isTemplate }\"\n\t\t\t\t\t\t@click=\"handleTitleClick\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<div\n\t\t\t\t\t\t\tv-if=\"isLoading\"\n\t\t\t\t\t\t\tclass=\"tasks-field-results-title-main\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<BIcon :name=\"Animated.LOADER_WAIT\"/>\n\t\t\t\t\t\t\t<TextMd accent>{{ loc('TASKS_V2_RESULT_TITLE_LOADING') }}</TextMd>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div\n\t\t\t\t\t\t\tv-else\n\t\t\t\t\t\t\tclass=\"tasks-field-results-title-main\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<BIcon :name=\"Outline.WINDOW_FLAG\"/>\n\t\t\t\t\t\t\t<TextMd accent>{{ emptyResultTitle }}</TextMd>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"tasks-field-results-title-actions print-ignore\">\n\t\t\t\t\t\t\t<BIcon\n\t\t\t\t\t\t\t\tv-if=\"showMoreIcon\"\n\t\t\t\t\t\t\t\tclass=\"tasks-field-results-title-icon\"\n\t\t\t\t\t\t\t\t:name=\"Outline.MORE_L\"\n\t\t\t\t\t\t\t\thoverable\n\t\t\t\t\t\t\t\tref=\"moreIcon\"\n\t\t\t\t\t\t\t\t@click.stop=\"isMenuShown = true\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<BIcon\n\t\t\t\t\t\t\t\tv-else\n\t\t\t\t\t\t\t\tclass=\"tasks-field-results-title-icon\"\n\t\t\t\t\t\t\t\t:name=\"Outline.PLUS_L\"\n\t\t\t\t\t\t\t\thoverable\n\t\t\t\t\t\t\t\t:data-task-results-add=\"resultsMeta.id\"\n\t\t\t\t\t\t\t\t@click.stop=\"openAddResultSheet\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<BMenu\n\t\t\t\t\t\tv-if=\"isMenuShown\"\n\t\t\t\t\t\t:options=\"menuOptions\"\n\t\t\t\t\t\t@close=\"isMenuShown = false\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t\t<Hint\n\t\t\t\t\tv-if=\"showCreatorResultHint\"\n\t\t\t\t\t:bindElement=\"$refs.resultsContainer\"\n\t\t\t\t\t:options=\"{ closeIcon: true }\"\n\t\t\t\t\t@close=\"handleCreatorHintClose\"\n\t\t\t\t>\n\t\t\t\t\t{{ loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_CREATOR') }}\n\t\t\t\t</Hint>\n\t\t\t</template>\n\t\t\t<ResultRequiredAha\n\t\t\t\tv-if=\"showResponsibleResultHint\"\n\t\t\t\t:bindElement=\"$refs.resultsContainer\"\n\t\t\t\t:popupWidth=\"getRequiredResultAhaWidth()\"\n\t\t\t\t:hasResults\n\t\t\t\t@close=\"handleResponsibleHintClose\"\n\t\t\t\t@addResult=\"handleResponsibleHintButtonClick\"\n\t\t\t/>\n\t\t</div>\n\t\t<ResultEditorSheet\n\t\t\tv-if=\"isSheetShown\"\n\t\t\t:resultId=\"sheetResultId\"\n\t\t\t:sheetBindProps\n\t\t\t@close=\"setSheetShown(false)\"\n\t\t/>\n\t\t<ResultListSheet\n\t\t\tv-if=\"isListSheetShown\"\n\t\t\t:resultId=\"sheetResultId\"\n\t\t\t:sheetBindProps\n\t\t\t@close=\"setListSheetShown(false)\"\n\t\t/>\n\t"
	};

	// @vue/component
	const ResultsChip = {
		components: {
			Chip: ui_system_chip_vue.Chip,
			BMenu: ui_vue3_components_menu.BMenu,
			ResultEditorSheet
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {},
			analytics: {},
			cardType: {},
			isTemplate: {},
			embedded: {}
		},
		props: {
			isSheetShown: {
				type: Boolean,
				default: false
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['update:isSheetShown'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				resultsMeta
			};
		},
		data() {
			return {
				isMenuShown: false,
				sheetResultId: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: "".concat(tasks_v2_const.Model.Interface, "/currentUserId"),
				stateFlags: "".concat(tasks_v2_const.Model.Interface, "/stateFlags"),
				templateStateFlags: "".concat(tasks_v2_const.Model.Interface, "/templateStateFlags")
			}),
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[resultsMeta.id] || this.task.requireResult;
			},
			menuOptions() {
				return {
					id: "result-chip-menu-".concat(main_core.Text.getRandom()),
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top'
					},
					bindElement: this.$refs.chip.$el,
					targetContainer: document.body,
					minWidth: 240,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: false
				};
			},
			menuItems() {
				return [{
					title: this.loc('TASKS_V2_RESULT_ADD'),
					icon: ui_iconSet_api_vue.Outline.PLUS_L,
					onClick: this.openAddResultSheet,
					dataset: {
						id: "MenuResultAdd-".concat(this.taskId)
					}
				}, {
					title: this.loc('TASKS_V2_RESULT_REQUIRE'),
					icon: ui_iconSet_api_vue.Outline.WINDOW_FLAG,
					onClick: this.requireResult,
					isLocked: this.isLocked,
					dataset: {
						id: "MenuResultRequire-".concat(this.taskId)
					}
				}];
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.requiredResult.available;
			},
			featureId() {
				return tasks_v2_core.Core.getParams().restrictions.requiredResult.featureId;
			}
		},
		mounted() {
			main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.AddResultFromChat, this.handleAddResultFromChat);
			main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.DeleteResultFromChat, this.handleDeleteResultFromChat);
			main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.OpenPrefilledResultForm, this.handleOpenPrefilledResultForm);
		},
		beforeUnmount() {
			main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.AddResultFromChat, this.handleAddResultFromChat);
			main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.DeleteResultFromChat, this.handleDeleteResultFromChat);
			main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenPrefilledResultForm, this.handleOpenPrefilledResultForm);
		},
		methods: {
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				if (this.isTemplate || !this.isEdit && !this.isLocked) {
					this.requireResult();
					return;
				}
				if (this.task.rights.edit) {
					this.isMenuShown = true;
				} else {
					this.openAddResultSheet();
				}
			},
			async handleAddResultFromChat(event) {
				const {
					taskId,
					messageId,
					text,
					authorId
				} = event.data;
				if (taskId !== this.taskId || event.isDefaultPrevented()) {
					return;
				}
				event.preventDefault();
				const payload = {
					text: main_core.Type.isStringFilled(text) ? text : this.loc('TASKS_V2_RESULT_DEFAULT_TITLE_FROM_MESSAGE'),
					author: this.getUserDto(authorId),
					id: main_core.Text.getRandom(),
					taskId: this.taskId,
					createdAtTs: Date.now() / 1000,
					updatedAtTs: Date.now() / 1000,
					rights: {
						edit: true,
						remove: true
					}
				};
				const isSuccess = await tasks_v2_provider_service_resultService.resultService.addResultFromMessage(taskId, messageId, payload);
				this.sendAnalyticsResultFromMessageAdd(isSuccess);
				if (isSuccess) {
					main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultFromMessageAdded, {
						taskId
					});
				}
			},
			sendAnalyticsResultFromMessageAdd(isSuccess) {
				tasks_v2_lib_analytics.analytics.sendStatusSummaryAdd(this.analytics, {
					isSuccess,
					cardType: this.cardType,
					taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
					element: tasks_v2_const.Analytics.Element.ChatContextMenu,
					subSection: tasks_v2_const.Analytics.SubSection.Chat
				});
			},
			handleDeleteResultFromChat(event) {
				const {
					taskId,
					resultId
				} = event.data;
				if (taskId !== this.taskId || event.isDefaultPrevented()) {
					return;
				}
				event.preventDefault();
				void tasks_v2_provider_service_resultService.resultService.delete(resultId);
			},
			openAddResultSheet() {
				let text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
				const id = main_core.Text.getRandom();
				const payload = {
					id,
					text,
					taskId: this.taskId,
					author: this.getUser(this.currentUserId)
				};
				void this.$store.dispatch("".concat(tasks_v2_const.Model.Results, "/insert"), payload);
				this.sheetResultId = id;
				this.setSheetShown(true);
			},
			async requireResult() {
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						code: "limit_".concat(this.featureId),
						bindElement: this.$refs.chip.$el,
						analytics: {
							type: 'limit_tasks_status_summary'
						}
					});
					return;
				}
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					requireResult: true
				});
				if (this.isEdit) {
					return;
				}
				if (this.isTemplate) {
					await this.$store.dispatch("".concat(tasks_v2_const.Model.Interface, "/updateTemplateStateFlags"), {
						defaultRequireResult: true
					});
					void tasks_v2_provider_service_stateService.stateService.setTemplateFlags(this.templateStateFlags);
				} else {
					await this.$store.dispatch("".concat(tasks_v2_const.Model.Interface, "/updateStateFlags"), {
						defaultRequireResult: true
					});
					void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
				}
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
			},
			getUser(userId) {
				return this.$store.getters["".concat(tasks_v2_const.Model.Users, "/getById")](userId);
			},
			getUserDto(userId) {
				return tasks_v2_provider_service_userService.UserMappers.mapModelToDto(this.getUser(userId));
			},
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			},
			handleOpenPrefilledResultForm(event) {
				const {
					taskId,
					text
				} = event.getData();
				if (this.taskId !== taskId || event.isDefaultPrevented()) {
					return;
				}
				if (this.embedded) {
					queueMicrotask(() => {
						if (!event.isDefaultPrevented()) {
							event.preventDefault();
							this.openAddResultSheet(text);
						}
					});
					return;
				}
				event.preventDefault();
				this.openAddResultSheet(text);
			}
		},
		template: "\n\t\t<Chip\n\t\t\t:design\n\t\t\t:text=\"resultsMeta.title\"\n\t\t\t:icon=\"Outline.WINDOW_FLAG\"\n\t\t\t:data-task-id=\"taskId\"\n\t\t\t:data-task-chip-id=\"resultsMeta.id\"\n\t\t\tref=\"chip\"\n\t\t\t@click=\"handleClick\"\n\t\t/>\n\t\t<BMenu v-if=\"isMenuShown\" :options=\"menuOptions\" @close=\"isMenuShown = false\"/>\n\t\t<ResultEditorSheet\n\t\t\tv-if=\"isSheetShown\"\n\t\t\t:resultId=\"sheetResultId\"\n\t\t\t:sheetBindProps\n\t\t\t@close=\"setSheetShown(false)\"\n\t\t/>\n\t"
	};

	exports.ResultEditorSheet = ResultEditorSheet;
	exports.ResultListSheet = ResultListSheet;
	exports.Results = Results;
	exports.ResultsChip = ResultsChip;
	exports.resultsMeta = resultsMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Event, BX.Tasks.V2.Lib, BX.Vue3.Vuex, BX.Vue3.Directives, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.IconSet, BX, BX, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Vue3, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.UI.System.Skeleton.Vue, BX.Tasks.V2.Component, BX.UI.TextEditor, BX.Tasks.V2.Lib, BX.UI.System.Chip.Vue);
//# sourceMappingURL=results.bundle.js.map
