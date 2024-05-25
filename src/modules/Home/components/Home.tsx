'use client';

import {
  ProForm,
  ProFormCascader,
  ProFormText,
} from '@ant-design/pro-components';
import {
  Card,
  ConfigProvider,
  List,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { ThemeProvider } from 'antd-style';
import axios from 'axios';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

import useStore from '@/common/hooks/useStore';

const { Text, Title, Paragraph } = Typography;

type VideoData = {
  url: string;
  cover: string;
  title: string;
  UP: string;
  views: string;
  tags: { firstChannel: string; secondChannel: string; ordinaryTags: string[] };
};

type Data = {
  time: number;
  video: VideoData[];
};

const Home: React.FC = React.memo(() => {
  const [dataList, setDataList] = useState<{ value: string; label: string }[]>(
    []
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [videoData, setVideoData] = useState<Data>();
  const [filteredData, setFilteredData] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [form] = ProForm.useForm();

  const { currentColor, currentMode, screenSize } = useStore();

  useEffect(() => {
    setLoading(true);
    axios
      .get(
        'https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/list.json'
      )
      .then((response) => {
        const lists = response.data.map((fileName: string) => ({
          value: fileName,
          label: fileName,
        }));
        setDataList(lists);
        return response.data[0];
      })
      .then((filename) => {
        axios
          .get(
            `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/${filename}.json`
          )
          .then((dataResponse) => {
            setVideoData(dataResponse.data);
            setFilteredData(dataResponse.data.video);
            setLoading(false);
            setSelectedTime(filename);
            form.resetFields();
          })
          .catch((error) => {
            console.error('There was an error fetching the data:', error);
            setLoading(false);
          });
      });
  }, []);

  const changeTime = (filename: string) => {
    setLoading(true);
    axios
      .get(
        `https://raw.githubusercontent.com/BlackishGreen33/BiliBili-Analyzer/result/result/${filename}.json`
      )
      .then((dataResponse) => {
        setVideoData(dataResponse.data);
        setFilteredData(dataResponse.data.video);
        setLoading(false);
        setSelectedTime(filename);
        form.resetFields();
      });
  };

  type Option = {
    value: string;
    label: string;
    children?: Option[];
  };

  const channelOptions: Option[] = [];
  videoData?.video.forEach((v) => {
    if (v.tags.firstChannel && v.tags.secondChannel) {
      const existingChannel = channelOptions.find(
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
        channelOptions.push({
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

  const handleFilterChange = async (values: any): Promise<void> => {
    setLoading(true);
    const filteredResults = videoData?.video.filter((item) => {
      const matchesChannel =
        !values.channel ||
        values.channel.some(
          (selectedChannel: string[]) =>
            selectedChannel[0] === item.tags.firstChannel ||
            selectedChannel[1] === item.tags.secondChannel
        ) ||
        values.channel.length === 0;

      const matchesSearch =
        !values.search ||
        item.title.toLowerCase().includes(values.search.toLowerCase());

      return matchesChannel && matchesSearch;
    });

    setFilteredData(filteredResults || []);
    setLoading(false);
  };

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <ThemeProvider
        themeMode={currentMode === 'Light' ? 'light' : 'dark'}
        theme={{
          token: {
            colorPrimary: currentColor,
          },
        }}
      >
        <ConfigProvider
          theme={{
            components: {
              Cascader: {
                controlItemWidth: 200,
                dropdownHeight: 500,
              },
            },
          }}
        >
          <div className="mx-auto mb-[50px] mt-0 w-[70vw]">
            <Title level={3} className='m-auto'>哔哩哔哩热门视频分类检索系统</Title>
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
              <ProForm
                form={form}
                onReset={handleFilterChange}
                onFinish={handleFilterChange}
                submitter={{ onSubmit: handleFilterChange }}
              >
                <ProFormText
                  name="search"
                  label="搜索"
                  placeholder={'请输入视频标题、UP主名称或视频标签'}
                  fieldProps={{ size: 'large' }}
                ></ProFormText>
                <ProFormCascader
                  name="channel"
                  label="分区"
                  placeholder={'请选择分区'}
                  fieldProps={{
                    options: channelOptions,
                    // @ts-ignore
                    multiple: true,
                    maxTagCount: 'responsive',
                  }}
                />
              </ProForm>
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
                <List.Item>
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
      </ThemeProvider>
    </div>
  );
});

export default Home;
