'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LuShare2 } from 'react-icons/lu';

import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/components/ui/select';
import { useToast } from '@/common/components/ui/use-toast';
import { useThemeStore } from '@/common/hooks/useThemeStore';
import { EASE_OUT_EXPO } from '@/common/styles/motion';
import { cn } from '@/common/utils';
import { ChannelOption, ChannelSelection } from '@/common/utils/search-filters';

export type FilterPanelProps = {
  list: ReadonlyArray<string>;
  channelOptions: ReadonlyArray<ChannelOption>;
  effectiveTime: string | null;
  searchValue: string;
  selectedChannels: ChannelSelection;
  activeTag: string | null;
  filteredCount: number;
  totalCount: number;
  setSearchValue: (v: string) => void;
  setSelectedChannels: (
    cs: ChannelSelection | ((prev: ChannelSelection) => ChannelSelection)
  ) => void;
  handleReset: () => void;
  handleChangeDate: (f: string) => void;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  list,
  channelOptions,
  effectiveTime,
  searchValue,
  selectedChannels,
  activeTag,
  filteredCount,
  totalCount,
  setSearchValue,
  setSelectedChannels,
  handleReset,
  handleChangeDate,
}) => {
  const { t } = useTranslation();
  const { currentColor } = useThemeStore();
  const { toast } = useToast();

  const handleShare = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('share.copied'),
        description: t('share.copiedHint'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('share.copiedFail'),
        description: t('share.copiedFailHint'),
      });
    }
  }, [toast, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.06 }}
    >
      <Card className="mx-auto mb-8 max-w-5xl">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{t('search.filter.title')}</CardTitle>
              <CardDescription>{t('search.filter.desc')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="cursor-pointer active:scale-95"
              title={t('search.filter.share')}
            >
              <LuShare2 className="mr-1.5 h-3.5 w-3.5" />
              {t('search.filter.share')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t('search.filter.date')}
              </label>
              <Select
                value={effectiveTime ?? ''}
                onValueChange={handleChangeDate}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder={t('search.filter.date')} />
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
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">
                {t('search.filter.keyword')}
              </label>
              <div className="relative">
                <FaSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={t('search.filter.keywordPlaceholder')}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('search.filter.firstChannel')}
            </label>
            <div className="flex flex-wrap gap-2">
              <ChannelChip
                active={selectedChannels.length === 0}
                onClick={() => setSelectedChannels([])}
              >
                {t('search.filter.all')}
              </ChannelChip>
              {channelOptions.map((opt) => {
                const active = selectedChannels.some(
                  ([first]) => first === opt.value
                );
                return (
                  <ChannelChip
                    key={opt.value}
                    active={active}
                    onClick={() => {
                      if (active) {
                        setSelectedChannels((prev) =>
                          prev.filter(([first]) => first !== opt.value)
                        );
                      } else {
                        setSelectedChannels((prev) => [
                          ...prev,
                          [opt.value, ''],
                        ]);
                      }
                    }}
                  >
                    {opt.label}
                  </ChannelChip>
                );
              })}
            </div>
          </div>

          {selectedChannels.length > 0 && (
            <motion.div
              key="sub-channels"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
              className="space-y-2 overflow-hidden"
            >
              <label className="text-sm font-medium">
                {t('search.filter.secondChannel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {channelOptions
                  .filter((opt) =>
                    selectedChannels.some(([first]) => first === opt.value)
                  )
                  .flatMap((opt) =>
                    (opt.children ?? []).map((sub) => ({
                      parent: opt,
                      sub,
                    }))
                  )
                  .map(({ parent, sub }) => {
                    const active = selectedChannels.some(
                      ([first, second]) =>
                        first === parent.value && second === sub.value
                    );
                    return (
                      <ChannelChip
                        key={`${parent.value}-${sub.value}`}
                        active={active}
                        onClick={() => {
                          setSelectedChannels((prev) => {
                            const idx = prev.findIndex(
                              ([first]) => first === parent.value
                            );
                            if (idx < 0) return prev;
                            const copy = [...prev];
                            const currentEntry = copy[idx];
                            if (!currentEntry) return prev;
                            if (currentEntry[1] === sub.value) {
                              copy[idx] = [currentEntry[0] ?? '', ''];
                            } else {
                              copy[idx] = [parent.value, sub.value];
                            }
                            return copy;
                          });
                        }}
                      >
                        {sub.label}
                      </ChannelChip>
                    );
                  })}
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-muted-foreground text-sm">
              {t('search.filter.match', {
                matched: filteredCount,
                total: totalCount,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={
                  !searchValue && selectedChannels.length === 0 && !activeTag
                }
                className="cursor-pointer active:scale-95"
              >
                <FaTimes className="mr-1 h-3 w-3" />
                {t('common.reset')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Local Card sub-components inline to avoid importing from '@/common/components/ui/card' if not present.
import { FaSearch, FaTimes } from 'react-icons/fa';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';

const ChannelChip: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = React.memo(({ active, onClick, children }) => {
  const { currentColor } = useThemeStore();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'transition-base cursor-pointer rounded-full border px-3 py-1 text-xs',
        active
          ? 'border-transparent text-white shadow-sm'
          : 'hover:bg-muted hover:scale-105'
      )}
      style={{
        backgroundColor: active ? currentColor : undefined,
      }}
    >
      {children}
    </motion.button>
  );
});
ChannelChip.displayName = 'ChannelChip';

export default FilterPanel;
