import './css/lobby-user-form.css';

// Guards against double-encoding avatar URLs that already contain percent-encoded sequences;
// mirrors call.view checkAndEncodeURI (kept local to avoid depending on call.view internals)
const checkAndEncodeURI = (uri) => (decodeURI(uri) === uri ? encodeURI(uri) : uri);

// @vue/component
export const LobbyUserForm = {
	name: 'LobbyUserForm',
	props: {
		userName: {
			type: String,
			default: '',
		},
		userAvatar: {
			type: String,
			default: '',
		},
		permissionsRequested: {
			type: Boolean,
			default: false,
		},
		micBlocked: {
			type: Boolean,
			default: false,
		},
		cameraBlocked: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['join'],
	data()
	{
		return {
			editableName: this.userName,
		};
	},
	computed: {
		hasRealName()
		{
			return this.userName.length > 0
				&& this.userName !== this.$Bitrix.Loc.getMessage('CALL_LOBBY_DEFAULT_USER_NAME');
		},
		avatarStyle()
		{
			if (this.userAvatar)
			{
				return {
					backgroundImage: `url("${checkAndEncodeURI(this.userAvatar)}")`,
				};
			}

			return {};
		},
		joinVideoClasses()
		{
			return {
				'call-lobby-user-form__button': true,
				'--video': true,
				'--disabled': !this.permissionsRequested || this.cameraBlocked,
			};
		},
		joinAudioClasses()
		{
			return {
				'call-lobby-user-form__button': true,
				'--audio': true,
				'--disabled': !this.permissionsRequested,
			};
		},
	},
	methods: {
		onJoin(video)
		{
			if (!this.permissionsRequested)
			{
				return;
			}

			if (video && this.cameraBlocked)
			{
				return;
			}

			// fall back to the original name when the guest cleared the field (v-model.trim leaves '')
			const userName = this.editableName === '' ? this.userName : this.editableName;

			this.$emit('join', {
				video,
				audio: !this.micBlocked,
				userName,
			});
		},
	},
	template: /* HTML */`
		<div class="call-lobby-user-form">
			<template v-if="hasRealName">
				<div class="call-lobby-user-form__name-container">
					<div
						v-if="userAvatar"
						class="call-lobby-user-form__avatar"
						:style="avatarStyle"
					></div>
					<div class="call-lobby-user-form__name-text">{{ userName }}</div>
				</div>
			</template>
			<template v-else>
				<input
					v-model.trim="editableName"
					type="text"
					autocomplete="name"
					:aria-label="$Bitrix.Loc.getMessage('CALL_LOBBY_NAME_PLACEHOLDER')"
					:placeholder="$Bitrix.Loc.getMessage('CALL_LOBBY_NAME_PLACEHOLDER')"
					class="call-lobby-user-form__name-input"
				/>
			</template>
			<div class="call-lobby-user-form__buttons">
				<button
					:class="joinVideoClasses"
					:disabled="!permissionsRequested || cameraBlocked"
					@click="onJoin(true)"
				>{{ $Bitrix.Loc.getMessage('CALL_LOBBY_JOIN_VIDEO') }}</button>
				<button
					:class="joinAudioClasses"
					:disabled="!permissionsRequested"
					@click="onJoin(false)"
				>{{ $Bitrix.Loc.getMessage('CALL_LOBBY_JOIN_AUDIO') }}</button>
			</div>
		</div>
	`,
};
