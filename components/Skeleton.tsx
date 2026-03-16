import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius, className = '', style }) => {
  const styles: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: borderRadius,
    ...style,
  };

  return <div className={`skeleton ${className}`} style={styles} />;
};

export default Skeleton;
