import { BiCommentDetail } from 'react-icons/bi';
import { BsCurrencyDollar, BsShield } from 'react-icons/bs';
import { FiCreditCard, FiSettings } from 'react-icons/fi';
import { LuSearch } from 'react-icons/lu';

const avatar = './assets/avatar.jpg';
const avatar2 = './assets/avatar2.jpg';
const avatar3 = './assets/avatar3.png';
const avatar4 = './assets/avatar4.jpg';
const product5 = './assets/product5.jpg';
const product6 = './assets/product6.jpg';
const product7 = './assets/product7.jpg';

export const links = [
  {
    title: '检索系统',
    links: [
      {
        name: '热门视频分类检索',
        nav: 'search',
        icon: <LuSearch />,
      },
      {
        name: '视频详细信息',
        nav: 'details',
        icon: <BiCommentDetail />,
      },
    ],
  },
  {
    title: '个性化',
    links: [
      {
        name: '设置中心',
        nav: 'settings',
        icon: <FiSettings />,
      },
    ],
  },
];

export const cartData = [
  {
    image: product5,
    name: 'butterscotch ice-cream',
    category: 'Milk product',
    price: '$250',
  },
  {
    image: product6,
    name: 'Supreme fresh tomato',
    category: 'Vegetable Item',
    price: '$450',
  },
  {
    image: product7,
    name: 'Red color candy',
    category: 'Food Item',
    price: '$190',
  },
];

export const chatData = [
  {
    image: avatar2,
    message: 'Roman Joined the Team!',
    desc: 'Congratulate him',
    time: '9:08 AM',
  },
  {
    image: avatar3,
    message: 'New message received',
    desc: 'Salma sent you new message',
    time: '11:56 AM',
  },
  {
    image: avatar4,
    message: 'New Payment received',
    desc: 'Check your earnings',
    time: '4:39 AM',
  },
  {
    image: avatar,
    message: 'Jolly completed tasks',
    desc: 'Assign her new tasks',
    time: '1:12 AM',
  },
];

export const userProfileData = [
  {
    icon: <BsCurrencyDollar />,
    title: '我的档案',
    desc: '账户设定',
    iconColor: '#03C9D7',
    iconBg: '#E5FAFB',
  },
  {
    icon: <BsShield />,
    title: '收件箱',
    desc: '信息 & 邮件',
    iconColor: 'rgb(0, 194, 146)',
    iconBg: 'rgb(235, 250, 242)',
  },
  {
    icon: <FiCreditCard />,
    title: 'My Tasks',
    desc: 'To-do and Daily Tasks',
    iconColor: 'rgb(255, 244, 229)',
    iconBg: 'rgb(254, 201, 15)',
  },
];
