import { Type } from 'main.core';

import Util from '../util';

export class AuthoritativeUserNameService
{
	#scopeKey = null;
	#scopeEpoch = 0;
	#authoritativeNames = {};
	#pendingRequests = {};

	resolveUserData(call, userData, userIds, getCurrentName = null)
	{
		this.#ensureScope(call);

		if (!Type.isPlainObject(userData))
		{
			return {};
		}

		const result = {};
		for (const userId of this.#normalizeUserIds(userIds))
		{
			const sourceUserData = Type.isPlainObject(userData[userId]) ? userData[userId] : {};
			const resolvedName = this.resolveDisplayName(userId, sourceUserData.name, getCurrentName?.(userId));

			result[userId] = { ...sourceUserData };
			if (resolvedName)
			{
				result[userId].name = resolvedName;
			}
		}

		return result;
	}

	resolveDisplayName(userId, transportName, currentName = null)
	{
		const key = String(userId);
		const authoritativeName = this.#authoritativeNames[key];

		return authoritativeName || currentName || transportName;
	}

	setAuthoritativeUserName(userId, name)
	{
		if (!userId || !name)
		{
			return;
		}

		this.#authoritativeNames[String(userId)] = name;
	}

	fetchUserData(call, userIds, options = {})
	{
		this.#ensureScope(call);

		const force = options.force === true;
		const requestUserIds = this.#normalizeUserIds(userIds).filter((userId) => {
			const key = String(userId);

			return !Object.prototype.hasOwnProperty.call(this.#pendingRequests, key) && (force || (
				!Object.prototype.hasOwnProperty.call(this.#authoritativeNames, key)
			));
		});

		if (requestUserIds.length === 0)
		{
			return Promise.resolve({});
		}

		const requestData = this.#getRequestData(call, requestUserIds);
		if (!requestData)
		{
			return Promise.resolve({});
		}

		const scopeKey = this.#scopeKey;
		const scopeEpoch = this.#scopeEpoch;
		const request = BX.ajax.runAction('call.CallManager.getUsers', {
			data: requestData,
		}).then((response) => {
			this.#clearPending(requestUserIds);

			if (scopeKey !== this.#scopeKey || scopeEpoch !== this.#scopeEpoch)
			{
				return {};
			}

			const responseData = Type.isPlainObject(response.data) ? response.data : {};
			const result = {};

			for (const userId of requestUserIds)
			{
				const userRecord = Type.isPlainObject(responseData[userId]) ? responseData[userId] : null;
				if (!userRecord)
				{
					continue;
				}

				const key = String(userId);
				if (
					userRecord.name
					&& (force || !Object.prototype.hasOwnProperty.call(this.#authoritativeNames, key))
				)
				{
					this.#authoritativeNames[key] = userRecord.name;
				}

				result[userId] = { ...userRecord };
				if (this.#authoritativeNames[key])
				{
					result[userId].name = this.#authoritativeNames[key];
				}
			}

			return result;
		}).catch((error) => {
			this.#clearPending(requestUserIds);
			console.warn('[Call] Failed to fetch authoritative user names', error);

			return {};
		});

		for (const userId of requestUserIds)
		{
			this.#pendingRequests[String(userId)] = request;
		}

		return request;
	}

	reset()
	{
		this.#scopeKey = null;
		this.#scopeEpoch++;
		this.#authoritativeNames = {};
		this.#pendingRequests = {};
	}

	#ensureScope(call)
	{
		const scopeKey = this.#getScopeKey(call);
		if (scopeKey === this.#scopeKey)
		{
			return;
		}

		this.#scopeKey = scopeKey;
		this.#scopeEpoch++;
		this.#authoritativeNames = {};
		this.#pendingRequests = {};
	}

	#getRequestData(call, userIds)
	{
		if (!call)
		{
			return null;
		}

		const data = { userIds };
		if (call.uuid)
		{
			data.callUuid = call.uuid;

			return data;
		}

		if (Util.isLegacyCall(call.provider, call.scheme) && call.id)
		{
			data.callId = call.id;

			return data;
		}

		if (call.id)
		{
			data.callId = call.id;

			return data;
		}

		return null;
	}

	#getScopeKey(call)
	{
		if (!call)
		{
			return null;
		}

		return `${call.provider || ''}:${call.scheme || ''}:${call.uuid || call.id || ''}`;
	}

	#normalizeUserIds(userIds)
	{
		return [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter((userId) => {
			return userId !== null && userId !== undefined;
		}))];
	}

	#clearPending(userIds)
	{
		for (const userId of userIds)
		{
			delete this.#pendingRequests[String(userId)];
		}
	}
}
