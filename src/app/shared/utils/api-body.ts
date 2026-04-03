import { AccountAddFavoriteRequest } from '../../api';

/**
 * Wraps a plain object as the generated API body type.
 * The generated client expects `AccountAddFavoriteRequest` for all POST bodies,
 * but the actual shape varies per endpoint.
 */
export function buildRawBody(
    body: Record<string, boolean | number | string>,
): AccountAddFavoriteRequest {
    return body as unknown as AccountAddFavoriteRequest;
}
