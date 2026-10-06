const { Event } = BX;
const hiddenClass = '--hidden';
const progressPhraseInterval = 15000;
const progressValues = ['0%', '25%', '50%', '75%', '90%'];
const progressPhraseIndexes = [0, null, 1, null, 2];

window.LandingCopilotVideo = class
{
	constructor(rootContainer)
	{
		this.rootContainer = rootContainer;
		this.videoContainer = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-video-container]');
		this.video = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-video]');

		this.play = this.play.bind(this);
		this.pause = this.pause.bind(this);

		this.bindEvents();
	}

	bindEvents()
	{
		if (!this.rootContainer)
		{
			return;
		}

		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-video:play', this.play);
		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-video:pause', this.pause);
	}

	setState(state)
	{
		if (this.videoContainer)
		{
			this.videoContainer.dataset.landingSiteCopilotAiPlaceholderVideoState = state;
		}
	}

	play()
	{
		if (!this.video)
		{
			return;
		}

		const playResult = this.video.play();
		if (playResult?.then)
		{
			playResult
				.then(() => this.setState('playing'))
				.catch(() => this.setState('paused'))
			;
		}
		else
		{
			this.setState('playing');
		}
	}

	pause()
	{
		if (!this.video)
		{
			return;
		}

		this.video.pause();
		this.setState('paused');
	}
};

window.LandingCopilotAnimation = class
{
	constructor(rootContainer)
	{
		this.rootContainer = rootContainer;
		this.animation = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-animation]');

		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);

		this.bindEvents();
	}

	bindEvents()
	{
		if (!this.rootContainer)
		{
			return;
		}

		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-animation:show', this.show);
		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-animation:hide', this.hide);
	}

	show()
	{
		this.animation?.classList.remove(hiddenClass);
	}

	hide()
	{
		this.animation?.classList.add(hiddenClass);
	}
};

window.LandingCopilotText = class
{
	constructor(rootContainer)
	{
		this.rootContainer = rootContainer;
		this.initialText = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-initial-text]');
		this.generationText = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-generation-text]');

		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);

		this.bindEvents();
	}

	bindEvents()
	{
		if (!this.rootContainer)
		{
			return;
		}

		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-text:show', this.show);
		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-text:hide', this.hide);
	}

	show()
	{
		this.initialText?.classList.add(hiddenClass);
		this.generationText?.classList.remove(hiddenClass);
	}

	hide()
	{
		this.generationText?.classList.add(hiddenClass);
		this.initialText?.classList.remove(hiddenClass);
	}
};

window.LandingCopilotProgress = class
{
	constructor(rootContainer, options = {})
	{
		this.rootContainer = rootContainer;
		this.progress = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-progress]');
		this.generationText = this.rootContainer?.querySelector('[data-landing-site-copilot-ai-placeholder-generation-text]');
		this.phrases = Array.isArray(options.phrases) ? options.phrases.filter((phrase) => typeof phrase === 'string') : [];
		this.currentPhraseIndex = 0;
		this.phraseInterval = null;

		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);

		this.bindEvents();
	}

	bindEvents()
	{
		if (!this.rootContainer)
		{
			return;
		}

		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-progress:show', this.show);
		Event.bind(this.rootContainer, 'landing-site-copilot-ai-placeholder-progress:hide', this.hide);
	}

	show()
	{
		this.progress?.classList.remove(hiddenClass);
		this.currentPhraseIndex = 0;
		this.setPhrase(this.currentPhraseIndex);
		this.startPhraseInterval();
	}

	hide()
	{
		this.stopPhraseInterval();
		this.progress?.classList.add(hiddenClass);
	}

	startPhraseInterval()
	{
		this.stopPhraseInterval();
		this.phraseInterval = setInterval(() => {
			if (this.currentPhraseIndex >= progressValues.length - 1)
			{
				this.stopPhraseInterval();

				return;
			}

			this.currentPhraseIndex += 1;
			this.setPhrase(this.currentPhraseIndex);
			if (this.currentPhraseIndex >= progressValues.length - 1)
			{
				this.stopPhraseInterval();
			}
		}, progressPhraseInterval);
	}

	stopPhraseInterval()
	{
		if (this.phraseInterval)
		{
			clearInterval(this.phraseInterval);
			this.phraseInterval = null;
		}
	}

	setPhrase(index)
	{
		if (this.progress)
		{
			const progressValue = progressValues[index] ?? progressValues[progressValues.length - 1];
			this.progress.style.setProperty(
				'--landing-site-copilot-ai-placeholder-progress',
				progressValue,
			);
			this.progress.setAttribute('aria-valuenow', parseInt(progressValue, 10));
		}

		const phraseIndex = progressPhraseIndexes[index];
		if (this.generationText && this.phrases[phraseIndex])
		{
			this.generationText.textContent = this.phrases[phraseIndex];
		}
	}
};

window.LandingCopilotA11y = class
{
	constructor(options = {})
	{
		this.messages = options.messages ?? {};
		this.announcedMilestones = new Set();
	}

	announceGenerationStarted(generationId)
	{
		this.announceMilestone('generationStarted', 'polite', generationId);
	}

	announceGenerationFinished(generationId)
	{
		this.announceMilestone('generationFinished', 'polite', generationId);
	}

	announceGenerationFailed(generationId)
	{
		this.announceMilestone('generationFailed', 'assertive', generationId);
	}

	announceMilestone(milestone, politeness, generationId)
	{
		// A milestone belongs to its generation: a command the pull stream delivers twice says
		// nothing new, while the same milestone of the next generation is news of its own.
		const milestoneKey = `${parseInt(generationId, 10) || 0}:${milestone}`;
		if (this.announcedMilestones.has(milestoneKey))
		{
			return;
		}

		const message = this.messages[milestone];
		const announcer = BX.UI?.Accessibility?.LiveAnnouncer;
		if (!message || !announcer)
		{
			return;
		}

		// A milestone counts as announced only once the announcer has actually been reached.
		announcer.announce(message, politeness);
		this.announcedMilestones.add(milestoneKey);
	}
};
