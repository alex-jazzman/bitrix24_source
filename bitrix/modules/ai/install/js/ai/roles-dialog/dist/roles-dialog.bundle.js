/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ai_engine, main_core, main_core_events, ui_notification, main_popup, ui_iconSet_api_core, ui_vue3_components_hint, ui_vue3_pinia, ui_iconSet_api_vue, ui_label) {
	'use strict';

	class RolesDialogLoaderPopup {
		#popup;
		show() {
			if (!this.#popup) {
				this.#initPopup();
			}
			this.#popup.show();
		}
		hide() {
			this.#popup?.close();
		}
		#initPopup() {
			this.#popup = new main_popup.Popup({
				content: this.#renderContent(),
				resizable: true,
				width: 881,
				height: 621,
				padding: 0,
				contentPadding: 0,
				borderRadius: '10px 10px 4px 4px',
				className: 'ai_roles-dialog_popup',
				animation: true,
				cacheable: false
			});
		}
		#renderContent() {
			return main_core.Tag.render`
			<div class="ai__roles-dialog_loader-popup-inner">
				${this.#renderPopupTitleBar()}
				<div class="ai__roles-dialog_loader-popup-content">
					<div class="ai__roles-dialog_loader-popup-content-left">
						<div style="width: 145px; height: 10px; margin-bottom: 22px; margin-left: 12px;">
							<div class="rec --color-ai"></div>
						</div>
						<div style="width: 100%; height: 119px; margin-bottom: 14px;">
							<div class="rec --color-ai"></div>
						</div>
						<div style="width: 100%; height: 54px;">
							<div class="rec --color-ai"></div>
						</div>
					</div>
					<div class="ai__roles-dialog_loader-popup-content-right">
					<div style="width: 101px; height: 10px; margin-bottom: 22px;">
							<div class="rec"></div>
						</div>
						<div style="width: 100%; height: 75px; margin-bottom: 8px;">
							<div class="rec"></div>
						</div>
						<div style="width: 100%; height: 75px;">
							<div class="rec"></div>
						</div>
					</div>
				</div>
			</div>
		`;
		}
		#renderPopupTitleBar() {
			return main_core.Tag.render`
			<div class="ai__roles-dialog_loader-popup-title-bar">
				<div
					style="width: 152px; height: 16px;"
					class="ai__roles-dialog_loader-popup-title-bar-left"
				>
					<div class="rec"></div>
				</div>
				<div
					style="width: 98px; height: 16px;"
					class="ai__roles-dialog_loader-popup-title-bar-left"
				>
					<div class="rec"></div>
				</div>
			</div>
		`;
		}
	}

	function showRolesDialogErrorPopup() {
		const popup = new main_popup.Popup({
			content: renderPopupContent(),
			resizable: false,
			width: 881,
			height: 621,
			padding: 0,
			contentPadding: 0,
			borderRadius: '10px 10px 4px 4px',
			className: 'ai_roles-dialog_popup',
			animation: true,
			cacheable: false,
			autoHide: true,
			closeByEsc: true,
			closeIcon: true,
			closeIconSize: main_popup.CloseIconSize.LARGE
		});
		popup.show();
	}
	function renderPopupContent() {
		const copilotName = main_core.Extension.getSettings('ai.roles-dialog').get('copilotName');
		return main_core.Tag.render`
		<div class="ai__roles-dialog_error-popup-inner">
			<div class="ai__roles-dialog_error-popup-content">
				<div class="ai__roles-dialog_error-popup-content-warning-icon">
					${renderWarningIcon()}
				</div>
				<p class="ai__roles-dialog_error-popup-content-error-text">
					${main_core.Loc.getMessage('AI_COPILOT_ROLES_ERROR_TEXT_MSGVER_1', {
		'#COPILOT_NAME#': copilotName
	})}
				</p>
			</div>
		</div>
	`;
	}
	function renderWarningIcon() {
		const warningIconColor = 'rgba(176, 149, 220, 0.4)';
		const warningIcon = new ui_iconSet_api_core.Icon({
			icon: ui_iconSet_api_core.Main.WARNING,
			size: 56,
			color: warningIconColor
		});
		return warningIcon.render();
	}

	const RolesDialogAnalyticsEvent = Object.freeze({
		OPEN: 'open',
		CLOSE: 'close',
		SAVE: 'save',
		SEARCH: 'search',
		FEEDBACK: 'feedback',
		SELECT: 'save'
	});
	const RolesDialogAnalyticsEventStatus = Object.freeze({
		SUCCESS: 'success',
		ERROR: 'error'
	});
	class RolesDialogAnalytics {
		#cSection;
		constructor(options) {
			this.#cSection = this.#formatCSectionParam(options.cSection);
		}
		sendOpenLabel(isSuccess, role) {
			const status = isSuccess ? RolesDialogAnalyticsEventStatus.SUCCESS : RolesDialogAnalyticsEventStatus.ERROR;
			const extraParams = role ? {
				p1: {
					name: 'role',
					value: role
				}
			} : {};
			this.#sendLabel({
				status,
				extraParams,
				event: RolesDialogAnalyticsEvent.OPEN
			});
		}
		sendCloseLabel(role) {
			const extraParams = role ? {
				p1: {
					name: 'role',
					value: role
				}
			} : {};
			this.#sendLabel({
				extraParams,
				event: RolesDialogAnalyticsEvent.CLOSE
			});
		}
		sendSelectLabel(role) {
			const extraParams = role ? {
				p1: {
					name: 'role',
					value: role
				}
			} : {};
			this.#sendLabel({
				extraParams,
				event: RolesDialogAnalyticsEvent.SELECT
			});
		}
		sendSearchLabel(search) {
			const extraParams = search ? {
				p1: {
					name: 'search',
					value: search
				}
			} : {};
			this.#sendLabel({
				extraParams,
				event: RolesDialogAnalyticsEvent.SEARCH
			});
		}
		sendFeedBackLabel() {
			this.#sendLabel({
				event: RolesDialogAnalyticsEvent.FEEDBACK
			});
		}
		async #sendLabel(params) {
			const status = params.status || RolesDialogAnalyticsEventStatus.SUCCESS;
			const event = params.event;
			const extraParams = params.extraParams || {};
			try {
				const {
					sendData
				} = await main_core.Runtime.loadExtension('ui.analytics');
				const sendDataOptions = {
					event,
					status,
					...this.#getCommonParameters(),
					...this.#getFormattedExtraParams(extraParams)
				};
				sendData(sendDataOptions);
			} catch (e) {
				console.error('AI: RolesDialog: Can\'t send analytics', e);
			}
		}
		#getCommonParameters() {
			return {
				tool: 'ai',
				category: 'roles_picker',
				c_section: this.#cSection
			};
		}
		#getFormattedExtraParams(extraParams) {
			const formattedExtraParams = {};
			Object.entries(extraParams).forEach(([paramKey, param]) => {
				formattedExtraParams[paramKey] = `${main_core.Text.toCamelCase(param.name)}_${main_core.Text.toCamelCase(param.value)}`;
			});
			return formattedExtraParams;
		}
		#formatCSectionParam(cSection) {
			return cSection.replaceAll('-', '_').split('_').map(stringPart => {
				if (Number.isNaN(parseInt(stringPart, 10))) {
					return stringPart;
				}
				return '';
			}).filter(stringPart => stringPart).join('_');
		}
	}

	const RolesDialogGroupListFooterEvents = {
		CHOOSE_STANDARD_ROLE: 'AI.RolesDialog.GroupListFooter:ChooseStandardRole'
	};
	const RolesDialogGroupListFooter = {
		methods: {
			handleClick() {
				main_core_events.EventEmitter.emit(document, RolesDialogGroupListFooterEvents.CHOOSE_STANDARD_ROLE);
			}
		},
		template: `
		<button @click="handleClick" class="ai__roles-dialog_standard-group-btn">
			<span class="ai__roles-dialog_standard-group-btn-text">
				{{ $Bitrix.Loc.getMessage('AI_COPILOT_ROLES_USE_STANDARD_ROLE') }}
			</span>
		</button>
	`
	};

	const RolesDialogHeaderWithHint = {
		components: {
			Hint: ui_vue3_components_hint.Hint
		},
		props: {
			header: {
				type: String,
				required: false,
				default: ''
			},
			hint: {
				type: String,
				required: false,
				default: ''
			}
		},
		template: `
		<div class="ai__roles-dialog_header-with-hint">
			<span class="ai__roles-dialog_header-with-hint-text">
				{{ header }}
			</span>
			<span
				v-if="hint"
				class="ai__roles-dialog_header-with-hint-text-hint"
			>
				<Hint :text="hint" />
			</span>
		</div>
	`
	};

	const RolesDialogGroupListHeader = {
		components: {
			RolesDialogHeaderWithHint
		},
		computed: {
			text() {
				return this.$Bitrix.Loc.getMessage('AI_COPILOT_ROLES_GROUP_LIST_HEADER_2');
			},
			hint() {
				return '';
			}
		},
		template: `
		<div class="ai__roles-dialog_group-list-header">
			<RolesDialogHeaderWithHint
				:header="text"
				:hint="hint"
			/>
		</div>
	`
	};

	function getRolesDialogContentHeader(States, analytic) {
		const sendSearchAnalyticLabel = searchQuery => {
			analytic.sendSearchLabel(searchQuery);
		};
		const debouncedSendSearchAnalyticLabel = main_core.Runtime.debounce(sendSearchAnalyticLabel, 800);
		return {
			components: {
				RolesDialogHeaderWithHint
			},
			computed: {
				...ui_vue3_pinia.mapWritableState(States.useGlobalState, {
					searchQuery: 'searchQuery',
					searching: 'searchApplied'
				}),
				header() {
					return this.$Bitrix.Loc.getMessage('AI_COPILOT_ROLES_MAIN_CONTENT_HEADER');
				},
				hint() {
					return this.$Bitrix.Loc.getMessage('AI_COPILOT_ROLES_MAIN_CONTENT_HEADER_HINT_MSGVER_1', {
						'#COPILOT_NAME#': main_core.Extension.getSettings('ai.roles-dialog').get('copilotName')
					});
				}
			},
			watch: {
				searchQuery() {
					if (this.searching) {
						debouncedSendSearchAnalyticLabel(this.searchQuery);
					}
				}
			},
			template: `
			<div class="ai__roles-dialog_main-content-header">
				<RolesDialogHeaderWithHint
					:header="header"
					:hint="hint"
				/>
			</div>
		`
		};
	}

	const RolesDialogRoleItemAvatar = {
		name: 'RolesDialogRoleItemAvatar',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		data() {
			return {
				isAvatarLoaded: null
			};
		},
		props: {
			avatar: {
				type: String,
				required: false,
				default: null
			},
			avatarAlt: {
				type: String,
				required: false,
				default: ''
			},
			icon: {
				type: String,
				required: false,
				default: null
			},
			isUniversal: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			iconSize() {
				return 24;
			},
			iconColor() {
				return getComputedStyle(document.body).getPropertyValue('--ui-color-background-primary') || '#fff';
			},
			fallbackIcon() {
				return ui_iconSet_api_core.Main.COPILOT_AI;
			},
			wrapperClassName() {
				return {
					'ai__roles-dialog_role-image-wrapper': true,
					'--universal': this.isUniversal
				};
			}
		},
		methods: {
			onImageLoad() {
				this.isAvatarLoaded = true;
			},
			onImageLoadError() {
				this.isAvatarLoaded = false;
			}
		},
		template: `
		<div
			:class="wrapperClassName"
		>
			<div
				v-if="isUniversal"
			></div>
			<div
				v-else-if="icon"
				class="ai__roles-dialog_role-image-icon"
			>
				<BIcon
					:name="icon"
					:size="iconSize"
					:color="iconColor"
				/>
			</div>
			<div
				v-else
			>
				<transition name="ai-roles-dialog-icon-fade">
					<img
						v-show="isAvatarLoaded"
						class="ai__roles-dialog_role-image"
						:src="avatar"
						:alt="avatarAlt"
						@error="onImageLoadError"
						@load="onImageLoad"
					/>
				</transition>
				<div
					v-if="isAvatarLoaded === null || isAvatarLoaded === false"
					:class="{'ai__roles-dialog_role-image-icon': true, '--loading': isAvatarLoaded === null}"
				>
					<BIcon
						:name="fallbackIcon"
						:size="iconSize"
						:color="iconColor"
					/>
				</div>
			</div>
		</div>
	`
	};

	const RolesDialogLabelNew = {
		props: {
			inverted: {
				type: Boolean,
				required: false,
				default: false
			},
			useRedesign: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			labelHTML() {
				const labelColor = this.inverted ? ui_label.LabelColor.COPILOT_LIGHT_REVERSE : ui_label.LabelColor.COPILOT_LIGHT;
				const label = new ui_label.Label({
					color: labelColor,
					size: ui_label.LabelSize.SM,
					text: 'NEW',
					fill: true
				});
				return label.render().outerHTML;
			},
			className() {
				return {
					'ai__roles-dialog_label-new': true,
					'--inverted': this.inverted
				};
			}
		},
		template: `
		<div v-if="useRedesign" :class="className">
			<span class="ai__roles-dialog_label-new-text">New</span>
		</div>
		<div v-else ref="label" class="ai__roles-dialog_label" v-html="labelHTML"></div>
	`
	};

	// eslint-disable-next-line max-lines-per-function
	function getRolesDialogRoleItemWithStates(States) {
		return {
			name: 'RolesDialogRoleItem',
			components: {
				BIcon: ui_iconSet_api_vue.BIcon,
				RolesDialogRoleItemAvatar,
				RolesDialogLabelNew
			},
			data() {
				return {
					isFavourite: this.itemData.itemData.customData.isFavourite,
					isProcessingRoleFavourite: false
				};
			},
			props: ['itemData'],
			computed: {
				...ui_vue3_pinia.mapWritableState(States.useGlobalState, {
					searching: 'searchApplied',
					searchQuery: 'searchQuery'
				}),
				item() {
					return this.itemData.itemData;
				},
				subtitle() {
					const subtitle = main_core.Text.encode(this.item.subtitle);
					if (this.searching && this.searchQuery !== '') {
						return subtitle.replaceAll(new RegExp(this.searchQuery, 'gi'), match => `<mark>${match}</mark>`);
					}
					return subtitle;
				},
				title() {
					const title = main_core.Text.encode(this.item.title);
					if (this.searching && this.searchQuery !== '') {
						return title.replaceAll(new RegExp(this.searchQuery, 'gi'), match => `<mark>${match}</mark>`);
					}
					return title;
				},
				isSelected() {
					return Boolean(this.item.customData?.selected);
				},
				isNew() {
					return Boolean(this.item.customData?.isNew);
				},
				isInfoItem() {
					return Boolean(this.item.customData?.isInfoItem);
				},
				isUniversal() {
					return Boolean(this.item.customData?.isUniversal);
				},
				className() {
					return {
						'ai__roles-dialog_role-item': true,
						'--selected': this.isSelected,
						'--universal': this.isUniversal
					};
				},
				isRoleCanBeFavourite() {
					return this.item.customData.canBeFavourite === true;
				},
				favouriteLabelIconData() {
					const iconName = this.isProcessingRoleFavourite ? ui_iconSet_api_core.Animated.LOADER_WAIT : ui_iconSet_api_core.Main.BOOKMARK_1;
					return {
						name: iconName,
						size: 24
					};
				},
				favouriteLabelTitle() {
					return this.isFavourite ? this.$Bitrix.Loc.getMessage('AI_COPILOT_ROLES_REMOVE_FROM_FAVOURITE') : this.$Bitrix.Loc.getMessage('AI_COPILOT_ROLES_ADD_TO_FAVOURITE');
				},
				favouriteLabelClassname() {
					return {
						'ai__roles-dialog_role-item-favourite-label': true,
						'--active': this.isFavourite,
						'--loading': this.isProcessingRoleFavourite
					};
				},
				infoIcon() {
					return ui_iconSet_api_core.Main.INFO;
				},
				universalIcon() {
					return ui_iconSet_api_core.Main.COPILOT_AI;
				}
			},
			methods: {
				selectRole() {
					if (main_core.Type.isFunction(this.item.button.action)) {
						this.item.button.action();
					}
				},
				toggleFavourite() {
					if (this.isProcessingRoleFavourite) {
						return;
					}
					let isRequestFinished = false;
					setTimeout(() => {
						if (isRequestFinished === false) {
							this.isProcessingRoleFavourite = true;
						}
					}, 300);

					// eslint-disable-next-line promise/catch-or-return
					this.item.customData.actions.toggleFavourite(!this.isFavourite).then(() => {
						this.isFavourite = !this.isFavourite;
					}).finally(() => {
						this.isProcessingRoleFavourite = false;
						isRequestFinished = true;
					});
				}
			},
			template: `
			<article @click="selectRole" :class="className">
				<RolesDialogRoleItemAvatar
					:avatar="item.customData.avatar"
					:avatar-alt="item.title"
					:icon="isInfoItem ? infoIcon : (isUniversal ? universalIcon : null)"
					:is-universal="isUniversal"
				/>
				<div class="ai__roles-dialog_role-item-info">
					<div class="ai__roles-dialog_role-item-title-wrapper">
						<div class="ai__roles-dialog_role-item-title" v-html="title"></div>
						<div class="ai__roles-dialog_role-item-label">
							<RolesDialogLabelNew v-if="isNew" :use-redesign="item.customData.isBitrixGptV2Available" />
						</div>
					</div>
					<p class="ai__roles-dialog_role-item-description" v-html="subtitle"></p>
				</div>
				<button
					v-if="isRoleCanBeFavourite"
					:class="favouriteLabelClassname"
					:title="favouriteLabelTitle"
					@click.stop.prevent="toggleFavourite"
					@mousedown.stop
				>
					<BIcon
						:name="favouriteLabelIconData.name"
						:size="favouriteLabelIconData.size"
					/>
				</button>
			</article>
		`
		};
	}

	const RolesDialogGroupItem = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			RolesDialogLabelNew
		},
		props: ['groupData'],
		computed: {
			group() {
				return this.groupData.groupData;
			},
			isNew() {
				return this.group.customData.isNew;
			},
			isSelected() {
				return this.group.selected;
			},
			handleClick() {
				if (this.group.selected) {
					return undefined;
				}
				return this.groupData.handleClick;
			},
			groupItemClassname() {
				return {
					'ai__roles-dialog_group-item': true,
					'--selected': this.isSelected
				};
			},
			chevronRightIconName() {
				return ui_iconSet_api_core.Actions.CHEVRON_RIGHT;
			}
		},
		created() {
			if (this.groupData.groupData.id === 'recents') {
				main_core_events.EventEmitter.subscribe('update-complete', this.onUpdate);
			}
		},
		beforeDestroy() {
			if (this.groupData.groupData.id === 'recents') {
				main_core_events.EventEmitter.unsubscribe('update-complete', this.onUpdate);
			}
		},
		methods: {
			onUpdate() {
				this.groupData.handleClick();
			}
		},
		template: `
		<div @click="handleClick" class="ai__roles-dialog_group-item-wrapper">
			<div :class="groupItemClassname">
				<div class="ai__roles-dialog_group-item-inner">
				<div class="ai__roles-dialog_group-item-title-wrapper">
					<span class="ai__roles-dialog_group-item-title">
						{{ group.name }}
					</span>
					<div class="ai__roles-dialog_group-item-label-new">
						<RolesDialogLabelNew
							v-if="isNew"
							:inverted="isSelected"
							:use-redesign="group.customData.isBitrixGptV2Available"
						/>
					</div>
				</div>
					<b-icon :size="16" :name="chevronRightIconName"></b-icon>
				</div>
			</div>
		</div>
	`
	};

	const RolesDialogSearchStubEvents = {
		CHOOSE_STANDARD_ROLE: 'AI.RolesDialog.RolesDialogSearchStub:ChooseStandardRole'
	};
	const textWithLink = main_core.Loc.getMessage('AI_COPILOT_ROLES_SEARCH_NO_RESULT_3_MSGVER_1', {
		'#LINK#': '<span @click.prevent="selectUniversalRole">',
		'#/LINK#': '</span>',
		'#COPILOT_NAME#': main_core.Extension.getSettings('ai.roles-dialog').get('copilotName')
	});
	const RolesDialogSearchStub = {
		methods: {
			selectUniversalRole() {
				main_core_events.EventEmitter.emit(document, RolesDialogSearchStubEvents.CHOOSE_STANDARD_ROLE);
			}
		},
		template: `
		<div class="ai__roles-dialog_search-stub">
			<div class="ai__roles-dialog_search-stub-content">
				<div class="ai__roles-dialog_search-stub-image"></div>
				<h3 class="ai__roles-dialog_search-stub-title">
					{{ $Bitrix.Loc.getMessage('AI_COPILOT_ROLES_SEARCH_NO_RESULT_TITLE') }}
				</h3>
				<div class="ai__roles-dialog_search-stub-text">
					${textWithLink}
				</div>
			</div>
		</div>
	`
	};

	const customDescription = main_core.Loc.getMessage('AI_COPILOT_ROLES_EMPTY_CUSTOM_GROUP', {
		'#LINK#': '<a @click.prevent="openRolesLibrary" href="#">',
		'#/LINK#': '</a>'
	});
	const getRolesDialogEmptyGroupStubWithStates = States => {
		return {
			computed: {
				...ui_vue3_pinia.mapWritableState(States.useGlobalState, {
					currentGroup: 'currentGroup'
				}),
				emptyStubData() {
					return this.currentGroup.customData.emptyStubData;
				},
				groupCode() {
					return this.currentGroup.id;
				},
				title() {
					return this.emptyStubData.title;
				},
				description() {
					return this.emptyStubData.description;
				}
			},
			methods: {
				async sendAnalytics() {
					try {
						const {
							sendData
						} = await main_core.Runtime.loadExtension('ui.analytics');
						const sendDataOptions = {
							event: 'open_list',
							status: 'success',
							tool: 'ai',
							category: 'roles_saving',
							c_section: 'roles_picker'
						};
						sendData(sendDataOptions);
					} catch (e) {
						console.error('AI: RolesDialog: Can\'t send analytics', e);
					}
				},
				openRolesLibrary() {
					if (!main_core.Extension.getSettings('ai.roles-dialog').get('isLibraryVisible')) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('AI_COPILOT_ROLES_LIBRARY_COLLABER_ACCESS_DENIED')
						});
						return;
					}
					if (BX.SidePanel) {
						this.sendAnalytics();
						BX.SidePanel.Instance.open('/bitrix/components/bitrix/ai.role.library.grid/slider.php', {
							cacheable: false,
							events: {
								onCloseStart: () => {
									main_core.Event.EventEmitter.emit('update');
								}
							}
						});
					} else {
						window.location.href = '/bitrix/components/bitrix/ai.prompt.library.grid/slider.php';
					}
				}
			},
			template: `
			<div class="ai__roles-dialog_empty-group-stub">
				<div class="ai__roles-dialog_empty-group-stub-content">
					<div
						class="ai__roles-dialog_empty-group-stub-image"
						:class="'--' + groupCode"
					></div>
					<h3 class="ai__roles-dialog_empty-group-stub-title">
						{{ title }}
					</h3>
					<div v-if="groupCode !== 'customs'" class="ai__roles-dialog_empty-group-stub-text">
						{{ description }}
					</div>
					<div v-else class="ai__roles-dialog_empty-group-stub-text">
						${customDescription}
					</div>
				</div>
			</div>
		`
		};
	};

	const RolesDialogRolesLibrary = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			useRedesign: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		computed: {
			chevronRightIconName() {
				return ui_iconSet_api_core.Actions.CHEVRON_RIGHT;
			},
			rolesLibraryIconName() {
				return this.useRedesign ? ui_iconSet_api_core.Outline.ROLES_LIBRARY : ui_iconSet_api_core.Main.ROLES_LIBRARY;
			},
			rolesLibraryIconSize() {
				return this.useRedesign ? 24 : 32;
			}
		},
		methods: {
			async sendAnalytics() {
				try {
					const {
						sendData
					} = await main_core.Runtime.loadExtension('ui.analytics');
					const sendDataOptions = {
						event: 'open_list',
						status: 'success',
						tool: 'ai',
						category: 'roles_saving',
						c_section: 'roles_picker'
					};
					sendData(sendDataOptions);
				} catch (e) {
					console.error('AI: RolesDialog: Can\'t send analytics', e);
				}
			},
			handleClick() {
				if (BX.SidePanel) {
					this.sendAnalytics();
					BX.SidePanel.Instance.open('/bitrix/components/bitrix/ai.role.library.grid/slider.php', {
						cacheable: false,
						events: {
							onCloseStart: () => {
								main_core.Event.EventEmitter.emit('update');
							}
						}
					});
				} else {
					window.location.href = '/bitrix/components/bitrix/ai.prompt.library.grid/slider.php';
				}
			}
		},
		template: `
		<div @click="handleClick" class="ai__roles-dialog_roles-library-wrapper">
			<div class="ai__roles-dialog_roles-library">
				<div class="ai__roles-dialog_roles-library-inner">
				<div class="ai__roles-dialog_roles-library-title-wrapper">
					<b-icon :size="rolesLibraryIconSize" :name="rolesLibraryIconName"></b-icon>
					<span class="ai__roles-dialog_roles-library-title">
						{{ $Bitrix.Loc.getMessage('AI_COPILOT_ROLES_LIBRARY_TITLE') }}
					</span>
					<div class="ai__roles-dialog_roles-library-label-new">
					</div>
				</div>
					<b-icon :size="16" :name="chevronRightIconName"></b-icon>
				</div>
			</div>
		</div>
	`
	};

	const RolesDialogEvents = {
		HIDE: 'hide',
		SELECT_ROLE: 'select-role'
	};
	const RECOMMENDED_GROUP_CODE = 'recommended';
	const RECENT_GROUP_CODE = 'recents';
	const FAVOURITE_GROUP_CODE = 'favorites';
	const CUSTOM_GROUP_CODE = 'customs';
	class RolesDialog extends main_core_events.EventEmitter {
		#entityCatalog;
		#engine;
		#analytic;
		#roles;
		#recentRoles;
		#favouriteRoles;
		#customRoles;
		#defaultRoleCode;
		#industries;
		#selectedDefaultRoleHandler;
		#reloadDialogHandler;
		#selectedRoleCode;
		#universalRole;
		#title;
		#moduleId;
		#contextId;
		#rolesLibraryAvailable;
		#isBitrixGptV2Available;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.RolesDialog');
			this.#validateOptions(options);
			this.#title = options.title || '';
			if (options.engine) {
				this.#engine = options.engine;
			} else {
				this.#engine = new ai_engine.Engine({});
			}
			this.#moduleId = options.moduleId;
			this.#contextId = options.contextId;
			this.#engine.setModuleId(options.moduleId);
			this.#engine.setContextId(options.contextId);
			this.#selectedRoleCode = main_core.Type.isString(options.selectedRoleCode) ? options.selectedRoleCode : '';
			this.#analytic = new RolesDialogAnalytics({
				cSection: `${this.#moduleId}_${this.#contextId}`
			});
			this.#rolesLibraryAvailable = main_core.Extension.getSettings('ai.roles-dialog').get('isLibraryVisible');
			this.#isBitrixGptV2Available = main_core.Extension.getSettings('ai.roles-dialog').get('isBitrixGptV2Available');
		}
		#validateOptions(options) {
			if (main_core.Type.isStringFilled(options.moduleId) === false) {
				throw new main_core.BaseError('AI.RolesDialog: moduleId is required option and must be string');
			}
			if (main_core.Type.isStringFilled(options.contextId) === false) {
				throw new main_core.BaseError('AI.RolesDialog: contextId is required option and must be string');
			}
			if (options.selectedRoleCode !== undefined && main_core.Type.isString(options.selectedRoleCode) === false) {
				throw new main_core.BaseError('AI.RolesDialog: selectedRoleCode must be string');
			}
			if (options.title && main_core.Type.isString(options.title) === false) {
				throw new main_core.BaseError('AI.RolesDialog: title must be string');
			}
			if (options.engine && !(options.engine instanceof ai_engine.Engine)) {
				throw new main_core.BaseError('AI.RolesDialog: engine option must be instance of Engine');
			}
		}
		setSelectedRoleCode(code) {
			this.#selectedRoleCode = code;
			if (this.#entityCatalog) {
				this.#entityCatalog.setGroups(this.#getItemGroupsFromIndustries());
				this.#entityCatalog.setItems(this.#getItemsData());
			}
		}
		async show() {
			if (this.#entityCatalog) {
				this.#entityCatalog.show();
				this.#analytic.sendOpenLabel(true, this.#selectedRoleCode);
				return;
			}
			await this.#showAfterInit();
		}
		hide() {
			this.#entityCatalog?.close();
		}
		async #showAfterInit() {
			const loader = new RolesDialogLoaderPopup();
			let isShowLoader = true;
			setTimeout(() => {
				if (isShowLoader) {
					loader.show();
				}
			}, 300);
			try {
				await this.#init();
				this.#analytic.sendOpenLabel(true, this.#selectedRoleCode);
				this.#entityCatalog.show();
			} catch (e) {
				showRolesDialogErrorPopup();
				this.#analytic.sendOpenLabel(false, this.#selectedRoleCode);
				console.error(e);
			} finally {
				isShowLoader = false;
				loader.hide();
			}
		}
		#subscribeEvents() {
			this.#selectedDefaultRoleHandler = this.#selectDefaultRole.bind(this);
			main_core_events.EventEmitter.subscribe(document, RolesDialogGroupListFooterEvents.CHOOSE_STANDARD_ROLE, this.#selectedDefaultRoleHandler);
			main_core_events.EventEmitter.subscribe(document, RolesDialogSearchStubEvents.CHOOSE_STANDARD_ROLE, this.#selectedDefaultRoleHandler);
			this.#reloadDialogHandler = this.#reloadDialog.bind(this);
			main_core_events.EventEmitter.subscribe('update', this.#reloadDialogHandler);
		}
		async #reloadDialog() {
			const loader = new RolesDialogLoaderPopup();
			let isShowLoader = true;
			setTimeout(() => {
				if (isShowLoader) {
					loader.show();
				}
			}, 300);
			try {
				this.#entityCatalog.setItems([]);
				this.#entityCatalog.setGroups([]);
				await this.#loadData();
			} catch (e) {
				showRolesDialogErrorPopup();
				console.error(e);
			} finally {
				isShowLoader = false;
				loader.hide();
				this.#entityCatalog.setItems(this.#getItemsData());
				this.#entityCatalog.setGroups(this.#getItemGroupsFromIndustries());
				main_core_events.EventEmitter.emit('update-complete');
			}
		}
		#unsubscribeEvents() {
			main_core_events.EventEmitter.unsubscribe(document, RolesDialogGroupListFooterEvents.CHOOSE_STANDARD_ROLE, this.#selectedDefaultRoleHandler);
			main_core_events.EventEmitter.unsubscribe(document, RolesDialogSearchStubEvents.CHOOSE_STANDARD_ROLE, this.#selectedDefaultRoleHandler);
			main_core_events.EventEmitter.unsubscribe('update', this.#reloadDialogHandler);
		}
		#selectRole(role) {
			const event = new main_core_events.BaseEvent({
				data: {
					role
				}
			});
			this.setSelectedRoleCode(role.code);
			this.#analytic.sendSelectLabel(this.#selectedRoleCode);
			this.emit(RolesDialogEvents.SELECT_ROLE, event);
		}
		#selectDefaultRole() {
			this.setSelectedRoleCode(this.#defaultRoleCode);
			const event = new main_core_events.BaseEvent({
				data: {
					role: this.#universalRole
				}
			});
			this.emit(RolesDialogEvents.SELECT_ROLE, event);
			this.#entityCatalog.close();
		}
		async #init() {
			await this.#loadData();
			await this.#initEntityCatalog();
		}
		async #initEntityCatalog() {
			const {
				EntityCatalog,
				States
			} = await main_core.Runtime.loadExtension('ui.entity-catalog');
			this.#entityCatalog = new EntityCatalog({
				title: this.#title,
				showSearch: true,
				showEmptyGroups: true,
				customComponents: {
					RolesDialogContentHeader: getRolesDialogContentHeader(States, this.#analytic),
					RolesDialogRoleItem: getRolesDialogRoleItemWithStates(States),
					RolesDialogGroupListHeader,
					RolesDialogGroupItem,
					RolesDialogGroupListFooter,
					RolesDialogSearchStub,
					RolesDialogEmptyGroupStub: getRolesDialogEmptyGroupStubWithStates(States),
					RolesDialogRolesLibrary
				},
				popupOptions: {
					className: `ai_roles-dialog_popup ui-entity-catalog__scope${this.#isBitrixGptV2Available ? ' --bitrixgpt-redesign' : ''}`,
					resizable: false,
					width: 852,
					height: 510,
					animation: true,
					events: {
						onPopupShow: () => {
							this.#subscribeEvents();
						},
						onPopupClose: () => {
							this.emit(RolesDialogEvents.HIDE);
							this.#unsubscribeEvents();
							this.#analytic.sendCloseLabel(this.#selectedRoleCode);
						}
					}
				},
				slots: this.#getSlots(EntityCatalog),
				groups: this.#getItemGroupsFromIndustries(),
				items: this.#getItemsData()
			});
		}
		#getSlots(EntityCatalog) {
			const slots = {
				[EntityCatalog.SLOT_MAIN_CONTENT_HEADER]: '<RolesDialogContentHeader />',
				[EntityCatalog.SLOT_MAIN_CONTENT_ITEM]: '<RolesDialogRoleItem :itemData="itemSlotProps" />',
				[EntityCatalog.SLOT_GROUP]: '<RolesDialogGroupItem :groupData="groupSlotProps" />',
				[EntityCatalog.SLOT_GROUP_LIST_HEADER]: '<RolesDialogGroupListHeader />',
				[EntityCatalog.SLOT_MAIN_CONTENT_EMPTY_GROUP_STUB]: '<RolesDialogEmptyGroupStub />'
			};
			if (EntityCatalog.SLOT_MAIN_CONTENT_SEARCH_STUB) {
				slots[EntityCatalog.SLOT_MAIN_CONTENT_NO_SELECTED_GROUP_STUB] = '<RolesDialogSearchStub />';
				slots[EntityCatalog.SLOT_MAIN_CONTENT_SEARCH_STUB] = '<RolesDialogSearchStub />';
			}
			if (this.#rolesLibraryAvailable) {
				slots[EntityCatalog.SLOT_GROUP_LIST_FOOTER] = `<RolesDialogRolesLibrary :use-redesign="${this.#isBitrixGptV2Available}" />`;
			}
			return slots;
		}
		#getInfoItemData() {
			return {
				id: 'info-item-data',
				title: main_core.Loc.getMessage('AI_COPILOT_ROLES_HELP_ITEM_TITLE'),
				subtitle: main_core.Loc.getMessage('AI_COPILOT_ROLES_HELP_ITEM_DESCRIPTION'),
				groupIds: this.#getAllIndustryCodesWithExcludes([FAVOURITE_GROUP_CODE, CUSTOM_GROUP_CODE]),
				customData: {
					isInfoItem: true
				},
				button: {
					action: async () => {
						await main_core.Runtime.loadExtension('ui.feedback.form');
						const id = Math.round(Math.random() * 1000);
						BX.UI.Feedback.Form.open({
							id: `ai.roles-dialog.feedback-form_${id}`,
							presets: {
								sender_page: `${this.#moduleId}_${this.#contextId}`
							},
							forms: [{
								zones: ['es'],
								id: 738,
								lang: 'es',
								sec: '77ui4p'
							}, {
								zones: ['en'],
								id: 740,
								lang: 'en',
								sec: 'obza3e'
							}, {
								zones: ['de'],
								id: 742,
								lang: 'de',
								sec: 'vqqxgr'
							}, {
								zones: ['com.br'],
								id: 744,
								lang: 'com.br',
								sec: 'nz3zig'
							}, {
								zones: ['ru', 'by', 'kz'],
								id: 746,
								lang: 'ru',
								sec: 'we50kv'
							}]
						});
						this.#analytic.sendFeedBackLabel();
					}
				}
			};
		}
		#getAllIndustryCodesWithExcludes(excludesCodes) {
			const excludes = new Set(excludesCodes);
			return this.#industries.map(industry => {
				return industry.code;
			}).filter(industryCode => {
				return excludes.has(industryCode) === false;
			});
		}
		async #loadData() {
			const result = await this.#engine.getRolesDialogData();
			this.#universalRole = result.data.universalRole;
			this.#defaultRoleCode = this.#universalRole.code;
			this.#industries = result.data.items.map(roleIndustry => {
				const {
					code,
					name,
					isNew
				} = roleIndustry;
				return {
					code,
					name,
					isNew
				};
			});
			this.#industries.unshift(this.#getRecentRoleIndustry(), this.#getFavouriteRoleIndustry(), this.#getCustomRoleIndustry(), this.#getRecommendedRoleIndustry());
			this.#roles = result.data.items.reduce((roles, roleIndustry) => {
				const industryRoles = roleIndustry.roles;
				return [...roles, ...industryRoles];
			}, []);
			this.#recentRoles = result.data.recents;
			this.#favouriteRoles = result.data.favorites;
			this.#customRoles = result.data.customs;
			this.#roles = [...this.#roles, ...this.#customRoles];
			this.#selectedRoleCode = this.#selectedRoleCode || null;
		}
		#getRecommendedRoleIndustry() {
			return {
				code: RECOMMENDED_GROUP_CODE,
				name: main_core.Loc.getMessage('AI_COPILOT_ROLES_RECOMMENDED_GROUP')
			};
		}
		#getRecentRoleIndustry() {
			return {
				code: RECENT_GROUP_CODE,
				name: main_core.Loc.getMessage('AI_COPILOT_ROLES_RECENT_GROUP')
			};
		}
		#getFavouriteRoleIndustry() {
			return {
				code: FAVOURITE_GROUP_CODE,
				name: main_core.Loc.getMessage('AI_COPILOT_ROLES_FAVOURITE_GROUP')
			};
		}
		#getCustomRoleIndustry() {
			return {
				code: CUSTOM_GROUP_CODE,
				name: main_core.Loc.getMessage('AI_COPILOT_ROLES_CUSTOM_GROUP')
			};
		}
		#getItemsData() {
			let selectedRole = null;
			const items = this.#roles.map(role => {
				const groupIds = [role.industryCode];
				if (role.isRecommended) {
					groupIds.push(RECOMMENDED_GROUP_CODE);
				}
				if (this.#recentRoles.findIndex(recentRole => recentRole.code === role.code) > -1) {
					groupIds.push(RECENT_GROUP_CODE);
				}
				if (this.#favouriteRoles.findIndex(favouriteRole => favouriteRole.code === role.code) > -1) {
					groupIds.push(FAVOURITE_GROUP_CODE);
				}
				if (this.#customRoles.findIndex(customRole => customRole.code === role.code) > -1) {
					groupIds.push(CUSTOM_GROUP_CODE);
				}
				if (role.code === this.#selectedRoleCode) {
					selectedRole = this.#getItemDataFromRole(role, groupIds);
					return null;
				}
				return this.#getItemDataFromRole(role, groupIds);
			}).filter(role => role);
			const itemsSortedByNewness = items.sort(role => {
				return role.customData.isNew ? -1 : 1;
			});
			const universalRoleItem = this.#getUniversalRoleItemData();
			return [universalRoleItem, selectedRole, ...itemsSortedByNewness, this.#getInfoItemData()].filter(role => role);
		}
		#getUniversalRoleItemData() {
			const role = this.#universalRole;
			const groupIds = [...this.#getAllIndustryCodesWithExcludes([FAVOURITE_GROUP_CODE, CUSTOM_GROUP_CODE])];
			return this.#getItemDataFromRole(role, groupIds);
		}
		#getItemGroupsFromIndustries() {
			const selectedGroupIndex = this.#getSelectedGroupIndex();
			const groups = this.#industries.map((industry, index) => {
				const isSelectedRole = index === selectedGroupIndex;
				if (industry.code === RECENT_GROUP_CODE) {
					return this.#getRecentItemGroupData(isSelectedRole);
				}
				if (industry.code === FAVOURITE_GROUP_CODE) {
					return this.#getFavouriteItemGroupData(isSelectedRole);
				}
				if (industry.code === CUSTOM_GROUP_CODE) {
					return this.#getCustomItemGroupData(isSelectedRole);
				}
				return this.#getItemGroupDataFromIndustry(industry, isSelectedRole);
			});
			return [[...groups]];
		}
		#getItemGroupDataFromIndustry(industry, isSelected = false) {
			return {
				id: industry.code,
				name: industry.name,
				selected: isSelected,
				customData: {
					isNew: industry.isNew,
					isBitrixGptV2Available: this.#isBitrixGptV2Available
				}
			};
		}
		#getRecentItemGroupData(isSelected = false) {
			return {
				...this.#getItemGroupDataFromIndustry(this.#getRecentRoleIndustry(), isSelected),
				compare: (item1, item2) => {
					return this.#compareRecentItems(item1, item2);
				}
			};
		}
		#compareRecentItems(item1, item2) {
			const item1Index = this.#recentRoles.findIndex(rr => item1.id === rr.code) + 1;
			const item2Index = this.#recentRoles.findIndex(rr => item2.id === rr.code) + 1;
			if (item1.id === this.#getInfoItemData().id) {
				return 1;
			}
			return item1Index - item2Index;
		}
		#getFavouriteItemGroupData(isSelected = false) {
			return {
				...this.#getItemGroupDataFromIndustry(this.#getFavouriteRoleIndustry(), isSelected),
				compare: (item1, item2) => {
					return this.#compareFavouriteItems(item1, item2);
				},
				customData: {
					emptyStubData: {
						title: main_core.Loc.getMessage('AI_COPILOT_ROLES_EMPTY_FAVOURITE_GROUP_TITLE'),
						description: main_core.Loc.getMessage('AI_COPILOT_ROLES_EMPTY_FAVOURITE_GROUP')
					}
				}
			};
		}
		#getCustomItemGroupData(isSelected = false) {
			return {
				...this.#getItemGroupDataFromIndustry(this.#getCustomRoleIndustry(), isSelected),
				customData: {
					emptyStubData: {
						title: main_core.Loc.getMessage('AI_COPILOT_ROLES_EMPTY_CUSTOM_GROUP_TITLE')
					}
				}
			};
		}
		#compareFavouriteItems(item1, item2) {
			const item1Index = this.#favouriteRoles.findIndex(rr => item1.id === rr.code) + 1;
			const item2Index = this.#favouriteRoles.findIndex(rr => item2.id === rr.code) + 1;
			return item1Index - item2Index;
		}
		#getItemDataFromRole(role, groupIds = []) {
			const isRoleInFavouriteList = this.#isRoleInFavouriteList(role.code);
			return {
				groupIds,
				id: role.code,
				name: role.name,
				title: role.name,
				subtitle: role.description,
				description: role.description,
				button: {
					text: main_core.Loc.getMessage('AI_COPILOT_ROLES_USE_ROLE_BTN'),
					action: () => {
						this.#selectRole(role);
						this.#entityCatalog.close();
					}
				},
				customData: {
					selected: role.code === this.#selectedRoleCode,
					avatar: role.avatar.medium,
					isNew: role.isNew,
					isUniversal: this.#isBitrixGptV2Available && role.code === this.#universalRole.code,
					isBitrixGptV2Available: this.#isBitrixGptV2Available,
					isFavourite: isRoleInFavouriteList,
					canBeFavourite: role.code !== this.#universalRole.code,
					actions: {
						toggleFavourite: makeItFavourite => {
							const roleCode = role.code;
							return this.#toggleRoleFavourite(roleCode, makeItFavourite);
						}
					}
				}
			};
		}
		#getSelectedGroupIndex() {
			const selectedGroupIndex = this.#industries.findIndex(industry => {
				return this.#isSelectedIndustry(industry);
			});
			return selectedGroupIndex > -1 ? selectedGroupIndex : 0;
		}
		#isSelectedIndustry(industry) {
			const items = this.#getItemsData();
			const selectedItem = items.find(item => {
				return item.id === this.#selectedRoleCode;
			});
			return selectedItem?.groupIds.includes(industry.code) || false;
		}
		#isRoleInFavouriteList(roleCode) {
			return this.#favouriteRoles.some(role => {
				return role.code === roleCode;
			});
		}
		async #toggleRoleFavourite(roleCode, makeFavourite) {
			const role = roleCode === this.#universalRole.code ? this.#universalRole : this.#roles.find(currentRole => currentRole.code === roleCode);
			if (!role && roleCode !== this.#universalRole.code) {
				const failedMessage = makeFavourite ? main_core.Loc.getMessage('AI_COPILOT_ROLES_ADD_TO_FAVOURITE_ACTION_FAILED') : main_core.Loc.getMessage('AI_COPILOT_ROLES_REMOVE_FROM_FAVOURITE_ACTION_FAILED');
				ui_notification.UI.Notification.Center.notify({
					content: failedMessage
				});
				return Promise.reject();
			}
			if (makeFavourite) {
				return this.#addRoleToFavouriteList(role.code, role.name);
			}
			return this.#removeRoleFromFavouriteList(role.code, role.name);
		}
		async #addRoleToFavouriteList(roleCode, roleName) {
			return this.#engine.addRoleToFavouriteList(roleCode).then(res => {
				this.#favouriteRoles = res.data.items;
				this.#entityCatalog.setItems(this.#getItemsData());
				this.#entityCatalog.setGroups(this.#getItemGroupsFromIndustries());
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('AI_COPILOT_ROLES_ADD_TO_FAVOURITE_NOTIFICATION_SUCCESS', {
						'#ROLE#': main_core.Text.encode(roleName)
					})
				});
			}).catch(err => {
				console.error(err);
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('AI_COPILOT_ROLES_ADD_TO_FAVOURITE_ACTION_FAILED')
				});
			});
		}
		async #removeRoleFromFavouriteList(roleCode, roleName) {
			return this.#engine.removeRoleFromFavouriteList(roleCode).then(res => {
				this.#favouriteRoles = res.data.items;
				this.#entityCatalog.setItems(this.#getItemsData());
				this.#entityCatalog.setGroups(this.#getItemGroupsFromIndustries());
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('AI_COPILOT_ROLES_REMOVE_FROM_FAVOURITE_NOTIFICATION_SUCCESS', {
						'#ROLE#': main_core.Text.encode(roleName)
					})
				});
			}).catch(err => {
				console.error(err);
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('AI_COPILOT_ROLES_REMOVE_FROM_FAVOURITE_ACTION_FAILED')
				});
			});
		}
	}

	exports.RolesDialog = RolesDialog;
	exports.RolesDialogEvents = RolesDialogEvents;

})(this.BX.AI = this.BX.AI || {}, BX.AI, BX, BX.Event, BX.UI.Notification, BX.Main, BX.UI.IconSet, BX.Vue3.Components, BX.Vue3.Pinia, BX.UI.IconSet, BX.UI);
//# sourceMappingURL=roles-dialog.bundle.js.map
