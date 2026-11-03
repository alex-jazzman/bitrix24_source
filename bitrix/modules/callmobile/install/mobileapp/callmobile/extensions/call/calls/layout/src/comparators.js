jn.define('src/comparators', (require, exports, module) => {
	const USER_DATA_BAKED_FIELDS = [
		'id',
		'name',
		'avatar',
		'state',
		'cameraState',
		'microphoneState',
		'screenState',
		'floorRequestState',
		'talking',
	];

	function sameViewableIds(a, b)
	{
		if (a === b)
		{
			return true;
		}

		if (a == null && b == null)
		{
			return true;
		}

		if (a == null || b == null)
		{
			return false;
		}

		if (a.length !== b.length)
		{
			return false;
		}

		const set = new Set(a);
		return b.every((id) => set.has(id));
	}

	function computeStreamSig(streams)
	{
		if (streams == null)
		{
			return '';
		}

		return Object.keys(streams).sort().join(',');
	}

	// ASM-01 (NORMATIVE): index-based comparison is only correct while the order of
	// userRegistry.users is stable. Sorting happens in _sort() on push only (by `order`).
	// A dynamic re-sort of the same user set returns false — an overestimate, not a bug
	// (one extra render). See SDD §ASM-01.
	//
	// `snapshotArr` is the previous immutable snapshot of `USER_DATA_BAKED_FIELDS`
	// (see `snapshotUsersContent`), not a live `UserModel`. Live `UserModel.data` is
	// mutated in place, so a live↔live comparison reports equality even after real field
	// changes and skips the render. The snapshot pins the values as of the previous
	// `update()`.
	function sameUsersContent(newUsers, snapshotArr)
	{
		if (newUsers == null || snapshotArr == null || newUsers.length !== snapshotArr.length)
		{
			return false;
		}

		for (let i = 0; i < newUsers.length; i++)
		{
			const newData = newUsers[i].data;
			const snap = snapshotArr[i];
			for (const field of USER_DATA_BAKED_FIELDS)
			{
				if (newData[field] !== snap[field])
				{
					return false;
				}
			}
		}

		return true;
	}

	function snapshotUsersContent(users)
	{
		const result = new Array(users.length);
		for (let i = 0; i < users.length; i++)
		{
			const src = users[i].data;
			const snap = {};
			for (const field of USER_DATA_BAKED_FIELDS)
			{
				snap[field] = src[field];
			}
			result[i] = snap;
		}
		return result;
	}

	module.exports = {
		USER_DATA_BAKED_FIELDS,
		sameViewableIds,
		computeStreamSig,
		sameUsersContent,
		snapshotUsersContent,
	};
});
