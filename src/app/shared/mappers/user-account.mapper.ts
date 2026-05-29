import { AccountDetails } from '../../api';
import { UserAccountIdentity, UserAccountProfile } from '../models';

function ensureAccountId(account: AccountDetails): number {
    const accountId = account.id;

    if (typeof accountId !== 'number' || !Number.isInteger(accountId)) {
        throw new Error('The account service did not return a valid account id.');
    }

    return accountId;
}

export function toUserAccountIdentity(
    account: AccountDetails,
): UserAccountIdentity {
    return {
        accountId: ensureAccountId(account),
        username: account.username?.trim() || null,
    };
}

export function toUserAccountProfile(
    account: AccountDetails,
): UserAccountProfile {
    const tmdbAvatarPath = account.avatar?.tmdb?.avatar_path ?? null;

    return {
        accountId: ensureAccountId(account),
        username: account.username?.trim() || null,
        name: account.name?.trim() || null,
        avatarPath: tmdbAvatarPath,
        language: account.iso_639_1 ?? null,
        region: account.iso_3166_1 ?? null,
        includeAdult: account.include_adult ?? false,
    };
}
