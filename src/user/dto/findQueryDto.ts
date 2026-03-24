import { UserRole } from "../userRolesEnum";

export class FindQueryDto{
    
    name?:string;
    email?:string;
    id?:string;
    username?:string;
    institute?:string;
    role?:UserRole;
}