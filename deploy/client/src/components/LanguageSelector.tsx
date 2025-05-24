import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLngs } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { GlobeIcon, ChevronDown, CheckIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-black border-white/20"
        >
          <GlobeIcon className="h-4 w-4" />
          <span>{t(`language.${i18n.language}`)}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-medium">
          {t('language.select')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedLngs.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className="flex items-center justify-between"
            onClick={() => changeLanguage(language.code)}
          >
            <span>{t(`language.${language.code}`)}</span>
            {i18n.language === language.code && (
              <CheckIcon className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;