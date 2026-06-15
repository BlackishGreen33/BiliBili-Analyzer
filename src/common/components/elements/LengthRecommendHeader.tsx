'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/common/components/ui/badge';
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';

type Props = {
  label: string;
  confidence: 'low' | 'mid' | 'high';
};

const LengthRecommendHeader: React.FC<Props> = React.memo(
  ({ label, confidence }) => {
    const { t } = useTranslation();
    const isLowConfidence = confidence === 'low';
    return (
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {t('length.recommendTitle')}
          </CardTitle>
          {isLowConfidence && (
            <Badge variant="outline" className="text-[10px]">
              {t('length.recommendLowConfidence')}
            </Badge>
          )}
        </div>
        <CardDescription>
          {t('length.recommendDesc', { name: label })}
        </CardDescription>
      </CardHeader>
    );
  }
);
LengthRecommendHeader.displayName = 'LengthRecommendHeader';

export default LengthRecommendHeader;
