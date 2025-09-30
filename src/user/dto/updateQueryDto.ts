import { Types } from "mongoose";
import { UserRole } from "../userRolesEnum";
import { IsNotEmpty } from "class-validator";

export class UpdateQueryDto{

    name?:string;
    email?:string;
    institute?:string;
    role?:UserRole;
    pfp?:string;
    phone?:string;
}