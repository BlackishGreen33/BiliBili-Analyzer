'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExchangeAlt, FaShareAlt } from 'react-icons/fa';

import { Button } from '@/common/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/components/ui/select';
import { useToast } from '@/common/components/ui/use-toast';

type DatePickersProps = {
  list: ReadonlyArray<string>;
  a: string | null;
  b: string | null;
  onAChange: (v: string) => void;
  onBChange: (v: string) => void;
  onSwap: () => void;
};

const DatePickers: React.FC<DatePickersProps> = ({
  list,
  a,
  b,
  onAChange,
  onBChange,
  onSwap,
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleShare = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t('share.copied') });
    } catch {
      toast({
        variant: 'destructive',
        title: t('share.copiedFail'),
        description: t('share.copiedFailHint'),
      });
    }
  }, [toast, t]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">{t('compare.selectA')}</label>
        <Select value={a ?? ''} onValueChange={onAChange}>
          <SelectTrigger className="w-44 cursor-pointer">
            <SelectValue placeholder={t('compare.selectA')} />
          </SelectTrigger>
          <SelectContent>
            {list.map((f) => (
              <SelectItem key={f} value={f} className="cursor-pointer">
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onSwap}
        className="cursor-pointer active:scale-95"
        title={t('common.swap')}
        aria-label={t('common.swap')}
      >
        <FaExchangeAlt className="h-3.5 w-3.5" />
      </Button>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">{t('compare.selectB')}</label>
        <Select value={b ?? ''} onValueChange={onBChange}>
          <SelectTrigger className="w-44 cursor-pointer">
            <SelectValue placeholder={t('compare.selectB')} />
          </SelectTrigger>
          <SelectContent>
            {list.map((f) => (
              <SelectItem key={f} value={f} className="cursor-pointer">
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="cursor-pointer active:scale-95"
      >
        <FaShareAlt className="mr-1.5 h-3.5 w-3.5" />
        {t('compare.share')}
      </Button>
    </div>
  );
};

export default DatePickers;
