import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Settings } from "lucide-react";
import logo from "@/assets/logo.png";

const sidebarLinkClass = ({ isActive }) =>
  `block px-2 py-1 rounded hover:bg-blue-100 ${isActive ? "text-blue-600 font-semibold" : "text-gray-700"}`;

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r bg-white shadow-md p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <img src={logo} alt="Logo" className="w-10 h-10 rounded" />
        <div className="font-bold text-sm leading-4">
          <div>SURYA</div>
          <div>LOGAM</div>
          <div>JAYA</div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <ScrollArea className="h-[calc(100vh-100px)] pr-2">
        <nav className="flex flex-col gap-3 text-sm font-medium">
          <NavLink to="/dashboard" className={sidebarLinkClass}>
            <div className="flex items-center gap-2">
              <LayoutDashboard size={16} />
              Dashboard
            </div>
          </NavLink>
          <NavLink to="/input-po" className={sidebarLinkClass}>
            <div className="flex items-center gap-2">
              <Package size={16} />
              Input PO
            </div>
          </NavLink>
          <NavLink to="/arap" className={sidebarLinkClass}>
            <div className="flex items-center gap-2">
              <Settings size={16} />
              AR / AP
            </div>
          </NavLink>

          {/* Accordion Menu for Masterdata */}
          <Accordion type="single" collapsible>
            <AccordionItem value="masterdata">
              <AccordionTrigger className="text-xs text-gray-500">Masterdata</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col ml-3 gap-1">
                  <NavLink to="/masterdata/jenis-barang" className={sidebarLinkClass}>Jenis Barang</NavLink>
                  <NavLink to="/masterdata/bentuk-barang" className={sidebarLinkClass}>Bentuk Barang</NavLink>
                  <NavLink to="/masterdata/grade-barang" className={sidebarLinkClass}>Grade Barang</NavLink>
                  <NavLink to="/masterdata/item-barang" className={sidebarLinkClass}>Item Barang</NavLink>
                  <NavLink to="/masterdata/jenis-biaya" className={sidebarLinkClass}>Jenis Biaya</NavLink>
                  <NavLink to="/masterdata/jenis-mutasi-stock" className={sidebarLinkClass}>Jenis Mutasi Stock</NavLink>
                  <NavLink to="/masterdata/supplier" className={sidebarLinkClass}>Supplier</NavLink>
                  <NavLink to="/masterdata/pelanggan" className={sidebarLinkClass}>Pelanggan</NavLink>
                  <NavLink to="/masterdata/gudang" className={sidebarLinkClass}>Gudang</NavLink>
                  <NavLink to="/masterdata/pelaksana" className={sidebarLinkClass}>Pelaksana</NavLink>
                  <NavLink to="/masterdata/jenis-transaksi-kas" className={sidebarLinkClass}>Jenis Transaksi Kas</NavLink>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Accordion Menu for Tools */}
          <Accordion type="single" collapsible>
          <AccordionItem value="tools">
            <AccordionTrigger className="text-xs text-gray-500">Tools</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col ml-3 gap-1">
                <NavLink to="/workshop" className={sidebarLinkClass}>Workshop</NavLink>
                <NavLink to="/fui" className={sidebarLinkClass}>FUI</NavLink>
                <NavLink to="/report" className={sidebarLinkClass}>Report</NavLink>
                <NavLink to="/cut-report" className={sidebarLinkClass}>Cut Report</NavLink>
                <NavLink to="/add-cut" className={sidebarLinkClass}>Add Cut</NavLink>
                <NavLink to="/potong" className={sidebarLinkClass}>Potong</NavLink>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </nav>
      </ScrollArea>
    </aside>
  );
}
