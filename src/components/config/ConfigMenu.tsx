import { ChevronRight } from "lucide-react";

interface ConfigMenuProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export const ConfigMenu: React.FC<ConfigMenuProps> = ({ label, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between group px-1 py-2 hover:bg-primary/5 rounded-lg transition-colors text-left"
  >
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-primary font-medium">{label}</span>
      </div>
      {description && <p className="text-[12px] text-primary/50">{description}</p>}
    </div>
    <ChevronRight size={18} className="text-primary/30 group-hover:text-primary transition-colors" />
  </button>
);