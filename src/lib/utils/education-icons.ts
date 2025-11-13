/**
 * Education Type Icon Mapping
 * 
 * Returns appropriate emoji icon for each education type.
 */

export function getEducationIcon(type: string): string {
  const icons: Record<string, string> = {
    school: '🏫',
    college: '🎓',
    university: '🏛️',
    vocational: '🔧',
    graduate: '👨‍🎓',
  };

  return icons[type] || '📚';
}
