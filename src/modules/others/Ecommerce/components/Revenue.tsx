'use client';

import { GoDotFill } from 'react-icons/go';

import { Button, Pie, SparkLine, Stacked } from '@/common/components/elements';
import useStore from '@/common/hooks/useStore';
import {
  SparklineAreaData,
  ecomPieChartData,
} from '../../../../common/dummy/dummy';

const Revenue: React.FC = () => {
  const { currentColor } = useStore();

  return (
    <section className="flex flex-wrap justify-center gap-10">
      <div className="m-3 rounded-2xl bg-white p-4 dark:bg-secondary-dark-bg dark:text-gray-200 md:w-780  ">
        <div className="flex justify-between">
          <p className="text-xl font-semibold">Revenue Updates</p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-2 text-gray-600 hover:drop-shadow-xl">
              <span>
                <GoDotFill />
              </span>
              <span>Expense</span>
            </p>
            <p className="flex items-center gap-2 text-green-400 hover:drop-shadow-xl">
              <span>
                <GoDotFill />
              </span>
              <span>Budget</span>
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-10">
          <div className=" m-4 border-r-1 border-color pr-10">
            <div>
              <p>
                <span className="text-3xl font-semibold">$93,438</span>
                <span className="ml-3 cursor-pointer rounded-full bg-green-400 p-1.5 text-xs text-white hover:drop-shadow-xl">
                  23%
                </span>
              </p>
              <p className="mt-1 text-gray-500">Budget</p>
            </div>
            <div className="mt-8">
              <p className="text-3xl font-semibold">$48,487</p>

              <p className="mt-1 text-gray-500">Expense</p>
            </div>

            <div className="mt-5">
              <SparkLine
                currentColor={currentColor}
                id="line-sparkLine"
                type="Line"
                height="80px"
                width="250px"
                data={SparklineAreaData}
                color={currentColor}
              />
            </div>
            <div className="mt-10">
              <Button
                color="white"
                bgColor={currentColor}
                text="Download Report"
                borderRadius="10px"
              />
            </div>
          </div>
          <div>
            <Stacked width="320px" height="360px" stackedCustomSeries={[]} />
          </div>
        </div>
      </div>
      <div>
        <div
          className=" m-3 rounded-2xl p-4 md:w-400"
          style={{ backgroundColor: currentColor }}
        >
          <div className="flex items-center justify-between ">
            <p className="text-2xl font-semibold text-white">Earnings</p>

            <div>
              <p className="mt-8 text-2xl font-semibold text-white">
                $63,448.78
              </p>
              <p className="text-gray-200">Monthly revenue</p>
            </div>
          </div>

          <div className="mt-4">
            <SparkLine
              currentColor={currentColor}
              id="column-sparkLine"
              height="100px"
              type="Column"
              data={SparklineAreaData}
              width="320"
              color="rgb(242, 252, 253)"
            />
          </div>
        </div>

        <div className="m-3 flex items-center justify-center gap-10 rounded-2xl bg-white p-8 dark:bg-secondary-dark-bg dark:text-gray-200 md:w-400">
          <div>
            <p className="text-2xl font-semibold ">$43,246</p>
            <p className="text-gray-400">Yearly sales</p>
          </div>

          <div className="w-40">
            <Pie
              id="pie-chart"
              data={ecomPieChartData}
              legendVisiblity={false}
              height="160px"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Revenue;
