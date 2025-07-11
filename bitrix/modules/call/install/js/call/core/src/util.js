import { Type, Extension } from 'main.core';
import { CallEngine, Provider, RoomType } from './engine/engine';
import { CallEngineLegacy } from './engine/engine_legacy';
import { ClientPlatform, ClientVersion, MediaStreamsKinds } from './call_api';
import { CallTokenManager } from 'call.lib.call-token-manager';
import { CallSettingsManager } from 'call.lib.settings-manager';
import { CallAI } from './call_ai';

import {EventEmitter} from 'main.core.events'
import {Event} from 'main.core';

const blankAvatar = '/bitrix/js/im/images/blank.gif';

let userData = {}
let usersInProcess = {}

let abortController= null;

/* User role & room permission */
let roomPermissions =
{
	AudioEnabled: false,
	VideoEnabled: false,
	ScreenShareEnabled: false,
};

let userPermissions =
{
	ask: false,
	audio: true,
	can_approve: false,
	change_role: false,
	change_settings: false,
	end_call: false,
	give_permissions: false,
	invite: false,
	join_call: false,
	kick_user: false,
	mute: false,
	mute_others: false,
	record_call: false,
	screen_share: true,
	update: false,
	video: true,
	view_users: false,
};

const UsersRoles =
{
	ADMIN: 'ADMIN', // chat admin
	MANAGER: 'MANAGER', // aka moderator
	USER: 'USER', // regular user
}

const regularUserRoles = [UsersRoles.USER]; // TODO got this from signaling in future

let currentUserRole = UsersRoles.USER;

function setCurrentUserRole(role)
{
	if (role)
	{
		currentUserRole = role.toUpperCase();
	}
}

function setRoomPermissions(_roomPermissions)
{
	if (!Type.isPlainObject(_roomPermissions))
	{
		return;
	}

	roomPermissions = _roomPermissions;
}

function setUserPermissionsByRoomPermissions(_roomPermissions)
{
	if (this.isRegularUser(this.getCurrentUserRole()))
	{
		let permissions = this.getUserPermissions();

		for (let permission in _roomPermissions)
		{
			if (_roomPermissions.hasOwnProperty(permission))
			{
				switch (permission)
				{
					case 'AudioEnabled':
						permissions.audio = _roomPermissions[permission];
						break;
					case 'VideoEnabled':
						permissions.video = _roomPermissions[permission];
						break;
					case 'ScreenShareEnabled':
						permissions.screen_share = _roomPermissions[permission];
						break;
				}
			}
		}

		this.setUserPermissions(permissions);
	}
}

function updateUserPermissionByNewRoomPermission(_roomPermission, value)
{
	if (this.isRegularUser(this.getCurrentUserRole()))
	{
		let permissions = this.getUserPermissions();

		switch (_roomPermission)
		{
			case 'audio':
				permissions.audio = value;
				break;
			case 'video':
				permissions.video = value;
				break;
			case 'screen_share':
				permissions.screen_share = value;
				break;
		}

		this.setUserPermissions(permissions);
	}
}

function isRegularUser(_role)
{
	return regularUserRoles.includes(_role);
}

function getRoomPermissions()
{
	return roomPermissions;
}

function setUserPermissions(_userPermissions)
{
	if (Type.isPlainObject(_userPermissions))
	{
		for (let permission in _userPermissions)
		{
			if (userPermissions.hasOwnProperty(permission))
			{
				userPermissions[permission] = _userPermissions[permission];
			}
		}
	}
}

function getUserPermissions()
{
	return userPermissions;
}

function getCurrentUserRole()
{
	return currentUserRole;
}

function havePermissionToBroadcast(type)
{
	let havePermission = false;

	switch (type)
	{
		case 'mic':

			havePermission = userPermissions.audio;
			break;
		case 'cam':

			havePermission = userPermissions.video;
			break;
		case 'screenshare':

			havePermission = userPermissions.screen_share;
			break;
	}

	return havePermission;
}

function canControlChangeSettings()
{
	return !!(userPermissions.change_settings && getCurrentBitrixCall());
}

function canControlGiveSpeakPermission()
{
	return !!userPermissions.give_permissions;
}

function getUserRoleByUserId(userId)
{
	if (userData.hasOwnProperty(userId))
	{
		return userData[userId].role;
	}
}

/* ------ */

function updateUserData(callId, users)
{
	let usersToUpdate = [];
	for (let i = 0; i < users.length; i++)
	{
		if (userData.hasOwnProperty(users[i]))
		{
			continue;
		}

		usersToUpdate.push(users[i]);
	}

	let result = new Promise((resolve, reject) =>
	{
		if (usersToUpdate.length === 0 || !callId)
		{
			return resolve();
		}

		CallEngine.getRestClient().callMethod("im.call.getUsers", {
			callId: callId,
			userIds: usersToUpdate
		}).then((response) =>
		{
			const result = Type.isPlainObject(response.answer.result) ? response.answer.result : {};
			users.forEach((userId) =>
			{
				if (result[userId])
				{
					userData[userId] = result[userId];
				}
				delete usersInProcess[userId];
			});
			resolve();

		}).catch(function (error)
		{
			reject(error.answer);
		});
	});

	for (let i = 0; i < usersToUpdate.length; i++)
	{
		usersInProcess[usersToUpdate[i]] = result;
	}
	return result;
}

function setUserData(users)
{
	for (let userId in users)
	{
		userData[userId] = users[userId];

	}

	//setCurrentUserRole(userData[CallEngine.getCurrentUserId()].role);
}

const getDateForLog = () =>
{
	const d = new Date();

	return d.getFullYear() + "-" + lpad(d.getMonth() + 1, 2, '0') + "-" + lpad(d.getDate(), 2, '0') + " " + lpad(d.getHours(), 2, '0') + ":" + lpad(d.getMinutes(), 2, '0') + ":" + lpad(d.getSeconds(), 2, '0') + "." + d.getMilliseconds();
}

const getTimeForLog = () =>
{
	const d = new Date();

	return lpad(d.getHours(), 2, '0') + ":" + lpad(d.getMinutes(), 2, '0') + ":" + lpad(d.getSeconds(), 2, '0') + "." + d.getMilliseconds();
}

function lpad(str, length, chr)
{
	str = str.toString();
	chr = chr || ' ';

	if (str.length > length)
	{
		return str;
	}

	let result = '';
	for (let i = 0; i < length - str.length; i++)
	{
		result += chr;
	}

	return result + str;
}

function getUser(callId, userId)
{
	return new Promise((resolve, reject) =>
	{
		if (userData.hasOwnProperty(userId))
		{
			return resolve(userData[userId]);
		}
		else if (usersInProcess.hasOwnProperty(userId))
		{
			usersInProcess[userId].then(() =>
			{
				return resolve(userData[userId]);
			});
		}
		else
		{
			updateUserData(callId, [userId]).then(() =>
			{
				return resolve(userData[userId]);
			});
		}
	});
}

function getUserCached(userId)
{
	return userData.hasOwnProperty(userId) ? userData[userId] : null;
}

function getUsers(callId, users)
{

	return new Promise((resolve, reject) =>
	{
		updateUserData(callId, users).then(() =>
		{
			let result = {};
			users.forEach(userId => result[userId] = userData[userId] || {});
			return resolve(result);
		});
	});
}

function getUserName(callId, userId)
{
	return new Promise((resolve, reject) =>
	{
		if (userData.hasOwnProperty(userId))
		{
			return resolve(userData[userId].name ? userData[userId].name : '');
		}
		else if (usersInProcess.hasOwnProperty(userId))
		{
			usersInProcess[userId].then(() =>
			{
				return resolve(userData[userId].name ? userData[userId].name : '');
			});
		}
		else
		{
			updateUserData(callId, [userId]).then(() =>
			{
				return resolve(userData[userId].name ? userData[userId].name : '');
			});
		}
	});
}

function getUserAvatar(callId, userId)
{
	return new Promise((resolve, reject) =>
	{
		if (userData.hasOwnProperty(userId))
		{
			return resolve(userData[userId].avatar_hr && !isBlank(userData[userId].avatar_hr) ? userData[userId].avatar_hr : '');
		}
		else if (usersInProcess.hasOwnProperty(userId))
		{
			usersInProcess[userId].then(() =>
			{
				return resolve(userData[userId].avatar_hr && !isBlank(userData[userId].avatar_hr) ? userData[userId].avatar_hr : '');
			});
		}
		else
		{
			updateUserData(callId, [userId]).then(() =>
			{
				return resolve(userData[userId].avatar_hr && !isBlank(userData[userId].avatar_hr) ? userData[userId].avatar_hr : '');
			});
		}
	});
}

function getUserAvatars(callId, users)
{
	return new Promise((resolve, reject) =>
	{
		updateUserData(callId, users).then(() =>
		{
			let result = {};
			users.forEach((userId) =>
			{
				result[userId] = userData[userId].avatar_hr && !isBlank(userData[userId].avatar_hr) ? userData[userId].avatar_hr : ''
			});
			return resolve(result);
		});
	});
}

function isAvatarBlank(url)
{
	return isBlank(url);
}

function getCustomMessage(message, userData)
{
	let messageText;
	if (!Type.isPlainObject(userData))
	{
		userData = {};
	}

	if (userData.gender && BX.message.hasOwnProperty(message + '_' + userData.gender))
	{
		messageText = BX.message(message + '_' + userData.gender);
	}
	else
	{
		messageText = BX.message(message);
	}

	userData = convertKeysToUpper(userData);

	return messageText.replace(/#.+?#/gm, function (match)
	{
		const placeHolder = match.substr(1, match.length - 2);
		return userData.hasOwnProperty(placeHolder) ? userData[placeHolder] : match;
	});
}

function convertKeysToUpper(obj)
{
	var result = BX.util.objectClone(obj);

	for (let k in result)
	{
		const u = k.toUpperCase();

		if (u != k)
		{
			result[u] = result[k];
			delete result[k];
		}
	}
	return result;
}

function appendChildren(parent, children)
{
	children.forEach(child => parent.appendChild(child))
}

function containsVideoTrack(stream: MediaStream)
{
	if (!(stream instanceof MediaStream))
	{
		return false;
	}

	return stream.getVideoTracks().length > 0;
}

function hasHdVideo(stream: MediaStream)
{
	if (!(stream instanceof MediaStream) || stream.getVideoTracks().length === 0)
	{
		return false;
	}

	var videoTrack = stream.getVideoTracks()[0];
	var trackSettings = videoTrack.getSettings();

	return trackSettings.width >= 1280;
}

function findBestElementSize(width, height, userCount, minWidth, minHeight)
{
	minWidth = minWidth || 0;
	minHeight = minHeight || 0;
	let bestFilledArea = 0;

	for (let i = 1; i <= userCount; i++)
	{
		const area = getFilledArea(width, height, userCount, i);
		if (area.area > bestFilledArea && area.elementWidth > minWidth && area.elementHeight > minHeight)
		{
			bestFilledArea = area.area;
			var bestWidth = area.elementWidth;
			var bestHeight = area.elementHeight;
		}
		if (area.area < bestFilledArea)
		{
			break;
		}
	}
	if (bestFilledArea === 0)
	{
		bestWidth = minWidth;
		bestHeight = minHeight
	}
	return {width: bestWidth, height: bestHeight};
}

function getFilledArea(width, height, userCount, rowCount)
{
	const columnCount = Math.ceil(userCount / rowCount);
	const maxElementWidth = Math.floor(width / columnCount);
	const maxElementHeight = Math.floor(height / rowCount);

	const ratio = maxElementHeight / maxElementWidth;
	const neededRatio = 9 / 16;

	let expectedElementHeight;
	let expectedElementWidth;

	if (ratio < neededRatio)
	{
		expectedElementHeight = maxElementHeight;
		expectedElementWidth = Math.floor(maxElementWidth * (ratio / neededRatio));
	}
	else
	{
		expectedElementWidth = maxElementWidth;
		expectedElementHeight = Math.floor(maxElementHeight * (neededRatio / ratio));
	}

	//console.log(expectedElementWidth + 'x' + expectedElementHeight)
	var area = expectedElementWidth * expectedElementHeight * userCount;

	return {area: area, elementWidth: expectedElementWidth, elementHeight: expectedElementHeight};
}

const isWebRTCSupported = () =>
{
	return (typeof webkitRTCPeerConnection != 'undefined' || typeof mozRTCPeerConnection != 'undefined' || typeof RTCPeerConnection != 'undefined');
}

const isCallServerAllowed = () =>
{
	return BX.message('call_server_enabled') === 'Y'
}

const isFeedbackAllowed = () =>
{
	return BX.message('call_allow_feedback') === 'Y'
}

const shouldCollectStats = () =>
{
	return BX.message('call_collect_stats') === 'Y'
}

const shouldShowDocumentButton = () =>
{
	return BX.message('call_docs_status') !== 'N' || BX.message('call_resumes_status') !== 'N';
}

const getDocumentsArticleCode = () =>
{
	if (!BX.message('call_docs_status').startsWith('L'))
	{
		return false;
	}

	return BX.message('call_docs_status').substr(2);
}

const getResumesArticleCode = () =>
{
	if (!BX.message('call_resumes_status').startsWith('L'))
	{
		return false;
	}

	return BX.message('call_resumes_status').substr(2);
}

const getUserLimit = () =>
{
	if (isCallServerAllowed())
	{
		return parseInt(BX.message('call_server_max_users'));
	}

	return parseInt(BX.message('turn_server_max_users'));
}

const getClientSelfTestUrl = () =>
{
	return BX.message('call_client_selftest_url') ?? '';
}

const getCallFeatures = () => {
	return BX.message('call_features')
}

function getLogMessage ()
{
	let text = getDateForLog();

	for (let i = 0; i < arguments.length; i++)
	{
		if (arguments[i] instanceof Error)
		{
			text = arguments[i].message + "\n" + arguments[i].stack
		}
		else
		{
			try
			{
				text = text + ' | ' + (typeof (arguments[i]) == 'object' ? JSON.stringify(arguments[i]) : arguments[i]);
			} catch (e)
			{
				text = text + ' | (circular structure)';
			}
		}
	}

	return text;
}

const getUuidv4 = () =>
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
	{
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function reportConnectionResult(callId, connectionResult)
{
	BX.ajax.runAction("im.call.reportConnection", {
		data: {
			callId: callId,
			connectionResult: connectionResult
		}
	})
}

function sendTelemetryEvent(options)
{

}

const isDesktop = () =>
{
	return typeof (BXDesktopSystem) != "undefined" || typeof (BXDesktopWindow) != "undefined";
}

const getBrowserForStatistics = () =>
{
	if (BX.browser.IsOpera())
	{
		return 'opera';
	}
	if (BX.browser.IsChrome())
	{
		return 'chrome';
	}
	if (BX.browser.IsFirefox())
	{
		return 'firefox';
	}
	if (BX.browser.IsSafari())
	{
		return 'safari';
	}
	return 'other';
}

function isBlank(url)
{
	return typeof (url) !== "string" || url == "" || url.endsWith(blankAvatar);
}

function stopMediaStreamAudioTracks(mediaStream)
{
	if (!mediaStream instanceof MediaStream)
	{
		return;
	}

	mediaStream.getAudioTracks().forEach(function (track)
	{
		if (track.kind === 'audio') {
			track.stop();
			mediaStream.removeTrack(track);
		}
	});
}

function stopMediaStreamVideoTracks(mediaStream)
{
	if (!mediaStream instanceof MediaStream)
	{
		return;
	}

	mediaStream.getTracks().forEach(function (track)
	{
		if (track.kind === 'video') {
			track.stop();
			mediaStream.removeTrack(track);
		}
	});
}

function stopMediaStream(mediaStream)
{
	if (!mediaStream instanceof MediaStream)
	{
		return;
	}

	mediaStream.getTracks().forEach(function (track)
	{
		track.stop()
	});
}

function getConferenceProvider(): string{
	if (isCallServerAllowed())
	{
		return Provider.Bitrix;
	}

	return Provider.Plain;
}

function getCurrentBitrixCall()
{
	for (let callId in CallEngine.calls)
	{
		if(CallEngine.calls[callId].BitrixCall)
		{
			return CallEngine.calls[callId];
			break;
		}
	}

	for (let callId in CallEngineLegacy.calls)
	{
		if(CallEngineLegacy.calls[callId].BitrixCall)
		{
			return CallEngineLegacy.calls[callId];
			break;
		}
	}

	return false;
}

function setCodecToReport(report, codecs, reportsWithoutCodecs)
{
	if (codecs[report.codecId])
	{
		report.codecName = codecs[report.codecId];
		return true;
	}
	return false;
}

function saveReportWithoutCodecs(report, reportsWithoutCodecs)
{
	if (reportsWithoutCodecs[report.codecId])
	{
		reportsWithoutCodecs[report.codecId].push(report);
	}
	else
	{
		reportsWithoutCodecs[report.codecId] = [report];
	}
}

function processReportsWithoutCodecs(report, codecs, reportsWithoutCodecs)
{
	codecs[report.id] = report.mimeType;
	if (reportsWithoutCodecs[report.id])
	{
		reportsWithoutCodecs[report.id].forEach(r =>
		{
			r.codecName = report.mimeType;
		});
		delete reportsWithoutCodecs[report.id];
	}
}

function setLocalPacketsLostOrSaveReport(report, remoteReports, reportsWithoutRemoteInfo)
{
	if (remoteReports[report.id])
	{
		const packetsLostData = calcLocalPacketsLost(report, remoteReports[report.id]);
		report.packetsLostData = packetsLostData;
		report.packetsLost = packetsLostData.totalPacketsLost;
		report.packetsLostExtended = formatPacketsLostData(packetsLostData);
		delete remoteReports[report.id];
		return true;
	}
	else if (!report.packetsLostExtended)
	{
		reportsWithoutRemoteInfo[report.id] = report;
		return false;
	}
}

function calcBitrate(currentReport, prevReport, isLocal)
{
	prevReport = prevReport || {};
	const bytes = isLocal
		? currentReport.bytesSent - (prevReport.bytesSent || 0)
		: currentReport.bytesReceived - (prevReport.bytesReceived || 0);
	const time = currentReport.timestamp - (prevReport.timestamp || 0);
	const bitrate = 8 * bytes / (time / 1000);
	return bitrate < 0 ? 0 : Math.trunc(bitrate);
}

function calcLocalPacketsLost(currentReport, prevReport, remoteReport)
{
	prevReport = prevReport || {};
	const packetsLost = Math.abs(remoteReport.packetsLost);
	const deltaPacketsSent = currentReport.packetsSent - (prevReport.packetsSent || 0);
	const deltaPacketsLost = packetsLost - (prevReport.packetsLost || 0);
	const percentPacketLost = (deltaPacketsLost / deltaPacketsSent) * 100 || 0;
	const percentPacketLostTotal = (packetsLost / currentReport.packetsSent) * 100 || 0;
	return {
		currentPacketsLost: deltaPacketsLost,
		currentPercentPacketLost: percentPacketLost >= 0 ? Math.trunc(percentPacketLost) : 0,
		totalPacketsLost: packetsLost,
		totalPercentPacketLost: Math.trunc(percentPacketLostTotal),
	};
}

function calcRemotePacketsLost(currentReport, prevReport)
{
	prevReport = prevReport || {};
	const packetsLost = Math.abs(currentReport.packetsLost);
	const deltaPacketsReceived = currentReport.packetsReceived - (prevReport.packetsReceived || 0);
	const deltaPacketsLost = packetsLost - (prevReport.packetsLost || 0);
	const percentPacketLost = (deltaPacketsLost / (deltaPacketsReceived + deltaPacketsLost)) * 100 || 0;
	const percentPacketLostTotal = (packetsLost / (currentReport.packetsReceived + packetsLost)) * 100 || 0;
	return {
		currentPacketsLost: deltaPacketsLost,
		currentPercentPacketLost:  percentPacketLost >= 0 ? Math.trunc(percentPacketLost) : 0,
		totalPacketsLost: packetsLost,
		totalPercentPacketLost:  Math.trunc(percentPacketLostTotal),
	};
}

function formatPacketsLostData(data)
{
	return `${data.currentPacketsLost} - ${data.currentPercentPacketLost}% (total: ${data.totalPacketsLost} - ${data.totalPercentPacketLost}%)`;
}

function getAvatarBackground()
{
	const colorList = ['#006484', '#00A2E8', '#559BE6', '#688800', '#7FA800', '#11A9D9', '#0B66C3', '#004F69', '#00789E', '#506900', '#828B95'];

	return colorList[Math.floor(Math.random() * colorList.length)];
}

function getRecordTimeText(recordState, returnInSeconds = false)
{
	if (!recordState)
	{
		return '';
	}

	const nowDate = new Date();
	let startDate = new Date(recordState.date.start);
	if (startDate.getTime() < nowDate.getDate())
	{
		startDate = nowDate;
	}

	const pauseTime = recordState.date.pause
		.map((element) =>
		{
			const finish = element.finish ? new Date(element.finish) : nowDate;
			return finish - new Date(element.start);
		})
		.reduce((sum, element) => sum + element, 0);

	let totalTime = nowDate - startDate - pauseTime;
	if (totalTime <= 0)
	{
		totalTime = 0;
	}

	let second = Math.floor(totalTime / 1000);

	if (returnInSeconds)
	{
		return second;
	}

	let hour = Math.floor(second / 60 / 60);
	if (hour > 0)
	{
		second -= hour * 60 * 60;
	}

	const minute = Math.floor(second / 60);
	if (minute > 0)
	{
		second -= minute * 60;
	}

	return (hour > 0 ? hour + ':' : '')
		+ (hour > 0 ? minute.toString().padStart(2, "0") + ':' : minute + ':')
		+ second.toString().padStart(2, "0")
		;
}

function getTimeText(startTime)
{
	if (!startTime)
	{
		return '';
	}

	const nowDate = new Date();
	let startDate = new Date(startTime);
	if (startDate.getTime() < nowDate.getDate())
	{
		startDate = nowDate;
	}

	let totalTime = nowDate - startDate;
	if (totalTime <= 0)
	{
		totalTime = 0;
	}

	let second = Math.floor(totalTime / 1000);

	let hour = Math.floor(second / 60 / 60);
	if (hour > 0)
	{
		second -= hour * 60 * 60;
	}

	const minute = Math.floor(second / 60);
	if (minute > 0)
	{
		second -= minute * 60;
	}

	return (hour > 0 ? hour + ':' : '')
		+ (hour > 0 ? minute.toString().padStart(2, "0") + ':' : minute + ':')
		+ second.toString().padStart(2, "0")
		;
}

function getTimeInSeconds(startTime)
{
	if (!startTime)
	{
		return '';
	}

	const nowDate = new Date();
	let startDate = new Date(startTime);
	if (startDate.getTime() < nowDate.getDate())
	{
		startDate = nowDate;
	}

	let totalTime = nowDate - startDate;
	if (totalTime <= 0)
	{
		totalTime = 0;
	}

	return Math.floor(totalTime / 1000);
}

const isConferenceChatEnabled = () =>
{
	return BX.message('conference_chat_enabled');
}

const getCallConnectionData = async (callOptions, chatId) => {
	if (!Type.isPlainObject(callOptions))
	{
		callOptions = {};
	}

	return new Promise(async (resolve, reject) =>
	{
		abortController = new AbortController();
		const callBalancerUrl = CallSettingsManager.callBalancerUrl;

		const roomType = callOptions.provider === Provider.Plain && CallSettingsManager.isJwtInPlainCallsEnabled()
			? RoomType.Personal
			: RoomType.Small;
		const url = `${callBalancerUrl}/v2/join`;

		const userToken = await CallTokenManager.getUserToken(chatId);

		const data = JSON.stringify({
			userToken,
			roomType,
			clientVersion: ClientVersion,
			clientPlatform: ClientPlatform,
			...callOptions,
		});

		fetch(url, {
			method: 'POST',
			body: data,
			signal: abortController.signal,
		})
			.then((response) => {
				return response.json();
			})
			.then((response) => {
				resolve(response);
			})
			.catch((error) => {
				try
				{
					if (error.xhr.responseText)
					{
						const response = JSON.parse(error.xhr.responseText);
						if (response.error)
						{
							reject(response);
						}
					}
				}
				catch (e)
				{
					reject(e);
				}

				reject(error);
			})
			.finally(() => {
				abortController = null;
			});
	});
};

const getCallConnectionDataById = async (callUuid) =>
{
	try
	{
		const call = await CallEngine.getCallWithId(callUuid);

		return getCallConnectionData({
			callType: call.call.type,
			instanceId: call.call.instanceId,
			provider: call.call.provider,
			roomId: call.call.uuid,
			callToken: CallTokenManager.getTokenCached(call.call.associatedEntity.chatId),
		}, call.call.associatedEntity.chatId);
	}
	catch (error)
	{
		throw error;
	}
}

const abortGetCallConnectionData = () => {
	abortController?.abort();
};

function startSelfTest()
{
	const link = BX.Call.Util.getClientSelfTestUrl();

	if (isDesktop()) {
		window.open(link, '_blank', 'popup');
		return;
	}

	window.open(link, '_blank');
}

const useTcpSdp = () =>
{
	return BX.message('call_use_tcp_sdp') === 'Y';
}

function openArticle(articleCode)
{
	const infoHelper = BX.UI.InfoHelper;

	if (infoHelper.isOpen())
	{
		infoHelper.close()
	}

	infoHelper.show(articleCode);
}

const getAiSettings = () =>
{
	return Extension.getSettings('call.core')?.ai || {};
}

const isUserControlFeatureEnabled = () =>
{
	return Extension.getSettings('call.core')?.isUserControlFeatureEnabled;
}

const isPictureInPictureFeatureEnabled = () =>
{
	return Extension.getSettings('call.core')?.isPictureInPictureFeatureEnabled;
}

const isNewQOSEnabled = () =>
{
	return Extension.getSettings('call.core')?.isNewQOSEnabled;
}

const isNewFollowUpSliderEnabled = () =>
{
	return Extension.getSettings('call.core')?.isNewFollowUpSliderEnabled;
}

const isChatMountInPage = () =>
{
	return Extension.getSettings('call.core')?.isAirDesignEnabled && Extension.getSettings('call.core')?.shouldHideQuickAccess;
}

/* ws logger */

function sendLog(params)
{
	const evnt = new Event.BaseEvent({data: params});
	Event.EventEmitter.emit('BX.Call.Logger:sendLog', evnt);
}


export default {
	updateUserData,
	setUserData,
	getDateForLog,
	getTimeForLog,
	lpad,
	getUser,
	getUserCached,
	getUsers,
	getUserName,
	getUserAvatar,
	getUserAvatars,
	isAvatarBlank,
	getCustomMessage,
	convertKeysToUpper,
	appendChildren,
	containsVideoTrack,
	hasHdVideo,
	findBestElementSize,
	getFilledArea,
	isWebRTCSupported,
	isCallServerAllowed,
	isFeedbackAllowed,
	shouldCollectStats,
	shouldShowDocumentButton,
	getDocumentsArticleCode,
	getResumesArticleCode,
	getUserLimit,
	getClientSelfTestUrl,
	getLogMessage,
	getUuidv4,
	reportConnectionResult,
	sendTelemetryEvent,
	isDesktop,
	getBrowserForStatistics,
	isBlank,
	stopMediaStream,
    stopMediaStreamVideoTracks,
    stopMediaStreamAudioTracks,
	getConferenceProvider,
	getCurrentBitrixCall,
	setCodecToReport,
	saveReportWithoutCodecs,
	processReportsWithoutCodecs,
	setLocalPacketsLostOrSaveReport,
	calcBitrate,
	calcLocalPacketsLost,
	calcRemotePacketsLost,
	formatPacketsLostData,
	getCallFeatures,
	getAvatarBackground,
	getRecordTimeText,
	getTimeText,
	getTimeInSeconds,
	isConferenceChatEnabled,
	getCallConnectionData,
	getCallConnectionDataById,
	abortGetCallConnectionData,
	startSelfTest,
	useTcpSdp,
	openArticle,
	getAiSettings,
	isUserControlFeatureEnabled,
	isPictureInPictureFeatureEnabled,
	isNewQOSEnabled,
	sendLog,
	isNewFollowUpSliderEnabled,
	isChatMountInPage,
	roomPermissions,
	getCurrentUserRole,
	havePermissionToBroadcast,
	setRoomPermissions,
	getRoomPermissions,
	setUserPermissions,
	getUserPermissions,
	updateUserPermissionByNewRoomPermission,
	setUserPermissionsByRoomPermissions,
	canControlChangeSettings,
	canControlGiveSpeakPermission,
	setCurrentUserRole,
	UsersRoles,
	isRegularUser,
	getUserRoleByUserId,
}
