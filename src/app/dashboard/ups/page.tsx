'use client';

import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUserAlt } from 'react-icons/fa';

import { Badge } from '@/common/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/common/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/components/ui/select';
import { Spinner } from '@/common/components/ui/spinner';
import { useUpOverlap } from '@/common/libs/dashboard-data';
import {
  containerStagger,
  EASE_OUT_EXPO,
  fadeUp,
} from '@/common/styles/motion';
import { formatViews } from '@/common/utils/format';

const WINDOW_OPTIONS = [7, 14, 30, 60, 90] as const;
const MIN_CH_OPTIONS = [2, 3, 4, 5] as const;
const MIN_COUNT_OPTIONS = [2, 3, 5, 10] as const;

const CHANNEL_COLORS = [
  '#FB7299',
  '#03C9D7',
  '#7352FF',
  '#FF5C8E',
  '#1E4DB7',
  '#FB9678',
  '#1A97F5',
  '#00C292',
  '#FEC90F',
  '#0FC941',
];

const UpsPage: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [window, setWindow] = useState<number>(30);
  const [minChannels, setMinChannels] = useState<number>(2);
  const [minCount, setMinCount] = useState<number>(2);
  const { data, isLoading } = useUpOverlap(window, minChannels, minCount);

  const allChannels = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const u of data.items) {
      for (const c of u.channels) set.add(c.firstChannel);
    }
    return Array.from(set).sort();
  }, [data]);

  const channelColor = (ch: string) => {
    const idx = allChannels.indexOf(ch);
    return CHANNEL_COLORS[idx % CHANNEL_COLORS.length];
  };

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <motion.div
        className="mx-auto mb-8 max-w-7xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t('ups.title')}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{t('ups.desc')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FilterSelect
            label={t('ups.window')}
            value={String(window)}
            onChange={(v) => setWindow(parseInt(v, 10))}
            options={WINDOW_OPTIONS.map((v) => ({
              value: String(v),
              label: `${v} ${t('trend.days')}`,
            }))}
          />
          <FilterSelect
            label={t('ups.minChannels')}
            value={String(minChannels)}
            onChange={(v) => setMinChannels(parseInt(v, 10))}
            options={MIN_CH_OPTIONS.map((v) => ({
              value: String(v),
              label: String(v),
            }))}
          />
          <FilterSelect
            label={t('ups.minCount')}
            value={String(minCount)}
            onChange={(v) => setMinCount(parseInt(v, 10))}
            options={MIN_COUNT_OPTIONS.map((v) => ({
              value: String(v),
              label: String(v),
            }))}
          />
        </div>
      </motion.div>

      {isLoading || !data ? (
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : data.items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground mx-auto flex h-64 max-w-7xl items-center justify-center text-sm"
        >
          {t('ups.empty')}
        </motion.div>
      ) : (
        <motion.div
          className="mx-auto flex max-w-7xl flex-col gap-4"
          variants={containerStagger(0.04, 0.04)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>{t('ups.title')}</CardTitle>
                <CardDescription>
                  {data.totalUps} UPs · {data.items.length} matched
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground border-b text-left text-xs uppercase">
                      <tr>
                        <th className="py-3 pr-4">{t('ups.columns.rank')}</th>
                        <th className="py-3 pr-4">{t('ups.columns.up')}</th>
                        <th className="py-3 pr-4 text-right">
                          {t('ups.columns.channels')}
                        </th>
                        <th className="py-3 pr-4 text-right">
                          {t('ups.columns.count')}
                        </th>
                        <th className="py-3 pr-4 text-right">
                          {t('ups.columns.views')}
                        </th>
                        <th className="py-3 pr-4">
                          {t('ups.columns.overlap')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((u, i) => (
                        <motion.tr
                          key={u.name + (u.mid ?? '')}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: i * 0.012,
                            ease: EASE_OUT_EXPO,
                          }}
                          className="hover:bg-muted/50 border-b last:border-0"
                        >
                          <td className="py-3 pr-4 tabular-nums">{i + 1}</td>
                          <td className="py-3 pr-4 font-medium">
                            <span className="flex items-center gap-1.5">
                              <FaUserAlt className="text-muted-foreground h-3 w-3" />
                              {u.name}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {u.channelCount}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {u.totalCount}
                          </td>
                          <td className="text-muted-foreground py-3 pr-4 text-right tabular-nums">
                            {formatViews(u.views)}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1">
                              {u.channels.map((c) => (
                                <Badge
                                  key={c.firstChannel}
                                  variant="outline"
                                  className="cursor-default gap-1"
                                  style={{
                                    borderColor: channelColor(c.firstChannel),
                                    color: channelColor(c.firstChannel),
                                  }}
                                >
                                  {c.firstChannel} · {c.count}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
});
UpsPage.displayName = 'UpsPage';

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}> = React.memo(({ label, value, onChange, options }) => (
  <div className="flex items-center gap-2">
    <label className="text-sm">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-28 cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="cursor-pointer">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));
FilterSelect.displayName = 'FilterSelect';

export default UpsPage;
