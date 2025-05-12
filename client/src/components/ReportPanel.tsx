import { useState, useRef } from 'react';
import { XIcon, ArrowLeftIcon, CameraIcon, MapPinIcon, InfoIcon, ChevronRightIcon, SmartphoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import IssueTypeCard from './IssueTypeCard';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { issueFormSchema } from '@shared/schema';
import { resizeImage } from '@/lib/imageUtils';
import { issueCategories, getAllIssueTypes } from '@/data/issueTypes';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { useCapacitorCamera } from '@/hooks/useCapacitorCamera';

interface ReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentLocation: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
}

type FormData = z.infer<typeof issueFormSchema>;

export default function ReportPanel({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentLocation 
}: ReportPanelProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { takePicture, isCapacitorAvailable } = useCapacitorCamera();

  const form = useForm<FormData>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      type: '',
      latitude: 0,
      longitude: 0,
      address: '',
      notes: '',
      reportId: nanoid(10),
      status: 'reported'
    }
  });

  const resetForm = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedIssueType(null);
    setPhoto(null);
    setPhotoFile(null);
    form.reset();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedIssueType(null); // Reset issue type when category changes
    setStep(1.5); // Go to subcategory selection
  };

  const handleIssueTypeSelect = (type: string) => {
    setSelectedIssueType(type);
    form.setValue('type', type);
  };

  const goToStep2 = () => {
    if (step === 1 && !selectedCategory) {
      toast({
        title: t('errors.form.required'),
        description: t('report.form.category.required'),
        variant: "destructive"
      });
      return;
    }
    
    if (step === 1.5 && !selectedIssueType) {
      toast({
        title: t('errors.form.required'),
        description: t('report.form.subcategory.required'),
        variant: "destructive"
      });
      return;
    }
    
    setStep(2);
  };
  
  const goBackFromSubcategory = () => {
    setSelectedCategory(null);
    setSelectedIssueType(null);
    setStep(1);
  };

  const goToStep3 = () => {
    // Photos are now optional, no check required
    
    // Set location data in form
    if (currentLocation.latitude && currentLocation.longitude && currentLocation.address) {
      form.setValue('latitude', currentLocation.latitude);
      form.setValue('longitude', currentLocation.longitude);
      form.setValue('address', currentLocation.address);
    } else {
      toast({
        title: t('errors.location.error'),
        description: t('errors.location.errorDesc'),
        variant: "destructive"
      });
      return;
    }
    
    setStep(3);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      // Resize image before storing
      try {
        const resizedFile = await resizeImage(file);
        setPhotoFile(resizedFile);
        
        // Convert the resized file to data URL for preview
        const resizedReader = new FileReader();
        resizedReader.onload = (e) => {
          setPhoto(e.target?.result as string);
        };
        resizedReader.readAsDataURL(resizedFile);
      } catch (error) {
        console.error('Image resize error:', error);
        // Fallback to original image if resize fails
        setPhoto(event.target?.result as string);
        setPhotoFile(file);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const triggerCamera = async () => {
    // If Capacitor is available, use native camera
    if (isCapacitorAvailable) {
      try {
        const capturedFile = await takePicture({
          quality: 90,
          allowEditing: true,
          resultType: 'base64',
          saveToGallery: false
        });
        
        if (capturedFile) {
          setPhotoFile(capturedFile);
          
          // Create a preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setPhoto(e.target?.result as string);
          };
          reader.readAsDataURL(capturedFile);
        }
      } catch (error) {
        console.error('Capacitor camera error:', error);
        toast({
          title: t('errors.camera.title'),
          description: t('errors.camera.message'),
          variant: "destructive"
        });
      }
    } else {
      // Fall back to input file for web
      cameraInputRef.current?.click();
    }
  };

  const onSubmit = async (data: FormData) => {
    // Photos are now optional, so we don't need to check if one is provided

    try {
      // Set loading state to true
      setIsSubmitting(true);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Use stored photoFile
      if (photo && photoFile) {
        formData.append('photo', photoFile);
      }
      
      // Add other form fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      
      // Submit the form
      const response = await fetch('/api/issues', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('errors.submission.failed'));
      }
      
      // Show success message
      toast({
        title: t('success.report.title'),
        description: t('success.report.message'),
      });
      
      // Reset form and show success
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: t('errors.submission.title'),
        description: error instanceof Error ? error.message : t('errors.submission.unknown'),
        variant: "destructive"
      });
    } finally {
      // Set loading state back to false
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 h-screen bg-white z-20 rounded-t-3xl shadow-lg overflow-y-auto pb-20 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Step 1: Category Selection */}
      <div className={`p-6 pb-24 ${step !== 1 && 'hidden'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl">{t('report.title')}</h2>
          <button className="text-neutral-800" onClick={handleClose}>
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <p className="text-neutral-800 mb-4">{t('report.form.category.label')}:</p>
        
        <div className="grid grid-cols-2 gap-4">
          {issueCategories.map((category) => (
            <div 
              key={category.id}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                selectedCategory === category.id ? 'border-primary bg-primary/5' : 'border-neutral-200'
              }`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className="flex flex-col items-center">
                <IssueTypeCard 
                  type={category.icon}
                  name=""
                  selected={false}
                  onClick={() => {}}
                  color={category.color}
                />
                <span className="font-medium text-center">{category.name}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 mb-6">
          <Button
            onClick={goToStep2}
            className={`w-full py-3 rounded-lg font-medium ${
              selectedCategory ? 'bg-primary text-white' : 'bg-neutral-300 text-neutral-500'
            }`}
            disabled={!selectedCategory}
          >
            {t('report.form.next')}
          </Button>
        </div>
      </div>
      
      {/* Step 1.5: Subcategory Selection */}
      <div className={`p-6 pb-24 ${step !== 1.5 && 'hidden'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button className="mr-2" onClick={goBackFromSubcategory}>
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h2 className="font-bold text-xl">{t('report.form.subcategory.label')}</h2>
          </div>
          <button className="text-neutral-800" onClick={handleClose}>
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        {selectedCategory && (
          <>
            <div className="mb-4 p-2 bg-neutral-100 rounded-lg">
              <p className="text-sm text-neutral-600">Category:</p>
              <p className="font-medium">{issueCategories.find(c => c.id === selectedCategory)?.name}</p>
            </div>
            
            <p className="text-neutral-800 mb-4">{t('report.form.subcategory.placeholder')}:</p>
            
            <div className="grid grid-cols-1 gap-4">
              {issueCategories
                .find(c => c.id === selectedCategory)
                ?.subcategories.map((subcat) => (
                  <div 
                    key={subcat.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center ${
                      selectedIssueType === subcat.id ? 'border-primary bg-primary/5' : 'border-neutral-200'
                    }`}
                    onClick={() => handleIssueTypeSelect(subcat.id)}
                  >
                    <IssueTypeCard 
                      type={subcat.icon}
                      name=""
                      selected={false}
                      onClick={() => {}}
                      color={issueCategories.find(c => c.id === selectedCategory)?.color}
                    />
                    <span className="flex-1">{subcat.name}</span>
                    <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                ))
              }
            </div>
          </>
        )}
        
        <div className="mt-8 mb-6">
          <Button
            onClick={goToStep2}
            className={`w-full py-3 rounded-lg font-medium ${
              selectedIssueType ? 'bg-primary text-white' : 'bg-neutral-300 text-neutral-500'
            }`}
            disabled={!selectedIssueType}
          >
            {t('report.form.next')}
          </Button>
        </div>
      </div>
      
      {/* Step 2: Take Photo */}
      <div className={`p-6 pb-24 ${step !== 2 && 'hidden'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl">{t('report.form.photo.title')}</h2>
          <button className="text-neutral-800" onClick={() => setStep(1)}>
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="bg-neutral-200 rounded-xl h-80 flex items-center justify-center mb-6">
          {!photo ? (
            <div className="text-center p-6">
              <CameraIcon className="h-10 w-10 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-600">{t('report.form.photo.description')}</p>
              <p className="text-xs text-neutral-500 mt-2">{t('report.form.photo.help')}</p>
            </div>
          ) : (
            <img 
              src={photo} 
              className="w-full h-full object-cover rounded-xl" 
              alt="Issue photo preview" 
            />
          )}
        </div>
        
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
        />
        
        <div className="flex flex-col items-center mb-8">
          <Button
            onClick={triggerCamera}
            className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mb-2"
          >
            <CameraIcon className="h-6 w-6" />
          </Button>
          
          {isCapacitorAvailable && (
            <div className="flex items-center text-xs text-neutral-500 mt-1">
              <SmartphoneIcon className="h-3 w-3 mr-1" />
              <span>{t('report.form.photo.nativeCamera')}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3 mb-6">
          <Button
            onClick={goToStep3}
            className="w-full py-3 rounded-lg font-medium bg-primary text-white"
          >
            {photo ? "Continue with Photo" : "Skip Photo"}
          </Button>
          
          {photo && (
            <Button
              onClick={() => setPhoto(null)}
              variant="outline"
              className="w-full py-3 rounded-lg font-medium border-neutral-300"
            >
              Remove Photo
            </Button>
          )}
        </div>
      </div>
      
      {/* Step 3: Location & Details */}
      <div className={`p-6 pb-24 ${step !== 3 && 'hidden'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-xl">Location & Details</h2>
          <button className="text-neutral-800" onClick={() => setStep(2)}>
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <MapPinIcon className="text-destructive mr-2 h-5 w-5" />
            <h3 className="font-medium">Current Location</h3>
          </div>
          <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200">
            <p className="text-neutral-800">
              {currentLocation.address || 'Locating...'}
            </p>
            <p className="text-xs text-neutral-500">
              {currentLocation.latitude && currentLocation.longitude 
                ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                : 'Acquiring coordinates...'}
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="notes" className="block mb-2 font-medium">Additional Notes</label>
          <Textarea 
            id="notes" 
            className="w-full p-3 border border-neutral-200 rounded-lg h-28" 
            placeholder="Describe the issue in more detail (optional)"
            {...form.register('notes')}
          />
        </div>
        
        <div className="mb-6">
          <div className="p-4 bg-neutral-100 rounded-lg border border-neutral-200 mb-4">
            <div className="flex items-start mb-2">
              <div className="mr-2 pt-1">
                <InfoIcon className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-medium">Your report will be sent to:</h4>
                <p className="text-sm text-neutral-600">• City of Tshwane Infrastructure team</p>
                <p className="text-sm text-neutral-600">• Ward 60 Councillor</p>
              </div>
            </div>
            <p className="text-xs text-neutral-500">All reports are submitted anonymously</p>
          </div>
        </div>
        
        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('report.form.submitting')}
            </div>
          ) : (
            t('report.form.submit')
          )}
        </Button>
      </div>
    </div>
  );
}
