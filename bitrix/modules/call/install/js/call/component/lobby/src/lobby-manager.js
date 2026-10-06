import { BitrixVue } from 'ui.vue3';
import { CallLobby } from './call-lobby';

export class LobbyManager
{
	#app = null;
	#reject = null;
	#shown = false;

	/**
	 * @param {Object} params
	 * @param {HTMLElement} params.container
	 * @param {string} params.userName
	 * @param {string} params.userAvatar
	 * @param {string} params.callerName
	 * @returns {Promise<{accepted: boolean, video?: boolean, audio?: boolean, userName?: string}>}
	 *          resolves with accepted=true and join params, or accepted=false on decline;
	 *          rejects only on a real failure (forced destroy, missing container, already shown)
	 */
	show({ container, userName, userAvatar, callerName })
	{
		if (this.#shown)
		{
			return Promise.reject(new Error('LobbyManager is already shown'));
		}

		if (!container)
		{
			return Promise.reject(new Error('LobbyManager: container is required'));
		}

		return new Promise((resolve, reject) =>
		{
			this.#reject = reject;
			this.#shown = true;

			this.#app = BitrixVue.createApp({
				name: 'CallLobbyApp',
				components: {
					CallLobby,
				},
				data()
				{
					return {
						userName,
						userAvatar,
						callerName,
					};
				},
				methods: {
					onJoin: (params) =>
					{
						if (!this.#shown)
						{
							return;
						}

						resolve({ accepted: true, ...params });
						this.#reset();
					},
					onDecline: () =>
					{
						if (!this.#shown)
						{
							return;
						}

						// declining the call is a normal outcome, not an error — resolve instead of reject
						resolve({ accepted: false });
						this.#reset();
					},
				},
				template: /* HTML */`
					<CallLobby
						:userName="userName"
						:userAvatar="userAvatar"
						:callerName="callerName"
						@join="onJoin"
						@decline="onDecline"
					/>
				`,
			});

			this.#app.mount(container);
		});
	}

	#unmountApp()
	{
		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}
	}

	#reset()
	{
		this.#shown = false;
		this.#reject = null;
		this.#unmountApp();
	}

	destroy()
	{
		if (!this.#shown)
		{
			return;
		}

		const reject = this.#reject;
		this.#reset();
		reject(new Error('destroyed'));
	}

	isShown()
	{
		return this.#shown;
	}
}
