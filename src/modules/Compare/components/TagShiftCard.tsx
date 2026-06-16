'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/common/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { fadeUp } from '@/common/styles/motion';

type TagShift = {
  newTags: string[];
  droppedTags: string[];
  commonTags: number;
};

type TagMap = Map<string, number>;

const TagShiftCard: React.FC<{
  shift: TagShift;
  tagMapA: TagMap;
  tagMapB: TagMap;
}> = ({ shift, tagMapA, tagMapB }) => {
  const { t } = useTranslation();
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('compare.sections.tags')}</CardTitle>
          <CardDescription>
            {t('compare.tagsCommon', { count: shift.commonTags })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TagColumn
              title={t('compare.tagsNew')}
              count={shift.newTags.length}
              tags={shift.newTags.slice(0, 30)}
              tagMap={tagMapB}
              variant="new"
              t={t}
            />
            <TagColumn
              title={t('compare.tagsDropped')}
              count={shift.droppedTags.length}
              tags={shift.droppedTags.slice(0, 30)}
              tagMap={tagMapA}
              variant="dropped"
              t={t}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function TagColumn({
  title,
  count,
  tags,
  tagMap,
  variant,
  t,
}: {
  title: string;
  count: number;
  tags: ReadonlyArray<string>;
  tagMap: TagMap;
  variant: 'new' | 'dropped';
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const badgeCls =
    variant === 'new'
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-rose-700 dark:text-rose-400';
  const borderColor =
    variant === 'new' ? 'rgb(16 185 129 / 0.4)' : 'rgb(244 63 94 / 0.4)';
  const badgeVariantCls =
    variant === 'new'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        <Badge variant="secondary" className={badgeVariantCls}>
          {title}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {t('compare.countUnit', { count })}
        </span>
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={badgeCls}
            style={{ borderColor }}
          >
            {tag}
            {tagMap.has(tag) && (
              <span className="text-muted-foreground ml-1.5 text-[10px]">
                ×{tagMap.get(tag)}
              </span>
            )}
          </Badge>
        ))}
        {tags.length === 0 && (
          <p className="text-muted-foreground text-xs">—</p>
        )}
      </div>
    </div>
  );
}

export default TagShiftCard;
