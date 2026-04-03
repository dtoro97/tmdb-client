import { Video } from '../../api';
import type { MediaType } from '../types';

export interface VideoCardItem {
    mediaId: number;
    mediaType: MediaType;
    mediaTitle: string;
    mediaYear?: string;
    mediaOverview?: string;
    mediaPosterPath?: string | null;
    backdropPath?: string | null;
    video?: Video;
    videoId: string;
    videoKey: string;
    videoName: string;
    videoPublishedAt?: string;
    videoDurationLabel?: string;
    mediaLink: [string, number, MediaType];
    openVideoLabel: string;
    videoTypeLabel: string;
    videoUrl: string;
}
