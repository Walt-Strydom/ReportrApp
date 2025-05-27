import { useState } from 'react';
import { XIcon, SearchIcon, ArrowUpIcon, RefreshCwIcon, CalendarIcon, FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Issue } from '@/types';
import { formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { getIssueTypeById, issueCategories, getAllIssueTypes } from '@/data/issueTypes';
import Icon from '@/components/Icon';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

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
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [issueTypeFilter, setIssueTypeFilter] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [filterTab, setFilterTab] = useState<string>("category");
  
  // Get all issue types for the filter dropdown
  const allIssueTypes = getAllIssueTypes();

  // Filter issues based on current filters
  const filteredIssues = issues.filter(issue => {
    // If categoryFilter is set, check if the issue belongs to that category
    const issueType = getIssueTypeById(issue.type);
    
    // Category filtering
    const matchesCategory = !categoryFilter || 
      (issueType && issueType.categoryId === categoryFilter) || 
      // Handle legacy types
      (categoryFilter === 'roads-traffic' && (issue.type === 'pothole' || issue.type === 'trafficlight')) ||
      (categoryFilter === 'street-lighting' && issue.type === 'streetlight');
    
    // Issue type filtering
    const matchesIssueType = !issueTypeFilter || issue.type === issueTypeFilter;
    
    // Time filtering (30, 60, 90 days)
    const matchesTimeFilter = !timeFilter || 
      isAfter(new Date(issue.createdAt), subDays(new Date(), timeFilter));
    
    // Search query filtering
    const matchesSearch = !searchQuery || 
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Combined filters
    return matchesCategory && matchesIssueType && matchesTimeFilter && matchesSearch;
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
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        // Update last refresh time
        setLastRefreshTime(new Date());
        toast({
          title: "Refreshed!",
          description: "Issues have been updated with the latest data.",
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: "Refresh failed",
          description: "Could not refresh issues. Please try again.",
          variant: "destructive",
          duration: 2000,
        });
        console.error("Error refreshing issues:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
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
        {/* Fixed header at the top - iOS Safe Area */}
        <div className="px-6 bg-white shadow-sm" style={{paddingTop: 'max(16px, calc(16px + env(safe-area-inset-top)))', paddingBottom: '16px'}}>
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl">{t('nearby.title', 'Nearby')}</h2>
            <div className="flex items-center space-x-2">
              <button 
                className="text-neutral-800 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCwIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              </button>
              <button 
                className="text-neutral-800 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors" 
                onClick={() => {
                  // Log the close action and call the onClose handler
                  console.log('Nearby panel close button clicked');
                  onClose();
                }}
                aria-label="Close"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Last refresh indicator */}
          <div className="flex items-center text-xs text-neutral-500 mt-1">
            <RefreshCwIcon className="h-3 w-3 mr-1" />
            <span>
              {isRefreshing 
                ? 'Refreshing...' 
                : `Last refreshed: ${formatDistanceToNow(lastRefreshTime, { addSuffix: true })}`
              }
            </span>
          </div>
          
          {/* Ad banner at the top of Nearby page */}
          <div className="mt-4">
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="pt-2 pb-1 px-4 bg-gray-50 border-b border-gray-100">
                <h2 className="text-xs font-medium text-gray-500">Sponsored</h2>
              </div>
              <div className="p-3 flex justify-center items-center">
                <div className="bg-gray-100 rounded w-full h-16 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Ad Banner Space</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
            
            {/* Filter controls */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-500">{t('filters.label', 'Filters')}</h3>
                
                {/* Time period filter dropdown */}
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-neutral-500 mr-2" />
                  <Select
                    value={timeFilter ? String(timeFilter) : "all"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setTimeFilter(null);
                      } else {
                        setTimeFilter(parseInt(value, 10));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="60">Last 60 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filter tabs */}
              <Tabs 
                defaultValue="category" 
                value={filterTab} 
                onValueChange={setFilterTab}
                className="w-full mb-4"
              >
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="category" 
                    onClick={() => {
                      setIssueTypeFilter(null);
                      setFilterTab("category");
                    }}
                  >
                    Categories
                  </TabsTrigger>
                  <TabsTrigger value="issueType"
                    onClick={() => {
                      setCategoryFilter(null);
                      setFilterTab("issueType");
                    }}
                  >
                    Issue Types
                  </TabsTrigger>
                </TabsList>
                
                {/* Category filter content */}
                <TabsContent value="category" className="mt-0">
                  <div className="flex overflow-x-auto py-2 -mx-2">
                    <Button
                      variant={categoryFilter === null ? 'default' : 'outline'}
                      className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm flex items-center ${
                        categoryFilter === null ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
                      }`}
                      onClick={() => {
                        setCategoryFilter(null);
                        setIssueTypeFilter(null);
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
                          setIssueTypeFilter(null);
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
                </TabsContent>
                
                {/* Issue Types filter content */}
                <TabsContent value="issueType" className="mt-0">
                  <div className="flex overflow-x-auto py-2 -mx-2">
                    <Button
                      variant={issueTypeFilter === null ? 'default' : 'outline'}
                      className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm flex items-center ${
                        issueTypeFilter === null ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
                      }`}
                      onClick={() => {
                        setIssueTypeFilter(null);
                      }}
                    >
                      <Icon name="grid" className="mr-1.5 h-3.5 w-3.5" />
                      All Issue Types
                    </Button>
                    
                    {allIssueTypes.map(issueType => (
                      <Button
                        key={issueType.id}
                        variant={issueTypeFilter === issueType.id ? 'default' : 'outline'}
                        className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm flex items-center ${
                          issueTypeFilter === issueType.id ? 
                          `text-white` : 
                          'bg-neutral-200 text-neutral-800'
                        }`}
                        onClick={() => setIssueTypeFilter(issueType.id)}
                        style={issueTypeFilter === issueType.id ? {backgroundColor: issueType.color} : {}}
                      >
                        <Icon name={issueType.id} className="mr-1.5 h-3.5 w-3.5" />
                        {issueType.name}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Active filters */}
              {(timeFilter || categoryFilter || issueTypeFilter) && (
                <div className="flex flex-wrap items-center mt-2 mb-4">
                  <span className="text-xs text-neutral-500 mr-2">Active filters:</span>
                  
                  {timeFilter && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center mr-2 mb-1">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Last {timeFilter} Days
                      <button 
                        className="ml-1 hover:text-primary-dark" 
                        onClick={() => setTimeFilter(null)}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {categoryFilter && (
                    <span 
                      className="text-white text-xs px-2 py-1 rounded-full flex items-center mr-2 mb-1"
                      style={{ backgroundColor: issueCategories.find(c => c.id === categoryFilter)?.color }}
                    >
                      {issueCategories.find(c => c.id === categoryFilter)?.name}
                      <button 
                        className="ml-1 text-white/80 hover:text-white" 
                        onClick={() => setCategoryFilter(null)}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {issueTypeFilter && (
                    <span 
                      className="text-white text-xs px-2 py-1 rounded-full flex items-center mr-2 mb-1"
                      style={{ backgroundColor: getIssueTypeById(issueTypeFilter)?.color }}
                    >
                      {getIssueTypeById(issueTypeFilter)?.name}
                      <button 
                        className="ml-1 text-white/80 hover:text-white" 
                        onClick={() => setIssueTypeFilter(null)}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  <button 
                    className="text-xs text-neutral-500 underline hover:text-primary mb-1"
                    onClick={() => {
                      setTimeFilter(null);
                      setCategoryFilter(null);
                      setIssueTypeFilter(null);
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
            
            {filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600">{t('nearby.noIssues', 'No issues found matching your criteria')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue, index) => (
                  <div key={issue.id}>
                    <div 
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
                    
                    {/* Ad banner after every 3 issues */}
                    {(index + 1) % 3 === 0 && index < filteredIssues.length - 1 && (
                      <div className="my-4">
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                          <div className="pt-2 pb-1 px-4 bg-gray-50 border-b border-gray-100">
                            <h2 className="text-xs font-medium text-gray-500">Sponsored</h2>
                          </div>
                          <div className="p-3 flex justify-center items-center">
                            <div className="bg-gray-100 rounded w-full h-16 flex items-center justify-center">
                              <p className="text-sm text-gray-500">Ad Banner Space</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Extra padding at bottom */}
          <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
}