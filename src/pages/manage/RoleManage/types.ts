export interface IUser {
  id: string;
  username: string;
  fullName: string;
}

export interface IUserRole {
  userId: string;
  roleIds: string[];
}

export interface IRole {
  roleId: string;
  roleName: string;
}

export interface IPermission {
  id: string;
  code: string;
  name: string;
}

export interface IRolePermission {
  roleId: string;
  permissionIds: string[];
}
