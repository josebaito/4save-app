export declare enum UserType {
    ADMIN = "admin",
    TECNICO = "tecnico"
}
export declare class CreateUserDto {
    email: string;
    password: string;
    name: string;
    type: UserType;
    especialidade?: string;
    telefone?: string;
}
