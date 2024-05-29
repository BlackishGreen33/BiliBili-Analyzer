import axios from 'axios';
import { NextResponse } from 'next/server';

const infoApi = 'https://api.bilibili.com/x/web-interface/view?bvid=';

export async function POST(req: Request, res: Response) {
  try {
    const { bvid } = await req.json();

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
      Referer: 'https://www.bilibili.com/',
    };

    const response = await axios.get(infoApi + bvid, { headers });
    return NextResponse.json(response.data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('LOGIN_POST', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
