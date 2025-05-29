import { cn } from "@/lib/utils";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Files, 
  Home, 
  Share, 
  Users, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const NavItem = ({ to, icon, label, collapsed }: NavItemProps) => {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        collapsed ? "justify-center" : "",
        isActive 
          ? "bg-blue-100 text-blue-600" 
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "bg-white h-[calc(100vh-64px)] border-r border-gray-200 sticky top-16 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-end mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        
        <div className="flex flex-col gap-1">
          <NavItem 
            to="/" 
            icon={<Home size={20} />} 
            label="Dashboard" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/files" 
            icon={<Files size={20} />} 
            label="My Files" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/shared" 
            icon={<Share size={20} />} 
            label="Shared" 
            collapsed={collapsed} 
          />
          <NavItem 
            to="/users" 
            icon={<Users size={20} />} 
            label="Users" 
            collapsed={collapsed} 
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
