import './sync-page-block.css';

const VALID_SIZES = ['large', 'medium', 'small'];
const VALID_ACTION_TYPES = [
	'start-call',
	'join-meeting',
	'schedule-meeting',
	'call-with-me',
	'free-slots',
];
const VALID_ICONS = VALID_ACTION_TYPES;

// @vue/component
export const SyncPageBlock = {
	name: 'SyncPageBlock',
	props: {
		size: {
			type: String,
			required: true,
			validator: (value) => VALID_SIZES.includes(value),
		},
		// block identifier emitted on click and routed in the service actionMap (required for every size)
		actionType: {
			type: String,
			required: true,
			validator: (value) => VALID_ACTION_TYPES.includes(value),
		},
		// visual icon, rendered only for medium/small sizes (large uses an illustration instead)
		icon: {
			type: String,
			default: '',
			validator: (value) => value === '' || VALID_ICONS.includes(value),
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		badge: {
			type: String,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		ctaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['click'],
	computed: {
		tabIndex()
		{
			return this.disabled ? -1 : 0;
		},
	},
	methods: {
		onClick()
		{
			if (this.disabled)
			{
				return;
			}

			this.$emit('click', this.actionType);
		},
	},
	template: /* HTML */`
		<div
			class="call-sync-page-block"
			:class="['--' + size, { '--disabled': disabled }]"
			role="button"
			:tabindex="tabIndex"
			:aria-disabled="disabled ? 'true' : null"
			:aria-label="title"
			@click="onClick"
			@keydown.enter="onClick"
			@keydown.space.prevent="onClick"
		>
			<div v-if="badge" class="call-sync-page-block__badge">{{ badge }}</div>
			<div v-if="size === 'large'" class="call-sync-page-block__content --large">
				<div class="call-sync-page-block__content-left">
					<div class="call-sync-page-block__illustration"></div>
				</div>
				<div class="call-sync-page-block__content-right">
					<div class="call-sync-page-block__title">{{ title }}</div>
					<div class="call-sync-page-block__description">{{ description }}</div>
					<div v-if="ctaLabel" class="call-sync-page-block__cta">{{ ctaLabel }}</div>
				</div>
			</div>
			<div v-else-if="size === 'medium'" class="call-sync-page-block__content --medium">
				<div class="call-sync-page-block__icon" :class="['--' + size, '--' + icon]"></div>
				<div class="call-sync-page-block__title">{{ title }}</div>
				<div class="call-sync-page-block__description">{{ description }}</div>
			</div>
			<div v-else class="call-sync-page-block__content --small">
				<div class="call-sync-page-block__icon" :class="['--' + size, '--' + icon]"></div>
				<div class="call-sync-page-block__title">{{ title }}</div>
			</div>
		</div>
	`,
};
