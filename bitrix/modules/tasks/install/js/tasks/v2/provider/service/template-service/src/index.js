import { mapPermissionDtoToModel, mapPermissionModelToDto, mapDtoToTaskDto, mapRights } from './mappers';

export { templateService } from './template-service';
export const TemplateMappers = { mapPermissionDtoToModel, mapPermissionModelToDto, mapDtoToTaskDto, mapRights };

export { permissionBuilder } from './mappers/permission-builder';
export type { TemplatePermission } from './types';
