'use client';

// import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import React from 'react';
// import React, { useEffect } from 'react';

const videoInfo = {
  bvid: 'BV13s421w7MG',
  aid: 1854751235,
  videos: 1,
  tid: 172,
  tname: '手机游戏',
  copyright: 1,
  pic: 'http://i0.hdslb.com/bfs/archive/02d89f8d44da505724d42c4e3858fb8516e0925c.jpg',
  title: '《无期迷途》常驻玩法——「无尽梦魇」长夜微光',
  pubdate: 1716609600,
  ctime: 1716540868,
  desc: '常驻玩法「无尽梦魇」长夜微光5月30日开启\n活动影像>>传输成功\n■影像坐标 [未知区域]\n■收件者 [MBCC管理局局长]\n■解锁等级 [最高机密]\n\n▼游戏下载地址：https://www.biligame.com/detail/?id=107111',
  desc_v2: [
    {
      raw_text:
        '常驻玩法「无尽梦魇」长夜微光5月30日开启\n活动影像>>传输成功\n■影像坐标 [未知区域]\n■收件者 [MBCC管理局局长]\n■解锁等级 [最高机密]\n\n▼游戏下载地址：https://www.biligame.com/detail/?id=107111',
      type: 1,
      biz_id: 0,
    },
  ],
  state: 0,
  duration: 116,
  rights: {
    bp: 0,
    elec: 0,
    download: 1,
    movie: 0,
    pay: 0,
    hd5: 1,
    no_reprint: 1,
    autoplay: 1,
    ugc_pay: 0,
    is_cooperation: 0,
    ugc_pay_preview: 0,
    no_background: 0,
    clean_mode: 0,
    is_stein_gate: 0,
    is_360: 0,
    no_share: 0,
    arc_pay: 0,
    free_watch: 0,
  },
  owner: {
    mid: 647409444,
    name: '无期迷途',
    face: 'https://i0.hdslb.com/bfs/face/9859fc14160795f4a7700053342494b3c71945ce.jpg',
  },
  stat: {
    aid: 1854751235,
    view: 933671,
    danmaku: 2453,
    reply: 4887,
    favorite: 2641,
    coin: 2707,
    share: 1582,
    now_rank: 0,
    his_rank: 0,
    like: 19308,
    dislike: 0,
    evaluation: '',
    vt: 0,
  },
  argue_info: {
    argue_msg: '',
    argue_type: 0,
    argue_link: '',
  },
  dynamic: '',
  cid: 1557264526,
  dimension: {
    width: 1920,
    height: 1080,
    rotate: 0,
  },
  premiere: null,
  teenage_mode: 0,
  is_chargeable_season: false,
  is_story: false,
  is_upower_exclusive: false,
  is_upower_play: false,
  is_upower_preview: false,
  enable_vt: 0,
  vt_display: '',
  no_cache: false,
  pages: [
    {
      cid: 1557264526,
      page: 1,
      from: 'vupload',
      part: '《无期迷途》常驻玩法——「无尽梦魇」长夜微光',
      duration: 116,
      vid: '',
      weblink: '',
      dimension: {
        width: 1920,
        height: 1080,
        rotate: 0,
      },
      first_frame:
        'http://i0.hdslb.com/bfs/storyff/n240524sa11sleksx8lx7557i4a0j131_firsti.jpg',
    },
  ],
  subtitle: {
    allow_submit: false,
    list: [
      {
        id: 1496446355550261800,
        lan: 'ai-zh',
        lan_doc: '中文（自动生成）',
        is_lock: false,
        subtitle_url: '',
        type: 1,
        id_str: '1496446355550261760',
        ai_type: 0,
        ai_status: 2,
        author: {
          mid: 0,
          name: '',
          sex: '',
          face: '',
          sign: '',
          rank: 0,
          birthday: 0,
          is_fake_account: 0,
          is_deleted: 0,
          in_reg_audit: 0,
          is_senior_member: 0,
        },
      },
    ],
  },
  is_season_display: false,
  user_garb: {
    url_image_ani_cut: '',
  },
  honor_reply: {
    honor: [
      {
        aid: 1854751235,
        type: 4,
        desc: '热门',
        weekly_recommend_num: 0,
      },
    ],
  },
  like_icon: '',
  need_jump_bv: false,
  disable_show_up_info: false,
  is_story_play: 1,
};

const Detail: React.FC = React.memo(() => {
  const searchParams = useSearchParams();
  const bvid = searchParams.get('bvid');

  // const fetchVideoInfo = async () => {
  //   const response = await axios.post('/api/videoInfo', { bvid: bvid });
  //   console.log(response.data.data);
  //   return response.data.data;
  // };

  // let videoInfo = null;

  // useEffect(() => {
  //   videoInfo = fetchVideoInfo();
  // }, []);

  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <button>Detail</button>
    </div>
  );
});

export default Detail;
