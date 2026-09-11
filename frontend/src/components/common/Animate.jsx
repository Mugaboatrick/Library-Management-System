import React from 'react';

const Animate = ({ type = 'fade-up', delay = 0, duration, className = '', as: Tag = 'div', children, ...rest }) => {
  const style = {
    animationDelay: delay ? `${delay}ms` : undefined,
    ...(duration ? { animationDuration: `${duration}ms` } : {})
  };
  return (
    <Tag className={`animate-${type} ${className}`} style={style} {...rest}>
      {children}
    </Tag>
  );
};

export default Animate;