export function useOtpCaptchaFlow(options = {}): Object
{
	const {
		mainBlockVisibleKey = 'isMainBlockVisible',
		captchaBlockVisibleKey = 'isCaptchaBlockVisible',
		waitingKey = 'isWaiting',
	} = options;

	return {
		showCaptcha()
		{
			this[mainBlockVisibleKey] = false;
			this[captchaBlockVisibleKey] = true;
		},

		handleFormSubmit(event)
		{
			if (this.captchaCode)
			{
				event.preventDefault();
				this.showCaptcha();
			}
			else
			{
				this[waitingKey] = true;
				this.$emit('form-submit');
			}
		},

		handleCodeComplete()
		{
			this.$nextTick(() => {
				if (this.captchaCode)
				{
					this.showCaptcha();
				}
				else
				{
					this[waitingKey] = true;
					this.$emit('form-submit');

					const formRef = this.$refs?.authForm;
					if (formRef)
					{
						formRef.submit();
					}
				}
			});
		},
	};
}
