export type BottomNavSlot = 'home' | 'courses' | 'tools' | 'profile';

export interface BottomNavProps {
  active: BottomNavSlot;
  hrefOverrides?: Partial<Record<BottomNavSlot, string>>;
}
