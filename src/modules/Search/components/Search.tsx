'use client';

import {
  Button,
  Card,
  Cascader,
  ConfigProvider,
  Input,
  List,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ToastAction } from '@/common/components/ui/toast';
import { toast } from '@/common/components/ui/use-toast';
import useStore from '@/common/hooks/useStore';
import {
  fetchResultByName,
  fetchResultList,
} from '@/common/libs/result-data';
import type { CrawlResult, VideoData } from '@/common/types/video';

const { Text, Title, Paragraph } = Typography;

type ChannelOption = {
  value: string;
  label: string;
  children?: ChannelOption[];
};

const Home: React.FC = React.memo(() => {
  const [dataList, setDataList] = useState<{ value: string; label: string }[]>(
    []
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [videoData, setVideoData] = useState<CrawlResult>();
  const [filteredData, setFilteredData] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[][]>([]);

  const { currentColor, screenSize } = useStore();
  const { theme } = useTheme();
  const router = useRouter();

  const loadFilename = useCallback(async (filename: string) => {
    setLoading(true);
    try {
      const data = await fetchResultByName(filename);
      setVideoData(data);
      setFilteredData(data.video);
      setSelectedTime(filename);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '无法获取到数据。',
        description: '发生了一些意料之外的错误。',
        action: <ToastAction altText="Try again">再试一次</ToastAction>,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchResultList();
        if (cancelled) {
          return;
        }
        setDataList(list.map((fileName) => ({ value: fileName, label: fileName })));
        const latest = list[0];
        if (latest) {
          await loadFilename(latest);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: '无法获取到数据。',
            description: '发生了一些意料之外的错误。',
            action: <ToastAction altText="Try again">再试一次</ToastAction>,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFilename, toast]);

  const changeTime = (filename: string) => {
    setSearchValue('');
    setSelectedChannels([]);
    void loadFilename(filename);
  };

  type Option = {
    value: string;
    label: string;
    children?: Option[];
  };

  const channelOptions: Option[] = useMemo(() => {
    const options: Option[] = [];
    videoData?.video.forEach((v) => {
      if (v.tags.firstChannel && v.tags.secondChannel) {
        const existingChannel = options.find(
          (entry) => entry.label === v.tags.firstChannel
        );

        if (existingChannel) {
          existingChannel.children = existingChannel.children || [];
          const existingSecondChannel = existingChannel.children.find(
            (child) => child.label === v.tags.secondChannel
          );

          if (!existingSecondChannel) {
            existingChannel.children.push({
              label: v.tags.secondChannel,
              value: v.tags.secondChannel,
            });
          }
        } else {
          options.push({
            label: v.tags.firstChannel,
            value: v.tags.firstChannel,
            children: [
              {
                label: v.tags.secondChannel,
                value: v.tags.secondChannel,
              },
            ],
          });
        }
      }
    });
    return options;
  }, [videoData]);

  const applyFilters = useCallback(() => {
    const keyword = searchValue.trim().toLowerCase();
    const filteredResults = (videoData?.video || []).filter((item) => {
      const matchesChannel =
        selectedChannels.length === 0 ||
        selectedChannels.some(
          (selectedChannel) =>
            selectedChannel[0] === item.tags.firstChannel ||
            selectedChannel[1] === item.tags.secondChannel
        );

      const matchesSearch =
        !keyword || item.title.toLowerCase().includes(keyword);

      return matchesChannel && matchesSearch;
    });
    setFilteredData(filteredResults);
  }, [searchValue, selectedChannels, videoData]);

  const handleFilter = (e?: React.FormEvent) => {
    e?.preventDefault();
    applyFilters();
  };

  const handleReset = () => {
    setSearchValue('');
    setSelectedChannels([]);
    setFilteredData(videoData?.video || []);
  };

  const handleClicked = async (url: string) => {
    const pattern = /video\/([a-zA-Z0-9]+)/;
    const matchResult = url.match(pattern);
    if (matchResult && matchResult[1]) {
      const bvid = matchResult[1];
      router.push('/details?bvid=' + bvid);
    } else {
      toast({
        variant: 'destructive',
        title: '无法从 URL 中获取 BV 号',
        description: '请确认输入的链接是否正确。',
        action: <ToastAction altText="Try again">再试一次</ToastAction>,
      });
    }
  };

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: currentColor,
          },
          components: {
            Cascader: {
              controlItemWidth: 200,
              dropdownHeight: 500,
            },
          },
        }}
      >
          <div className="mx-auto mb-[50px] mt-0 w-[70vw]">
            <Title level={3} className="m-auto">
              哔哩哔哩热门视频分类检索系统
            </Title>
            <Card>
              <Space size="large" className="flex flex-col md:flex-row">
                <Card.Meta
                  description={
                    <Text>
                      数据更新于：
                      {new Date(videoData?.time || 0).toLocaleString()}
                    </Text>
                  }
                />
                <Select
                  size="large"
                  style={{ width: 250 }}
                  options={dataList}
                  value={selectedTime}
                  onSelect={(value) => {
                    changeTime(value);
                  }}
                />
              </Space>
              <form onSubmit={handleFilter} className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">搜索</span>
                  <Input
                    size="large"
                    placeholder="请输入视频标题、UP主名称或视频标签"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    allowClear
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">分区</span>
                  <Cascader
                    size="large"
                    options={channelOptions}
                    value={selectedChannels}
                    onChange={(value) =>
                      setSelectedChannels(value as string[][])
                    }
                    placeholder="请选择分区"
                    multiple
                    maxTagCount="responsive"
                  />
                </label>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{ backgroundColor: currentColor }}
                  >
                    筛选
                  </Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </form>
            </Card>
          </div>
          <div className="mx-auto mb-[50px] mt-0 w-[70vw]">
            <List
              rowKey={(item) => item.url}
              loading={loading}
              pagination={{ pageSize: 12, showSizeChanger: false }}
              dataSource={filteredData}
              grid={{
                gutter: 30,
                column:
                  screenSize! <= 768
                    ? 1
                    : screenSize! <= 1024
                      ? 2
                      : screenSize! <= 1280
                        ? 3
                        : 4,
              }}
              renderItem={(item) => (
                <List.Item onClick={() => handleClicked(item.url)}>
                  <Card
                    hoverable
                    cover={
                      <Image
                        alt={item.title}
                        src={item.cover}
                        width={200}
                        height={200}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    }
                  >
                    <Card.Meta
                      title={
                        <a href={item.url} target={'_blank'}>
                          {item.title}
                        </a>
                      }
                      description={
                        <Paragraph
                          ellipsis={{
                            rows: 3,
                          }}
                        >
                          <Tag bordered={false} color="red">
                            {item.tags.firstChannel}
                          </Tag>
                          <Tag bordered={false} color="green">
                            {item.tags.secondChannel}
                          </Tag>
                          {item.tags.ordinaryTags.map((tag) => (
                            <Tag key={tag} bordered={false}>
                              {tag}
                            </Tag>
                          ))}
                        </Paragraph>
                      }
                    />
                    <div className="mb-4 flex h-5 justify-between">
                      <div className="flex gap-1">
                        <Image
                          src="https://s1.hdslb.com/bfs/static/jinkela/popular/assets/icon_up.png"
                          alt="up"
                          width={20}
                          height={20}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        {item.UP}
                      </div>
                      <div>播放量：{item.views}</div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
      </ConfigProvider>
    </div>
  );
});

export default Home;
