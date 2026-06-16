'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaUserAlt } from 'react-icons/fa';

import DeltaChip from '@/common/components/composed/DeltaChip';
import { Badge } from '@/common/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { fadeUp } from '@/common/styles/motion';

type UpItem = { name: string; mid?: number; count: number };

type UpBuckets = {
  newUps: UpItem[];
  droppedUps: UpItem[];
  persistent: Array<{ a: UpItem; b: UpItem; delta: number }>;
};

const UpMovementCard: React.FC<{ buckets: UpBuckets }> = ({ buckets }) => {
  const { t } = useTranslation();
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardHeader>
          <CardTitle>{t('compare.sections.upMovement')}</CardTitle>
          <CardDescription>
            {t('compare.upBucket.newUps')} {buckets.newUps.length} ·{' '}
            {t('compare.upBucket.droppedUps')} {buckets.droppedUps.length} ·{' '}
            {t('compare.upBucket.persistent')} {buckets.persistent.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <UpColumn
              title={t('compare.upBucket.newUps')}
              count={buckets.newUps.length}
              variant="new"
              items={buckets.newUps.slice(0, 10)}
            />
            <UpColumn
              title={t('compare.upBucket.droppedUps')}
              count={buckets.droppedUps.length}
              variant="dropped"
              items={buckets.droppedUps.slice(0, 10)}
            />
            <PersistentColumn buckets={buckets} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

type UpVariant = 'new' | 'dropped';

function UpColumn({
  title,
  count,
  variant,
  items,
}: {
  title: string;
  count: number;
  variant: UpVariant;
  items: ReadonlyArray<UpItem>;
}) {
  const { t } = useTranslation();
  const badgeCls =
    variant === 'new'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Badge variant="secondary" className={badgeCls}>
          {title}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {t('compare.upBucket.countUps', { count })}
        </span>
      </h4>
      <div className="space-y-1">
        {items.map((u) => (
          <div
            key={u.name + (u.mid ?? '')}
            className="flex items-center justify-between text-xs"
          >
            <span className="flex items-center gap-1.5">
              <FaUserAlt className="text-muted-foreground h-2.5 w-2.5" />
              {u.name}
            </span>
            <span className="tabular-nums">
              {t('compare.countLabel', { count: u.count })}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-muted-foreground text-xs">—</p>
        )}
      </div>
    </div>
  );
}

function PersistentColumn({ buckets }: { buckets: UpBuckets }) {
  const { t } = useTranslation();
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Badge variant="secondary">{t('compare.upBucket.persistent')}</Badge>
        <span className="text-muted-foreground text-xs">
          {t('compare.upBucket.byAbsDelta')}
        </span>
      </h4>
      <div className="space-y-1">
        {buckets.persistent.slice(0, 10).map((p) => (
          <div
            key={p.a.name + (p.a.mid ?? '')}
            className="flex items-center justify-between text-xs"
          >
            <span className="flex items-center gap-1.5">
              <FaUserAlt className="text-muted-foreground h-2.5 w-2.5" />
              <span className="max-w-[120px] truncate">{p.a.name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground tabular-nums">
                {p.a.count}→{p.b.count}
              </span>
              <DeltaChip
                delta={p.delta}
                formatter={(n) => `${n > 0 ? '+' : ''}${n}`}
              />
            </span>
          </div>
        ))}
        {buckets.persistent.length === 0 && (
          <p className="text-muted-foreground text-xs">—</p>
        )}
      </div>
    </div>
  );
}

export default UpMovementCard;
