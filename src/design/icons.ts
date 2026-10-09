// The one icon set (design.md §10): names used by the registry map to Lucide components here.
import { Banknote, Landmark, PenLine, Star, TrendingUp, Users } from '@lucide/svelte';

export const icons = { star: Star, trend: TrendingUp, users: Users, money: Banknote, capitol: Landmark, pen: PenLine };
export type IconName = keyof typeof icons;
