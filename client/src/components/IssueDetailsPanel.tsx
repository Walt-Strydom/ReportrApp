import { useState } from 'react';
import { XIcon, ArrowUpIcon, ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Issue } from '@/types';
import { generateDeviceId } from '@/lib/imageUtils';
import { queryClient } from '@/lib/queryClient';

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
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const { toast } = useToast();

  if (!issue) return null;

  // Format date for display
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });
  const formattedDate = format(new Date(issue.createdAt), 'MMM d, yyyy');

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

  const handleUpvote = async () => {
    if (isUpvoting || isUpvoted || !issue) return;
    
    try {
      setIsUpvoting(true);
      
      // Get device ID
      const deviceId = generateDeviceId();
      
      // Send upvote request
      const response = await apiRequest('POST', `/api/issues/${issue.id}/upvote`, {
        deviceId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upvote');
      }
      
      // Mark as upvoted
      setIsUpvoted(true);
      
      // Show success message
      toast({
        title: "Issue Upvoted",
        description: "Thank you for confirming this issue. It helps prioritize repairs.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/issues/nearby'] });
      
      // Close panel and show success
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Upvote error:', error);
      toast({
        title: "Upvote Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpvoting(false);
    }
  };
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg z-20 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="p-6">
        <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-6"></div>
        
        <div className="flex items-start mb-6">
          <div className="w-20 h-20 rounded-lg overflow-hidden mr-4">
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
              <span className="text-xs text-neutral-500">Reported {timeAgo}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{issue.address}</h3>
            <p className="text-sm text-neutral-600 mb-2">{issue.notes || 'No additional details provided.'}</p>
            
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <ArrowUpIcon className="text-primary mr-1 h-4 w-4" />
                <span className="font-medium">{issue.upvotes}</span>
              </div>
              <div className="text-xs text-neutral-500">
                <ClockIcon className="inline mr-1 h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleUpvote}
          className={`w-full py-3 rounded-lg font-medium mb-4 flex items-center justify-center ${
            isUpvoted ? 'bg-success' : 'bg-primary'
          } text-white`}
          disabled={isUpvoting || isUpvoted}
        >
          {isUpvoted ? (
            <>
              <span className="mr-2">✓</span>
              <span>Upvoted</span>
            </>
          ) : (
            <>
              <ArrowUpIcon className="mr-2 h-5 w-5" />
              <span>Upvote This Issue</span>
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
