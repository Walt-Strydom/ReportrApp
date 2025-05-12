import { useState, useEffect } from 'react';
import { generateDeviceId } from '@/lib/imageUtils';
import { Issue } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { getIssueTypeById } from '@/data/issueTypes';
import { ThumbsUp, MapPin, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface MyComplaintsProps {
  onIssueClick: (issueId: number) => void;
}

export default function MyComplaints({ onIssueClick }: MyComplaintsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Get device ID
  useEffect(() => {
    const id = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem('deviceId', id);
    setDeviceId(id);
  }, []);

  // Fetch all issues
  const { data: issues = [], isLoading, error } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
    enabled: !!deviceId,
  });

  // Filter issues to only show those reported by this device
  const myIssues = issues.filter(issue => {
    // This is an approximation as we don't store the reporter device ID in the backend
    // In a real app, you would have a more robust way to track user-submitted issues
    const issueFingerprint = `${issue.latitude.toFixed(6)}-${issue.longitude.toFixed(6)}-${issue.type}`;
    const reportedIssues = JSON.parse(localStorage.getItem('reportedIssues') || '[]');
    return reportedIssues.includes(issueFingerprint);
  });

  // Format issue type display
  const formatIssueType = (type: string) => {
    const issueType = getIssueTypeById(type);
    if (issueType) {
      return issueType.name;
    }
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  };

  // Get badge color for an issue
  const getBadgeColor = (type: string) => {
    const issueType = getIssueTypeById(type);
    if (issueType) {
      return issueType.color;
    }
    return '#6b7280'; // Default gray
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">{t('home.topIssues.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-center text-red-500">{t('home.topIssues.error')}</p>
      </div>
    );
  }

  if (myIssues.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg my-4">
        <div className="text-center py-6">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-2">{t('myComplaints.empty.title')}</h3>
          <p className="text-gray-500 text-sm mb-0">
            {t('myComplaints.empty.description')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {myIssues.map(issue => (
        <div
          key={issue.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onIssueClick(issue.id)}
        >
          <div className="flex items-start">
            {issue.photoUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden mr-4 bg-gray-200">
                <img 
                  src={issue.photoUrl} 
                  alt={`${issue.type} issue`} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg flex items-center justify-center mr-4" 
                style={{backgroundColor: `${getBadgeColor(issue.type)}25`}}>
                <img 
                  src="/assets/lokisa-logo.png" 
                  alt="Municipality Logo" 
                  className="h-10 w-auto" 
                  style={{opacity: 0.8}}
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span 
                  className="inline-block px-2 py-1 text-white text-xs rounded-full mr-2" 
                  style={{backgroundColor: getBadgeColor(issue.type)}}
                >
                  {formatIssueType(issue.type)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-medium mb-1 line-clamp-1">{issue.address}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {issue.notes || t('issues.details.notes')}
              </p>
              
              <div className="flex items-center">
                <div className="flex items-center">
                  <ThumbsUp className="text-primary mr-1 h-4 w-4" />
                  <span className="font-medium">
                    {issue.upvotes} {issue.upvotes === 1 
                      ? t('issues.details.supporters', { count: 1 }) 
                      : t('issues.details.supporters', { count: issue.upvotes })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}