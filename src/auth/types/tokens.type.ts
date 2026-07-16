import { UserRole } from "generated/prisma/enums"

export type Tokens = {
    access_token:string
    refresh_token:string

}
export type SignInResponse={
    tokens:Tokens
    user:{
        uuid:string
        role:UserRole
        fullName: string
    }
}