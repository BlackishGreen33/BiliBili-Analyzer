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
import { EASE_OUT_EXPO } from '@/common/styles/motion';

type TopTag = { tag: string; count: number };

const TopTagsCard: React.FC<{ topTags: ReadonlyArray<TopTag> }> = ({
  topTags,
}) => {
  const { t } = useTranslation();
  const data = topTags.slice(0, 20);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.chart.tags')}</CardTitle>
        <CardDescription>{t('dashboard.chart.tagsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.map((tag, i) => (
            <motion.div
              key={tag.tag}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.24,
                delay: i * 0.015,
                ease: EASE_OUT_EXPO,
              }}
            >
              <Badge
                variant="secondary"
                className="transition-base cursor-default px-3 py-1 text-sm hover:scale-105"
                style={{
                  fontSize: `${Math.min(20, 12 + tag.count * 0.5)}px`,
                  opacity: 0.5 + Math.min(0.5, tag.count / 50),
                }}
              >
                {tag.tag} · {tag.count}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopTagsCard;
