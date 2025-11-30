export const SYSTEM_CATEGORIES = [
  'Work',
  'Personal',
  'Study',
];

// Return Tailwind background color classes for known categories
export const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    Work: 'bg-blue-500',
    Personal: 'bg-green-500',
    Shopping: 'bg-purple-500',
    Errands: 'bg-orange-400',
    Design: 'bg-pink-500',
    Engineering: 'bg-teal-500',
    Marketing: 'bg-yellow-500',
    Finance: 'bg-indigo-500',
  };
  // If not a known category, return neutral gray
  return colors[category] || 'bg-gray-500';
};
