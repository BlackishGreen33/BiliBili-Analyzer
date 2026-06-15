'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

const LengthRecommendEmpty: React.FC = React.memo(() => {
  const { t } = useTranslation();
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">
      {t('length.recommendEmpty')}
    </p>
  );
});
LengthRecommendEmpty.displayName = 'LengthRecommendEmpty';

export default LengthRecommendEmpty;
