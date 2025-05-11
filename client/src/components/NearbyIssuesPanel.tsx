import { useState } from 'react';
import { XIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Issue } from '@/types';
import { formatDistanceToNow } from 'date-fns';

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

  // Filter issues based on current filter and search query
  const filteredIssues = issues.filter(issue => {
    const matchesFilter = filter === 'all' || issue.type === filter;
    const matchesSearch = !searchQuery || 
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Get badge color based on issue type
  const getBadgeColor = (type: string) => {
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

  // Format issue type for display
  const formatIssueType = (type: string) => {
    switch (type) {
      case 'pothole':
        return 'Pothole';
      case 'streetlight':
        return 'Street Light';
      case 'trafficlight':
        return 'Traffic Light';
      default:
        return 'Other';
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-white z-20 transform transition-transform duration-300 ${
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
          <div className="flex overflow-x-auto py-2 -mx-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
              onClick={() => setFilter('all')}
            >
              All Issues
            </Button>
            
            <Button
              variant={filter === 'pothole' ? 'default' : 'outline'}
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                filter === 'pothole' ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
              onClick={() => setFilter('pothole')}
            >
              Potholes
            </Button>
            
            <Button
              variant={filter === 'streetlight' ? 'default' : 'outline'} 
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                filter === 'streetlight' ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
              onClick={() => setFilter('streetlight')}
            >
              Street Lights
            </Button>
            
            <Button
              variant={filter === 'trafficlight' ? 'default' : 'outline'}
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                filter === 'trafficlight' ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
              onClick={() => setFilter('trafficlight')}
            >
              Traffic Lights
            </Button>
            
            <Button
              variant={filter === 'other' ? 'default' : 'outline'}
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 text-sm ${
                filter === 'other' ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
              onClick={() => setFilter('other')}
            >
              Other
            </Button>
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
                  <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-neutral-200">
                    {issue.photoUrl && (
                      <img 
                        src={issue.photoUrl} 
                        alt={`${issue.type} issue`} 
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>
                  
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
                        <span className="font-medium">{issue.upvotes}</span>
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

// Import needed icon
import { ArrowUpIcon } from 'lucide-react';
