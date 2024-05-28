import axios from 'axios';
import { NextResponse } from 'next/server';

// 假设这是从服务器端API获取的B站视频信息
const userCookie =
  "buvid3=4528212C-2E8E-43D3-7771-08E3D097016B43101infoc; b_nut=1697991243; _uuid=8F3109D6E-37F6-109BE-EE59-CFF43586727A44186infoc; buvid4=FB8AB4CA-5AE3-F9AE-B971-59CA3110583644147-023102300-sc6TKcUNTk72ytH9fgLXOA%3D%3D; rpdid=|(JY~|lk~)u~0J'uYm~mmukRR; enable_web_push=DISABLE; header_theme_version=CLOSE; DedeUserID=21907943; DedeUserID__ckMd5=472ff340a3ce3940; buvid_fp_plain=undefined; CURRENT_BLACKGAP=0; CURRENT_FNVAL=4048; hit-dyn-v2=1; PVID=1;";
const infoApi = 'https://api.bilibili.com/x/web-interface/view?bvid=';

export async function POST(req: Request, res: Response) {
  try {
    const { bvid } = await req.json();

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
      Referer: 'https://www.bilibili.com/',
      Cookie: userCookie,
    };

    const response = await axios.get(infoApi + bvid, { headers });
    console.log(response.data); // 打印获取到的视频信息
    return NextResponse.json(response.data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('LOGIN_POST', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
