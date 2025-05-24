import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';

interface SuccessOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function SuccessOverlay({ isOpen, onClose, title, message }: SuccessOverlayProps) {
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-2xl p-6 w-5/6 max-w-md">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">{title}</h3>
          <p className="text-neutral-600 mb-6">{message}</p>
          <Button 
            onClick={onClose}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
