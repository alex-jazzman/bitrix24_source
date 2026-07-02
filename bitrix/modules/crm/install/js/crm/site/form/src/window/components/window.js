import { MountingPortal } from '../../vue/portal-vue.esm.js';
import {Scrollable} from "./scrolldown";

function getPortalSelector(mountId)
{
	const className = 'b24-window-mounts';
	mountId = mountId || `empty`;
	mountId = `b24-window-mount-${mountId}`;

	const selector = `#${mountId}`;
	if (document.getElementById(mountId))
	{
		return selector;
	}

	let wrapper = document.querySelector(`.${className}`);
	if (!wrapper)
	{
		wrapper = document.createElement('div');
		wrapper.classList.add(className);
		document.body.appendChild(wrapper);
	}

	const container = document.createElement('div');
	container.id = mountId;
	container.classList.add('b24-form');
	wrapper.appendChild(container);

	return selector;
}

const Overlay = {
	props: ['show', 'background'],
	components: {},
	template: `
		<transition name="b24-a-fade" appear>
			<div class="b24-window-overlay"
				:style="{ backgroundColor: background }" 
				@click="$emit('click')"
				v-show="show"
			></div>
		</transition>
	`,
};

let windowMixin = {
	props: [
		'show', 'title', 'position', 'vertical',
		'maxWidth', 'zIndex', 'scrollDown', 'scrollDownText',
		'mountId', 'hideOnOverlayClick', 'messages',
	],
	components: {
		'b24-overlay': Overlay,
		'b24-scrollable': Scrollable,
		MountingPortal,
	},
	data(): { escHandler: ?Function, previousActiveElement: ?HTMLElement }
	{
		return {
			escHandler: null,
			previousActiveElement: null,
		};
	},
	methods: {
		onOverlayClick() {
			if (this.hideOnOverlayClick)
			{
				this.hide();
			}
		},
		hide() {
			this.show = false;
			this.$emit('hide');
		},
		listenEsc()
		{
			if (!this.escHandler)
			{
				this.escHandler = e => {
					if (this.show && e.key === 'Escape')
					{
						e.preventDefault();
						e.stopPropagation();

						this.hide();
					}
				};
			}

			this.show
				? document.addEventListener('keydown', this.escHandler)
				: document.removeEventListener('keydown', this.escHandler);
		},

		getMountTo(mountId)
		{
			return getPortalSelector(mountId);
		},

		setFocusToPopup(): void
		{
			if (!this.previousActiveElement && document.activeElement)
			{
				this.previousActiveElement = document.activeElement;
			}

			this.$refs.closeButton?.focus();
		},

		restoreFocus(): void
		{
			this.previousActiveElement?.focus();
			this.previousActiveElement = null;
		},
	},
	mounted ()
	{
		this.listenEsc();
	},
	updated(): void
	{
		if (this.show)
		{
			this.$nextTick(() => {
				this.setFocusToPopup();
			});
		}
	},
	watch: {
		show ()
		{
			this.listenEsc();
			if (!this.show)
			{
				this.$nextTick(() => {
					this.restoreFocus();
				});
			}
		},
	},
	computed: {
		zIndexComputed()
		{
			return this.zIndex || 200;
		},
		closeButtonLabel(): string
		{
			return this.messages?.get('fieldDateClose') || '';
		},
	},
};

const Popup = {
	mixins: [windowMixin],
	props: ['isOnTop'],
	template: `
		<MountingPortal
			append
			:disabled="!mountId"
			:mountTo="getMountTo(mountId)"
		>
			<div class="b24-window">
				<b24-overlay :show="show" @click="onOverlayClick()"></b24-overlay>
				<transition :name="getTransitionName()" appear>
					<div class="b24-window-popup" 
						:class="classes()"
						@click.self.prevent="onOverlayClick()"
						v-show="show"
					>
						<div class="b24-window-popup-wrapper" 
							:style="{ maxWidth: maxWidth + 'px' }"
						>
							<button ref="closeButton" @click="hide()" type="button" class="b24-window-close" :style="{ zIndex: zIndexComputed + 20}" :aria-label="closeButtonLabel"></button>
							<b24-scrollable
								:show="show"
								:enabled="scrollDown"
								:zIndex="zIndex"
								:text="scrollDownText"
							>
								<div v-if="title" class="b24-window-popup-head">
									<div class="b24-window-popup-title">{{ title }}</div>
								</div>
								<div class="b24-window-popup-body">
									<slot></slot>
								</div>
							</b24-scrollable>
						</div>
					</div>
				</transition>
			</div>
		</MountingPortal>
	`,
	methods: {
		getTransitionName(): string {
			return `b24-a-slide-${this.vertical || 'bottom'}`;
		},
		classes(): string[] {
			const classes = this.isOnTop ? ['b24-window-popup-on-top'] : [];
			classes.push(`b24-window-popup-p-${this.position || 'center'}`);

			return classes;
		},
	},
};

const Panel = {
	mixins: [windowMixin],
	template: `
		<div class="b24-window">
			<b24-overlay :show="show" @click="hide()"></b24-overlay>
			<transition :name="getTransitionName()" appear>
				<div class="b24-window-panel"
					:class="classes()"
					v-show="show"
				>
					<button ref="closeButton" @click="hide()" type="button" class="b24-window-close" :style="{ zIndex: zIndexComputed + 20}" :aria-label="closeButtonLabel"></button>
					<b24-scrollable
						:show="show"
						:enabled="scrollDown"
						:zIndex="zIndex"
						:text="scrollDownText"
					>
						<slot></slot>
					</b24-scrollable>
				</div>
			</transition>
		</div>
	`,
	methods: {
		getTransitionName() {
			return 'b24-a-slide-' + (this.vertical || 'bottom');
		},
		classes() {
			return [
				'b24-window-panel-pos-' + (this.position || 'right')
			];
		},
	},
};

const Widget = {
	mixins: [windowMixin],
	template: `
		<div class="b24-window">
			<b24-overlay :show="show" @click="hide()" :background="'transparent'"></b24-overlay>
			<transition :name="getTransitionName()" appear>
				<div class="b24-window-widget" 
					:class="classes()" 
					v-show="show"
				>
					<button ref="closeButton" @click="hide()" type="button" class="b24-window-close" :aria-label="closeButtonLabel"></button>
					<div class="b24-window-widget-body">
						<slot></slot>
					</div>
				</div>
			</transition>
		</div>
	`,
	methods: {
		getTransitionName() {
			return 'b24-a-slide-short-' + (this.vertical || 'bottom');
		},
		classes() {
			return [
				'b24-window-widget-p-'
				+ (this.vertical || 'bottom') + '-'
				+ (this.position || 'right')
			];
		},
	},
};

const Definition = {
	'b24-overlay': Overlay,
	'b24-popup': Popup,
	'b24-panel': Panel,
	'b24-widget': Widget,
};

export {
	Overlay,
	Popup,
	Panel,
	Widget,
	Definition,
};
