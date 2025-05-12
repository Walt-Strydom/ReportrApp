declare module 'react-pull-to-refresh' {
  import { ComponentType, ReactNode, ReactElement } from 'react';

  export interface PullToRefreshProps {
    onRefresh: () => Promise<any>;
    pullDownThreshold?: number;
    maxPullDownDistance?: number;
    resistance?: number;
    pullingContent?: ReactNode;
    refreshingContent?: ReactNode;
    children: ReactNode;
    className?: string;
  }

  const PullToRefresh: ComponentType<PullToRefreshProps>;
  export default PullToRefresh;
}