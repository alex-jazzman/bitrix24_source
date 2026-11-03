/**
 * Phrase directory of the moderation and media-failure notifications: the two decision tables
 * NotificationService used to carry as nested branches.
 *
 * A function here answers one question, which phrase key describes what happened, and answers it
 * from its arguments alone. No dictionary, no DOM, no service: reading the phrase and showing the
 * balloon stay with the caller, which is what keeps these functions coverable on their own.
 *
 * The directory is deliberately outside the entry point of the extension: it is imported by the
 * service and its test by relative path, and adds nothing to the public surface of `call.core`.
 */

const ROOM_SETTING_ICONS = Object.freeze({
	audio: 'mic',
	video: 'cam',
	screen_share: 'screenshare',
});

/**
 * Which phrase a room setting change gets: prohibited or allowed, by me or by an administrator.
 * The administrator rows name a phrase family: the gender of the initiator is appended to it.
 */
const ROOM_SETTING_PHRASES = Object.freeze({
	prohibited: {
		own: {
			audio: 'CALL_YOU_PROHIBITED_MIC_FOR_ALL_BY_SETTINGS',
			video: 'CALL_YOU_PROHIBITED_CAM_FOR_ALL_BY_SETTINGS',
			screen_share: 'CALL_YOU_PROHIBITED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
		},
		admin: {
			audio: 'CALL_ADMIN_PROHIBITED_MIC_FOR_ALL_BY_SETTINGS',
			video: 'CALL_ADMIN_PROHIBITED_CAM_FOR_ALL_BY_SETTINGS',
			screen_share: 'CALL_ADMIN_PROHIBITED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
		},
	},
	allowed: {
		own: {
			audio: 'CALL_YOU_ALLOWED_MIC_FOR_ALL_BY_SETTINGS',
			video: 'CALL_YOU_ALLOWED_CAM_FOR_ALL_BY_SETTINGS',
			screen_share: 'CALL_YOU_ALLOWED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
		},
		admin: {
			audio: 'CALL_ADMIN_ALLOWED_MIC_FOR_ALL_BY_SETTINGS',
			video: 'CALL_ADMIN_ALLOWED_CAM_FOR_ALL_BY_SETTINGS',
			screen_share: 'CALL_ADMIN_ALLOWED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
		},
	},
});

/**
 * What the browser refused, by the name of the error it raised.
 * A family that has no row for the requested devices shows nothing.
 */
const MEDIA_FAILURE_PHRASES = Object.freeze({
	denied: {
		micAndCam: 'CALL_DEVICE_ACCESS_DENIED_ALLOW_MIC_AND_CAM',
		mic: 'CALL_DEVICE_ACCESS_DENIED_ALLOW_MIC',
		cam: 'CALL_DEVICE_ACCESS_DENIED_ALLOW_CAM',
	},
	overconstrained: {
		mic: 'CALL_DEVICE_ACCESS_DENIED_USING_DEFAULT_MIC',
		cam: 'CALL_DEVICE_ACCESS_DENIED_USING_DEFAULT_CAM',
	},
	inUse: {
		mic: 'CALL_DEVICE_ACCESS_DENIED_MIC_IN_USE',
		cam: 'CALL_DEVICE_ACCESS_DENIED_CAM_IN_USE',
	},
});

/**
 * @typedef {object} RoomSettingsPhrase
 * @property {string|undefined} phraseKey - key of the phrase to read, undefined for an unknown device
 * @property {string} iconSuffix - tail of the icon class, appended to `bx-call-view-`
 * @property {boolean} isAllow - the change allows rather than prohibits: colours the balloon
 * @property {boolean} usesGenderChannel - the phrase carries the initiator, so it is read through
 *   the gendered channel with a name substitution; otherwise it is a plain phrase
 */

/**
 * Decides which phrase describes a change of the room settings.
 *
 * Pure function: same input, same output, no side effects, no external state.
 *
 * @param {object} params
 * @param {boolean} params.eft - the change prohibits the device (strictly true) rather than allows it
 * @param {string} params.act - device the change is about: audio, video or screen_share
 * @param {boolean} params.isOwnInitiator - the local user is the one who changed the setting
 * @param {string} params.initiatorGender - gender of the initiator, appended to a gendered phrase
 * @returns {RoomSettingsPhrase}
 */
export function getRoomSettingsPhrase({ eft, act, isOwnInitiator, initiatorGender })
{
	const isAllow = eft !== true;
	const usesGenderChannel = !isOwnInitiator;

	const phrases = ROOM_SETTING_PHRASES[isAllow ? 'allowed' : 'prohibited'][isOwnInitiator ? 'own' : 'admin'];
	const phraseKey = phrases[act];

	return {
		phraseKey: usesGenderChannel && phraseKey !== undefined ? `${phraseKey}_${initiatorGender}` : phraseKey,
		iconSuffix: `${ROOM_SETTING_ICONS[act]}-${isAllow ? 'unmuted' : 'muted'}`,
		isAllow,
		usesGenderChannel,
	};
}

/**
 * Names the family of a media failure by the error the browser raised.
 *
 * @param {string} errorName
 * @param {string} errorMessage
 * @returns {string} key of MEDIA_FAILURE_PHRASES, empty when the error is none of the known ones
 */
function getFailureFamily(errorName, errorMessage)
{
	if (errorName === 'PermissionDeniedError' || errorName === 'NotAllowedError')
	{
		return 'denied';
	}

	if (errorName === 'OverconstrainedError')
	{
		return 'overconstrained';
	}

	if (errorName === 'NotReadableError' || (errorName === 'AbortError' && errorMessage === 'Starting videoinput failed'))
	{
		return 'inUse';
	}

	return '';
}

/**
 * Names what was asked of the browser: both devices, the microphone alone or the camera alone.
 *
 * @param {object} options
 * @param {boolean} options.audio
 * @param {boolean} options.video
 * @returns {string} key of a phrase family row, empty when nothing was asked for
 */
function getRequestedDevices({ audio, video })
{
	if (audio && video)
	{
		return 'micAndCam';
	}

	if (audio)
	{
		return 'mic';
	}

	if (video)
	{
		return 'cam';
	}

	return '';
}

/**
 * Decides which phrase describes a refusal of access to the media devices.
 *
 * Pure function: same input, same output, no side effects, no external state. An empty string is
 * the answer "nothing is shown": several combinations of error and requested devices have no phrase.
 *
 * @param {object} params
 * @param {string} params.errorName - name of the error the browser raised
 * @param {string} [params.errorMessage] - its message, read only for AbortError
 * @param {{audio: boolean, video: boolean}} params.options - what was asked of the browser
 * @returns {string} phrase key, or an empty string when there is nothing to show
 */
export function getUserMediaFailurePhrase({ errorName, errorMessage, options })
{
	const phrases = MEDIA_FAILURE_PHRASES[getFailureFamily(errorName, errorMessage)];

	// the requested devices are read only once the error is one we speak about, the way the ladder
	// of the service reached them
	if (!phrases)
	{
		return '';
	}

	return phrases[getRequestedDevices(options)] ?? '';
}
