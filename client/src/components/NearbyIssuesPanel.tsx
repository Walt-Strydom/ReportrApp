import { useState, useRef, useEffect } from 'react';
import { XIcon, SearchIcon, ArrowUpIcon, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Issue } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById, issueCategories } from '@/data/issueTypes';
import Icon from '@/components/Icon';
import { useTranslation } from 'react-i18next';

interface NearbyIssuesPanelProps {
  issues: Issue[];
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
  onRefresh?: () => Promise<any>;
}

export default function NearbyIssuesPanel({ 
  issues, 
  isOpen, 
  onClose, 
  onIssueClick,
  onRefresh 
}: NearbyIssuesPanelProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  // Touch-based pull-to-refresh implementation
  const touchStartY = useRef<number | null>(null);
  const touchMoveY = useRef<number | null>(null);
  const pullThreshold = 70; // Pixels user needs to pull down to trigger refresh

  // Filter issues based on current filter, category, and search query
  const filteredIssues = issues.filter(issue => {
    // If categoryFilter is set, check if the issue belongs to that category
    const issueType = getIssueTypeById(issue.type);
    
    const matchesCategory = !categoryFilter || 
      (issueType && issueType.categoryId === categoryFilter) || 
      // Handle legacy types
      (categoryFilter === 'roads-traffic' && (issue.type === 'pothole' || issue.type === 'trafficlight')) ||
      (categoryFilter === 'street-lighting' && issue.type === 'streetlight');
    
    const matchesFilter = filter === 'all' || issue.type === filter;
    const matchesSearch = !searchQuery || 
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return (categoryFilter ? matchesCategory : matchesFilter) && matchesSearch;
  });
  
  // Get the actual color value (not class name) for backgrounds
  const getColorValue = (type: string) => {
    const issueType = getIssueTypeById(type);
    
    if (issueType) {
      return issueType.color;
    }
    
    // Fall back to legacy types with hex values
    switch (type) {
      case 'pothole':
        return '#ef4444';  // destructive red
      case 'streetlight':
        return '#0ea5e9';  // accent blue
      case 'trafficlight':
        return '#6366f1';  // secondary purple
      default:
        return '#6b7280';  // neutral gray
    }
  };

  // Format issue type for display
  const formatIssueType = (type: string) => {
    const issueType = getIssueTypeById(type);
    
    if (issueType) {
      return issueType.name;
    }
    
    // Fall back to legacy types
    switch (type) {
      case 'pothole':
        return 'Pothole';
      case 'streetlight':
        return 'Street Light';
      case 'trafficlight':
        return 'Traffic Light';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
    }
  };

  // Reset pull-to-refresh state after animation completes
  useEffect(() => {
    if (!isRefreshing && pullDistance > 0) {
      // Add a slight delay to reset the pull distance after refresh animation
      const timer = setTimeout(() => {
        setPullDistance(0);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, pullDistance]);
  
  // Handle pull-to-refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };
  
  // Touch handlers for custom pull-to-refresh
  const touchStartHandler = (e: React.TouchEvent) => {
    if (isRefreshing) return; // Don't allow new pulls while refreshing
    
    // Get the scroll position of the content area
    const scrollTop = e.currentTarget.parentElement?.querySelector('.overflow-y-auto')?.scrollTop;
    
    // Only enable pull-to-refresh when at the top of the content
    if (scrollTop && scrollTop > 0) return;
    
    // Record the starting Y position when user touches the screen
    touchStartY.current = e.touches[0].clientY;
    touchMoveY.current = null;
    setPullDistance(0);
  };
  
  const touchMoveHandler = (e: React.TouchEvent) => {
    if (touchStartY.current === null || isRefreshing) return;
    
    // Record the current position as user moves finger
    touchMoveY.current = e.touches[0].clientY;
    
    // Calculate how far user has pulled down
    const distance = touchMoveY.current - touchStartY.current;
    
    // Only allow positive (downward) pull
    if (distance <= 0) {
      setPullDistance(0);
      return;
    }
    
    // Apply resistance to make pull feel more natural 
    // (the further you pull, the harder it gets)
    const resistedPull = Math.min(Math.pow(distance, 0.8), 100);
    setPullDistance(resistedPull);
    
    // Prevent default scrolling behavior when pulling down
    if (distance > 10) {
      e.preventDefault();
    }
  };
  
  const touchEndHandler = (e: React.TouchEvent) => {
    if (isRefreshing || touchStartY.current === null || touchMoveY.current === null) {
      return;
    }
    
    // Calculate pull distance
    const distance = touchMoveY.current - touchStartY.current;
    
    // If user pulled down far enough, trigger refresh
    if (distance >= pullThreshold) {
      handleRefresh();
    } else {
      // Reset pull distance immediately if we're not refreshing
      setPullDistance(0);
    }
    
    // Reset tracking variables
    touchStartY.current = null;
    touchMoveY.current = null;
  };

  // Create a custom pull-to-refresh indicator
  const pullToRefreshIndicator = () => {
    // Calculate opacity based on pull distance (max opacity at threshold)
    const opacity = Math.min(pullDistance / pullThreshold, 1);
    
    // Calculate rotation for the icon based on pull distance
    const rotation = Math.min(pullDistance / pullThreshold * 180, 180);
    
    // Show different content based on whether we're refreshing or pulling
    if (isRefreshing) {
      return (
        <div className="flex items-center justify-center p-3 text-primary">
          <RotateCw className="animate-spin h-5 w-5 mr-2" />
          <span>{t('issues.refreshing', 'Refreshing...')}</span>
        </div>
      );
    }
    
    return (
      <div 
        className="flex flex-col items-center justify-center p-3 text-neutral-500 transition-opacity"
        style={{ 
          opacity: opacity,
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
        }}
      >
        <div className="flex items-center mb-1">
          <RotateCw 
            className="h-5 w-5 mr-2 transition-transform" 
            style={{ 
              transform: `rotate(${rotation}deg)`,
              color: pullDistance >= pullThreshold ? '#f97316' : '#6b7280',
            }}
          />
          <span>
            {pullDistance >= pullThreshold 
              ? t('issues.releaseToRefresh', 'Release to refresh') 
              : t('issues.pullToRefresh', 'Pull down to refresh')}
          </span>
        </div>
        {pullDistance > 0 && pullDistance < pullThreshold && (
          <div className="w-full bg-gray-200 h-1 rounded-full mt-1 overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${(pullDistance / pullThreshold) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-white z-20 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full w-full flex flex-col">
        {/* Fixed header at the top */}
        <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
          <h2 className="font-bold text-xl">{t('nearby.title', 'Nearby')}</h2>
          <button 
            className="text-neutral-800 p-2" 
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div 
            className="absolute top-16 left-0 right-0 z-10 flex justify-center"
            style={{
              transform: pullDistance > 0 && !isRefreshing ? `translateY(${pullDistance}px)` : 'none'
            }}
          >
            {pullToRefreshIndicator()}
          </div>
        )}
        
        {/* Scrollable content area */}
        <div 
          className="flex-1 overflow-y-auto pb-20"
          style={{ 
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Main content without the header which is now fixed */}
          <div className="p-6 pt-2">
            <div className="mb-4">
              <div className="relative">
                <Input 
                  type="text" 
                  className="w-full p-3 pl-10 border border-neutral-200 rounded-lg" 
                  placeholder={t('search.placeholder', 'Search...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-5 w-5" />
              </div>
            </div>
            
            <div className="mb-4">
              {/* Category filter buttons */}
              <h3 className="text-sm font-medium text-neutral-500 mb-2">{t('categories.label', 'Categories')}</h3>
              <div className="flex overflow-x-auto py-2 -mx-2 mb-4">
                <Button
                  variant={categoryFilter === null ? 'default' : 'outline'}
                  className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm flex items-center ${
                    categoryFilter === null ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
                  }`}
                  onClick={() => {
                    setCategoryFilter(null);
                    setFilter('all');
                  }}
                >
                  <Icon name="grid" className="mr-1.5 h-3.5 w-3.5" />
                  {t('categories.all', 'All Categories')}
                </Button>
                
                {issueCategories.map(category => (
                  <Button
                    key={category.id}
                    variant={categoryFilter === category.id ? 'default' : 'outline'}
                    className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm flex items-center ${
                      categoryFilter === category.id ? 
                      `text-white` : 
                      'bg-neutral-200 text-neutral-800'
                    }`}
                    onClick={() => {
                      setCategoryFilter(category.id);
                      setFilter('all');
                    }}
                    style={categoryFilter === category.id ? {backgroundColor: category.color} : {}}
                  >
                    {/* Show a representative icon for the category */}
                    {category.id === 'roads-traffic' && 
                      <Icon name="pothole" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.id === 'street-lighting' && 
                      <Icon name="lightbulb" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.id === 'water' && 
                      <Icon name="droplets" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.id === 'electricity' && 
                      <Icon name="zap" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.id === 'waste' && 
                      <Icon name="trash" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.id === 'public-spaces' && 
                      <Icon name="building" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.id === 'environmental' && 
                      <Icon name="palmtree" className="mr-1.5 h-3.5 w-3.5" />
                    }
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600">{t('nearby.noIssues', 'No issues found matching your criteria')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map(issue => (
                  <div 
                    key={issue.id}
                    className="border border-neutral-200 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => onIssueClick(issue.id)}
                  >
                    <div className="flex items-start p-4">
                      {issue.photoUrl ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-neutral-200">
                          <img 
                            src={issue.photoUrl} 
                            alt={`${issue.type} issue`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, replace with logo
                              e.currentTarget.src = '/logo-orange.png';
                              e.currentTarget.style.padding = '5px';
                              e.currentTarget.style.objectFit = 'contain';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center mr-4" 
                          style={{backgroundColor: `${getColorValue(issue.type)}25`}}>
                          <img 
                            src="/logo-orange.png" 
                            alt="Municipality Logo" 
                            className="h-10 w-auto" 
                            style={{opacity: 0.8}}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <div
                            className="flex items-center px-3 py-1.5 rounded-full mr-3 text-white text-xs font-medium"
                            style={{ backgroundColor: getColorValue(issue.type) }}
                          >
                            <Icon name={issue.type} className="mr-1.5 h-3.5 w-3.5" />
                            {formatIssueType(issue.type)}
                          </div>
                          <span className="text-xs text-neutral-500">
                            {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="font-medium mb-1">{issue.address}</h3>
                        <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                          {issue.notes || t('issue.noDetails', 'No additional details provided.')}
                        </p>
                        
                        <div className="flex items-center">
                          <div className="flex items-center">
                            <ArrowUpIcon className="text-primary mr-1 h-4 w-4" />
                            <span className="font-medium">
                              {issue.upvotes} {issue.upvotes === 1 ? 
                                t('issue.supporter', 'supporter') : 
                                t('issue.supporters', 'supporters')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Extra padding at bottom */}
          <div className="h-24"></div>
        </div>
        
        {/* If refresh is enabled, add a touch listener for pull-to-refresh */}
        {onRefresh && (
          <div 
            className="absolute top-0 left-0 right-0 h-24 z-20 opacity-0"
            onTouchStart={(e) => touchStartHandler(e)}
            onTouchMove={(e) => touchMoveHandler(e)}
            onTouchEnd={(e) => touchEndHandler(e)}
          />
        )}
      </div>
    </div>
  );
}