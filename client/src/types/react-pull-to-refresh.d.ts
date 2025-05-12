declare module 'react-pull-to-refresh' {
  interface PullToRefreshProps {
    onRefresh: () => Promise<any>;
    className?: string;
    pullingContent?: React.ReactNode;
    refreshingContent?: React.ReactNode;
    children?: React.ReactNode;
  }
  
  const PullToRefresh: React.FC<PullToRefreshProps>;
  
  export default PullToRefresh;
}