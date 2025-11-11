'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, User, MapPin, GraduationCap, Briefcase, Heart, Camera, Image } from 'lucide-react';
import BasicInfoSection from './BasicInfoSection';
import LocationsSection from './LocationsSection';
import EducationSection from './EducationSection';
import EmploymentSection from './EmploymentSection';
import BioSection from './BioSection';
import AvatarUpload from './AvatarUpload';
import PhotoModerationSection from './PhotoModerationSection';

interface Props {
  initialData: any;
  userId: string;
  profileId: string;
}

type SectionId = 'basic' | 'avatar' | 'moderation' | 'locations' | 'education' | 'employment' | 'bio';

export default function ProfileForm({ initialData, userId, profileId }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['basic', 'avatar'])
  );

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const sections = [
    {
      id: 'avatar' as SectionId,
      title: 'Фотография профиля',
      icon: Camera,
      description: 'Загрузите свою фотографию',
      component: <AvatarUpload profileId={profileId} userId={userId} currentAvatar={initialData?.avatar_url} />,
    },
    {
      id: 'moderation' as SectionId,
      title: 'Предложенные фото',
      icon: Image,
      description: 'Модерация фото от родственников',
      component: <PhotoModerationSection profileId={profileId} />,
    },
    {
      id: 'basic' as SectionId,
      title: 'Основная информация',
      icon: User,
      description: 'Имя, дата рождения, пол',
      component: <BasicInfoSection initialData={initialData} userId={userId} />,
    },
    {
      id: 'locations' as SectionId,
      title: 'Места проживания',
      icon: MapPin,
      description: 'Место рождения, текущий адрес',
      component: <LocationsSection initialData={initialData} userId={userId} />,
    },
    {
      id: 'education' as SectionId,
      title: 'Образование',
      icon: GraduationCap,
      description: 'Школы, университеты',
      component: <EducationSection education={initialData?.education || []} userId={userId} />,
    },
    {
      id: 'employment' as SectionId,
      title: 'Карьера',
      icon: Briefcase,
      description: 'Места работы',
      component: <EmploymentSection employment={initialData?.employment || []} userId={userId} />,
    },
    {
      id: 'bio' as SectionId,
      title: 'О себе',
      icon: Heart,
      description: 'Биография, интересы',
      component: <BioSection initialData={initialData} userId={userId} />,
    },
  ];

  return (
    <div className="divide-y divide-gray-200">
      {sections.map((section) => {
        const Icon = section.icon;
        const isExpanded = expandedSections.has(section.id);

        return (
          <div key={section.id} className="bg-white">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="px-6 pb-6 pt-2">
                {section.component}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
