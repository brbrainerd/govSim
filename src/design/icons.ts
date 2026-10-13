// The one icon set (design.md §10): names used by the registry map to Lucide components here.
import { Banknote, Download, Info, Landmark, PenLine, Star, TrendingUp, Upload, Users } from '@lucide/svelte';

export const icons = {
  star: Star,
  trend: TrendingUp,
  users: Users,
  money: Banknote,
  capitol: Landmark,
  pen: PenLine,
  download: Download,
  upload: Upload,
  info: Info,
};
export type IconName = keyof typeof icons;
