import { useState, useEffect } from 'react';
import { XIcon, ArrowUpIcon, ClockIcon, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { Issue } from '@/types';
import { generateDeviceId } from '@/lib/imageUtils';
import { queryClient } from '@/lib/queryClient';
import { getIssueTypeById } from '@/data/issueTypes';
import Icon from '@/components/Icon';

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
  const [isRevoking, setIsRevoking] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize device ID
    const storedId = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem('deviceId', storedId);
    setDeviceId(storedId);

    // Check if user has already supported this issue
    if (issue && storedId) {
      const checkSupportStatus = async () => {
        try {
          const response = await fetch(`/api/issues/${issue.id}/support/${storedId}`, {
            method: 'GET'
          });
          
          if (response.ok) {
            // User has already supported this issue
            setHasSupported(true);
          } else {
            // User has not supported this issue yet
            setHasSupported(false);
          }
        } catch (error) {
          console.error('Error checking support status:', error);
        }
      };
      
      checkSupportStatus();
    }
  }, [issue]);

  if (!issue) return null;

  // Format date for display
  const timeAgo = formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true });
  const formattedDate = format(new Date(issue.createdAt), 'MMM d, yyyy');

  // Get issue type details  
  const issueType = getIssueTypeById(issue.type);

  // Get the actual color value for backgrounds and badges
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
  
  const handleRevokeSupport = async () => {
    if (isRevoking || !hasSupported || !issue) return;
    
    try {
      setIsRevoking(true);
      
      // Use fetch with DELETE method to revoke support
      const response = await fetch(`/api/issues/${issue.id}/support`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke support');
      }
      
      // Mark as not supported
      setHasSupported(false);
      
      // Show success message
      toast({
        title: "Support Revoked",
        description: "Your support has been withdrawn.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/issues/nearby'] });
      
      // Close panel and show success
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Revoke support error:', error);
      toast({
        title: "Failed to Revoke Support",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRevoking(false);
    }
  };
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg z-20 max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{paddingBottom: 'max(24px, env(safe-area-inset-bottom))'}}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close details"
          >
            <XIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex items-start mb-6">
          {issue.photoUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-gray-200">
              <img 
                src={issue.photoUrl} 
                alt={`${issue.type} issue`} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  // If image fails to load, replace with logo
                  e.currentTarget.src = '/logo-new.png';
                  e.currentTarget.style.padding = '5px';
                  e.currentTarget.style.objectFit = 'contain';
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg flex items-center justify-center mr-4" 
              style={{backgroundColor: `${getColorValue()}25`}}>
              <img 
                src="/logo-new.png" 
                alt="Municipality Logo" 
                className="h-10 w-auto" 
                style={{opacity: 0.8}}
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div 
                className="flex items-center px-3 py-1.5 rounded-full mr-3 text-white text-xs font-medium"
                style={{ backgroundColor: getColorValue() }}
              >
                {issueType && (
                  <Icon name={issue.type} className="mr-1.5 h-3.5 w-3.5" />
                )}
                {formatIssueType()}
              </div>
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
        
        {!hasSupported ? (
          <Button
            onClick={handleSupport}
            className="w-full py-3 rounded-lg font-medium mb-4 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
            disabled={isSupporting}
          >
            {isSupporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                <span>Supporting...</span>
              </>
            ) : (
              <>
                <ThumbsUp className="mr-2 h-5 w-5" />
                <span>Support</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleRevokeSupport}
            className="w-full py-3 rounded-lg font-medium mb-4 flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
            disabled={isRevoking}
          >
            {isRevoking ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                <span>Revoking...</span>
              </>
            ) : (
              <>
                <ThumbsDown className="mr-2 h-5 w-5" />
                <span>Revoke Support</span>
              </>
            )}
          </Button>
        )}
        
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
