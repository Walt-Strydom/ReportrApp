declare module 'react-pull-to-refresh' {
  import React from 'react';

  export interface ReactPullToRefreshProps {
    onRefresh: () => Promise<void>;
    className?: string;
    style?: React.CSSProperties;
    resistance?: number;
    distanceToRefresh?: number;
    pullingContent?: React.ReactNode;
    refreshingContent?: React.ReactNode;
    children: React.ReactNode;
  }

  const PullToRefresh: React.ComponentType<ReactPullToRefreshProps>;
  
  export default PullToRefresh;
}