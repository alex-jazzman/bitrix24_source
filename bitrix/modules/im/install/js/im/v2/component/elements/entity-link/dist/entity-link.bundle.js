/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_vue3, ui_iconSet_api_vue, ui_iconSet_outline, im_v2_css_classes, main_core, im_v2_const) {
	'use strict';

	const EntityLinkAppearance = Object.freeze({
		link: 'link',
		button: 'button'
	});

	const EntityButton = ui_vue3.defineComponent({
		name: 'ImEntityButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			text: {
				type: String,
				required: true
			},
			url: {
				type: String,
				default: ''
			},
			appearance: {
				type: String,
				default: EntityLinkAppearance.link,
				validator: value => Object.values(EntityLinkAppearance).includes(value)
			},
			compactMode: {
				type: Boolean,
				default: false
			},
			withUnreadBadge: {
				type: Boolean,
				default: false
			},
			isChatMuted: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		computed: {
			chevronIcon() {
				return ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_M;
			},
			isLinkAppearance() {
				return this.appearance === EntityLinkAppearance.link;
			},
			containerClasses() {
				return {
					'--link': this.isLinkAppearance,
					'--button': !this.isLinkAppearance,
					'--compact': this.compactMode
				};
			}
		},
		methods: {
			onClick(event) {
				if (!this.url) {
					event.preventDefault();
				}
				this.$emit('click');
			}
		},
		template: `
		<a
			:href="url"
			class="bx-im-entity-button"
			:class="containerClasses"
			@click.stop="onClick"
			@keydown.enter.stop
			@keydown.space.stop
		>
			<template v-if="isLinkAppearance">
				<span class="bx-im-entity-button__text --ellipsis">{{ text }}</span>
				<BIcon class="bx-im-entity-button__icon" :name="chevronIcon" />
			</template>
			<template v-else>{{ text }}<span
				v-if="withUnreadBadge"
				:class="{ '--muted': isChatMuted }"
				class="bx-im-entity-button__unread-badge"
			></span></template>
		</a>
	`
	});

	const PhraseByLinkType = {
		[im_v2_const.ChatEntityLinkType.tasks]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_TASK'),
		[im_v2_const.ChatEntityLinkType.calendar]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_MEETING'),
		[im_v2_const.ChatEntityLinkType.sonetGroup]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_GROUP'),
		[im_v2_const.ChatEntityLinkType.mail]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_MAIL'),
		[im_v2_const.ChatEntityLinkType.contact]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_CONTACT'),
		[im_v2_const.ChatEntityLinkType.deal]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_DEAL'),
		[im_v2_const.ChatEntityLinkType.lead]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_LEAD'),
		[im_v2_const.ChatEntityLinkType.dynamic]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_DYNAMIC_ELEMENT'),
		[im_v2_const.ChatEntityLinkType.vibecodeApp]: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN_VIBECODE_APP'),
		default: main_core.Loc.getMessage('IM_ELEMENTS_ENTITY_LINK_OPEN')
	};

	const EntityLink = ui_vue3.defineComponent({
		name: 'ImEntityLink',
		components: {
			EntityButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			appearance: {
				type: String,
				default: EntityLinkAppearance.link
			},
			withEntityName: {
				type: Boolean,
				default: true
			},
			compactMode: {
				type: Boolean,
				default: false
			},
			withUnreadBadge: {
				type: Boolean,
				default: false
			},
			isChatMuted: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			dialog() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			entityUrl() {
				return this.dialog.entityLink?.url ?? '';
			},
			text() {
				if (!this.withEntityName) {
					return PhraseByLinkType.default;
				}
				return PhraseByLinkType[this.dialog.entityLink?.type] ?? PhraseByLinkType.default;
			}
		},
		template: `
		<EntityButton
			:text="text"
			:url="entityUrl"
			:appearance="appearance"
			:compactMode="compactMode"
			:withUnreadBadge="withUnreadBadge"
			:isChatMuted="isChatMuted"
			:data-testid="'im-entity-link-' + dialogId"
		/>
	`
	});

	const hasEntityLink = dialog => {
		return Boolean(dialog?.entityLink?.url);
	};

	exports.EntityButton = EntityButton;
	exports.EntityLink = EntityLink;
	exports.EntityLinkAppearance = EntityLinkAppearance;
	exports.PhraseByLinkType = PhraseByLinkType;
	exports.hasEntityLink = hasEntityLink;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Vue3, BX.UI.IconSet, window, BX.Messenger.v2.Css, BX, BX.Messenger.v2.Const);
//# sourceMappingURL=entity-link.bundle.js.map
