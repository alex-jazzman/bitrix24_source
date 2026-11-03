import { defineStore, getActivePinia } from 'ui.vue3.pinia';
import { MediaStreamRegistry } from 'call.lib.media-registry';

import { normalizeRenderer } from './internal/normalize-renderer';
import type { MediaStoreInstance } from './media-store';

// Lazy lookup of callMedia store to avoid static import cycle between users-store and media-store.
// Both stores need cross-references only inside getters/actions (call-time), so the type-only
// import is enough; the actual instance is fetched from Pinia's registry on demand.
function useMediaStore(): MediaStoreInstance | null
{
	const pinia = getActivePinia() as unknown as { _s?: Map<string, MediaStoreInstance> } | undefined;

	return pinia?._s?.get('callMedia') ?? null;
}

export type UserState = 'Idle' | 'Calling' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Declined' | 'Busy' | 'Unavailable' | 'Disconnected' | 'Failed';

export interface User
{
	id: number;
	name: string;
	avatar: string;
	state: UserState;
	microphoneState: boolean;
	cameraState: boolean;
	screenSharingState: boolean;
	talking: boolean;
	floorRequestState: boolean;
	connectionQuality: number;
	videoPaused: boolean;
	streamVersion: number;
}

type UsersMap = Record<number, User>;

type UsersStoreState = {
	users: UsersMap;
	currentUserId: number | null;
	speakerId: number | null;
	raiseHandQueue: number[];
	talkingQueue: number[];
};

function defaultUser(id: number, overrides: Partial<User> = {}): User
{
	return {
		id,
		name: '',
		avatar: '',
		state: 'Idle',
		microphoneState: true,
		cameraState: false,
		screenSharingState: false,
		talking: false,
		floorRequestState: false,
		connectionQuality: 100,
		videoPaused: false,
		streamVersion: 0,
		...overrides,
	};
}

export const useUsersStore = defineStore('callUsers', {
	state: (): UsersStoreState => ({
		users: {},
		currentUserId: null,
		speakerId: null,
		raiseHandQueue: [],
		talkingQueue: [],
	}),

	getters: {
		userById: (state) => (userId: number): User | null => state.users[userId] ?? null,

		currentUser: (state): User | null =>
			state.currentUserId === null ? null : state.users[state.currentUserId] ?? null,

		isCurrentUser: (state) => (userId: number): boolean => userId === state.currentUserId,

		usersArray: (state): User[] => Object.values(state.users),

		userIds: (state): number[] => Object.keys(state.users).map(Number),

		connectedUsers: (state): User[] =>
			Object.values(state.users).filter((u: User) => u.state === 'Connected'),

		talkingUsers: (state): User[] =>
			Object.values(state.users).filter((u: User) => u.talking),

		speakerUser: (state): User | null =>
			state.speakerId === null ? null : state.users[state.speakerId] ?? null,

		raiseHandUsers: (state): User[] =>
			state.raiseHandQueue
				.map((id: number) => state.users[id])
				.filter(Boolean),

		streamForUser(state)
		{
			return (userId: number): MediaStream | null =>
			{
				if (userId === state.currentUserId)
				{
					const mediaStore = useMediaStore();

					if (mediaStore !== null)
					{
						void mediaStore.localStreamVersion;
					}

					return normalizeRenderer(MediaStreamRegistry.getLocalStream());
				}

				void state.users[userId]?.streamVersion;

				return normalizeRenderer(MediaStreamRegistry.getRenderer(userId));
			};
		},

		mirrorFor(state)
		{
			return (userId: number): boolean =>
			{
				if (userId !== state.currentUserId)
				{
					return false;
				}

				return useMediaStore()?.flipLocalVideo ?? false;
			};
		},
	},

	actions: {
		setCurrentUser(userId: number, fields: Partial<User> = {}): void
		{
			this.currentUserId = userId;

			this.users[userId] = {
				...defaultUser(userId, { state: 'Connected' }),
				...this.users[userId],
				...fields,
				id: userId,
			};
		},

		clearCurrentUser(): void
		{
			this.currentUserId = null;
		},

		upsertUser(userId: number | string, fields: Partial<User> = {}): void
		{
			const id = parseInt(String(userId), 10);

			this.users[id] = {
				...(this.users[id] ?? defaultUser(id)),
				...fields,
				id,
			};
		},

		updateUser(userId: number | string, fields: Partial<User>): void
		{
			const id = parseInt(String(userId), 10);

			if (this.users[id])
			{
				this.users[id] = { ...this.users[id], ...fields };
			}
			else
			{
				this.upsertUser(id, fields);
			}
		},

		removeUser(userId: number | string): void
		{
			const id = parseInt(String(userId), 10);

			if (id === this.currentUserId)
			{
				return;
			}

			delete this.users[id];
			this.raiseHandQueue = this.raiseHandQueue.filter((uid) => uid !== id);
			this.talkingQueue = this.talkingQueue.filter((uid) => uid !== id);
		},

		setSpeaker(userId: number | null): void
		{
			this.speakerId = userId;
		},

		incrementStreamVersion(userId: number | string): void
		{
			const id = parseInt(String(userId), 10);

			if (this.users[id])
			{
				this.users[id].streamVersion += 1;
			}
			else
			{
				this.upsertUser(id, { streamVersion: 1 });
			}
		},

		addRaiseHand(userId: number | string): void
		{
			const id = parseInt(String(userId), 10);

			if (!this.raiseHandQueue.includes(id))
			{
				this.raiseHandQueue.push(id);
			}
		},

		removeRaiseHand(userId: number | string): void
		{
			const id = parseInt(String(userId), 10);

			this.raiseHandQueue = this.raiseHandQueue.filter((uid) => uid !== id);
		},

		clearRaiseHands(): void
		{
			this.raiseHandQueue = [];
		},

		setFloorRequest(userId: number | string, raised: boolean): void
		{
			const id = parseInt(String(userId), 10);

			this.updateUser(id, { floorRequestState: raised });

			if (raised)
			{
				this.addRaiseHand(id);
			}
			else
			{
				this.removeRaiseHand(id);
			}
		},

		refreshTalkingQueue(): void
		{
			const talking = Object.values(this.users)
				.filter((u: User) => u.talking)
				.map((u: User) => u.id)
				.sort((a: number, b: number) => a - b);

			const connected = Object.values(this.users)
				.filter((u: User) => u.state === 'Connected' && !u.talking)
				.map((u: User) => u.id);

			this.talkingQueue = [...talking, ...connected];
		},

		// Intent — toggles raise-hand for self.
		// Optimistic write to users[currentUserId], then forwards through mediaStore bridge.
		toggleRaiseHand(): void
		{
			const me = this.currentUser;

			if (!me)
			{
				return;
			}

			const next = !me.floorRequestState;

			this.setFloorRequest(me.id, next);
			useMediaStore()?._bridge?.emit('onButtonClick', { buttonName: 'floorRequest' });
		},

		resetUsers(): void
		{
			this.users = {};
			this.currentUserId = null;
			this.speakerId = null;
			this.raiseHandQueue = [];
			this.talkingQueue = [];
		},
	},
});

export type UsersStoreInstance = ReturnType<typeof useUsersStore>;
