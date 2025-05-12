import { useState } from 'react';
import { XIcon, ArrowUpIcon, ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Issue } from '@/types';
import { generateDeviceId } from '@/lib/imageUtils';
import { queryClient } from '@/lib/queryClient';
import { getIssueTypeById } from '@/data/issueTypes';

interface IssueDetailsPanelProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function IssueDetailsPanel({ 
  issue, 
  isOpen, 
  onClose,
  onSuccess 
}: IssueDetailsPanelProps) {
  const [isSupporting, setIsSupporting] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);
  const { toast } = useToast();

  if (!issue) return null;

  // Format date for display
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });
  const formattedDate = format(new Date(issue.createdAt), 'MMM d, yyyy');

  // Get issue type details  
  const issueType = getIssueTypeById(issue.type);

  // Get badge color based on issue type
  const getBadgeColor = () => {
    return issueType ? `bg-[${issueType.color}]` : 'bg-neutral-500';
  };
  
  // Get the actual color value for backgrounds
  const getColorValue = () => {
    return issueType ? issueType.color : '#6b7280';  // neutral gray as fallback
  };

  // Format issue type for display
  const formatIssueType = () => {
    if (issueType) {
      return issueType.name;
    }
    
    // Fallback for old issue types (backward compatibility)
    switch (issue.type) {
      case 'pothole':
        return 'Pothole';
      case 'streetlight':
        return 'Street Light';
      case 'trafficlight':
        return 'Traffic Light';
      default:
        return issue.type.charAt(0).toUpperCase() + issue.type.slice(1).replace(/-/g, ' ');
    }
  };

  const handleSupport = async () => {
    if (isSupporting || hasSupported || !issue) return;
    
    try {
      setIsSupporting(true);
      
      // Get device ID
      const deviceId = generateDeviceId();
      
      // Send support request
      const response = await apiRequest('POST', `/api/issues/${issue.id}/support`, {
        deviceId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to support this issue');
      }
      
      // Mark as supported
      setHasSupported(true);
      
      // Show success message
      toast({
        title: "Issue Supported",
        description: "Thank you for supporting this issue. It helps prioritize repairs.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/issues/nearby'] });
      
      // Close panel and show success
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Support error:', error);
      toast({
        title: "Support Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSupporting(false);
    }
  };
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg z-20 max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="p-6 pb-12">
        <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-6"></div>
        
        <div className="flex items-start mb-6">
          {issue.photoUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-gray-200">
              <img 
                src={issue.photoUrl} 
                alt={`${issue.type} issue`} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  // If image fails to load, replace with logo
                  e.currentTarget.src = '/assets/logo-orange.png';
                  e.currentTarget.style.padding = '5px';
                  e.currentTarget.style.objectFit = 'contain';
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg flex items-center justify-center mr-4" 
              style={{backgroundColor: `${getColorValue()}25`}}>
              <img 
                src="/assets/logo-orange.png" 
                alt="Municipality Logo" 
                className="h-10 w-auto" 
                style={{opacity: 0.8}}
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className={`inline-block px-2 py-1 ${getBadgeColor()} text-white text-xs rounded-full mr-2`}>
                {formatIssueType()}
              </span>
              <span className="text-xs text-neutral-500">Reported {timeAgo}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{issue.address}</h3>
            <p className="text-sm text-neutral-600 mb-2">{issue.notes || 'No additional details provided.'}</p>
            
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <ArrowUpIcon className="text-primary mr-1 h-4 w-4" />
                <span className="font-medium">{issue.upvotes} {issue.upvotes === 1 ? 'supporter' : 'supporters'}</span>
              </div>
              <div className="text-xs text-neutral-500">
                <ClockIcon className="inline mr-1 h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSupport}
          className={`w-full py-3 rounded-lg font-medium mb-4 flex items-center justify-center ${
            hasSupported ? 'bg-success' : 'bg-primary'
          } text-white`}
          disabled={isSupporting || hasSupported}
        >
          {hasSupported ? (
            <>
              <span className="mr-2">✓</span>
              <span>Supported</span>
            </>
          ) : (
            <>
              <ArrowUpIcon className="mr-2 h-5 w-5" />
              <span>Support This Issue</span>
            </>
          )}
        </Button>
        
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border border-neutral-300 text-neutral-800 py-3 rounded-lg font-medium"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
