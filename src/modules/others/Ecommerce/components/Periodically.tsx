'use client';

import Image from 'next/image';
import { IoIosMore } from 'react-icons/io';

import { Button, SparkLine } from '@/common/components/elements';
import useStore from '@/common/hooks/useStore';
import {
  SparklineAreaData,
  medicalproBranding,
  weeklyStats,
} from '../../../../common/dummy/dummy';

const product9 = './assets/product9.jpg';

const Periodically: React.FC = () => {
  const { currentColor } = useStore();

  return (
    <div className="flex flex-wrap justify-center">
      <div className="m-3 rounded-2xl bg-white p-6 dark:bg-secondary-dark-bg dark:text-gray-200 md:w-400">
        <div className="flex justify-between">
          <p className="text-xl font-semibold">Weekly Stats</p>
          <button type="button" className="text-xl font-semibold text-gray-500">
            <IoIosMore />
          </button>
        </div>
        <div className="mt-10 ">
          {weeklyStats.map((item) => (
            <div key={item.title} className="mt-4 flex w-full justify-between">
              <div className="flex gap-4">
                <button
                  type="button"
                  style={{ background: item.iconBg }}
                  className="rounded-full p-3 text-2xl text-white hover:drop-shadow-xl"
                >
                  {item.icon}
                </button>
                <div>
                  <p className="text-md font-semibold">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>

              <p className={`text-${item.pcColor}`}>{item.amount}</p>
            </div>
          ))}
          <div className="mt-4">
            <SparkLine
              currentColor={currentColor}
              id="area-sparkLine"
              height="160px"
              type="Area"
              data={SparklineAreaData}
              width="320"
              color="rgb(242, 252, 253)"
            />
          </div>
        </div>
      </div>
      <div className="m-3 w-400 rounded-2xl bg-white p-6 dark:bg-secondary-dark-bg dark:text-gray-200">
        <div className="flex justify-between">
          <p className="text-xl font-semibold">MedicalPro Branding</p>
          <button type="button" className="text-xl font-semibold text-gray-400">
            <IoIosMore />
          </button>
        </div>
        <p className="mt-10 w-24 cursor-pointer rounded-lg bg-orange-400 px-2 py-0.5 text-xs font-semibold text-gray-200 hover:drop-shadow-xl">
          16 APR, 2021
        </p>

        <div className="mt-6 flex gap-4 border-b-1 border-color">
          {medicalproBranding.data.map((item) => (
            <div key={item.title} className="border-r-1 border-color pb-2 pr-4">
              <p className="text-xs text-gray-400">{item.title}</p>
              <p className="text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 border-b-1 border-color pb-4">
          <p className="text-md mb-2 font-semibold">Teams</p>

          <div className="flex gap-4">
            {medicalproBranding.teams.map((item) => (
              <p
                key={item.name}
                style={{ background: item.color }}
                className="cursor-pointer rounded-lg px-3 py-0.5 text-xs text-white hover:drop-shadow-xl"
              >
                {item.name}
              </p>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <p className="text-md mb-2 font-semibold">Leaders</p>
          <div className="flex gap-4">
            {medicalproBranding.leaders.map((item, index) => (
              <Image
                key={index}
                className="h-8 w-8 rounded-full"
                src={item.image}
                alt=""
                loading="lazy"width={200}
                height={200}
              />
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t-1 border-color">
          <div className="mt-3">
            <Button
              color="white"
              bgColor={currentColor}
              text="Add"
              borderRadius="10px"
            />
          </div>
          <p className="text-sm text-gray-400">36 Recent Transactions</p>
        </div>
      </div>
      <div className="m-3 w-400 rounded-2xl bg-white p-6 dark:bg-secondary-dark-bg dark:text-gray-200">
        <div className="flex justify-between">
          <p className="text-xl font-semibold">Daily Activities</p>
          <button type="button" className="text-xl font-semibold text-gray-500">
            <IoIosMore />
          </button>
        </div>
        <div className="mt-10">
          <Image
            className="h-50 md:w-96 "
            src={product9}
            alt=""
            loading="lazy"width={200}
            height={200}
          />
          <div className="mt-8">
            <p className="text-lg font-semibold">React 18 coming soon!</p>
            <p className="text-gray-400 ">By Johnathan Doe</p>
            <p className="mt-8 text-sm text-gray-400">
              This will be the small description for the news you have shown
              here. There could be some great info.
            </p>
            <div className="mt-3">
              <Button
                color="white"
                bgColor={currentColor}
                text="Read More"
                borderRadius="10px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Periodically;
