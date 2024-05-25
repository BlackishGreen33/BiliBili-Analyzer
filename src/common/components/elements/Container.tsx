import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  [propName: string]: React.ReactNode | string | undefined;
}

const Container: React.FC<ContainerProps> = React.memo(
  ({ children, className = '', ...others }) => {
    return (
      <div className={`mb-10 mt-20 p-8 lg:mt-0 ${className} `} {...others}>
        {children}
      </div>
    );
  }
);

export default Container;
