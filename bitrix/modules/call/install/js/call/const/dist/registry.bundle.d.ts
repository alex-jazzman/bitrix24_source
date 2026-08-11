/* eslint-disable */
type LayersAvailability = {
	f: boolean;
	h: boolean;
	q: boolean;
};

type SubscribedQuality = {
	quality?: 'HIGH' | 'MEDIUM' | 'LOW';
	enabled?: boolean;
};

declare namespace BX.Call.Const {
	const CallTypes: {
		video: {
			id: string;
			locCode: string;
			start: (dialogId: string) => void;
		};
		audio: {
			id: string;
			locCode: string;
			start: (dialogId: string) => void;
		};
	};

	const ParticipantTrackType: {
		readonly AUDIO: 0;
		readonly VIDEO: 1;
		readonly SCREENSHARE: 2;
	};

	/**
	 * Bitrix Messenger
	 * Conference constants
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */
	const ConferenceFieldState: Readonly<{
		view: "view";
		edit: "edit";
		create: "create";
	}>;

	const ConferenceStateType: Readonly<{
		preparation: "preparation";
		call: "call";
	}>;

	const ConferenceErrorCode: Readonly<{
		userLimitReached: "userLimitReached";
		detectIntranetUser: "detectIntranetUser";
		bitrix24only: "bitrix24only";
		kickedFromCall: "kickedFromCall";
		unsupportedBrowser: "unsupportedBrowser";
		missingMicrophone: "missingMicrophone";
		unsafeConnection: "unsafeConnection";
		wrongAlias: "wrongAlias";
		notStarted: "notStarted";
		finished: "finished";
		userLeftCall: "userLeftCall";
		noSignalFromCamera: "noSignalFromCamera";
	}>;

	const ConferenceRightPanelMode: Readonly<{
		hidden: "hidden";
		chat: "chat";
		users: "users";
		split: "split";
	}>;

	const ConferenceUserState: Readonly<{
		Idle: "Idle";
		Busy: "Busy";
		Calling: "Calling";
		Unavailable: "Unavailable";
		Declined: "Declined";
		Ready: "Ready";
		Connecting: "Connecting";
		Connected: "Connected";
		Failed: "Failed";
	}>;
}
