export interface UserAccountProfile {
    readonly accountId: number;
    readonly username: string | null;
    readonly name: string | null;
    readonly avatarPath: string | null;
    readonly language: string | null;
    readonly region: string | null;
    readonly includeAdult: boolean;
}

export type UserAccountIdentity = Pick<
    UserAccountProfile,
    'accountId' | 'username'
>;
