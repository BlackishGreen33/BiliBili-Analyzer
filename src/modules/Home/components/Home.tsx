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

// 定义VideoData类型，用于存储视频的相关信息
type VideoData = {
  url: string;
  cover: string;
  title: string;
  UP: string;
  views: string;
  tags: { firstChannel: string; secondChannel: string; ordinaryTags: string[] };
};
// 定义数据的类型，包括时间和视频数组
type Data = {
  time: number;
  video: VideoData[];
};

const Home: React.FC = React.memo(() => {
  const [dataList, setDataList] = useState<{ value: string; label: string }[]>(
    []
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [videoData, setVideoData] = useState<Data>(); // 视频数据
  const [filteredData, setFilteredData] = useState<VideoData[]>([]); // 过滤后的视频数据
  const [loading, setLoading] = useState<boolean>(false);

  const [form] = ProForm.useForm();

  const { currentColor, currentMode } = useStore();

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

  // 根据选择的数据，展示视频
  const changeTime = (filename: string) => {
    setLoading(true);
    // 获取数据，更新 videoData 和 filteredData 状态
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

  // 定义分区选择器的选项类型
  interface Option {
    value: string;
    label: string;
    children?: Option[];
  }

  // 构建分区选择器的选项数组
  const channelOptions: Option[] = [];
  // 遍历视频数据，构建分区选择器的选项
  videoData?.video.forEach((v) => {
    if (v.tags.firstChannel && v.tags.secondChannel) {
      // 查找选项数组中是否已经存在该一级分区
      const existingChannel = channelOptions.find(
        (entry) => entry.label === v.tags.firstChannel
      );

      // 如果已经存在
      if (existingChannel) {
        existingChannel.children = existingChannel.children || [];
        // 查找子选项数组中是否已经存在该二级分区
        const existingSecondChannel = existingChannel.children.find(
          (child) => child.label === v.tags.secondChannel
        );

        if (!existingSecondChannel) {
          // 将该二级分区添加到子选项数组中
          existingChannel.children.push({
            label: v.tags.secondChannel,
            value: v.tags.secondChannel,
          });
        }
      } else {
        // 如果不存在，将该一级分区和二级分区添加到选项数组中
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

  // 处理分区和搜索条件的变化
  const handleFilterChange = async (values: any): Promise<void> => {
    setLoading(true);
    // 根据分区和搜索条件过滤结果
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
    <>
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
          <div className={'box'}>
            <Title level={3}>哔哩哔哩热门视频分类检索系统</Title>
            <Card>
              <Space size="large">
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
              {/* 搜索和分区选择表单 */}
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
          {/* 视频列表 */}
          <div className="box">
            <List
              rowKey={(item) => item.url}
              loading={loading}
              pagination={{ pageSize: 12, showSizeChanger: false }}
              dataSource={filteredData}
              grid={{ gutter: 30, column: 4 }}
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
                          {/* 视频标签 */}
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
                    <div className="card-content">
                      <div>
                        {/* UP主信息 */}
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
    </>
  );
});

export default Home;
