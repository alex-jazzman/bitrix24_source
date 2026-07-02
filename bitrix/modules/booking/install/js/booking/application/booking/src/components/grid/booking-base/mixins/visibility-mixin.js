export const visibilityMixin = {
	data(): Object
	{
		return {
			visible: true,
		};
	},
	mounted(): void
	{
		this.updateVisibility();
		this.updateVisibilityDuringTransition();
	},
	methods: {
		updateVisibilityDuringTransition(): void
		{
			this.animation?.stop();
			// eslint-disable-next-line new-cap
			this.animation = new BX.easing({
				duration: 200,
				start: {},
				finish: {},
				step: this.updateVisibility,
			});
			this.animation.animate();
		},
		updateVisibility(): void
		{
			if (!this.$el)
			{
				return;
			}

			const rect = this.$el.getBoundingClientRect();
			this.visible = rect.right > 0 && rect.left < window.innerWidth;
		},
	},
	watch: {
		scroll(): void
		{
			this.updateVisibility();
		},
		zoom(): void
		{
			this.updateVisibility();
		},
		resourcesIds(): void
		{
			this.updateVisibilityDuringTransition();
		},
		visible(visible): void
		{
			if (visible)
			{
				return;
			}

			setTimeout(() => {
				this.updateVisibility();
			}, 2000);
		},
	},
};
