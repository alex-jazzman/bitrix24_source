/**
 * @module layout/socialnetwork/project-v2/create/src/helpers/project-avatar
 */
jn.define('layout/socialnetwork/project-v2/create/src/helpers/project-avatar', (require, exports, module) => {
	const { ProjectAvatarMode } = require('layout/socialnetwork/project-v2/create/src/enum/project-avatar-mode');

	const getModeValue = (mode) => {
		return ProjectAvatarMode.has(mode) ? mode.getValue() : mode;
	};

	const normalizeAvatar = (avatar = null, image = null) => {
		const mode = getModeValue(avatar?.mode);
		const avatarId = normalizeAvatarId(avatar?.id ?? avatar?.file?.id);
		const imageId = normalizeAvatarId(image?.id ?? image?.file?.id);

		if (avatar && ProjectAvatarMode.isDefined(mode))
		{
			if (mode === ProjectAvatarMode.REMOVE.getValue())
			{
				return {
					mode,
					id: null,
					previewUrl: null,
					base64: null,
				};
			}

			return {
				mode,
				id: avatarId ?? imageId,
				previewUrl: avatar.previewUrl ?? image?.previewUrl ?? null,
				base64: avatar.base64 ?? null,
			};
		}

		if (image?.base64 || imageId)
		{
			return {
				mode: ProjectAvatarMode.UPLOAD.getValue(),
				id: imageId,
				previewUrl: image.previewUrl ?? null,
				base64: image.base64,
			};
		}

		return {
			mode: ProjectAvatarMode.UNCHANGED.getValue(),
			id: imageId,
			previewUrl: image?.previewUrl ?? null,
			base64: null,
		};
	};

	const createUploadedAvatar = (image = {}) => normalizeAvatar({
		mode: ProjectAvatarMode.UPLOAD,
		id: image.id ?? image.file?.id ?? null,
		previewUrl: image.previewUrl ?? null,
		base64: image.base64 ?? null,
	});

	const createRemovedAvatar = () => normalizeAvatar({
		mode: ProjectAvatarMode.REMOVE,
	});

	const hasAvatarPreview = (avatar) => Boolean(normalizeAvatar(avatar).previewUrl);

	const normalizeAvatarId = (value) => {
		const avatarId = Number(value);

		return Number.isInteger(avatarId) && avatarId > 0 ? avatarId : null;
	};

	const buildAvatarPayload = (avatar, image = null, isEditMode = false) => {
		const normalizedAvatar = normalizeAvatar(avatar, image);
		const mode = normalizedAvatar.mode;

		if (mode === ProjectAvatarMode.UPLOAD.getValue())
		{
			if (normalizedAvatar.base64)
			{
				return {
					encodedFile: normalizedAvatar.base64,
				};
			}

			if (normalizedAvatar.id)
			{
				return {
					id: normalizedAvatar.id,
				};
			}

			return null;
		}

		if (isEditMode && mode === ProjectAvatarMode.REMOVE.getValue())
		{
			return {
				encodedFile: '',
			};
		}

		return null;
	};

	module.exports = {
		normalizeAvatar,
		createUploadedAvatar,
		createRemovedAvatar,
		hasAvatarPreview,
		buildAvatarPayload,
	};
});
