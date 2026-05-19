import { type HTMLAttributes, forwardRef } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
};

export const Container = forwardRef<HTMLDivElement, Props>(function Container(
  { as: Tag = 'div', className = '', children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as never}
      className={`mx-auto w-full max-w-container px-6 md:px-10 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});
