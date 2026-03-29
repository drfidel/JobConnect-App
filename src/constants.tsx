import { Laptop, Heart, TrendingUp, ShoppingBag, Truck, Utensils, Construction, GraduationCap } from 'lucide-react';

export const CATEGORIES = [
  { id: 'tech', label: 'Technology', icon: Laptop, color: 'bg-blue-50 text-blue-600' },
  { id: 'health', label: 'Healthcare', icon: Heart, color: 'bg-red-50 text-red-600' },
  { id: 'sales', label: 'Sales & Marketing', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
  { id: 'retail', label: 'Retail', icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
  { id: 'logistics', label: 'Logistics', icon: Truck, color: 'bg-purple-50 text-purple-600' },
  { id: 'food', label: 'Food & Beverage', icon: Utensils, color: 'bg-yellow-50 text-yellow-600' },
  { id: 'construction', label: 'Construction', icon: Construction, color: 'bg-stone-50 text-stone-600' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' }
];
