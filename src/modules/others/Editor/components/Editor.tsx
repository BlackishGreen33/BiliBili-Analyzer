'use client';

import {
  HtmlEditor,
  Image,
  Inject,
  Link,
  QuickToolbar,
  RichTextEditorComponent,
  Toolbar,
} from '@syncfusion/ej2-react-richtexteditor';
import React from 'react';

import Header from '@/common/components/elements/Header';
import { EditorData } from '../../../../common/dummy/dummy';

const Editor: React.FC = React.memo(() => (
  <div className="m-2 mt-24 rounded-3xl bg-white p-2 md:m-10 md:p-10">
    <Header category="App" title="Editor" />
    <RichTextEditorComponent>
      <EditorData />
      <Inject services={[HtmlEditor, Toolbar, Image, Link, QuickToolbar]} />
    </RichTextEditorComponent>
  </div>
));

export default Editor;
