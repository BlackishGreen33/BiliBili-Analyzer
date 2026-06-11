import React from 'react';

const Footer: React.FC = React.memo(() => (
  <footer className="text-muted-foreground mt-20 border-t py-6 text-center text-xs">
    <p>
      BiliBili Analyzer © 2026 · 数据来源：
      <a
        href="https://www.bilibili.com"
        target="_blank"
        rel="noreferrer"
        className="hover:text-foreground ml-1"
      >
        bilibili.com
      </a>
    </p>
    <p className="mt-1">仅做热门榜单公开数据检索分析 · 不存储任何用户隐私</p>
  </footer>
));

export default Footer;
