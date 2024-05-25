'use client';

import {
  ColumnDirective,
  ColumnsDirective,
  KanbanComponent,
} from '@syncfusion/ej2-react-kanban';
import React from 'react';

import { kanbanData, kanbanGrid } from '@/common/assets/dummy';
import Header from '@/common/components/elements/Header';

const Kanban: React.FC = React.memo(() => (
  <div className="m-2 mt-24 rounded-3xl bg-white p-2 md:m-10 md:p-10">
    <Header category="App" title="Kanban" />
    <KanbanComponent
      id="kanban"
      keyField="Status"
      dataSource={kanbanData}
      cardSettings={{ contentField: 'Summary', headerField: 'Id' }}
    >
      <ColumnsDirective>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        {kanbanGrid.map((item, index) => (
          <ColumnDirective key={index} {...item} />
        ))}
      </ColumnsDirective>
    </KanbanComponent>
  </div>
));

export default Kanban;
