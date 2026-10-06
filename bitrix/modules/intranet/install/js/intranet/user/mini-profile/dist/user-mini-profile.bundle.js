/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_core_cache, main_core_events, main_popup, ui_vue3, ui_iconSet_api_vue, ui_vue3_components_button, ui_iconSet_outline, ui_iconSet_solid, ui_vue3_components_avatar, humanresources_companyStructure_public, ui_vue3_components_menu, ui_vue3_components_richMenu, ui_vue3_directives_hint, ui_iconSet_api_core, main_date, ui_notification) {
	'use strict';

	class Backend {
		static load(userId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('intranet.user.miniProfile.load', {
					data: {
						userId
					}
				}).then(result => {
					resolve(result.data);
				}).catch(result => {
					reject(result.errors[0]?.code ?? null);
				});
			});
		}
	}

	const InitialParamDict = {
		RightSideExpand: 'right-side-expand'
	};
	const prefix = 'intranet-user-mini-profile';
	class InitialParamService {
		// eslint-disable-next-line flowtype/require-return-type
		static getValue(type) {
			const key = this.#getKeyByType(type);
			return localStorage.getItem(key);
		}
		static save(type, value) {
			const key = this.#getKeyByType(type);
			if (!Object.values(InitialParamDict).includes(type)) {
				return;
			}
			localStorage.setItem(key, value);
		}
		static #getKeyByType(type) {
			return prefix + type;
		}
	}

	// @vue/component
	const Divider = {
		name: 'UserMiniProfileDivider',
		props: {
			isVertical: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<div 
			class="intranet-user-mini-profile__divider"
			:class="isVertical ? '--vertical' : '--horizontal'"
		>
			<div class="intranet-user-mini-profile__divider-inner"></div>
		</div>
	`
	};

	const ErrorStateSettingByType = {
		default: {
			class: '--default',
			title: main_core.Loc.getMessage('INTRANET_USER_MINI_ERROR_STATE_TITLE'),
			description: main_core.Loc.getMessage('INTRANET_USER_MINI_ERROR_STATE_DESCRIPTION')
		},
		'access-denied': {
			class: '--access-denied',
			title: main_core.Loc.getMessage('INTRANET_USER_MINI_ERROR_STATE_ACCESS_DENIED_TITLE'),
			description: main_core.Loc.getMessage('INTRANET_USER_MINI_ERROR_STATE_ACCESS_DENIED_DESCRIPTION')
		}
	};
	const ErrorStateDict = Object.freeze({
		AccessDenied: 'access-denied',
		Default: 'default'
	});

	// @vue/component
	const ErrorState = {
		name: 'ErrorState',
		props: {
			type: {
				/** @type ErrorStateType */
				type: String,
				default: ErrorStateDict.Default,
				validator: value => {
					return Object.values(ErrorStateDict).includes(value);
				}
			}
		},
		computed: {
			setting() {
				return ErrorStateSettingByType[this.type] ?? null;
			}
		},
		template: `
		<div 
			class="intranet-user-mini-profile__error-state"
			:class="setting?.class"
		>
			<div class="intranet-user-mini-profile__error-state-content">
				<div class="intranet-user-mini-profile__error-state__icon"></div>
				<div class="intranet-user-mini-profile__error-state__title">
					{{ setting?.title }}
				</div>
				<div class="intranet-user-mini-profile__error-state__description">
					{{ setting?.description }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserMiniProfileLoader = {
		name: 'UserMiniProfileLoader',
		props: {
			isShort: {
				type: Boolean,
				default: false
			}
		},
		template: `
		<div class="intranet-user-mini-profile-loader" :class="{ '--short': isShort }"></div>
	`
	};

	// @vue/component
	const LoaderTransition = {
		name: 'LoaderTransition',
		components: {
			UserMiniProfileLoader
		},
		props: {
			isLoading: {
				type: Boolean,
				required: true
			},
			isShowContent: {
				type: Boolean,
				required: true
			},
			isLoaderShort: {
				type: Boolean,
				default: false
			}
		},
		emits: ['end'],
		methods: {
			resetSize() {
				main_core.Dom.style(this.$el, {
					width: '',
					height: ''
				});
			},
			onEnd() {
				this.resetSize();
				this.$emit('end');
			},
			onEnter(el) {
				requestAnimationFrame(() => {
					main_core.Dom.style(this.$el, {
						width: `${el.offsetWidth}px`,
						height: `${el.offsetHeight}px`
					});
				});
			},
			onBeforeLeave(el) {
				main_core.Dom.style(this.$el, {
					width: `${el.offsetWidth}px`,
					height: `${el.offsetHeight}px`
				});
			},
			onAfterLeave() {
				this.onEnd();
			},
			onAfterEnter() {
				this.onEnd();
			}
		},
		template: `
		<TransitionGroup 
			name="intranet-user-mini-profile-fade"
			tag="div"
			class="intranet-user-mini-profile__loader-transition-wrapper"
		>
			<div v-if="isLoading"
								 class="intranet-user-mini-profile__loader-transition-wrapper__loader"
				 key="loader"
			>
				<UserMiniProfileLoader
					 :isShort="isLoaderShort"
				/>
			</div>
			<slot v-else-if="isShowContent"></slot>
		</TransitionGroup>
	`
	};

	const ButtonMixin = {
		components: {
			Button: ui_vue3_components_button.Button
		},
		computed: {
			buttonSize: () => ui_vue3_components_button.ButtonSize,
			buttonStyle: () => ui_vue3_components_button.AirButtonStyle,
			buttonIcon: () => ui_vue3_components_button.ButtonIcon
		}
	};

	// @vue/mixin
	const IconSetMixin = {
		computed: {
			set: () => ui_iconSet_api_vue.Set,
			outlineSet: () => ui_iconSet_api_vue.Outline,
			solidSet: () => ui_iconSet_api_vue.Solid
		}
	};

	// @vue/mixin
	const LocMixin = {
		methods: {
			loc(code, replacements = null) {
				return main_core.Loc.getMessage(code, replacements);
			},
			locPlural(code, value, replacements = null) {
				return main_core.Loc.getMessagePlural(code, value, replacements);
			}
		}
	};

	// @vue/component
	const DepartmentConnector = {
		name: 'DepartmentConnector',
		props: {
			topBindElement: {
				type: HTMLElement,
				required: true
			},
			bottomBindElement: {
				type: HTMLElement,
				required: true
			},
			offsetLeft: {
				type: Number,
				default: 11
			}
		},
		computed: {
			top() {
				const {
					height
				} = this.topBindElement.getBoundingClientRect();
				const value = this.topBindElement.offsetTop + height;
				return `${value}px`;
			},
			left() {
				const value = this.topBindElement.offsetLeft + this.offsetLeft;
				return `${value}px`;
			},
			height() {
				const topElementBottom = this.topBindElement.offsetTop + this.topBindElement.offsetHeight;
				const bottomElementCenter = this.bottomBindElement.offsetTop + this.bottomBindElement.offsetHeight / 2;
				return Math.round(bottomElementCenter - topElementBottom);
			},
			pathD() {
				const height = this.height;
				const d = ['M 1 0', `V ${height - 5}`, `C 1 ${height - 3}.2091 2.7909 ${height - 1} 5 ${height - 1}`, 'H 9'];
				return d.join('');
			},
			viewBox() {
				return `0 0 9 ${this.height}`;
			}
		},
		template: `
		<div class="intranet-user-mini-profile__structure-view-connector" 
			 :style="{ 'top': top, 'left': left }"
		>
			<svg width="9" :height="height" :viewBox="viewBox" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path :d="pathD" stroke="#F0F0F0"/>
			</svg>
		</div>
	`
	};

	class OpenActionService {
		static openStructureNodeId(nodeId) {
			humanresources_companyStructure_public.Structure?.open({
				focusNodeId: nodeId
			});
		}
		static openUserProfile(url) {
			if (!main_core.Type.isStringFilled(url)) {
				return;
			}
			BX.SidePanel.Instance.open(url);
		}
	}

	// @vue/component
	const DepartmentBlock = {
		name: 'DepartmentBlock',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Avatar: ui_vue3_components_avatar.Avatar
		},
		mixins: [LocMixin, IconSetMixin],
		props: {
			nodeId: {
				type: Number,
				required: true
			},
			highlighted: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				required: true
			},
			employeeCount: {
				type: Number,
				required: true
			},
			user: {
				/** @type UserData | null */
				type: [Object, null],
				default: () => {}
			},
			head: {
				/** @type UserData | null */
				type: [Object, null],
				default: () => {}
			}
		},
		computed: {
			employeeCountTitle() {
				const {
					employeeCount
				} = this;
				return this.locPlural('INTRANET_USER_MINI_PROFILE_EMPLOYEES_COUNT', employeeCount, {
					'#COUNT#': employeeCount
				});
			},
			isShowHead() {
				const {
					head,
					user
				} = this;
				return head && head.id !== user?.id;
			}
		},
		methods: {
			onTitleClick() {
				OpenActionService.openStructureNodeId(this.nodeId);
			},
			onUserClick(user) {
				OpenActionService.openUserProfile(user.url);
			}
		},
		template: `
		<div 
			class="intranet-user-mini-profile__structure-view-department-block"
			:class="{'--highlighted': highlighted }"
			data-test-id="usermp_department-block"
		>
			<div class="intranet-user-mini-profile__structure-view-department-block__title"
				 :title="title"
				 data-test-id="usermp_department-title"
				 @click="onTitleClick"
			>
				<span>{{ title }}</span>
				<div class="intranet-user-mini-profile__structure-view-department-block__title-chevron">
					<div class="intranet-user-mini-profile__structure-view-department-block__title-chevron-icon">
						<BIcon
							:name="outlineSet.CHEVRON_RIGHT_S"
							:size="20"
						/>
					</div>
				</div>
			</div>
			<div class="intranet-user-mini-profile__structure-view-department-block__employee-count" data-test-id="usermp_employee-count">
				{{ employeeCountTitle }}
			</div>
			<div v-if="user"
				class="intranet-user-mini-profile__structure-view-department-block__user"
				data-test-id="usermp_department-user"
				@click="onUserClick(user)"
			>
				<div class="intranet-user-mini-profile__structure-view-department-block__user-avatar">
					<Avatar :options="{ 
						picPath: user.avatar ? encodeURI(user.avatar) : undefined,
						size: 28, 
						title: user.name 
					}"/>
				</div>
				<div class="intranet-user-mini-profile__structure-view-department-block__user-info">
					<div 
						class="intranet-user-mini-profile__structure-view-department-block__user-info__name"
						:title="user.name"
						data-test-id="usermp_department-user-name"
					>
						{{ user.name }}
					</div>
					<div v-if="user.workPosition"
						class="intranet-user-mini-profile__structure-view-department-block__user-info__position"
						:title="user.workPosition"
						data-test-id="usermp_department-user-position"
					>
						{{ user.workPosition }}
					</div>
				</div>
			</div>
			<div v-if="isShowHead" 
				class="intranet-user-mini-profile__structure-view-department-block__head"
				data-test-id="usermp_department-head-section"
			>
				<div class="intranet-user-mini-profile__structure-view-department-block__head-title" data-test-id="usermp_department-head-title">
					{{ loc('INTRANET_USER_MINI_DETAILED_INFO_HEAD') }}
				</div>
				<div
					class="intranet-user-mini-profile__structure-view-department-block__head-info"
					data-test-id="usermp_department-head"
					@click="onUserClick(head)"
				>
					<div
						class="intranet-user-mini-profile__structure-view-department-block__head-info__avatar"
						data-test-id="usermp_department-head-avatar"
					>
						<Avatar :options="{ picPath: head.avatar, size: 20, title: head.name }"/>
					</div>
					<div
						class="intranet-user-mini-profile__structure-view-department-block__head-info__name"
						:title="head.name"
						data-test-id="usermp_department-head-name"
					>
						{{ head.name }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const LockedDepartmentBlock = {
		name: 'LockedDepartmentBlock',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [IconSetMixin],
		template: `
		<div 
			class="intranet-user-mini-profile__structure-view-department-block --locked"
		>
			<div class="intranet-user-mini-profile__structure-view-department-block-lock">
				<BIcon 
					:size="30" 
					:name="outlineSet.LOCK_L"
				/>
			</div>
		</div>
	`
	};

	const DepartmentSpacer = {
		name: 'DepartmentSpacer',
		props: {
			value: {
				type: Number,
				required: true
			},
			isVertical: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			style() {
				const value = `${this.value}px`;
				if (!this.isVertical) {
					return {
						width: value,
						minWidth: value
					};
				}
				return {
					height: value,
					minHeight: value
				};
			}
		},
		template: `
		<div :style="style"/>
	`
	};

	const LockedDepartment = 'locked-department';

	// @vue/component
	const StructureView = {
		name: 'StructureView',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DepartmentBlock,
			LockedDepartmentBlock,
			DepartmentConnector,
			DepartmentSpacer
		},
		mixins: [LocMixin, IconSetMixin],
		props: {
			title: {
				type: String,
				default: ''
			},
			branch: {
				/** @type BranchProp */
				type: Array,
				required: true
			},
			headDictionary: {
				/** @type HeadDictionary */
				type: Object,
				required: true
			},
			userDepartmentId: {
				type: Number,
				default: null
			},
			user: {
				/** @type UserData | null */
				type: Object,
				default: null
			}
		},
		data() {
			return {
				blocks: [],
				connectorBindElementPairs: []
			};
		},
		computed: {
			LockedDepartment: () => LockedDepartment
		},
		mounted() {
			this.$nextTick(() => {
				this.makeConnectors();
			});
		},
		methods: {
			makeConnectors() {
				this.connectorBindElementPairs = [];
				const connectorCount = this.blocks.length - 2;
				for (let i = 0; i <= connectorCount; ++i) {
					const topBlock = this.blocks[i].$el;
					const bottomBlock = this.blocks[i + 1].$el;
					this.connectorBindElementPairs.push([topBlock, bottomBlock]);
				}
			},
			getHeadForDepartment(department) {
				const {
					id: departmentId
				} = department;
				if (departmentId !== this.userDepartmentId) {
					return null;
				}
				const {
					headIds
				} = department;
				const userIsHead = headIds.includes(this.user.id);
				if (userIsHead) {
					return null;
				}
				const firstHeadId = headIds[0];
				if (!firstHeadId) {
					return null;
				}
				return this.headDictionary[firstHeadId] ?? null;
			},
			getUserForDepartment(department) {
				const {
					id: departmentId
				} = department;
				if (departmentId === this.userDepartmentId) {
					return this.user;
				}
				const {
					headIds
				} = department;
				const firstHeadId = headIds[0];
				if (!firstHeadId) {
					return null;
				}
				return this.headDictionary[firstHeadId] ?? null;
			}
		},
		template: `
		<div class="intranet-user-mini-profile__structure-view" data-test-id="usermp_structure-view">
			<div class="intranet-user-mini-profile__structure-view__title" data-test-id="usermp_structure-title">
				<div class="intranet-user-mini-profile__structure-view__title-icon" data-test-id="usermp_structure-title-icon">
					<BIcon :name="outlineSet.COMPANY" :size="18"/>
				</div>
				<span data-test-id="usermp_structure-title-text">{{ title }}</span>
			</div>
			<div class="intranet-user-mini-profile__structure-view__preview" v-if="branch.length" data-test-id="usermp_structure-preview">
				<div v-for="(department, index) in branch"
					 class="intranet-user-mini-profile__structure-view__preview-row"
					 data-test-id="usermp_structure-department-row"
				>
					<DepartmentSpacer :value="index * 20"/>
					<template v-if="department === LockedDepartment">
						<LockedDepartmentBlock
							:ref="el => { blocks[index] = el}"
							data-test-id="usermp_locked-department-block"
						/>
					</template>
					<template v-else>
						<DepartmentBlock
							:ref="el => { blocks[index] = el}"
							:key="'department-' + department.id"
							:title="department.title"
							:nodeId="department.id"
							:employee-count="department.employeeCount"
							:user="getUserForDepartment(department)"
							:head="getHeadForDepartment(department)"
							:highlighted="department.id === userDepartmentId"
							data-test-id="usermp_department-block"
						/>
					</template>
				</div>
				<template
					v-for="elementPair in connectorBindElementPairs"
				>
					<DepartmentConnector
						:topBindElement="elementPair[0]"
						:bottomBindElement="elementPair[1]"
						:offsetLeft="11"
						data-test-id="usermp_department-connector"
					/>
				</template>
			</div>
		</div>
	`
	};

	const StructureViewListAnimation = Object.freeze({
		next: 'intranet-user-mini-profile-structure-view-carousel-next',
		prev: 'intranet-user-mini-profile-structure-view-carousel-prev'
	});
	const maxElementsInBranch = 3;

	// @vue/component
	const StructureViewList = {
		name: 'StructureViewList',
		components: {
			StructureView,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [IconSetMixin, ButtonMixin],
		props: {
			structure: {
				/** @type StructureType */
				type: Object,
				required: true
			},
			user: {
				/** @type UserData */
				type: Object,
				required: true
			}
		},
		data() {
			return {
				index: 0,
				animationName: '',
				isTransitionInProgress: false
			};
		},
		computed: {
			isPrevDisabled() {
				return this.isTransitionInProgress || this.index === 0;
			},
			isNextDisabled() {
				return this.isTransitionInProgress || this.index >= this.structure.userDepartmentIds.length - 1;
			},
			hasManyUserDepartments() {
				return this.structure.userDepartmentIds.length > 1;
			},
			maxBranchHeight() {
				let result = 0;
				for (const departmentId of this.structure.userDepartmentIds) {
					const departmentBranchHeight = this.makeDepartmentBranch(departmentId).length;
					if (departmentBranchHeight === maxElementsInBranch) {
						return maxElementsInBranch;
					}
					result = Math.max(result, departmentBranchHeight);
				}
				return result;
			},
			missingMaxDepartmentCount() {
				return maxElementsInBranch - this.maxBranchHeight;
			}
		},
		methods: {
			makeDepartmentBranch(departmentId) {
				const {
					departmentDictionary
				} = this.structure;
				const department = departmentDictionary[departmentId];
				if (!department) {
					return [];
				}
				const branch = [];
				let node = department;
				while (node && branch.length < maxElementsInBranch) {
					branch.push(node);
					if (node.parentId === null) {
						break;
					}
					node = departmentDictionary[node.parentId];
				}
				if (branch.length < maxElementsInBranch && branch[branch.length - 1].parentId !== 0) {
					branch.push(LockedDepartment);
				}
				return branch.reverse();
			},
			next() {
				if (this.isNextDisabled) {
					return;
				}
				this.animationName = StructureViewListAnimation.next;
				this.index += 1;
			},
			prev() {
				if (this.isPrevDisabled) {
					return;
				}
				this.animationName = StructureViewListAnimation.prev;
				this.index -= 1;
			}
		},
		template: `
		<div class="intranet-user-mini-profile__structure-view-list" data-test-id="usermp_structure-view-list">
			<div
				class="intranet-user-mini-profile__structure-view-list__preview-zone"
				:class="{ '--one-branch': !hasManyUserDepartments }"
				:style="{ '--missing-max-department-count': missingMaxDepartmentCount }"
				data-test-id="usermp_structure-preview-zone"
			>
				<TransitionGroup 
					type="transition" 
					:name="animationName"
					@beforeEnter="isTransitionInProgress = true"
					@afterLeave="isTransitionInProgress = false"
				>
					<template v-for="(departmentId, index) in structure.userDepartmentIds">
						<StructureView
							style="height: 100%;"
							v-if="index === this.index"
							:title="structure.title"
							:branch="makeDepartmentBranch(departmentId)"
							:key="departmentId"
							:userDepartmentId="departmentId"
							:headDictionary="structure.headDictionary"
							:user="user"
							data-test-id="usermp_structure-view"
						/>
					</template>
				</TransitionGroup>
			</div>
			<div v-if="hasManyUserDepartments"
				class="intranet-user-mini-profile__structure-view-control"
				data-test-id="usermp_structure-view-control"
			>
				<Button 
					:leftIcon="buttonIcon.CHEVRON_LEFT_S"
					:style="buttonStyle.PLAIN_NO_ACCENT"
					:size="buttonSize.EXTRA_SMALL"
					:removeRightCorners="true"
					:disabled="isPrevDisabled"
					@click="prev"
				/>
				<Button 
					:leftIcon="buttonIcon.CHEVRON_RIGHT_S"
					:style="buttonStyle.PLAIN_NO_ACCENT"
					:size="buttonSize.EXTRA_SMALL"
					:removeLeftCorners="true"
					:disabled="isNextDisabled"
					@click="next"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const CollapseTransition = {
		name: 'CollapseTransition',
		props: {
			initialHeight: {
				type: Number,
				default: 0
			}
		},
		emits: ['start', 'end'],
		created() {
			if (!this.$slots.default) {
				throw new Error('Slot is required');
			}
		},
		methods: {
			onEnter(el) {
				this.targetWidth = el.offsetWidth;
				this.targetHeight = Math.max(el.offsetHeight, this.initialHeight);
				const fromHeight = Math.min(el.offsetHeight, this.initialHeight);
				main_core.Dom.style(el, {
					width: 0,
					height: `${fromHeight}px`
				});
				requestAnimationFrame(() => {
					main_core.Dom.style(el, {
						width: `${this.targetWidth}px`,
						height: `${this.targetHeight}px`
					});
				});
			},
			onBeforeLeave(el) {
				const minHeight = Math.min(this.initialHeight, el.offsetHeight);
				main_core.Dom.style(el, {
					width: `${el.offsetWidth}px`,
					height: `${el.offsetHeight}px`
				});
				requestAnimationFrame(() => {
					main_core.Dom.style(el, {
						width: 0,
						height: `${minHeight}px`
					});
				});
				this.$emit('start');
			}
		},
		template: `
		<Transition
			name="intranet-user-mini-profile-collapse"
			@enter="onEnter"
			@beforeLeave="onBeforeLeave"
			@afterEnter="this.$emit('end')"
			@afterLeave="this.$emit('end')"
			@beforeEnter="this.$emit('start')"
		>
			<slot></slot>
		</Transition>
	`
	};

	class ChatService {
		static openMessenger(userId) {
			top.BX.Messenger.Public?.openChat(String(userId));
		}
		static call(userId, withVideo) {
			top.BX.Messenger.Public?.startVideoCall(String(userId), withVideo);
		}
		static isMessengerAvailable() {
			return Boolean(top.BX.Messenger.Public);
		}
	}

	const HelpArticleCode$1 = 'redirect=detail&code=17980386';
	function openHelper(event) {
		event.preventDefault();
		if (top.BX?.Helper) {
			top.BX.Helper.show(HelpArticleCode$1);
		}
	}
	function parseHintText() {
		const phrase = main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_FIRST_ADMIN_HINT');
		const parts = phrase.split('#HELP_LINK#');
		return {
			beforeText: parts[0] || null,
			linkText: parts[1] || null,
			afterText: parts[2] || null
		};
	}
	function createHintContent() {
		const hintText = parseHintText();
		const link = main_core.Tag.render`
		<a class="intranet-user-mini-profile__first-admin-badge_hint-link">${hintText.linkText}</a>
	`;
		main_core.Event.bind(link, 'click', openHelper);
		return main_core.Tag.render`
		<div class="intranet-user-mini-profile__first-admin-badge_hint-content">
			<div class="intranet-user-mini-profile__first-admin-badge_hint-content_hint-block">
				<span>${hintText.beforeText}</span>
				<span>${link}</span>
				<span>${hintText.afterText}</span>
			</div>
		</div>
	`;
	}
	function getFirstAdminHintParams() {
		return {
			interactivity: true,
			popupOptions: {
				id: `${PopupPrefixId}first-admin-hint-${main_core.Text.getRandom()}`,
				className: 'intranet-user-mini-profile__first-admin-badge_hint',
				darkMode: false,
				offsetTop: 2,
				background: 'var(--ui-color-bg-content-inapp)',
				padding: 6,
				angle: true,
				targetContainer: document.body,
				offsetLeft: 20,
				cacheable: false,
				content: createHintContent()
			}
		};
	}

	// @vue/component
	const FirstAdminBadge = {
		name: 'FirstAdminBadge',
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [LocMixin, IconSetMixin],
		methods: {
			getHintParams() {
				return getFirstAdminHintParams();
			}
		},
		template: `
		<div
			class="intranet-user-mini-profile__first-admin-badge"
			data-test-id="usermp_first_admin"
			v-hint="getHintParams"
		>
			<div
				class="intranet-user-mini-profile__first-admin-badge_icon"
				data-test-id="usermp_first-admin-title-icon"
			>
				<BIcon :name="solidSet.CROWN_1" :size="20"/>
			</div>
			<div class="intranet-user-mini-profile__first-admin-badge_title">
				{{ loc('INTRANET_USER_MINI_PROFILE_ROLE_FIRST_ADMIN') }}
			</div>
		</div>
	`
	};

	const MiniProfileDirection = Object.freeze({
		Viewport: 'viewport'
	});
	const UserRole$1 = Object.freeze({
		FirstAdmin: 'firstAdmin',
		Admin: 'admin',
		Employee: 'employee',
		Integrator: 'integrator',
		Collaber: 'collaber',
		Extranet: 'extranet',
		Visitor: 'visitor',
		Email: 'email',
		Shop: 'shop',
		External: 'external'
	});
	const UserStatus = Object.freeze({
		Online: 'online',
		Offline: 'offline',
		DoNotDisturb: 'dnd',
		Vacation: 'vacation',
		Fired: 'fired'
	});
	const UserStatusToShow = Object.freeze({
		Vacation: UserStatus.Vacation
	});

	const UserRoleTitleByCode = {
		[UserRole$1.Shop]: main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_SHOP'),
		[UserRole$1.Email]: main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_EMAIL'),
		[UserRole$1.Integrator]: main_core.Extension.getSettings('intranet.user.mini-profile')?.isRenamedIntegrator === 'Y' ? main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_INTEGRATOR_RENAMED') : main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_INTEGRATOR'),
		[UserRole$1.Visitor]: main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ROLE_VISITOR')
	};

	// @vue/component
	const UserRole = {
		name: 'UserRole',
		mixins: [LocMixin],
		props: {
			role: {
				type: [String, null],
				required: true
			}
		},
		computed: {
			title() {
				if (!this.role) {
					return null;
				}
				return UserRoleTitleByCode[this.role] ?? null;
			}
		},
		template: `
		<div v-if="title"
			class="intranet-user-mini-profile__role"
			data-test-id="usermp_role-title"
		>
			<div class="intranet-user-mini-profile__role-inner-text">
				{{ title }}
			</div>
		</div>
	`
	};

	const IconSettingByStatus = {
		vacation: {
			iconName: ui_iconSet_api_core.Outline.EARTH_WITH_TREE,
			colorVar: '--ui-color-accent-extra-aqua'
		}
	};

	class StatusService {
		static isSupportedToShow(statusCode) {
			return Object.values(UserStatusToShow).includes(statusCode);
		}
		static isSupported(statusCode) {
			return Object.values(UserStatus).includes(statusCode);
		}
		static getFailoverStatus() {
			return UserStatus.Offline;
		}
	}

	// @vue/component
	const UserStatusIcon = {
		name: 'UserStatusIcon',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [IconSetMixin],
		props: {
			status: {
				/** @type UserStatusCodeType */
				type: String,
				default: 'offline'
			}
		},
		computed: {
			iconSetting() {
				if (!main_core.Type.isStringFilled(this.status) || !StatusService.isSupportedToShow(this.status)) {
					return null;
				}
				return IconSettingByStatus[this.status] ?? null;
			}
		},
		template: `
		<div v-if="iconSetting"
			class="intranet-user-mini-profile__user-status" 
			:style="{ '--ui-icon-set__icon-color': 'var(' + iconSetting.colorVar + ')' }"
			data-test-id="usermp_status-icon"
		>
			<BIcon
				:size="24"
				:name="iconSetting.iconName"
			/>
		</div>
	`
	};

	const StaticDescriptionByStatus = {
		online: main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_USER_STATUS_ONLINE'),
		dnd: main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_USER_STATUS_DND'),
		fired: main_core.Loc.getMessage('INTRANET_USER_MINI_PROFILE_USER_STATUS_FIRED')
	};

	const PERSONAL_GENDER_FEMALE_MARKER = 'F';

	// @vue/component
	const UserStatusDescription = {
		name: 'UserStatusDescription',
		mixins: [LocMixin],
		props: {
			personalGender: {
				type: [String, null],
				default: null,
				required: false
			},
			status: {
				/** @type UserStatusType */
				type: Object,
				required: true
			}
		},
		computed: {
			text() {
				let {
					code
				} = this.status;
				if (!main_core.Type.isStringFilled(code)) {
					return '';
				}
				if (!StatusService.isSupported(code)) {
					code = StatusService.getFailoverStatus();
				}
				const staticText = StaticDescriptionByStatus[code] ?? null;
				if (staticText) {
					return staticText;
				}
				if (code === UserStatus.Offline) {
					return this.formatTextForOfflineStatus({
						...this.status,
						code
					});
				}
				if (code === UserStatus.Vacation) {
					return this.formatTextForVacationStatus({
						...this.status,
						code
					});
				}
				return '';
			}
		},
		methods: {
			formatTextForOfflineStatus(status) {
				if (!main_core.Type.isNumber(status.lastSeenTs) || status.lastSeenTs === 0) {
					return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_OFFLINE');
				}
				const dayMonthFormat = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
				const shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const phraseCode = this.personalGender === PERSONAL_GENDER_FEMALE_MARKER ? 'INTRANET_USER_MINI_PROFILE_USER_STATUS_OFFLINE_LAST_SEEN_TEMPLATE_F' : 'INTRANET_USER_MINI_PROFILE_USER_STATUS_OFFLINE_LAST_SEEN_TEMPLATE';
				return this.loc(phraseCode, {
					'#DATE#': main_date.DateTimeFormat.format(dayMonthFormat, status.lastSeenTs),
					'#TIME#': main_date.DateTimeFormat.format(shortTimeFormat, status.lastSeenTs)
				});
			},
			formatTextForVacationStatus(status) {
				if (!main_core.Type.isNumber(status.vacationTs)) {
					return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_VACATION');
				}
				const dayMonthFormat = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
				return this.loc('INTRANET_USER_MINI_PROFILE_USER_STATUS_VACATION_TEMPLATE', {
					'#DATE#': main_date.DateTimeFormat.format(dayMonthFormat, status.vacationTs)
				});
			}
		},
		template: `
		<span v-if="text"
			class="intranet-user-mini-profile__user-status-description"
			data-test-id="usermp_status-description-text"
		>
			{{ text }}
		</span>
	`
	};

	// @vue/component
	const UserTime = {
		name: 'UserTime',
		mixins: [LocMixin],
		props: {
			utcOffset: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				date: new Date(),
				tickInterval: null
			};
		},
		computed: {
			formattedTime() {
				const date = this.date;
				const localOffset = date.getTimezoneOffset() * 60 * 1000;
				const targetOffset = this.utcOffset * 1000;
				const totalOffset = localOffset + targetOffset;
				date.setTime(date.getTime() + totalOffset);
				const sign = this.utcOffset >= 0 ? '+' : '-';
				const absOffset = Math.abs(this.utcOffset);
				const hours = Math.floor(absOffset / 3600);
				const minutes = Math.floor(absOffset % 3600 / 60);
				const timezoneParts = [this.loc('INTRANET_USER_MINI_PROFILE_USER_TZ_TEMPLATE', {
					'#VALUE#': `${sign}${hours.toString()}`
				})];
				if (minutes > 0) {
					timezoneParts.push(`:${minutes.toString().padStart(2, 0)}`);
				}
				return `${timezoneParts.join('')} (${this.formatDate(date)})`;
			}
		},
		created() {
			this.tickInterval = setInterval(() => {
				this.date = new Date();
			}, 1000);
		},
		unmounted() {
			clearInterval(this.tickInterval);
		},
		methods: {
			formatDate(date) {
				const template = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				return main_date.DateTimeFormat.format(template, date);
			}
		},
		template: `
		<span class="intranet-user-mini-profile__user-time" data-test-id="usermp_user-time-display">
			{{ formattedTime }}
		</span>
	`
	};

	const UserAvatarTypeByRole = Object.freeze({
		[UserRole$1.Collaber]: 'round-guest',
		[UserRole$1.Extranet]: 'round-extranet',
		[UserRole$1.Employee]: 'round'
	});

	// @vue/component
	const UserBaseInfo = {
		name: 'UserBaseInfo',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UserRole,
			UserStatusIcon,
			UserStatusDescription,
			RichMenuPopup: ui_vue3_components_richMenu.RichMenuPopup,
			UserTime,
			Avatar: ui_vue3_components_avatar.Avatar,
			BMenu: ui_vue3_components_menu.BMenu,
			FirstAdminBadge
		},
		mixins: [LocMixin, IconSetMixin],
		props: {
			isShowExpand: {
				type: Boolean,
				default: false
			},
			isExpanded: {
				type: Boolean,
				required: true
			},
			userId: {
				type: Number,
				required: true
			},
			info: {
				/** @type UserMiniProfileData['baseInfo'] */
				type: Object,
				required: true
			},
			canChat: {
				type: Boolean,
				default: false
			}
		},
		emits: ['expand'],
		data() {
			return {
				isShowCallMenu: false
			};
		},
		computed: {
			callMenuPopupOptions() {
				return {
					id: `${PopupPrefixId}call-menu`,
					autoHide: true,
					bindElement: this.$refs.callActionMenu,
					bindOptions: {
						forceBindPosition: true
					},
					minWidth: 190,
					width: 190,
					items: [{
						title: this.loc('INTRANET_USER_MINI_PROFILE_ACTION_CALL_WITH_VIDEO'),
						icon: this.outlineSet.RECORD_VIDEO,
						onClick: () => this.onCallMenuItemClick()
					}, {
						title: this.loc('INTRANET_USER_MINI_PROFILE_ACTION_CALL'),
						icon: this.outlineSet.HEADSET,
						onClick: () => this.onCallMenuItemClick(false)
					}]
				};
			},
			shouldShowStatus() {
				return Boolean(this.info.status) && !this.info.isSystemUser;
			},
			shouldShowUserTime() {
				return this.shouldShowStatus && [UserStatus.Online, UserStatus.DoNotDisturb].includes(this.info.status.code);
			},
			shouldShowMessengerActionButtons() {
				return ChatService.isMessengerAvailable() && this.canChat;
			},
			shouldShowFirstAdminBadge() {
				return this.info.role === UserRole$1.FirstAdmin;
			},
			shouldShowCallAction() {
				return this.info.isSystemUser !== true;
			},
			currentUserId() {
				return Number(this.loc('USER_ID'));
			},
			isOwnProfile() {
				return this.userId === this.currentUserId;
			},
			avatarType() {
				return UserAvatarTypeByRole[this.info.role] ?? 'round';
			}
		},
		methods: {
			openChat() {
				ChatService.openMessenger(this.userId);
			},
			openNotes() {
				ChatService.openMessenger(this.currentUserId);
			},
			call(withVideo = true) {
				ChatService.call(this.userId, withVideo);
			},
			onCallMenuItemClick(withVideo = true) {
				this.isShowCallMenu = false;
				this.call(withVideo);
			},
			openProfile() {
				OpenActionService.openUserProfile(this.info.url);
			}
		},
		template: `
		<div class="intranet-user-mini-profile__base-info">
			<div class="intranet-user-mini-profile__base-info__user">
				<div class="intranet-user-mini-profile__base-info__user-avatar-wrapper">
					<div
						class="intranet-user-mini-profile__base-info__user-avatar"
						data-test-id="usermp_avatar"
						@click="openProfile"
					>
						<Avatar 
							:type="avatarType"
							:options="{
								userName: info.name,
								size: 72,
								title: info.name,
								picPath: info.avatar ? encodeURI(info.avatar) : undefined,
							}"
						/>
					</div>
					<UserStatusIcon v-if="shouldShowStatus"
						:status="info.status.code"
						data-test-id="usermp_status"
					/>
				</div>
				<div class="intranet-user-mini-profile__base-info__user-data">
					<div class="intranet-user-mini-profile__base-info__user-data__name"
						:title="info.name"
						data-test-id="usermp_name"
						@click="openProfile"
					>
						{{ info.name }}
					</div>
					<div class="intranet-user-mini-profile__base-info__user-data__position"
						:title="info.workPosition"
						data-test-id="usermp_position"
					>
						{{ info.workPosition }}
					</div>
					<FirstAdminBadge v-if="shouldShowFirstAdminBadge"/>
					<div class="intranet-user-mini-profile__base-info__user-data__status">
						<UserStatusDescription v-if="shouldShowStatus"
							:personalGender="info.personalGender"
							:status="info.status"
							data-test-id="usermp_status-description"
						/>
						<UserTime v-if="shouldShowUserTime" 
							:utcOffset="info.utcOffset"
							data-test-id="usermp_user-time"
						/>
					</div>
				</div>
			</div>
			<div v-if="shouldShowMessengerActionButtons"
				class="intranet-user-mini-profile__base-info__actions"
			>
				<template v-if="isOwnProfile">
					<div class="intranet-user-mini-profile__base-info__action">
						<button
							class="ui-btn ui-btn-sm ui-btn-no-caps --air --wide --style-outline-accent-2"
							data-test-id="usermp_notes-button"
							@click="openNotes"
						>
							<span class="ui-btn-text">
								{{ loc('INTRANET_USER_MINI_PROFILE_ACTION_NOTES') }}
							</span>
						</button>
					</div>
				</template>
				<template v-else>
					<div class="intranet-user-mini-profile__base-info__action">
						<button
							class="ui-btn ui-btn-sm ui-btn-no-caps --air --wide --style-outline-accent-2"
							data-test-id="usermp_chat-button"
							@click="openChat"
						>
							<span class="ui-btn-text">
								{{ loc('INTRANET_USER_MINI_PROFILE_ACTION_CHAT') }}
							</span>
						</button>
					</div>
					<div v-if="shouldShowCallAction"
						class="intranet-user-mini-profile__base-info__action"
					>
						<div class="ui-btn-split --air ui-btn-sm --style-filled ui-btn-no-caps">
							<button
								class="ui-btn-main --air"
								data-test-id="usermp_call-video-button"
								@click="call()"
							>
								<span class="ui-btn-text">
									{{ loc('INTRANET_USER_MINI_PROFILE_ACTION_CALL_WITH_VIDEO') }}
								</span>
							</button>
							<button
								ref="callActionMenu"
								class="ui-btn-menu"
								data-test-id="usermp_call-menu-button"
								@click="isShowCallMenu = !isShowCallMenu"
							>
								<BMenu v-if="isShowCallMenu"
									:options="callMenuPopupOptions"
									@close="isShowCallMenu = false"
								/>
							</button>
						</div>
					</div>
				</template>
			</div>
			<div v-if="isShowExpand"
				class="intranet-user-mini-profile__expand"
				data-test-id="usermp_expand-button"
				@click="() => $emit('expand')"
			>
				<BIcon :name="!isExpanded ? outlineSet.OPEN_CHAT : outlineSet.CLOSE_CHAT"/>
			</div>
			<div class="intranet-user-mini-profile__base-info__role">
				<UserRole 
					:role="info.role"
					data-test-id="usermp_role"
				/>
			</div>
		</div>
	`
	};

	const HelpArticleCode = 'redirect=detail&code=28659338';

	// @vue/component
	const SystemUserBadge = {
		name: 'SystemUserBadge',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		mixins: [LocMixin, IconSetMixin],
		methods: {
			openHelp() {
				if (top.BX?.Helper) {
					top.BX.Helper.show(HelpArticleCode);
				}
			}
		},
		template: `
		<div
			class="intranet-user-mini-profile__system-user-badge"
			data-test-id="usermp_system_user"
			role="button"
			tabindex="0"
			@click="openHelp"
			@keydown.enter.prevent="openHelp"
			@keydown.space.prevent="openHelp"
		>
			<span class="intranet-user-mini-profile__system-user-badge_title">
				{{ loc('INTRANET_USER_MINI_PROFILE_ROLE_SYSTEM_USER') }}
			</span>
			<div
				class="intranet-user-mini-profile__system-user-badge_icon"
				data-test-id="usermp_system-user-title-icon"
			>
				<BIcon :name="outlineSet.INFO_CIRCLE" :size="16"/>
			</div>
		</div>
	`
	};

	const ContactItem = Object.freeze({
		Mail: 'mail',
		Phone: 'phone'
	});

	// @vue/component
	const UserDetailedInfoContactItemValue = {
		name: 'UserDetailedInfoContactItemValue',
		props: {
			type: {
				/** @type ContactItemType */
				type: String,
				required: true
			},
			value: {
				type: String,
				required: true
			}
		},
		computed: {
			href() {
				if (this.type === ContactItem.Mail) {
					return `mailto:${this.value}`;
				}
				return null;
			}
		},
		methods: {
			onClick(event) {
				if (this.type === ContactItem.Phone) {
					event.preventDefault();
					if (navigator.clipboard) {
						navigator.clipboard.writeText(this.value).then(() => {
							ui_notification.UI.Notification.Center.notify({
								content: this.$Bitrix.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ACTION_CLIPBOARD_COPY_PHONE_SUCCESS')
							});
						}).catch(() => {
							ui_notification.UI.Notification.Center.notify({
								content: this.$Bitrix.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ACTION_CLIPBOARD_COPY_PHONE_ERROR')
							});
						});
					} else {
						ui_notification.UI.Notification.Center.notify({
							content: this.$Bitrix.Loc.getMessage('INTRANET_USER_MINI_PROFILE_ACTION_CLIPBOARD_COPY_PHONE_ERROR')
						});
					}
				}
			}
		},
		template: `
		<a 
			class="intranet-user-mini-profile__detailed-info__contact-item-value"
			:href="href"
			target
			:data-test-id="'usermp_contact-' + type"
			@click="onClick"
		> 
			{{ value }}
		</a>
	`
	};

	// @vue/component
	const UserDetailedInfoItem = {
		name: 'UserDetailedInfoItem',
		props: {
			title: {
				type: String,
				required: true
			},
			type: {
				type: String,
				required: false,
				default: 'general'
			}
		},
		template: `
		<div class="intranet-user-mini-profile__detailed-info-item" :data-test-id="'usermp_detailed-info-' + type">
			<div class="intranet-user-mini-profile__detailed-info-item__title" :data-test-id="'usermp_detailed-info-' + type + '-title'">
				{{ title }}
			</div>
			<div class="intranet-user-mini-profile__detailed-info-item__value" :data-test-id="'usermp_detailed-info-' + type + '-value'">
				<slot></slot>
			</div>
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const EntityMenuItem = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Avatar: ui_vue3_components_avatar.Avatar
		},
		mixins: [IconSetMixin],
		props: {
			title: {
				type: String,
				required: true
			},
			image: {
				/** @type ImageProp */
				type: Object,
				default: () => ({})
			}
		},
		template: `
		<div class="intranet-user-mini-profile__entity-menu-item" data-test-id="usermp_entity-menu-item">
			<div class="intranet-user-mini-profile__entity-menu-item-content">
				<div v-if="image"
					class="intranet-user-mini-profile__entity-menu-item__icon"
					:class="image.iconClass ?? null"
					data-test-id="usermp_entity-menu-item-icon"
				>
					<BIcon v-if="image.bIconName" 
						:name="image.bIconName"
						:size="18"
					/>
					<Avatar v-else
						:options="{
							size: 24,
							title,
							picPath: image.imageSrc ? encodeURI(image.imageSrc) : undefined,
						}"
					/>
				</div>
				<div 
					class="intranet-user-mini-profile__entity-menu-item__title"
					:title="title"
					data-test-id="usermp_entity-menu-item-title"
				>
					{{ title }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserDetailedInfoEntityListValue = {
		name: 'UserDetailedInfoEntityListValue',
		components: {
			RichMenuPopup: ui_vue3_components_richMenu.RichMenuPopup,
			EntityMenuItem
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			entityType: {
				type: String,
				required: false,
				default: ''
			}
		},
		emits: ['click'],
		data() {
			return {
				isMenuShow: false
			};
		},
		computed: {
			popupOptions() {
				const formatPopupId = type => {
					return main_core.Type.isStringFilled(type) ? `${PopupPrefixId}entity-list-${type}` : undefined;
				};
				return {
					id: formatPopupId(this.entityType),
					bindElement: this.$refs.counter,
					width: 240,
					maxHeight: 270,
					autoHide: true
				};
			},
			firstItem() {
				return this.items[0] ?? null;
			},
			isCounterShow() {
				return this.items.length > 1;
			},
			counterTitle() {
				return this.items.length - 1;
			}
		},
		methods: {
			openMenu() {
				this.isMenuShow = true;
			},
			onElementClick(id) {
				this.$emit('click', id);
			}
		},
		template: `
		<div class="intranet-user-mini-profile__user-detailed-info__list-value" v-if="items.length" :data-test-id="'usermp_entity-list-' + entityType">
			<div class="intranet-user-mini-profile__user-detailed-info__list-value__element-container">
					<div v-if="this.$slots.default"
						class="intranet-user-mini-profile__user-detailed-info__list-value__before-element"
					>
						<slot 
							:item="firstItem"
						>
						</slot>
					</div>
				<div class="intranet-user-mini-profile__user-detailed-info__list-value__element">
					<a
						class="intranet-user-mini-profile__user-detailed-info__list-value__element-text"
						:title="firstItem.title"
						:data-test-id="'usermp_entity-' + entityType + '-item'"
						@click="onElementClick(firstItem.id)"
					>
						{{ firstItem.title }}
					</a>
					<div v-if="isCounterShow"
						 class="intranet-user-mini-profile__user-detailed-info__list-value__counter ui-counter"
						 ref="counter"
						 data-test-id="usermp_entity-counter"
						 @click="openMenu"
					>
						<div class="ui-counter-inner">
							+{{ counterTitle }}
						</div>
					</div>
				</div>
			</div>
			<RichMenuPopup v-if="isMenuShow"
				class="intranet-user-mini-profile__user-detailed-info__list-value__entity-menu"
				:popup-options="popupOptions"
				@close="isMenuShow = false"
			>
				<EntityMenuItem v-for="item in items"
					:title="item.title"
					:image="item.image"
					:data-test-id="'usermp_entity-' + entityType + '-menu-item'"
					@click="onElementClick(item.id)"
				/>
			</RichMenuPopup>
		</div>
	`
	};

	// @vue/component
	const UserDetailedInfo = {
		name: 'UserDetailedInfo',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UserDetailedInfoItem,
			UserDetailedInfoContactItemValue,
			UserDetailedInfoEntityListValue
		},
		mixins: [LocMixin, IconSetMixin],
		props: {
			info: {
				/** @type UserMiniProfileData['detailInfo'] */
				type: Object,
				required: true
			},
			heads: {
				/** @type Array<UserInfo> */
				type: Array,
				default: () => []
			},
			userDepartments: {
				/** @type Array<DepartmentType> */
				type: Array,
				default: () => []
			},
			departments: {
				/** @type Array<DepartmentType> */
				type: Array,
				default: () => []
			},
			teams: {
				/** @type Array<TeamType> */
				type: Array,
				default: () => []
			}
		},
		computed: {
			departmentItems() {
				return this.userDepartments.map(department => ({
					id: department.id,
					title: department.title,
					parentId: department.parentId,
					image: {
						bIconName: this.outlineSet.GROUP,
						iconClass: '--department'
					}
				}));
			},
			headItems() {
				return this.heads.map(head => ({
					id: head.id,
					title: head.name,
					image: {
						imageSrc: head.avatar
					},
					href: head.url
				}));
			},
			teamItems() {
				return this.teams.map(team => ({
					id: team.id,
					title: team.title,
					image: {
						bIconName: this.outlineSet.MY_PLAN,
						iconClass: '--team'
					}
				}));
			},
			headTitle() {
				return this.headItems.length < 2 ? this.loc('INTRANET_USER_MINI_DETAILED_INFO_HEAD') : this.loc('INTRANET_USER_MINI_DETAILED_INFO_HEAD_MULTIPLE');
			},
			teamTitle() {
				return this.teamItems.length < 2 ? this.loc('INTRANET_USER_MINI_DETAILED_INFO_FC_SINGLE') : this.loc('INTRANET_USER_MINI_DETAILED_INFO_FC');
			},
			departmentTitle() {
				return this.departmentItems.length < 2 ? this.loc('INTRANET_USER_MINI_DETAILED_INFO_DEPARTMENT') : this.loc('INTRANET_USER_MINI_DETAILED_INFO_DEPARTMENT_MULTIPLE');
			}
		},
		methods: {
			onHeadClicked(id) {
				const head = this.heads.find(item => item.id === id);
				if (head?.url) {
					OpenActionService.openUserProfile(head.url);
				}
			},
			onStructureNodeClicked(id) {
				OpenActionService.openStructureNodeId(id);
			},
			getParentDepartmentById(id) {
				return this.departments.find(item => item.id === id);
			}
		},
		template: `
		<div class="intranet-user-mini-profile__detailed-info">
			<UserDetailedInfoItem v-if="info.personalMobile"
				:title="loc('INTRANET_USER_MINI_DETAILED_INFO_PERSONAL_MOBILE')"
				type="personal-mobile"
			>
				<UserDetailedInfoContactItemValue :value="info.personalMobile" type="phone"/>
			</UserDetailedInfoItem>
			<UserDetailedInfoItem v-if="info.innerPhone"
				:title="loc('INTRANET_USER_MINI_DETAILED_INFO_PHONE_INNER')"
				type="inner-phone"
			>
				{{ info.innerPhone }}
			</UserDetailedInfoItem>
			<UserDetailedInfoItem v-if="info.email"
				:title="loc('INTRANET_USER_MINI_DETAILED_INFO_EMAIL')"
				type="email"
			>
				<UserDetailedInfoContactItemValue :value="info.email" type="mail"/>
			</UserDetailedInfoItem>
			<UserDetailedInfoItem v-if="headItems.length"
				:title="headTitle"
				type="head"
			>
				<UserDetailedInfoEntityListValue
					entityType="user"
					:items="headItems"
					@click="(id) => onHeadClicked(id)"
				/>
			</UserDetailedInfoItem>
			<UserDetailedInfoItem v-if="departmentItems.length"
				:title="departmentTitle"
				type="department"
			>
				<UserDetailedInfoEntityListValue 
					:items="departmentItems"
					entityType="department"
					@click="(id) => onStructureNodeClicked(id)"
					v-slot="{ item }"
				>
					<template v-if="getParentDepartmentById(item.parentId)">
						<div class="intranet-user-mini-profile__detailed-info-item__parent-department">
							<div class="intranet-user-mini-profile__detailed-info-item__parent-department-text"
								 :title="getParentDepartmentById(item.parentId)?.title"
								 data-test-id="usermp_parent-department"
							>
								{{ getParentDepartmentById(item.parentId)?.title }}
							</div>
							<div class="intranet-user-mini-profile__detailed-info-item__parent-department-arrow">
								<div class="intranet-user-mini-profile__detailed-info-item__parent-department-arrow-icon">
									<BIcon :name="outlineSet.CHEVRON_RIGHT_L" :size="16"/>
								</div>
							</div>
						</div>
					</template>
				</UserDetailedInfoEntityListValue>
			</UserDetailedInfoItem>
			<UserDetailedInfoItem v-if="teamItems.length"
				:title="teamTitle"
				type="team"
			>
				<UserDetailedInfoEntityListValue 
					:items="teamItems"
					entityType="team"
					@click="(id) => onStructureNodeClicked(id)"
				/>
			</UserDetailedInfoItem>
		</div>
	`
	};

	// @vue/component
	const UserMiniProfileComponent = {
		name: 'UserMiniProfile',
		components: {
			UserMiniProfileLoader,
			UserBaseInfo,
			SystemUserBadge,
			UserDetailedInfo,
			Divider,
			StructureViewList,
			CollapseTransition,
			ErrorState,
			LoaderTransition
		},
		props: {
			popup: {
				/** @type Popup */
				type: Object,
				required: true
			},
			userId: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				isError: false,
				errorType: ErrorStateDict.Default,
				isLoaded: false,
				isLoading: false,
				isExpanded: true,
				isExpandBlocked: false,
				backendData: null
			};
		},
		computed: {
			userDepartments() {
				const userDepartmentIds = this.backendData.structure?.userDepartmentIds ?? [];
				const departmentDictionary = this.backendData.structure?.departmentDictionary ?? [];
				const userDepartments = [];
				userDepartmentIds.forEach(id => {
					const department = departmentDictionary[id];
					if (!department) {
						return;
					}
					userDepartments.push(department);
				});
				return userDepartments;
			},
			departments() {
				return Object.values(this.backendData.structure?.departmentDictionary ?? {});
			},
			heads() {
				const userHeadIds = this.backendData.structure.userHeadIds ?? [];
				if (userHeadIds.length === 0) {
					return [];
				}
				const headDictionary = this.backendData.structure?.headDictionary ?? {};
				const heads = [];
				userHeadIds.forEach(id => {
					const head = headDictionary[id];
					if (head) {
						heads.push(head);
					}
				});
				return heads;
			},
			canShowDepartments() {
				return this.userDepartments.length > 0;
			},
			isShouldBeExpandedByInitial() {
				return InitialParamService.getValue(InitialParamDict.RightSideExpand) === 'Y';
			},
			canChat() {
				return this.backendData?.access.canChat ?? false;
			},
			isSystemUser() {
				return this.backendData?.baseInfo?.isSystemUser === true;
			},
			isShowStructure() {
				return this.canShowDepartments && this.isExpanded && !this.isSystemUser;
			},
			isShowInlineStructure() {
				return this.canShowDepartments && this.isSystemUser;
			}
		},
		created() {
			if (!this.isLoaded) {
				this.isLoading = true;
				void Backend.load(this.userId).then(data => {
					this.backendData = data;
					this.isLoaded = true;
				}).catch(errorCode => {
					if (errorCode === 'ACCESS_DENIED') {
						this.errorType = ErrorStateDict.AccessDenied;
					}
					this.isError = true;
				}).finally(() => {
					this.isLoading = false;
					this.$nextTick(() => {
						this.adjustPopup();
					});
				});
			}
			this.isExpanded = this.isShouldBeExpandedByInitial;
		},
		mounted() {
			this.adjustPopup();
		},
		methods: {
			onExpand() {
				if (this.isExpandBlocked) {
					return;
				}
				this.isExpanded = !this.isExpanded;
				InitialParamService.save(InitialParamDict.RightSideExpand, this.isExpanded ? 'Y' : 'N');
				this.$nextTick(() => {
					this.adjustPopup();
				});
			},
			adjustPopup() {
				this.popup?.adjustPosition();
			},
			onCollapseStart() {
				this.isExpandBlocked = true;
				this.adjustPopup();
			},
			onCollapseEnd() {
				this.isExpandBlocked = false;
				this.adjustPopup();
			},
			getUserData() {
				const {
					avatar,
					name,
					workPosition,
					url
				} = this.backendData.baseInfo;
				return {
					id: this.userId,
					avatar,
					name,
					workPosition,
					url
				};
			}
		},
		template: `
		<div class="intranet-user-mini-profile-wrapper">
			<SystemUserBadge v-if="isSystemUser"/>
			<template v-if="!isError">
				<LoaderTransition 
					:isLoading="isLoading" 
					:isShowContent="!!backendData"
					:isLoaderShort="!isShouldBeExpandedByInitial"
					@end="() => this.adjustPopup()"
				>
					<div class="intranet-user-mini-profile-wrapper__content">
						<div class="intranet-user-mini-profile-wrapper__column --left"
							 ref="leftColumn"
						>
							<UserBaseInfo
								:userId="userId"
								:info="backendData.baseInfo"
								:isShowExpand="canShowDepartments && !isSystemUser"
								:isExpanded="isExpanded"
								:canChat="canChat"
								@expand="onExpand"
							/>
							<template v-if="backendData.detailInfo">
								<Divider style="margin-top: 18px; margin-bottom: 14px"/>
								<UserDetailedInfo
									:info="backendData.detailInfo"
									:userDepartments="userDepartments"
									:departments="departments"
									:heads="heads"
									:teams="backendData.structure.teams"
								/>
							</template>
							<template v-if="isShowInlineStructure">
								<Divider style="margin-top: 18px; margin-bottom: 14px"/>
								<StructureViewList
									:structure="backendData.structure"
									:user="getUserData()"
									data-test-id="usermp_structure-view-list"
								/>
							</template>
						</div>
						<div v-if="isShowStructure" 
							class="intranet-user-mini-profile-wrapper__content__right-wrapper"
							data-test-id="usermp_structure-wrapper"
						>
							<Divider isVertical style="margin: 0 18px"/>
							<div class="intranet-user-mini-profile-wrapper__column --right" data-test-id="usermp_structure-column">
								<StructureViewList
									:structure="backendData.structure"
									:user="getUserData()"
									data-test-id="usermp_structure-view-list"
								/>
							</div>
						</div>
					</div>
				</LoaderTransition>
			</template>
			<ErrorState v-if="isError"
				:type="errorType"
			/>
		</div>
	`
	};

	/**
	 * Picks the vertical side the mini-profile popup should open to.
	 *
	 * @param anchorCenterY vertical center of the anchor element, viewport-relative, px
	 * @param viewportHeight viewport height, px (window.innerHeight)
	 * @returns 'bottom' — open downward (anchor at or above viewport middle),
	 *          'top' — open upward (anchor below viewport middle)
	 */
	function resolveViewportDirection(anchorCenterY, viewportHeight) {
		return anchorCenterY <= viewportHeight / 2 ? 'bottom' : 'top';
	}

	const ShowDelayMs = 1000;
	const CloseDelayMs = 500;
	class Tracking extends main_core_events.EventEmitter {
		#popup;
		#bindElement = null;
		#showOrCloseTimeout = null;
		#haveToCloseCheckInterval = null;
		#handler = null;
		constructor(trackingOptions) {
			super();
			this.#popup = trackingOptions.popup;
			this.#bindElement = trackingOptions.bindElement;
			this.#handler = {
				onMouseEnter: event => this.#onMouseEnter(event),
				onMouseLeave: event => this.#onMouseLeave(event),
				onBindElementClick: event => this.#onBindElementClick(event)
			};
			this.setEventNamespace('Intranet.User.MiniProfile.Tracking');
		}
		setBindElement(element) {
			if (this.#bindElement === element) {
				return;
			}
			this.unbindTracking();
			this.#bindElement = element;
			if (this.#bindElement) {
				this.setupTracking();
			}
		}
		setupTracking() {
			const {
				onMouseEnter,
				onMouseLeave,
				onBindElementClick
			} = this.#handler;
			main_core.Event.bind(this.#bindElement, 'click', onBindElementClick);
			this.#getTrackingElements().forEach(element => {
				main_core.Event.bind(element, 'mouseenter', onMouseEnter);
				main_core.Event.bind(element, 'mouseleave', onMouseLeave);
			});
		}
		unbindTracking() {
			const {
				onMouseEnter,
				onMouseLeave,
				onBindElementClick
			} = this.#handler;
			main_core.Event.unbind(this.#bindElement, 'click', onBindElementClick);
			this.#getTrackingElements().forEach(element => {
				main_core.Event.unbind(element, 'mouseenter', onMouseEnter);
				main_core.Event.unbind(element, 'mouseleave', onMouseLeave);
			});
			clearInterval(this.#showOrCloseTimeout);
			clearInterval(this.#haveToCloseCheckInterval);
		}
		#onBindElementClick() {
			clearInterval(this.#haveToCloseCheckInterval);
			clearTimeout(this.#showOrCloseTimeout);
			this.emit('close');
		}
		#onMouseEnter(event) {
			clearInterval(this.#haveToCloseCheckInterval);
			this.#scheduleShow();
		}
		#onMouseLeave(event) {
			clearTimeout(this.#showOrCloseTimeout);
			if (this.#haveToClose()) {
				this.#scheduleClose();
			} else if (!this.#isPopupOnTop()) {
				this.#haveToCloseCheckInterval = setInterval(() => {
					if (!this.#haveToClose()) {
						return;
					}
					this.emit('close');
					clearInterval(this.#haveToCloseCheckInterval);
				}, CloseDelayMs * 2);
			}
		}
		#haveToClose() {
			if (this.#popup.isShown() && this.#isPopupOnTop()) {
				return true;
			}
			return false;
		}
		#isPopupOnTop() {
			const popupStack = main_popup.PopupManager.getPopups();
			for (let i = popupStack.length - 1; i >= 0; --i) {
				const popup = popupStack[i];
				if (popup.getId() === this.#popup.getId()) {
					return true;
				}
				if (popup.isShown() && popup.getId().includes(PopupPrefixId)) {
					return false;
				}
			}
			return true;
		}
		#scheduleClose() {
			clearTimeout(this.#showOrCloseTimeout);
			this.#showOrCloseTimeout = setTimeout(() => {
				this.emit('close');
			}, CloseDelayMs);
		}
		#scheduleShow() {
			clearTimeout(this.#showOrCloseTimeout);
			this.#showOrCloseTimeout = setTimeout(() => {
				this.emit('show');
			}, ShowDelayMs);
		}
		#getTrackingElements() {
			return [this.#bindElement, this.#popup.getPopupContainer()];
		}
	}

	const PopupPrefixId = 'intranet-user-mini-profile-';
	const FixedAngleOffset = 23;
	class UserMiniProfile {
		#options;
		#cache = new main_core_cache.MemoryCache();
		#tracking;
		#app = null;
		#closeHandler = null;
		constructor(options) {
			this.#options = options;
			this.#tracking = new Tracking({
				popup: this.#getPopup(),
				bindElement: options.bindElement
			});
			this.#closeHandler = () => this.close();
			this.#bindEvents();
		}
		destroy() {
			this.#tracking.unbindTracking();
			this.#getPopup().destroy();
			this.#app?.unmount();
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onOpen', this.#closeHandler);
			main_core_events.EventEmitter.unsubscribe('Intranet.User.MiniProfile:close', this.#closeHandler);
		}
		show() {
			this.#createAppIfNeed();
			this.#getPopup().show();
		}
		close() {
			this.#getPopup().close();
			main_popup.PopupManager.getPopups().filter(popup => popup.isShown() && popup.getId().includes(PopupPrefixId)).forEach(popup => {
				popup.close();
			});
		}
		setBindElement(element) {
			if (this.#options.bindElement === element) {
				return;
			}
			const popup = this.#getPopup();
			popup.close();
			popup.setBindElement(element);
			this.#tracking.setBindElement(element);
			this.#options.bindElement = element;
		}
		getBindElement() {
			return this.#options.bindElement;
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				const popup = new main_popup.Popup({
					className: 'intranet-user-mini-profile-popup',
					content: this.#getContainer(),
					targetContainer: document.body,
					bindElement: this.#options.bindElement,
					maxWidth: 643,
					maxHeight: 517,
					padding: 0,
					contentNoPaddings: true,
					angle: {
						offset: main_core.Dom.getPosition(this.#options.bindElement).width / 2 + FixedAngleOffset
					},
					animation: 'fading',
					bindOptions: this.#getBindOptions()
				});
				this.#enforceViewportDirection(popup);
				return popup;
			});
		}

		// In viewport mode the popup is repositioned by the Vue component on data load
		// and on right-side expand/collapse via popup.adjustPosition(). Override it so the
		// direction is always recomputed from the current anchor position — this keeps the
		// chosen side stable across those re-adjustments instead of falling back to content height.
		#enforceViewportDirection(popup) {
			if (this.#options.direction !== MiniProfileDirection.Viewport) {
				return;
			}
			const adjustPosition = popup.adjustPosition.bind(popup);
			popup.adjustPosition = () => adjustPosition(this.#getBindOptions());
		}
		#getBindOptions() {
			const defaultOptions = {
				forceBindPosition: true,
				forceTop: true,
				position: 'top'
			};
			const {
				bindElement,
				direction
			} = this.#options;
			if (direction !== MiniProfileDirection.Viewport || !bindElement) {
				return defaultOptions;
			}
			const rect = bindElement.getBoundingClientRect();
			const anchorCenterY = rect.top + rect.height / 2;
			return {
				...defaultOptions,
				position: resolveViewportDirection(anchorCenterY, window.innerHeight)
			};
		}
		#getContainer() {
			return this.#cache.remember('container', () => {
				return main_core.Tag.render`
				<div class="intranet-user-mini-profile --ui-context-content-light"></div>
			`;
			});
		}
		#createAppIfNeed() {
			if (this.#app) {
				return;
			}
			const {
				userId
			} = this.#options;
			const popup = this.#getPopup();
			this.#app = ui_vue3.BitrixVue.createApp(UserMiniProfileComponent, {
				userId,
				popup
			});
			this.#app.mount(this.#getContainer());
		}
		#bindEvents() {
			this.#tracking.setupTracking();
			this.#tracking.subscribe('close', () => this.close());
			this.#tracking.subscribe('show', () => this.show());
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpen', this.#closeHandler);
			main_core_events.EventEmitter.subscribe('Intranet.User.MiniProfile:close', this.#closeHandler);
		}
	}

	class UserMiniProfileManager {
		static #instanceByIdMap = new Map();
		static #instanceByBindElementMap = new Map();
		static getById(id) {
			return this.#instanceByIdMap.get(id);
		}
		static create(options) {
			const {
				id,
				bindElement
			} = options;

			// If other widget was already binded to element, we need to unbind it
			if (this.#instanceByBindElementMap.has(bindElement)) {
				const instanceByElement = this.#instanceByBindElementMap.get(bindElement);
				const instanceById = this.#instanceByIdMap.get(id);
				if (instanceById !== instanceByElement) {
					instanceByElement.setBindElement(null);
					this.#instanceByBindElementMap.delete(bindElement);
				}
			}
			if (this.#instanceByIdMap.has(id)) {
				const instance = this.#instanceByIdMap.get(id);
				const previousBindElement = instance.getBindElement();
				if (previousBindElement !== bindElement) {
					this.#instanceByBindElementMap.delete(previousBindElement);
					instance.setBindElement(bindElement);
				}
				this.#instanceByBindElementMap.set(bindElement, instance);
				return instance;
			}
			const instance = new UserMiniProfile(options);
			this.#instanceByIdMap.set(id, instance);
			this.#instanceByBindElementMap.set(bindElement, instance);
			return instance;
		}
	}

	exports.UserMiniProfileManager = UserMiniProfileManager;

})(this.BX.Intranet.User = this.BX.Intranet.User || {}, BX, BX.Cache, BX.Event, BX.Main, BX.Vue3, BX.UI.IconSet, BX.Vue3.Components, window, window, BX.UI.Vue3.Components, BX.Humanresources.CompanyStructure, BX.UI.Vue3.Components, BX.UI.Vue3.Components, BX.Vue3.Directives, BX.UI.IconSet, BX.Main, BX.UI.Notification);
//# sourceMappingURL=user-mini-profile.bundle.js.map
