'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TitleWordCloud } from '@/common/components/elements';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import { useWordCloud } from '@/common/libs/use-wordcloud';
import { fadeUp } from '@/common/styles/motion';

const DashboardWordCloud: React.FC<{ file: string }> = React.memo(
  ({ file }) => {
    const { t } = useTranslation();
    const { data, isLoading } = useWordCloud();
    // 只在選中最新檔時顯示（簡化：永遠用最新檔的 wordcloud）
    void file;
    if (isLoading || !data || data.tokens.length === 0) return null;
    return (
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle>{t('wordcloud.globalSection')}</CardTitle>
            <CardDescription>{t('wordcloud.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <TitleWordCloud tokens={data.tokens} height={300} maxWords={60} />
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);
DashboardWordCloud.displayName = 'DashboardWordCloud';

export default DashboardWordCloud;
