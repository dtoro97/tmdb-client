import { PersonCardItem, RemoteData } from '../../../shared';

export interface CreditsSummary {
    readonly topCastState: RemoteData<PersonCardItem[]>;
    readonly directors: readonly CreditsSummaryLink[];
    readonly creators: readonly CreditsSummaryLink[];
}

export interface CreditsSummaryLink {
    readonly id?: number | null;
    readonly name?: string | null;
}
