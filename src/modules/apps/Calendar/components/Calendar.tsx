'use client';

import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';
import {
  Agenda,
  Day,
  DragAndDrop,
  Inject,
  Month,
  Resize,
  ScheduleComponent,
  ViewDirective,
  ViewsDirective,
  Week,
  WorkWeek,
} from '@syncfusion/ej2-react-schedule';
import React, { useState } from 'react';

import { scheduleData } from '@/common/assets/dummy';
import Header from '@/common/components/elements/Header';

type CalendarProps = {};

// @ts-ignore eslint-disable-next-line react/destructuring-assignment
const PropertyPane = (props) => <div className="mt-5">{props.children}</div>;

const Calendar: React.FC<CalendarProps> = React.memo(() => {
  const [scheduleObj, setScheduleObj] = useState();
  // @ts-ignore
  const change = (args) => {
    // @ts-ignore
    scheduleObj.selectedDate = args.value;
    // @ts-ignore
    scheduleObj.dataBind();
  };

  // @ts-ignore
  const onDragStart = (arg) => {
    // eslint-disable-next-line no-param-reassign
    arg.navigation.enable = true;
  };

  return (
    <div className="m-2 mt-24 rounded-3xl bg-white p-2 md:m-10 md:p-10">
      <Header category="App" title="Calendar" />
      <ScheduleComponent
        height="650px"
        // @ts-ignore
        ref={(schedule) => setScheduleObj(schedule)}
        selectedDate={new Date(2021, 0, 10)}
        eventSettings={{ dataSource: scheduleData }}
        dragStart={onDragStart}
      >
        <ViewsDirective>
          {['Day', 'Week', 'WorkWeek', 'Month', 'Agenda'].map((item) => (
            // @ts-ignore
            <ViewDirective key={item} option={item} />
          ))}
        </ViewsDirective>
        <Inject
          services={[Day, Week, WorkWeek, Month, Agenda, Resize, DragAndDrop]}
        />
      </ScheduleComponent>
      <PropertyPane>
        <table style={{ width: '100%', background: 'white' }}>
          <tbody>
            <tr style={{ height: '50px' }}>
              <td style={{ width: '100%' }}>
                <DatePickerComponent
                  value={new Date(2021, 0, 10)}
                  showClearButton={false}
                  placeholder="Current Date"
                  floatLabelType="Always"
                  change={change}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </PropertyPane>
    </div>
  );
});

export default Calendar;
