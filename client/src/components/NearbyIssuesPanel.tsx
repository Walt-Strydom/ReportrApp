import { useState, useEffect } from 'react';
import { XIcon, SearchIcon, ArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Issue } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById, issueCategories } from '@/data/issueTypes';

interface NearbyIssuesPanelProps {
  issues: Issue[];
  isOpen: boolean;
  onClose: () => void;
  onIssueClick: (issueId: number) => void;
}

export default function NearbyIssuesPanel({ 
  issues, 
  isOpen, 
  onClose, 
  onIssueClick 
}: NearbyIssuesPanelProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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

  // Get badge color based on issue type using the new category system
  const getBadgeColor = (type: string) => {
    const issueType = getIssueTypeById(type);
    
    if (issueType) {
      return `bg-[${issueType.color}]`;
    }
    
    // Fall back to legacy types
    switch (type) {
      case 'pothole':
        return 'bg-destructive';
      case 'streetlight':
        return 'bg-accent';
      case 'trafficlight':
        return 'bg-secondary';
      default:
        return 'bg-neutral-500';
    }
  };
  
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

  return (
    <div 
      className={`fixed inset-0 bg-white z-20 transform transition-transform duration-300 overflow-y-auto pb-20 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl">Nearby Issues</h2>
          <button className="text-neutral-800" onClick={onClose}>
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="relative">
            <Input 
              type="text" 
              className="w-full p-3 pl-10 border border-neutral-200 rounded-lg" 
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-5 w-5" />
          </div>
        </div>
        
        <div className="mb-4">
          {/* Category filter buttons */}
          <h3 className="text-sm font-medium text-neutral-500 mb-2">Categories</h3>
          <div className="flex overflow-x-auto py-2 -mx-2 mb-4">
            <Button
              variant={categoryFilter === null ? 'default' : 'outline'}
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                categoryFilter === null ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
              onClick={() => {
                setCategoryFilter(null);
                setFilter('all');
              }}
            >
              All Categories
            </Button>
            
            {issueCategories.map(category => (
              <Button
                key={category.id}
                variant={categoryFilter === category.id ? 'default' : 'outline'}
                className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                  categoryFilter === category.id ? 
                  `bg-[${category.color}] text-white` : 
                  'bg-neutral-200 text-neutral-800'
                }`}
                onClick={() => {
                  setCategoryFilter(category.id);
                  setFilter('all');
                }}
                style={categoryFilter === category.id ? {backgroundColor: category.color} : {}}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
        
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-600">No issues found matching your criteria</p>
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
                      <span className={`inline-block px-2 py-1 ${getBadgeColor(issue.type)} text-white text-xs rounded-full mr-2`}>
                        {formatIssueType(issue.type)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-medium mb-1">{issue.address}</h3>
                    <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                      {issue.notes || 'No additional details provided.'}
                    </p>
                    
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <ArrowUpIcon className="text-primary mr-1 h-4 w-4" />
                        <span className="font-medium">{issue.upvotes} {issue.upvotes === 1 ? 'supporter' : 'supporters'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ArrowUpIcon already imported at the top
