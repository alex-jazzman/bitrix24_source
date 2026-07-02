import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { BCounter } from '../b-counter/b-counter';
import './option-card.css';

// @vue/component
export const OptionCard = {
	name: 'IntegrationYandexMapOptionCard',
	components: {
		BIcon,
		BCounter,
	},
	props: {
		id: {
			type: String,
			required: true,
		},
		imgSrc: {
			type: String,
			default: '',
		},
		head: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		link: {
			type: [String, null],
			default: null,
		},
		counter: {
			type: [Object, null],
			default: null,
		},
		footer: {
			type: [Object, null],
			default: null,
		},
		isInline: Boolean,
		isDisabled: Boolean,
	},
	emits: ['click'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	methods: {
		getControlComponent(): Object
		{
			return this.link ? 'a' : 'button';
		},
	},
	template: `
		<component
			v-if="isInline"
			:is="getControlComponent()"
			class="booking-option-card"
			:href="isDisabled ? null : link"
			:target="link ? '_blank' : null"
			:disabled="isDisabled || null"
			:data-id="'card-' + id"
			@click="$emit('click', $event)"
		>
			<div class="booking-option-card__bg">
				<div class="booking-option-card__bg-color"></div>
				<div class="booking-option-card__bg-border"></div>
			</div>
			<div class="booking-option-card__content">
				<div class="booking-option-card__body">
					<div class="booking-option-card__body-bg"></div>
					<div class="booking-option-card__body-content">
						<div class="booking-option-card__header">
							<div v-if="imgSrc" class="booking-option-card__img-container">
								<img :src="imgSrc" alt="Option" class="booking-option-card__img"/>
							</div>
							<div class="booking-option-card__header-text">
								<p class="booking-option-card__head">{{ head }}</p>
								<p v-if="description" class="booking-option-card__descr">{{ description }}</p>
							</div>
							<BIcon
								v-if="!isDisabled"
								class="booking-option-card__icon"
								:size="22"
								:name="Outline.CHEVRON_RIGHT_M"
							/>
						</div>
					</div>
				</div>
				<BCounter :id v-bind="counter" class="booking-option-card__counter" />
			</div>
		</component>
		<component
			v-else
			:is="getControlComponent()"
			class="booking-option-card"
			:href="isDisabled ? null : link"
			:target="link ? '_blank' : null"
			:disabled="isDisabled || null"
			:data-id="'card-' + id"
			@click="$emit('click', $event)"
		>
			<div class="booking-option-card__bg">
				<div class="booking-option-card__bg-color"></div>
				<div class="booking-option-card__bg-border"></div>
			</div>
			<div class="booking-option-card__content">
				<div class="booking-option-card__body">
					<div class="booking-option-card__body-bg"></div>
					<div class="booking-option-card__body-content">
						<div class="booking-option-card__header">
							<div v-if="imgSrc" class="booking-option-card__img-container">
								<img :src="imgSrc" alt="Option" class="booking-option-card__img" />
							</div>
							<div class="booking-option-card__header-text">
								<p class="booking-option-card__head">{{ head }}</p>
							</div>
						</div>
						<p v-if="description" class="booking-option-card__descr">{{ description }}</p>
					</div>
				</div>
				<div v-if="footer" class="booking-option-card__footer">
					<div class="booking-option-card__footer-bg"></div>
					<div class="booking-option-card__footer-content">
						<p v-if="footer.action" class="booking-option-card__action">
							<BIcon
								class="booking-option-card__action-icon"
								:size="19"
								:name="Outline.PLUS_M"
							/>
							<span class="booking-option-card__action-text">{{ footer.action }}</span>
						</p>
					</div>
				</div>
				<BCounter :id v-bind="counter" class="booking-option-card__counter"/>
			</div>
		</component>
	`,
};
