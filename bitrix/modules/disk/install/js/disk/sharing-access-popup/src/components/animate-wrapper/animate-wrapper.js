// @vue/component
export const AnimateWrapper = {
	data()
	{
		return {
			observer: null,
			rafId: 0,
			isReady: false,
		};
	},
	mounted()
	{
		const outer = this.$refs.outer;
		const inner = this.$refs.inner;

		this.observer = new ResizeObserver(([entry]) => {
			const nextHeight = Math.ceil(entry.contentRect.height);

			if (!this.isReady)
			{
				outer.style.height = `${nextHeight}px`;
				this.isReady = true;

				return;
			}

			const currentHeight = Math.ceil(outer.getBoundingClientRect().height);
			if (currentHeight === nextHeight)
			{
				return;
			}

			outer.classList.add('--animating');
			outer.style.height = `${currentHeight}px`;

			cancelAnimationFrame(this.rafId);
			this.rafId = requestAnimationFrame(() => {
				outer.style.height = `${nextHeight}px`;
			});
		});

		this.observer.observe(inner);
	},
	beforeUnmount()
	{
		cancelAnimationFrame(this.rafId);
		this.observer?.disconnect();
	},
	methods: {
		onTransitionEnd(event)
		{
			if (event.propertyName === 'height')
			{
				event.currentTarget.classList.remove('--animating');
			}
		},
	},
	template: `
  		<div
  			ref="outer"
  			class="disk-sharing-access-popup__auto-height"
  			@transitionend="onTransitionEnd"
  		>
  			<div ref="inner">
  				<slot />
  			</div>
  		</div>
  	`,
};