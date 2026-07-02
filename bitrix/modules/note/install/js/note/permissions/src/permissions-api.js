import { ajax as Ajax } from 'main.core';
import type { PermissionPayloadItem, CollectionPermissionsPayload } from './type';

export type CollectionResponse = {
	id: number,
	name?: string,
	position?: number,
};

export class PermissionsApi
{
	loadCollectionPermissions(collectionId: number): Promise<CollectionPermissionsPayload>
	{
		return Ajax.runAction('note.infrastructure.CollectionController.getPermissions', {
			data: { id: collectionId },
		}).then((response) => response?.data || {});
	}

	saveCollectionPermissions(
		collectionId: number,
		policyLevel: string,
		permissions: PermissionPayloadItem[],
	): Promise<boolean>
	{
		return Ajax.runAction('note.infrastructure.CollectionController.savePermissions', {
			data: {
				id: collectionId,
				policyLevel,
				permissions: Array.isArray(permissions) ? permissions : [],
			},
		}).then((response) => response?.data || false);
	}

	loadDocumentPermissions(documentId: number): Promise<CollectionPermissionsPayload>
	{
		return Ajax.runAction('note.infrastructure.DocumentController.getPermissions', {
			data: { id: documentId },
		}).then((response) => response?.data || {});
	}

	saveDocumentPermissions(
		documentId: number,
		permissions: PermissionPayloadItem[],
	): Promise<boolean>
	{
		return Ajax.runAction('note.infrastructure.DocumentController.savePermissions', {
			data: {
				id: documentId,
				permissions: Array.isArray(permissions) ? permissions : [],
			},
		}).then((response) => response?.data || false);
	}

	createCollection(name: string, position: number = 0): Promise<CollectionResponse | null>
	{
		return Ajax.runAction('note.infrastructure.CollectionController.create', {
			data: { name, position },
		}).then((response) => response?.data || null);
	}

	updateCollection(collectionId: number, name: string): Promise<mixed>
	{
		return Ajax.runAction('note.infrastructure.CollectionController.update', {
			data: { id: collectionId, name },
		}).then((response) => response?.data || null);
	}

	deleteCollection(collectionId: number): Promise<boolean>
	{
		return Ajax.runAction('note.infrastructure.CollectionController.delete', {
			data: { id: collectionId },
		}).then((response) => Boolean(response?.data));
	}
}
