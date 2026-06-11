import { z } from 'zod';

export const VideoTagsSchema = z.object({
  firstChannel: z.string(),
  secondChannel: z.string(),
  ordinaryTags: z.array(z.string()),
});

export const VideoDataSchema = z
  .object({
    bvid: z.string().regex(/^BV[A-Za-z0-9]+$/),
    url: z.string().url(),
    cover: z.string().url(),
    title: z.string(),
    UP: z.string(),
    mid: z.number().optional(),
    views: z.number().nonnegative(),
    duration: z.number().nonnegative().optional(),
    pubdate: z.number().nonnegative().optional(),
    tags: VideoTagsSchema,
    dimension: z
      .object({
        width: z.number(),
        height: z.number(),
        rotate: z.number(),
      })
      .optional(),
    pages: z.number().int().nonnegative().optional(),
    desc: z.string().optional(),
    tid: z.number().optional(),
    tid_v2: z.number().optional(),
    tnamev2: z.string().optional(),
    shortLink: z.string().optional(),
    honors: z.array(z.string()).optional(),
    rights: z
      .object({
        isCooperation: z.boolean(),
        isSteinGate: z.boolean(),
        is360: z.boolean(),
      })
      .optional(),
    pubLocation: z.string().optional(),
    upMeta: z
      .object({
        mid: z.number(),
        followers: z.number().nullable().optional(),
        sign: z.string().optional(),
        level: z.number().optional(),
        official: z.number().optional(),
      })
      .optional(),
  })
  .passthrough();

export const CrawlResultSchema = z.object({
  time: z.number().positive(),
  video: z.array(VideoDataSchema),
});

export type VideoDataParsed = z.infer<typeof VideoDataSchema>;
export type CrawlResultParsed = z.infer<typeof CrawlResultSchema>;
