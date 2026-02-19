import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Calendar, Trash2, Printer, Package, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import CustomerInfoTabs from "@/components/CustomerInfoTabs";
import DataTableModal from "@/components/modals/DataTableModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchSelect from "@/components/ui/search-select";
import AsyncSearchSelect from "@/components/ui/async-search-select";
import {
  getTermOptions,
  getBentukBarangOptions,
  getUnitOptions
} from "@/services/masterDataService";
import { useAlert } from "@/hooks/useAlert";
import { useRole } from "@/hooks/useRole";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import SalesOrderLayout from "@/components/SalesOrderLayout";
import { documentSequenceService } from "@/services/master-data/documentSequenceService";
import { generateSalesOrderPrintContent, openPrintDialog } from "@/lib/printUtils";
import { beratJenisService } from "@/services/master-data/beratJenisService";
import { gradeBarangService } from "@/services/master-data/gradeBarangService";
import { jenisBarangService } from "@/services/master-data/jenisBarangService";
import { gudangService } from "@/services/master-data/gudangService";

export default function AddSalesOrderPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { isUserAdmin, hasRole } = useRole();

  // Master data state
  const [termOptions, setTermOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  // Handover method options
  const handoverMethodOptions = [
    { value: "pickup", label: "Pickup" },
    { value: "delivery", label: "Delivery" }
  ];

  // Loading states
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingItemType, setLoadingItemType] = useState(false);
  const [loadingItemShape, setLoadingItemShape] = useState(false);
  const [loadingItemGrade, setLoadingItemGrade] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [loadingWeight, setLoadingWeight] = useState(false);

  // Customer Information
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Load master data on component mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingTerm(true);
        setLoadingWarehouse(true);
        setLoadingItemType(true);
        setLoadingItemShape(true);

        setLoadingUnit(true);

        const [
          terms,
          bentukBarang,
          soNumber
        ] = await Promise.all([
          getTermOptions(),
          getBentukBarangOptions(),
          documentSequenceService.generateSONumber()
        ]);

        setTermOptions(terms);
        setItemShapeOptions(bentukBarang);
        // Unit options akan dimuat oleh useEffect berdasarkan itemCutType

        // Set generated SO number
        setSoNumber(soNumber);
        console.log('Generated SO number:', soNumber);
      } catch (error) {
        console.error('Error loading master data:', error);
        showAlert('Error', 'Gagal memuat data master atau generate nomor SO', 'error');
      } finally {
        setLoadingTerm(false);
        setLoadingWarehouse(false);
        setLoadingItemType(false);
        setLoadingItemShape(false);

        // loadingUnit akan dihandle oleh useEffect untuk unit options
      }
    };

    loadMasterData();
  }, []);

  // Sales Order Details
  const [soNumber, setSoNumber] = useState("");
  const [soDate, setSoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [termOfPayment, setTermOfPayment] = useState("");
  const [originWarehouse, setOriginWarehouse] = useState("");
  const [originWarehouseName, setOriginWarehouseName] = useState(""); // Store warehouse name for printing
  const [handoverMethod, setHandoverMethod] = useState("pickup");
  const [includePPN, setIncludePPN] = useState(true);
  const [priceIncludesPPN, setPriceIncludesPPN] = useState(false); // Harga per item sudah include PPN
  const [diskonSO, setDiskonSO] = useState("0"); // Diskon SO level (percentage)

  // Item Input Form - Dimension fields (dynamic based on tipe_barang)
  const [itemPanjang, setItemPanjang] = useState("");
  const [itemLebar, setItemLebar] = useState("");
  const [itemTebal, setItemTebal] = useState("");
  const [itemDiameterLuar, setItemDiameterLuar] = useState("");
  const [itemDiameterDalam, setItemDiameterDalam] = useState("");
  const [itemDiameter, setItemDiameter] = useState("");
  const [itemSisi1, setItemSisi1] = useState("");
  const [itemSisi2, setItemSisi2] = useState("");
  // Legacy aliases for backward compatibility
  const itemLength = itemPanjang;
  const setItemLength = setItemPanjang;
  const itemWidth = itemLebar;
  const setItemWidth = setItemLebar;
  // Other item input fields
  const [itemQty, setItemQty] = useState("1");
  const [itemType, setItemType] = useState("");
  const [itemTypeLabel, setItemTypeLabel] = useState("");
  const [itemGradeLabel, setItemGradeLabel] = useState("");
  const [itemShape, setItemShape] = useState("");
  const [selectedShape, setSelectedShape] = useState(null);
  const [itemGrade, setItemGrade] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemUnit, setItemUnit] = useState("per-dimensi");
  const [itemDiscount, setItemDiscount] = useState("0");
  const [itemNotes, setItemNotes] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [itemCutType, setItemCutType] = useState("potongan");
  const [selectedItemBarangGroup, setSelectedItemBarangGroup] = useState(null);
  const [itemBarangGroupOptions, setItemBarangGroupOptions] = useState([]);
  const [loadingItemBarangGroup, setLoadingItemBarangGroup] = useState(false);
  const cutTypeOptions = [
    { value: "potongan", label: "Potongan" },
    { value: "utuh", label: "Utuh" }
  ];

  // Load unit options when jenis potongan changes
  useEffect(() => {
    const loadUnitOptions = async () => {
      if (!itemCutType) return; // Skip if itemCutType is not set yet

      try {
        setLoadingUnit(true);
        const units = await getUnitOptions(itemCutType);
        setUnitOptions(units);

        // Reset itemUnit jika satuan yang dipilih tidak ada dalam options baru
        const currentUnitExists = units.some(opt => opt.value === itemUnit);
        if (!currentUnitExists) {
          if (units.length > 0) {
            // Set ke satuan pertama yang tersedia
            setItemUnit(units[0].value);
          } else {
            // Reset jika tidak ada satuan yang tersedia
            setItemUnit("");
          }
        }
      } catch (error) {
        console.error('Error loading unit options:', error);
        showAlert('Error', 'Gagal memuat data satuan', 'error');
      } finally {
        setLoadingUnit(false);
      }
    };

    loadUnitOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCutType]);

  // Populate panjang, lebar, dan tebal ketika jenis potongan berubah menjadi "utuh" dari group yang dipilih
  useEffect(() => {
    if (itemCutType === "utuh" && selectedItemBarangGroup) {
      if (selectedItemBarangGroup.panjang != null) setItemPanjang(selectedItemBarangGroup.panjang.toString());
      if (selectedItemBarangGroup.lebar != null) setItemLebar(selectedItemBarangGroup.lebar.toString());
      if (selectedItemBarangGroup.tebal != null) setItemTebal(selectedItemBarangGroup.tebal.toString());
      if (selectedItemBarangGroup.diameter_luar != null) setItemDiameterLuar(selectedItemBarangGroup.diameter_luar.toString());
      if (selectedItemBarangGroup.diameter_dalam != null) setItemDiameterDalam(selectedItemBarangGroup.diameter_dalam.toString());
      if (selectedItemBarangGroup.diameter != null) setItemDiameter(selectedItemBarangGroup.diameter.toString());
      if (selectedItemBarangGroup.sisi1 != null) setItemSisi1(selectedItemBarangGroup.sisi1.toString());
      if (selectedItemBarangGroup.sisi2 != null) setItemSisi2(selectedItemBarangGroup.sisi2.toString());
    }
  }, [itemCutType, selectedItemBarangGroup]);

  // Load Item Barang Group options when jenis, bentuk, and grade are selected
  useEffect(() => {
    const loadItemBarangGroupOptions = async () => {
      // Only load if all 3 fields are selected
      if (!itemType || !selectedShape?.id || !itemGrade) {
        setItemBarangGroupOptions([]);
        setSelectedItemBarangGroup(null);
        return;
      }

      try {
        setLoadingItemBarangGroup(true);
        const queryParams = new URLSearchParams({
          jenis_barang_id: itemType,
          bentuk_barang_id: selectedShape.id,
          grade_barang_id: itemGrade,
          per_page: 100 // Load more options for dropdown
        });

        const response = await request(`/item-barang/group?${queryParams.toString()}`, { method: 'GET' });
        const groups = Array.isArray(response.data) ? response.data : [];
        setItemBarangGroupOptions(groups);

        // Reset selected group when options change
        setSelectedItemBarangGroup(null);
      } catch (error) {
        console.error('Error loading item barang group:', error);
        setItemBarangGroupOptions([]);
      } finally {
        setLoadingItemBarangGroup(false);
      }
    };

    loadItemBarangGroupOptions();
  }, [itemType, selectedShape?.id, itemGrade]);

  // Auto-calculate berat timbangan when required fields are filled
  useEffect(() => {
    // Validate and parse numeric values
    const panjang = parseFloat(itemLength);
    const lebar = parseFloat(itemWidth);
    const tebal = parseFloat(itemDiameter);

    // Check if all required fields are filled with valid numeric values
    // For "utuh", dimensions should be filled from group item selection
    const hasRequiredFields =
      itemType &&
      selectedShape?.id &&
      itemGrade &&
      itemLength &&
      !isNaN(panjang) &&
      panjang > 0 &&
      itemDiameter &&
      !isNaN(tebal) &&
      tebal >= 0;

    // For 2D items, also need width with valid value
    // For "utuh" items, dimensions come from group item, so we need to check them too
    const hasAllFields = selectedShape?.dimensi === "1D"
      ? hasRequiredFields
      : hasRequiredFields && itemWidth && !isNaN(lebar) && lebar > 0;

    if (!hasAllFields) {
      // Reset weight if required fields are missing
      if (itemWeight && itemWeight !== "0") {
        setItemWeight("");
      }
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        setLoadingWeight(true);

        const panjangCm = panjang / 10; // Convert mm to cm
        const lebarCm = selectedShape.dimensi === "1D"
          ? null
          : (lebar / 10); // Convert mm to cm
        const tebalCm = tebal / 10; // Convert mm to cm

        const requestData = {
          jenis_barang_id: parseInt(itemType),
          bentuk_barang_id: parseInt(selectedShape.id),
          grade_barang_id: parseInt(itemGrade),
          panjang: panjangCm,
          lebar: lebarCm,
          tebal: tebalCm
        };

        const response = await beratJenisService.calculateWeight(requestData);

        if (response.success && response.data) {
          const calculatedWeight = response.data.berat_kg || 0;
          setItemWeight(calculatedWeight.toFixed(4));

          // Optionally show a success message if weight was found
          if (response.data.berat_jenis_found && calculatedWeight > 0) {
            console.log('Berat timbangan berhasil dihitung:', calculatedWeight, 'kg');
          } else if (calculatedWeight === 0) {
            console.log('Data berat jenis tidak ditemukan, berat di-set ke 0');
          }
        } else {
          console.error('Error calculating weight:', response.message);
          setItemWeight("0.0000");
        }
      } catch (error) {
        console.error('Error calculating weight:', error);
        // Don't show error alert to avoid annoying user, just log it
        // The weight field will remain empty or previous value
      } finally {
        setLoadingWeight(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [itemType, selectedShape, itemGrade, itemLength, itemWidth, itemDiameter, itemCutType]);

  // Modal state
  const [shapeModalOpen, setShapeModalOpen] = useState(false);
  const [groupItemModalOpen, setGroupItemModalOpen] = useState(false);
  const [groupItemOptions, setGroupItemOptions] = useState([]);
  const [loadingGroupItem, setLoadingGroupItem] = useState(false);

  // Filter state for group i tem
  const [groupItemFilters, setGroupItemFilters] = useState({
    panjang: "",
    lebar: "",
    tebal: "",
    diameter_luar: "",
    diameter_dalam: "",
    diameter: "",
    sisi1: "",
    sisi2: "",
    min_quantity_utuh: "",
    max_quantity_utuh: "",
    min_quantity_potongan: "",
    max_quantity_potongan: ""
  });

  // Pagination state for group item
  const [groupItemPagination, setGroupItemPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1
  });

  const [showGroupItemFilters, setShowGroupItemFilters] = useState(false);

  // Calculated values
  const [itemThickness, setItemThickness] = useState("- mm");
  const [itemArea, setItemArea] = useState("0.00 m²");
  const [itemPricePerUnit, setItemPricePerUnit] = useState("Rp 0/m²");
  const [itemTotal, setItemTotal] = useState("Rp 0");

  // Item List
  const [items, setItems] = useState([]);

  // Function to calculate price based on satuan
  const calculatePriceBySatuan = (satuan, panjang, lebar, tebal, qty, pricePerUnit, berat = 0, selectedShape = null) => {
    const panjangM = panjang / 1000; // Convert mm to m
    const lebarM = lebar / 1000; // Convert mm to m
    const tebalM = tebal / 1000; // Convert mm to m

    switch (satuan?.toLowerCase()) {
      case 'utuh':
      case 'per unit':
      case 'per pcs':
        // Harga X quantity
        return pricePerUnit * qty;

      case 'kilogram':
      case 'kg':
        // Harga X kg (berat)
        if (berat <= 0) {
          // Jika berat tidak ada, estimasi berdasarkan volume dan densitas besi (7.85 g/cm³)
          const volumeCm3 = (panjang * lebar * tebal) / 1000; // mm³ to cm³
          const estimatedWeight = volumeCm3 * 7.85 / 1000; // Convert to kg
          return pricePerUnit * estimatedWeight;
        }
        return pricePerUnit * berat;

      case 'dimensi':
      case 'per dimensi':
      case 'per m²':
      case 'm²':
        // Harga X volume (untuk 2D) atau panjang (untuk 1D)
        if (selectedShape?.dimensi === "1D") {
          // Untuk 1D (shaft): harga X panjang saja
          return pricePerUnit * panjangM;
        } else {
          // Untuk 2D (plat): harga X volume (panjang X lebar X tebal)
          return pricePerUnit * panjangM * lebarM * tebalM;
        }

      case 'per m³':
      case 'm³':
        // Harga X volume
        const volumeM3 = panjangM * lebarM * tebalM;
        return pricePerUnit * volumeM3;

      default:
        // Default: harga X quantity
        return pricePerUnit * qty;
    }
  };

  // Calculate item area and total
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const length = parseFloat(itemLength) || 0;
        const width = parseFloat(itemWidth) || 0;
        const thickness = parseFloat(itemDiameter) || 0;
        const qty = parseInt(itemQty) || 0;
        const discount = parseFloat(itemDiscount) || 0;
        const pricePerUnit = parseFloat(itemPrice) || 0;

        // Hitung ketebalan (dalam mm)
        let thicknessDisplay = "- mm";
        if (thickness > 0) {
          thicknessDisplay = `${thickness} mm`;
        }
        setItemThickness(thicknessDisplay);

        // Hitung luas persegi berdasarkan dimensi (TEBAL TIDAK DIHITUNG)
        let area = 0;
        let areaPerItem = "0.00";

        if (selectedShape?.dimensi === "1D") {
          // Untuk bentuk 1D (shaft), luas = panjang saja (tanpa tebal)
          area = length;
          areaPerItem = (area / 1000).toFixed(2); // Convert mm to m
        } else if (selectedShape?.dimensi === "2D") {
          // Untuk bentuk 2D (plat), luas = panjang x lebar (tanpa tebal)
          area = length * width; // mm²
          areaPerItem = (area / 1000000).toFixed(2); // Convert mm² → m²
        }

        // Get current satuan
        const currentSatuan = unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit;

        // Hitung harga berdasarkan satuan
        let priceDisplay = "Rp 0";
        if (pricePerUnit > 0) {
          switch (currentSatuan?.toLowerCase()) {
            case 'utuh':
            case 'per unit':
            case 'per pcs':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/pcs`;
              break;
            case 'kilogram':
            case 'kg':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/kg`;
              break;
            case 'dimensi':
            case 'per dimensi':
            case 'per m²':
            case 'm²':
              // Check if shape is 1D or 2D
              if (selectedShape?.dimensi === "1D") {
                priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/m`;
              } else {
                priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/m³`;
              }
              break;
            case 'per m³':
            case 'm³':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/m³`;
              break;
            default:
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/pcs`;
          }
        }
        setItemPricePerUnit(priceDisplay);

        // Hitung total item berdasarkan satuan (termasuk diskon)
        let totalBeforeDiscount = 0;
        let totalAfterDiscount = 0;

        if (pricePerUnit > 0) {
          const unitPrice = calculatePriceBySatuan(currentSatuan, length, width, thickness, qty, pricePerUnit, parseFloat(itemWeight) || 0, selectedShape);

          // Untuk satuan "utuh", tidak perlu dikalikan quantity lagi
          if (currentSatuan?.toLowerCase() === 'utuh' || currentSatuan?.toLowerCase() === 'pcs' || currentSatuan?.toLowerCase() === 'pieces' || currentSatuan?.toLowerCase() === 'per unit' || currentSatuan?.toLowerCase() === 'per pcs') {
            totalBeforeDiscount = unitPrice; // Sudah termasuk quantity di dalamnya
          } else {
            totalBeforeDiscount = unitPrice * qty; // Kalikan dengan quantity untuk satuan lain
          }

          const discountAmount = totalBeforeDiscount * (discount / 100);
          totalAfterDiscount = totalBeforeDiscount - discountAmount;
        }

        // Set area/volume display based on shape
        if (selectedShape?.dimensi === "1D") {
          setItemArea(`${areaPerItem} m`); // 1D shows in meters
        } else {
          // For 2D, calculate volume instead of area
          const volumePerItem = ((length * width * thickness) / 1000000000).toFixed(4); // mm³ to m³
          setItemArea(`${volumePerItem} m³`); // 2D shows in cubic meters (volume)
        }
        setItemTotal(`Rp ${totalAfterDiscount.toLocaleString('id-ID')}`);

      } catch (error) {
        console.error('Error calculating area/volume:', error);
        setItemThickness("- mm");
        setItemArea("0.00 m³");
        setItemPricePerUnit("Rp 0/m³");
        setItemTotal("Rp 0");
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [itemLength, itemWidth, itemDiameter, selectedShape, itemQty, itemDiscount, itemPrice, itemWeight, itemUnit, unitOptions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Function to get price label based on selected unit (for input field)
  const getPriceLabel = () => {
    const currentSatuan = unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit;
    const satuanLower = currentSatuan?.toLowerCase() || '';

    switch (satuanLower) {
      case 'utuh':
      case 'per unit':
      case 'per pcs':
        return 'Harga (Rp/pcs)';
      case 'kilogram':
      case 'kg':
        return 'Harga (Rp/kg)';
      case 'dimensi':
      case 'per dimensi':
      case 'per m²':
      case 'm²':
        // Check if shape is 1D or 2D
        if (selectedShape?.dimensi === "1D") {
          return 'Harga (Rp/m)';
        }
        return 'Harga (Rp/m³)';
      case 'per m³':
      case 'm³':
        return 'Harga (Rp/m³)';
      default:
        return 'Harga (Rp/pcs)';
    }
  };

  // Function to get price label for calculated values summary (simpler format)
  const getPriceSummaryLabel = () => {
    const currentSatuan = unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit;
    const satuanLower = currentSatuan?.toLowerCase() || '';

    switch (satuanLower) {
      case 'utuh':
      case 'per unit':
      case 'per pcs':
        return 'Harga/pcs';
      case 'kilogram':
      case 'kg':
        return 'Harga/kg';
      case 'dimensi':
      case 'per dimensi':
      case 'per m²':
      case 'm²':
        // Check if shape is 1D or 2D
        if (selectedShape?.dimensi === "1D") {
          return 'Harga/m';
        }
        return 'Harga/m³';
      case 'per m³':
      case 'm³':
        return 'Harga/m³';
      default:
        return 'Harga/pcs';
    }
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) return;

    setSelectedCustomer(customer);
    // Update customer form state with proper field names
    setCustomerName(customer.nama_pelanggan || customer.nama || "");
    setCustomerPhone(customer.telepon_hp || customer.telepon || "");
    setCustomerAddress(customer.alamat || customer.kota || "");
  };

  const handleAddItem = () => {
    try {
      // Validasi field wajib dasar
      if (!itemType || !selectedShape || !itemGrade || !itemPrice || !itemQty) {
        showAlert("Peringatan", "Mohon lengkapi data item yang wajib (*)", "warning");
        return;
      }

      // Validasi dinamis berdasarkan tipe_barang (skip jika jenis potongan adalah "utuh")
      if (itemCutType !== "utuh") {
        const tipe = selectedShape?.tipe_barang || {};

        if (tipe.panjang && !itemPanjang) {
          showAlert("Peringatan", "Mohon isi panjang", "warning");
          return;
        }
        if (tipe.lebar && !itemLebar) {
          showAlert("Peringatan", "Mohon isi lebar", "warning");
          return;
        }
        if (tipe.tebal && !itemTebal) {
          showAlert("Peringatan", "Mohon isi tebal", "warning");
          return;
        }
        if (tipe.diameter_luar && !itemDiameterLuar) {
          showAlert("Peringatan", "Mohon isi diameter luar", "warning");
          return;
        }
        if (tipe.diameter_dalam && !itemDiameterDalam) {
          showAlert("Peringatan", "Mohon isi diameter dalam", "warning");
          return;
        }
        if (tipe.diameter && !itemDiameter) {
          showAlert("Peringatan", "Mohon isi diameter", "warning");
          return;
        }
        if (tipe.sisi1 && !itemSisi1) {
          showAlert("Peringatan", "Mohon isi sisi 1", "warning");
          return;
        }
        if (tipe.sisi2 && !itemSisi2) {
          showAlert("Peringatan", "Mohon isi sisi 2", "warning");
          return;
        }
      }

      // Validasi nilai numerik
      if (parseFloat(itemPrice) <= 0) {
        showAlert("Peringatan", "Harga harus lebih besar dari 0", "warning");
        return;
      }

      if (parseInt(itemQty) <= 0) {
        showAlert("Peringatan", "Qty harus lebih besar dari 0", "warning");
        return;
      }

      // Build dynamic dimensiString for display based on tipe_barang
      const tipe = selectedShape?.tipe_barang || {};
      let dimensiParts = [];

      // Helper to format dimension values: remove trailing zeros and format decimal
      const formatDim = (val) => {
        if (!val) return "";
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed.toString();
      };

      if (tipe.diameter_luar && itemDiameterLuar) dimensiParts.push(formatDim(itemDiameterLuar));
      if (tipe.diameter_dalam && itemDiameterDalam) dimensiParts.push(formatDim(itemDiameterDalam));
      if (tipe.diameter && itemDiameter) dimensiParts.push(formatDim(itemDiameter));
      if (tipe.sisi1 && itemSisi1) dimensiParts.push(formatDim(itemSisi1));
      if (tipe.sisi2 && itemSisi2) dimensiParts.push(formatDim(itemSisi2));
      if (tipe.tebal && itemTebal) dimensiParts.push(formatDim(itemTebal));
      if (tipe.lebar && itemLebar) dimensiParts.push(formatDim(itemLebar));
      if (tipe.panjang && itemPanjang) dimensiParts.push(formatDim(itemPanjang));

      let dimensiString = dimensiParts.length > 0 ? dimensiParts.join(' x ') : '-';

      // Calculate total using satuan-based pricing
      const currentSatuan = unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit;
      const qty = parseInt(itemQty) || 0;

      // Use itemTebal for tebal (backward compatibility) or itemDiameter for older calculation
      const tebalValue = parseFloat(itemTebal) || parseFloat(itemDiameter) || 0;

      const unitPrice = calculatePriceBySatuan(
        currentSatuan,
        parseFloat(itemPanjang) || 0,
        parseFloat(itemLebar) || 0,
        tebalValue,
        qty,
        parseFloat(itemPrice) || 0,
        parseFloat(itemWeight) || 0,
        selectedShape
      );

      let totalBeforeDiscount = 0;

      // Untuk satuan "utuh", tidak perlu dikalikan quantity lagi
      if (currentSatuan?.toLowerCase() === 'utuh' || currentSatuan?.toLowerCase() === 'pcs' || currentSatuan?.toLowerCase() === 'pieces' || currentSatuan?.toLowerCase() === 'per unit' || currentSatuan?.toLowerCase() === 'per pcs') {
        totalBeforeDiscount = unitPrice; // Sudah termasuk quantity di dalamnya
      } else {
        totalBeforeDiscount = unitPrice * qty; // Kalikan dengan quantity untuk satuan lain
      }

      const discountAmount = totalBeforeDiscount * (parseFloat(itemDiscount) || 0) / 100;
      const finalTotal = totalBeforeDiscount - discountAmount;

      const newItem = {
        id: Date.now(),
        jenisBarang: itemTypeLabel || itemTypeOptions.find(opt => opt.value === itemType)?.label || itemType,
        bentuk: selectedShape.nama,
        grade: itemGradeLabel || itemGrade,
        dimensi: dimensiString,
        qty: parseInt(itemQty),
        luasPerItem: itemArea,
        hargaDisplay: itemPricePerUnit,
        satuanDisplay: unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit,
        diskon: `${itemDiscount}%`,
        total: `Rp ${finalTotal.toLocaleString('id-ID')}`,
        jenisBarangId: itemType,
        bentukBarangId: selectedShape.id,
        gradeBarangId: itemGrade,
        // Dimension fields - send all to API (nullable)
        panjang: tipe.panjang ? (parseFloat(itemPanjang) || null) : null,
        lebar: tipe.lebar ? (parseFloat(itemLebar) || null) : null,
        tebal: tipe.tebal ? (parseFloat(itemTebal) || null) : null,
        diameter_luar: tipe.diameter_luar ? (parseFloat(itemDiameterLuar) || null) : null,
        diameter_dalam: tipe.diameter_dalam ? (parseFloat(itemDiameterDalam) || null) : null,
        diameter: tipe.diameter ? (parseFloat(itemDiameter) || null) : null,
        sisi1: tipe.sisi1 ? (parseFloat(itemSisi1) || null) : null,
        sisi2: tipe.sisi2 ? (parseFloat(itemSisi2) || null) : null,
        berat: parseFloat(itemWeight) || 0,
        harga: parseFloat(itemPrice) || 0, // Backend value
        satuan: itemUnit, // Backend value
        jenis_potongan: itemCutType,
        diskonPercent: parseFloat(itemDiscount) || 0,
        catatan: itemNotes
      };

      setItems([...items, newItem]);

      // Reset all form fields including new dimension fields
      setItemPanjang("");
      setItemLebar("");
      setItemTebal("");
      setItemDiameterLuar("");
      setItemDiameterDalam("");
      setItemDiameter("");
      setItemSisi1("");
      setItemSisi2("");
      setItemQty("1");
      setItemType("");
      setItemTypeLabel("");
      setItemShape("");
      setSelectedShape(null);
      setItemGrade("");
      setItemGradeLabel("");
      setItemDiscount("0");
      setItemNotes("");
      setItemWeight("");
      setItemCutType("potongan");
      setSelectedItemBarangGroup(null);
    } catch (error) {
      console.error('Error adding item:', error);
      showAlert("Error", "Terjadi kesalahan saat menambahkan item", "error");
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleTestSimpanSO = async () => {
    console.log("Testing save SO...");

    // Validation
    const errors = [];
    // if (!soNumber) errors.push("Nomor SO belum terisi"); // SO Number is auto-generated
    if (items.length === 0) errors.push("Belum ada item yang ditambahkan");

    // Check customer (either selected or manually input)
    const hasCustomer = selectedCustomer || (customerName && customerPhone && customerAddress);
    if (!hasCustomer) errors.push("Data pelanggan belum lengkap");

    if (!originWarehouse) errors.push("Gudang asal belum dipilih");
    if (!deliveryDate) errors.push("Tanggal pengiriman belum dipilih");
    if (!termOfPayment) errors.push("Term of Payment belum dipilih");

    if (errors.length > 0) {
      showAlert("Validasi Gagal", "Mohon lengkapi data berikut:\n" + errors.map(e => "- " + e).join("\n"), "warning");
      return;
    }

    try {
      const salesOrderData = {
        nomor_so: soNumber,
        tanggal_so: soDate,
        tanggal_pengiriman: deliveryDate,
        syarat_pembayaran: termOfPayment,
        gudang_id: parseInt(originWarehouse) || 1,
        handover_method: handoverMethod,
        pelanggan_id: selectedCustomer?.id || 1,
        subtotal: subtotal || 0,
        total_diskon: totalDiscountSO || 0,
        diskon_so: diskonSOPercent || 0,
        ppn_percent: includePPN ? 11.0 : 0,
        ppn_amount: ppn || 0,
        total_harga_so: totalHargaSO || 0,
        items: items.map(item => ({
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.tebal) || 0,
          qty: parseInt(item.qty) || 0,
          jenis_barang_id: parseInt(item.jenisBarangId) || 0,
          bentuk_barang_id: parseInt(item.bentukBarangId) || 0,
          grade_barang_id: parseInt(item.gradeBarangId) || 0,
          harga: parseFloat(item.harga) || 0,
          satuan: item.satuan,
          jenis_potongan: item.jenis_potongan,
          diskon: parseFloat(item.diskonPercent) || 0,
          catatan: item.catatan || ""
        }))
      };

      console.log("Data yang akan dikirim ke API:", salesOrderData);


      const result = await request(API_ENDPOINTS.salesOrder, {
        method: 'POST',
        body: JSON.stringify(salesOrderData)
      });

      console.log("✅ Sales Order berhasil disimpan:", result);
      showAlert("Sukses", "Sales Order berhasil disimpan!", "success");
      try {
        // Get term label
        const termLabel = termOptions.find(opt => opt.value === termOfPayment)?.label || termOfPayment;

        // Get warehouse name - with fallback to fetch from API if not in state
        let warehouseName = originWarehouseName;
        if (!warehouseName && originWarehouse) {
          try {
            console.log('⚠️ Warehouse name not in state, fetching from API...');
            const warehouseResp = await gudangService.getById(originWarehouse);
            const warehouseData = warehouseResp?.data || warehouseResp;
            warehouseName = warehouseData?.nama_gudang || warehouseData?.nama || originWarehouse;
            console.log('✅ Fetched warehouse name:', warehouseName);
          } catch (err) {
            console.error('❌ Failed to fetch warehouse name:', err);
            warehouseName = originWarehouse; // Fallback to ID if fetch fails
          }
        }

        if (!warehouseName) {
          warehouseName = 'N/A';
        }

        console.log('🖨️ Print data preparation:', {
          originWarehouse: originWarehouse,
          originWarehouseName: originWarehouseName,
          warehouseName: warehouseName,
          termOfPayment: termOfPayment,
          termLabel: termLabel
        });

        // Use selectedCustomer data if available, otherwise use form state
        const customerData = selectedCustomer ? {
          nama: selectedCustomer.nama_pelanggan || selectedCustomer.nama || customerName || 'N/A',
          telepon: selectedCustomer.telepon_hp || selectedCustomer.telepon || customerPhone || 'N/A',
          contact_person: selectedCustomer.contact_person || 'N/A',
          alamat: selectedCustomer.alamat || selectedCustomer.kota || customerAddress || 'N/A'
        } : {
          nama: customerName || 'N/A',
          telepon: customerPhone || 'N/A',
          contact_person: 'N/A',
          alamat: customerAddress || 'N/A'
        };

        // Langsung buka dialog cetak menggunakan data yang baru saja disimpan (data lokal)
        const printDataOnSave = {
          nomor_so: soNumber,
          tanggal_so: soDate,
          tanggal_pengiriman: deliveryDate,
          term_of_payment: termLabel,
          gudang_asal: warehouseName,
          customer: customerData,
          items: items.map(item => ({
            nama_item: item.jenisBarang,
            bentuk_barang: item.bentuk,
            grade_barang: item.grade,
            dimensi_potong: item.dimensi,
            unit: item.satuanDisplay || item.satuan,
            qty: item.qty,
            total_kg: item.berat || 0,
            harga_per_unit: typeof item.harga === 'number' ? item.harga : parseInt(String(item.harga).replace(/[^\d]/g, '')) || 0,
            total_harga: parseInt(String(item.total).replace(/[^\d]/g, '')) || 0
          })),
          total_harga: subtotal,
          discount: totalDiscountSO,
          diskon_so_percent: diskonSOPercent,
          diskon_so_amount: diskonSOAmount,
          price_includes_ppn: priceIncludesPPN,
          dpp: dpp,
          ppn: ppn,
          grand_total: totalHargaSO
        };
        const html = generateSalesOrderPrintContent(printDataOnSave);
        openPrintDialog(html);
      } catch (e) {
        console.error('Gagal membuka dialog cetak setelah simpan SO:', e);
      }

      setTimeout(() => {
        window.history.back();
      }, 2000);

    } catch (error) {
      console.error("❌ Error saving Sales Order:", error);
      showAlert("Error", "Terjadi kesalahan saat menyimpan Sales Order", "error");
    }
  };

  const handleBackToList = () => {
    window.history.back();
  };

  // Handle print sales order
  const handlePrintSalesOrder = async () => {
    try {
      setPrintLoading(true);

      // Validation
      const errors = [];
      if (!soNumber) errors.push("Nomor SO belum terisi");
      if (items.length === 0) errors.push("Belum ada item yang ditambahkan");

      // Check customer (either selected or manually input)
      const hasCustomer = selectedCustomer || (customerName && customerPhone && customerAddress);
      if (!hasCustomer) errors.push("Data pelanggan belum lengkap");

      if (!originWarehouse) errors.push("Gudang asal belum dipilih");
      if (!deliveryDate) errors.push("Tanggal pengiriman belum dipilih");
      if (!termOfPayment) errors.push("Term of Payment belum dipilih");

      if (errors.length > 0) {
        showAlert("Validasi Gagal", "Mohon lengkapi data berikut:\n" + errors.map(e => "- " + e).join("\n"), "error");
        return;
      }

      // Get term label
      const termLabel = termOptions.find(opt => opt.value === termOfPayment)?.label || termOfPayment;

      // Get warehouse name - use stored name or fetch from API
      let warehouseName = originWarehouseName;
      if (!warehouseName && originWarehouse) {
        try {
          console.log('⚠️ Warehouse name not in state, fetching from API...');
          const warehouseResp = await gudangService.getById(originWarehouse);
          const warehouseData = warehouseResp?.data || warehouseResp;
          warehouseName = warehouseData?.nama_gudang || warehouseData?.nama || originWarehouse;
          console.log('✅ Fetched warehouse name:', warehouseName);
        } catch (err) {
          console.error('❌ Failed to fetch warehouse name:', err);
          warehouseName = originWarehouse; // Fallback to ID if fetch fails
        }
      }

      if (!warehouseName) {
        warehouseName = 'N/A';
      }

      // Use selectedCustomer data if available, otherwise use form state
      const customerData = selectedCustomer ? {
        nama: selectedCustomer.nama_pelanggan || selectedCustomer.nama || customerName || 'N/A',
        telepon: selectedCustomer.telepon_hp || selectedCustomer.telepon || customerPhone || 'N/A',
        contact_person: selectedCustomer.contact_person || 'N/A',
        alamat: selectedCustomer.alamat || selectedCustomer.kota || customerAddress || 'N/A'
      } : {
        nama: customerName || 'N/A',
        telepon: customerPhone || 'N/A',
        contact_person: 'N/A',
        alamat: customerAddress || 'N/A'
      };

      // Prepare print data (use existing local state, no refetch)
      const printData = {
        nomor_so: soNumber,
        tanggal_so: soDate,
        tanggal_pengiriman: deliveryDate,
        term_of_payment: termLabel,
        gudang_asal: warehouseName,
        customer: customerData,
        items: items.map(item => ({
          nama_item: item.jenisBarang,
          bentuk_barang: item.bentuk,
          grade_barang: item.grade,
          dimensi_potong: item.dimensi,
          unit: item.satuanDisplay || item.satuan,
          qty: item.qty,
          total_kg: item.berat || 0,
          harga_per_unit: typeof item.harga === 'number' ? item.harga : parseInt(String(item.harga).replace(/[^\d]/g, '')) || 0,
          total_harga: parseInt(String(item.total).replace(/[^\d]/g, '')) || 0
        })),
        total_harga: subtotal,
        discount: totalDiscountSO,
        diskon_so_percent: diskonSOPercent,
        diskon_so_amount: diskonSOAmount,
        price_includes_ppn: priceIncludesPPN,
        dpp: dpp,
        ppn: ppn,
        grand_total: totalHargaSO
      };

      console.log('🖨️ Print data:', printData);

      // Generate printable HTML and open print dialog (no download)
      const printContent = generateSalesOrderPrintContent(printData);
      openPrintDialog(printContent);
    } catch (error) {
      console.error('Error printing sales order:', error);
      showAlert("Error", "Gagal generate PDF Sales Order", "error");
    } finally {
      setPrintLoading(false);
    }
  };

  const handleAutoFill = () => {
    // Note: SO number is now auto-generated from API, no need to set it manually

    setCustomerName("PT Jaya Makmur Sejahtera");
    setCustomerPhone("08123456789");
    setCustomerAddress("Jl. Raya Jakarta No. 123, Jakarta Selatan");

    setSelectedCustomer({
      id: 1,
      nama: "PT Jaya Makmur Sejahtera",
      kode: "CUST-001",
      telepon: "08123456789",
      email: "info@jayamakmur.com",
      alamat: "Jl. Raya Jakarta No. 123, Jakarta Selatan"
    });

    if (warehouseOptions.length > 0) {
      setOriginWarehouse(warehouseOptions[0].value);
    }
    if (termOptions.length > 0) {
      setTermOfPayment(termOptions[0].value);
    }
    setHandoverMethod("pickup");

    // Get available bentuk barang from master data
    const availableShapes = itemShapeOptions.filter(shape => shape.value && shape.label);
    const firstShape = availableShapes[0] || { value: "1", label: "AS", dimensi: "1D", nama: "AS", id: 1 };
    const secondShape = availableShapes[1] || { value: "2", label: "CNU", dimensi: "2D", nama: "CANAL U", id: 2 };

    // Calculate dimensions based on shape type
    const getDimensionsForShape = (shape, index) => {
      if (shape.dimensi === "1D") {
        return {
          panjang: 100,
          lebar: 0, // 1D doesn't use lebar
          tebal: 100, // 1D uses tebal instead of lebar
          dimensiString: `100 x 100`
        };
      } else {
        return {
          panjang: 50,
          lebar: 100,
          tebal: 100,
          dimensiString: `50 x 100 x 100`
        };
      }
    };

    const firstItemDims = getDimensionsForShape(firstShape, 0);
    const secondItemDims = getDimensionsForShape(secondShape, 1);

    // Calculate area for each item (TEBAL TIDAK DIHITUNG)
    const calculateArea = (panjang, lebar, tebal, dimensi) => {
      if (dimensi === "1D") {
        return (panjang / 1000).toFixed(2); // Convert to m (1D uses panjang saja)
      } else {
        return (panjang * lebar / 10000).toFixed(2); // Convert to m² (2D uses panjang x lebar)
      }
    };

    const firstItemArea = calculateArea(firstItemDims.panjang, firstItemDims.lebar, firstItemDims.tebal, firstShape.dimensi);
    const secondItemArea = calculateArea(secondItemDims.panjang, secondItemDims.lebar, secondItemDims.tebal, secondShape.dimensi);

    // Calculate totals using satuan-based pricing
    const firstSatuan = unitOptions.length > 0 ? unitOptions[0].label : "Per Dimensi";
    const firstUnitPrice = calculatePriceBySatuan(
      firstSatuan,
      firstItemDims.panjang,
      firstItemDims.lebar,
      firstItemDims.tebal,
      3,
      75000,
      0,
      firstShape
    );
    // Untuk satuan "utuh", tidak perlu dikalikan quantity lagi
    let firstTotal;
    if (firstSatuan?.toLowerCase() === 'utuh' || firstSatuan?.toLowerCase() === 'pcs' || firstSatuan?.toLowerCase() === 'pieces' || firstSatuan?.toLowerCase() === 'per unit' || firstSatuan?.toLowerCase() === 'per pcs') {
      firstTotal = firstUnitPrice; // Sudah termasuk quantity di dalamnya
    } else {
      firstTotal = firstUnitPrice * 3; // Kalikan dengan quantity untuk satuan lain
    }
    const firstDiscountAmount = firstTotal * 0.05;
    const firstFinalTotal = firstTotal - firstDiscountAmount;

    const autoItems = [
      {
        id: Date.now(),
        jenisBarang: itemTypeOptions.length > 0 ? itemTypeOptions[0].label : "Plat Besi",
        bentuk: firstShape.nama,
        grade: "Grade A",
        dimensi: firstItemDims.dimensiString,
        qty: 3,
        luasPerItem: firstShape.dimensi === "1D" ? `${firstItemArea} m` : `${firstItemArea} m²`,
        hargaDisplay: `Rp ${(75000).toLocaleString('id-ID')}/m²`,
        satuanDisplay: firstSatuan,
        diskon: "5%",
        total: `Rp ${firstFinalTotal.toLocaleString('id-ID')}`,
        jenisBarangId: itemTypeOptions.length > 0 ? itemTypeOptions[0].value : "1",
        bentukBarangId: firstShape.value,
        gradeBarangId: "1",
        panjang: firstItemDims.panjang,
        lebar: firstItemDims.lebar,
        tebal: firstItemDims.tebal,
        berat: 0,
        harga: 75000, // Backend value
        satuan: unitOptions.length > 0 ? unitOptions[0].value : "PER_DIMENSI", // Backend value
        diskonPercent: 5,
        catatan: `Auto-filled item 1 - ${firstShape.nama} (${firstShape.dimensi}) 😄`
      },
      {
        id: Date.now() + 1,
        jenisBarang: itemTypeOptions.length > 1 ? itemTypeOptions[1].label : itemTypeOptions[0]?.label || "Besi Beton",
        bentuk: secondShape.nama,
        grade: "Grade B",
        dimensi: secondItemDims.dimensiString,
        qty: 2,
        luasPerItem: secondShape.dimensi === "1D" ? `${secondItemArea} m` : `${secondItemArea} m²`,
        hargaDisplay: `Rp ${(45000).toLocaleString('id-ID')}/m²`,
        satuanDisplay: firstSatuan,
        diskon: "3%",
        total: `Rp ${(() => {
          const secondUnitPrice = calculatePriceBySatuan(firstSatuan, secondItemDims.panjang, secondItemDims.lebar, secondItemDims.tebal, 2, 45000, 0, secondShape);
          let secondTotal;
          if (firstSatuan?.toLowerCase() === 'utuh' || firstSatuan?.toLowerCase() === 'per unit' || firstSatuan?.toLowerCase() === 'per pcs') {
            secondTotal = secondUnitPrice; // Sudah termasuk quantity di dalamnya
          } else {
            secondTotal = secondUnitPrice * 2; // Kalikan dengan quantity untuk satuan lain
          }
          return (secondTotal * 0.97).toLocaleString('id-ID');
        })()}`,
        jenisBarangId: itemTypeOptions.length > 1 ? itemTypeOptions[1].value : itemTypeOptions[0]?.value || "2",
        bentukBarangId: secondShape.value,
        gradeBarangId: "2",
        panjang: secondItemDims.panjang,
        lebar: secondItemDims.lebar,
        tebal: secondItemDims.tebal,
        berat: 0,
        harga: 45000, // Backend value
        satuan: unitOptions.length > 0 ? unitOptions[0].value : "PER_DIMENSI", // Backend value
        diskonPercent: 3,
        catatan: `Auto-filled item 2 - ${secondShape.nama} (${secondShape.dimensi}) 🎯`
      }
    ];

    setItems(autoItems);
    showAlert("Info", `Data sudah di-auto fill! Items menggunakan bentuk barang: ${firstShape.nama} & ${secondShape.nama} 🎲`, "info");
  };

  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);

    // Reset all dimension fields when shape changes
    setItemPanjang("");
    setItemLebar("");
    setItemTebal("");
    setItemDiameterLuar("");
    setItemDiameterDalam("");
    setItemDiameter("");
    setItemSisi1("");
    setItemSisi2("");

    // Also reset the selected item barang group
    setSelectedItemBarangGroup(null);
  };

  // Load group item data with filters and pagination
  const loadGroupItemData = async (page = 1, resetFilters = false) => {
    // Validasi field yang diperlukan
    if (!itemType || !selectedShape || !itemGrade) {
      if (!resetFilters) {
        showAlert("Peringatan", "Mohon pilih Jenis Barang, Bentuk Barang, dan Grade Barang terlebih dahulu", "warning");
      }
      return;
    }

    try {
      setLoadingGroupItem(true);
      const queryParams = new URLSearchParams({
        jenis_barang_id: itemType,
        bentuk_barang_id: selectedShape.id,
        grade_barang_id: itemGrade,
        per_page: groupItemPagination.per_page,
        page: page
      });

      // Set min_quantity_utuh default to 1, or use filter value if provided
      const minQtyUtuh = groupItemFilters.min_quantity_utuh || '1';
      queryParams.append('min_quantity_utuh', minQtyUtuh);

      // Add filters if they have values
      if (groupItemFilters.panjang) queryParams.append('panjang', groupItemFilters.panjang);
      if (groupItemFilters.lebar) queryParams.append('lebar', groupItemFilters.lebar);
      if (groupItemFilters.tebal) queryParams.append('tebal', groupItemFilters.tebal);
      if (groupItemFilters.diameter_luar) queryParams.append('diameter_luar', groupItemFilters.diameter_luar);
      if (groupItemFilters.diameter_dalam) queryParams.append('diameter_dalam', groupItemFilters.diameter_dalam);
      if (groupItemFilters.diameter) queryParams.append('diameter', groupItemFilters.diameter);
      if (groupItemFilters.sisi1) queryParams.append('sisi1', groupItemFilters.sisi1);
      if (groupItemFilters.sisi2) queryParams.append('sisi2', groupItemFilters.sisi2);
      if (groupItemFilters.max_quantity_utuh) queryParams.append('max_quantity_utuh', groupItemFilters.max_quantity_utuh);
      if (groupItemFilters.min_quantity_potongan) queryParams.append('min_quantity_potongan', groupItemFilters.min_quantity_potongan);
      if (groupItemFilters.max_quantity_potongan) queryParams.append('max_quantity_potongan', groupItemFilters.max_quantity_potongan);

      const response = await request(`/item-barang/group?${queryParams.toString()}`, { method: 'GET' });
      console.log('Group item response:', response);
      const groupItems = Array.isArray(response.data) ? response.data : [];
      console.log('Group items to set:', groupItems);
      setGroupItemOptions(groupItems);

      // Update pagination
      if (response.pagination) {
        setGroupItemPagination({
          current_page: response.pagination.current_page || page,
          per_page: response.pagination.per_page || groupItemPagination.per_page,
          total: response.pagination.total || 0,
          last_page: response.pagination.last_page || 1
        });
      }
    } catch (error) {
      console.error('Error loading group item:', error);
      showAlert('Error', 'Gagal memuat data group item barang', 'error');
    } finally {
      setLoadingGroupItem(false);
    }
  };

  // Handle open group item modal
  const handleOpenGroupItemModal = async () => {
    // Reset filters and pagination
    setGroupItemFilters({
      panjang: "",
      lebar: "",
      tebal: "",
      diameter_luar: "",
      diameter_dalam: "",
      diameter: "",
      sisi1: "",
      sisi2: "",
      min_quantity_utuh: "",
      max_quantity_utuh: "",
      min_quantity_potongan: "",
      max_quantity_potongan: ""
    });
    setGroupItemPagination({
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1
    });
    setShowGroupItemFilters(false);

    await loadGroupItemData(1, true);
    setGroupItemModalOpen(true);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setGroupItemFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    loadGroupItemData(1, true);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setGroupItemFilters({
      panjang: "",
      lebar: "",
      tebal: "",
      diameter_luar: "",
      diameter_dalam: "",
      diameter: "",
      sisi1: "",
      sisi2: "",
      min_quantity_utuh: "",
      max_quantity_utuh: "",
      min_quantity_potongan: "",
      max_quantity_potongan: ""
    });
    loadGroupItemData(1, true);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= groupItemPagination.last_page) {
      loadGroupItemData(newPage, true);
    }
  };

  // Handle select group item
  const handleSelectGroupItem = (groupItem) => {
    // Fill all dimension fields from group item
    if (groupItem.panjang != null) setItemPanjang(groupItem.panjang.toString());
    if (groupItem.lebar != null) setItemLebar(groupItem.lebar.toString());
    if (groupItem.tebal != null) setItemTebal(groupItem.tebal.toString());
    if (groupItem.diameter_luar != null) setItemDiameterLuar(groupItem.diameter_luar.toString());
    if (groupItem.diameter_dalam != null) setItemDiameterDalam(groupItem.diameter_dalam.toString());
    if (groupItem.diameter != null) setItemDiameter(groupItem.diameter.toString());
    if (groupItem.sisi1 != null) setItemSisi1(groupItem.sisi1.toString());
    if (groupItem.sisi2 != null) setItemSisi2(groupItem.sisi2.toString());

    // Also set the selected group to update the dropdown selection
    setSelectedItemBarangGroup(groupItem);

    setGroupItemModalOpen(false);
    showAlert("Sukses", "Dimensi berhasil diisi dari group item", "success");
  };

  const shapeColumns = [
    { key: 'id', label: 'ID' },
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama' },
    {
      key: 'dimensi',
      label: 'Dimensi',
      type: 'badge',
      badgeColor: (value) => value === '1D' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    }
  ];

  // Calculate summary
  // Subtotal adalah total harga SETELAH diskon item (sudah termasuk diskon item)
  const subtotal = items.reduce((sum, item) => {
    try {
      const total = parseInt(item.total.replace(/[^\d]/g, '')) || 0;
      return sum + total;
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return sum;
    }
  }, 0);

  // Calculate SO-level discount (dihitung dari subtotal yang sudah termasuk diskon item)
  const diskonSOPercent = parseFloat(diskonSO) || 0;
  const diskonSOAmount = subtotal * (diskonSOPercent / 100);

  // Total discount = hanya diskon SO (karena diskon item sudah termasuk dalam subtotal)
  const totalDiscountSO = diskonSOAmount;

  // Calculate PPN based on whether item prices already include PPN
  let ppn = 0;
  let dpp = 0; // Dasar Pengenaan Pajak (base price before PPN)
  const afterDiscount = subtotal - totalDiscountSO;

  if (includePPN) {
    if (priceIncludesPPN) {
      // Harga sudah include PPN, jadi PPN = harga / 1.11 * 0.11
      // DPP = harga / 1.11
      dpp = afterDiscount / 1.11;
      ppn = afterDiscount - dpp; // atau: dpp * 0.11
    } else {
      // Harga belum include PPN, jadi PPN = harga * 0.11
      dpp = afterDiscount;
      ppn = afterDiscount * 0.11;
    }
  } else {
    dpp = afterDiscount;
    ppn = 0;
  }

  // Total Harga SO: jika harga sudah include PPN, total = subtotal - diskon (tidak tambah PPN lagi)
  // Jika harga belum include PPN, total = subtotal - diskon + PPN
  const totalHargaSO = priceIncludesPPN && includePPN
    ? afterDiscount  // Harga sudah include PPN
    : afterDiscount + ppn; // Harga belum include PPN, tambahkan PPN

  return (
    <SalesOrderLayout title="Sales Order (SO)" subtitle="TRANSAKSI">
      {/* Main Content Card */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title">Input Sales Order</CardTitle>
            <div className="flex space-sm">
              {/* {isUserAdmin && (
                <Button variant="outline" size="sm" onClick={handleAutoFill} className="btn-outline">
                  🎲 Auto Fill
                </Button>
              )} */}
              <Button variant="default" size="sm" onClick={handleTestSimpanSO} className="btn-primary">
                Simpan Sales Order
              </Button>

              <Button variant="secondary" size="sm" onClick={handleBackToList} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke List
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="section-content space-md">
          {/* Customer Information */}
          <CustomerInfoTabs
            onCustomerSelect={handleCustomerSelect}
            selectedCustomer={selectedCustomer}
          />

          {/* Display Selected Customer Info */}
          {selectedCustomer && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-sm font-medium text-gray-800 mb-2">
                Data Pelanggan yang Dipilih:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Nama:</strong> {selectedCustomer.nama_pelanggan || 'Tidak tersedia'}</div>
                <div><strong>Kode:</strong> {selectedCustomer.kode || 'Tidak tersedia'}</div>
                <div><strong>Telepon:</strong> {selectedCustomer.telepon_hp || 'Tidak tersedia'}</div>
                <div><strong>Contact Person:</strong> {selectedCustomer.contact_person || 'Tidak tersedia'}</div>
                <div className="col-span-2"><strong>Alamat:</strong> {selectedCustomer.kota || 'Tidak tersedia'}</div>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            {/* Sales Order Details */}
            <div className="grid-form m-lg">
              <div>
                <Label htmlFor="soNumber">Nomor SO</Label>
                <Input
                  id="soNumber"
                  value={soNumber}
                  disabled
                  className="bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Nomor SO akan otomatis terisi dari API generate sequence"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nomor SO otomatis di-generate dari sistem saat halaman dibuka
                </p>
              </div>
              <div>
                <Label htmlFor="soDate">Tanggal SO</Label>
                <div className="relative">
                  <Input
                    id="soDate"
                    type="date"
                    value={soDate}
                    onChange={(e) => setSoDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryDate">Tanggal Pengiriman</Label>
                <div className="relative">
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <SearchSelect
                  label="Term of Payment"
                  placeholder="Pilih Term of Payment"
                  searchPlaceholder="Cari term of payment..."
                  value={termOfPayment}
                  onValueChange={setTermOfPayment}
                  options={termOptions}
                  loading={loadingTerm}
                  required
                />
              </div>
              <div>
                <AsyncSearchSelect
                  label="Asal Gudang"
                  placeholder="Pilih Gudang"
                  searchPlaceholder="Cari gudang..."
                  value={originWarehouse}
                  onValueChange={(value, option) => {
                    setOriginWarehouse(value);
                    // Store the warehouse name for printing
                    if (option && option.label) {
                      setOriginWarehouseName(option.label);
                      console.log('✅ Warehouse selected:', { id: value, name: option.label });
                    }
                  }}
                  required
                  fetchOptions={async (q, page) => {
                    const resp = await gudangService.getPaginated(page || 1, 50, q || "", "", "asc", { tipe_gudang: "gudang" });
                    const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
                    return rows.map((item) => ({
                      value: item.id?.toString(),
                      label: item.nama_gudang || item.nama || "Unknown",
                    }));
                  }}
                />
              </div>
              <div>
                <SearchSelect
                  label="Metode Penyerahan"
                  placeholder="Pilih Metode Penyerahan"
                  searchPlaceholder="Cari metode penyerahan..."
                  value={handoverMethod}
                  onValueChange={setHandoverMethod}
                  options={handoverMethodOptions}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Item Input Form */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <CardTitle className="page-title">Input Item</CardTitle>
        </CardHeader>
        <CardContent className="section-content">
          <div className="grid-form m-lg">
            {/* Row 1: Bentuk Barang, Jenis Barang, Grade Barang */}
            <div>
              <Label htmlFor="itemShape">Bentuk Barang <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  value={selectedShape ? `${selectedShape.nama} (${selectedShape.dimensi})` : ""}
                  placeholder="Pilih Bentuk Barang"
                  readOnly
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShapeModalOpen(true)}
                >
                  Pilih
                </Button>
              </div>
            </div>
            <div>
              <AsyncSearchSelect
                label="Jenis Barang"
                placeholder="Pilih Jenis Barang"
                searchPlaceholder="Cari jenis barang..."
                value={itemType}
                onValueChange={(val, option) => {
                  setItemType(val);
                  if (option && option.label) {
                    setItemTypeLabel(option.label);
                  } else {
                    // Fallback if option not provided (should not happen on selection)
                    if (!val) {
                      setItemTypeLabel("");
                      return;
                    }
                    // Try to fetch if no option passed
                    jenisBarangService.getById(val).then(resp => {
                      const data = resp?.data || resp;
                      const label = data?.nama_jenis || data?.nama || data?.label || String(val);
                      setItemTypeLabel(label);
                    }).catch(() => {
                      setItemTypeLabel(String(val));
                    });
                  }
                }}
                required
                fetchOptions={async (q, page) => {
                  const resp = await jenisBarangService.getPaginated(page || 1, 50, q || "");
                  const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
                  return rows.map((item) => ({
                    value: item.id?.toString(),
                    label: item.nama_jenis || item.nama || item.label || "Unknown",
                  }));
                }}
              />
            </div>
            <div>
              <AsyncSearchSelect
                label="Grade Barang"
                placeholder="Pilih Grade"
                searchPlaceholder="Cari grade..."
                value={itemGrade}
                onValueChange={(val, option) => {
                  setItemGrade(val);
                  if (option && option.label) {
                    setItemGradeLabel(option.label);
                  } else {
                    if (!val) {
                      setItemGradeLabel("");
                      return;
                    }
                    gradeBarangService.getById(val).then(resp => {
                      const data = resp?.data || resp;
                      const label = data?.nama || data?.nama_grade || data?.label || String(val);
                      setItemGradeLabel(label);
                    }).catch(() => {
                      setItemGradeLabel(String(val));
                    });
                  }
                }}
                required
                fetchOptions={async (q, page) => {
                  const resp = await gradeBarangService.getPaginated(page || 1, 50, q || "");
                  const rows = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
                  return rows.map((item) => ({
                    value: item.id?.toString(),
                    label: item.nama || item.nama_grade || item.label || "Unknown",
                  }));
                }}
              />
            </div>

            {/* Row: Item Barang Group - appears when jenis, bentuk, and grade are selected */}
            {itemType && selectedShape && itemGrade && (
              <div className="col-span-3">
                <Label htmlFor="itemBarangGroup">Master Item Barang</Label>
                <div className="flex gap-2">
                  <select
                    id="itemBarangGroup"
                    value={selectedItemBarangGroup?.id?.toString() || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        setSelectedItemBarangGroup(null);
                        return;
                      }
                      const group = itemBarangGroupOptions.find(g => g.id?.toString() === selectedId);
                      if (group) {
                        setSelectedItemBarangGroup(group);
                        // Auto-fill all dimension fields from selected group
                        if (group.panjang != null) setItemPanjang(group.panjang.toString());
                        if (group.lebar != null) setItemLebar(group.lebar.toString());
                        if (group.tebal != null) setItemTebal(group.tebal.toString());
                        if (group.diameter_luar != null) setItemDiameterLuar(group.diameter_luar.toString());
                        if (group.diameter_dalam != null) setItemDiameterDalam(group.diameter_dalam.toString());
                        if (group.diameter != null) setItemDiameter(group.diameter.toString());
                        if (group.sisi1 != null) setItemSisi1(group.sisi1.toString());
                        if (group.sisi2 != null) setItemSisi2(group.sisi2.toString());
                      }
                    }}
                    disabled={loadingItemBarangGroup || itemBarangGroupOptions.length === 0}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {loadingItemBarangGroup
                        ? "Memuat..."
                        : itemBarangGroupOptions.length === 0
                          ? "Tidak ada Master Item Barang tersedia"
                          : "Pilih Master Item Barang"}
                    </option>
                    {itemBarangGroupOptions.map((group) => (
                      <option key={group.id} value={group.id?.toString()}>
                        {group.nama_group_barang || `Group ${group.id}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenGroupItemModal}
                    disabled={loadingGroupItem || !itemType || !selectedShape || !itemGrade}
                    className="h-10 w-12"
                    title="Pilih Group Item Barang"
                  >
                    {loadingGroupItem ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {selectedItemBarangGroup && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Qty Utuh: {selectedItemBarangGroup.quantity_utuh || 0} | Qty Potongan: {selectedItemBarangGroup.quantity_potongan || 0}
                  </p>
                )}
                {!loadingItemBarangGroup && itemBarangGroupOptions.length === 0 && itemType && selectedShape && itemGrade && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tidak ada group dengan kombinasi jenis, bentuk, dan grade ini
                  </p>
                )}
              </div>
            )}

            {/* Row 2: Jenis Potongan, Qty, Satuan */}
            <div>
              <SearchSelect
                label="Jenis Potongan"
                placeholder="Pilih Jenis Potongan"
                searchPlaceholder="Cari jenis potongan..."
                value={itemCutType}
                onValueChange={setItemCutType}
                options={cutTypeOptions}
                required
              />
            </div>
            <div>
              <Label htmlFor="itemQty">Qty <span className="text-red-500">*</span></Label>
              <Input
                id="itemQty"
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="itemUnit">Satuan <span className="text-red-500">*</span></Label>
              <div className="flex-1">
                <SearchSelect
                  label=""
                  placeholder="Pilih Satuan"
                  searchPlaceholder="Cari satuan..."
                  value={itemUnit}
                  onValueChange={setItemUnit}
                  options={unitOptions}
                  loading={loadingUnit}
                  required
                />
              </div>
            </div>

            {/* Row 3: Dynamic Dimension Fields based on tipe_barang */}
            {/* Diameter Luar - for pipes */}
            {selectedShape?.tipe_barang?.diameter_luar && (
              <div>
                <Label htmlFor="itemDiameterLuar">
                  Diameter Luar (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemDiameterLuar"
                  type="number"
                  step="0.01"
                  value={itemDiameterLuar}
                  onChange={(e) => setItemDiameterLuar(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_diameter_luar}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Diameter Dalam - for pipes */}
            {selectedShape?.tipe_barang?.diameter_dalam && (
              <div>
                <Label htmlFor="itemDiameterDalam">
                  Diameter Dalam (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemDiameterDalam"
                  type="number"
                  step="0.01"
                  value={itemDiameterDalam}
                  onChange={(e) => setItemDiameterDalam(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_diameter_dalam}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Diameter - for round shafts */}
            {selectedShape?.tipe_barang?.diameter && (
              <div>
                <Label htmlFor="itemDiameter">
                  Diameter (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemDiameter"
                  type="number"
                  step="0.01"
                  value={itemDiameter}
                  onChange={(e) => setItemDiameter(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_diameter}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Sisi 1 - for square/rectangular shafts */}
            {selectedShape?.tipe_barang?.sisi1 && (
              <div>
                <Label htmlFor="itemSisi1">
                  Sisi 1 (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemSisi1"
                  type="number"
                  step="0.01"
                  value={itemSisi1}
                  onChange={(e) => setItemSisi1(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_sisi1}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Sisi 2 - for square/rectangular shafts */}
            {selectedShape?.tipe_barang?.sisi2 && (
              <div>
                <Label htmlFor="itemSisi2">
                  Sisi 2 (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemSisi2"
                  type="number"
                  step="0.01"
                  value={itemSisi2}
                  onChange={(e) => setItemSisi2(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_sisi2}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Tebal - for plates and pipes */}
            {selectedShape?.tipe_barang?.tebal && (
              <div>
                <Label htmlFor="itemTebal">
                  Tebal (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemTebal"
                  type="number"
                  step="0.01"
                  value={itemTebal}
                  onChange={(e) => setItemTebal(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_tebal}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Lebar - for plates */}
            {selectedShape?.tipe_barang?.lebar && (
              <div>
                <Label htmlFor="itemLebar">
                  Lebar (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemLebar"
                  type="number"
                  step="0.01"
                  value={itemLebar}
                  onChange={(e) => setItemLebar(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_lebar}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}
            {/* Panjang - for all types */}
            {selectedShape?.tipe_barang?.panjang && (
              <div>
                <Label htmlFor="itemPanjang">
                  Panjang (mm) {itemCutType !== "utuh" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="itemPanjang"
                  type="number"
                  step="0.01"
                  value={itemPanjang}
                  onChange={(e) => setItemPanjang(e.target.value)}
                  placeholder="0.00"
                  disabled={itemCutType === "utuh" || !selectedShape?.tipe_barang?.cancut_panjang}
                  required={itemCutType !== "utuh"}
                />
              </div>
            )}

            {/* Row 4: Timbangan, Harga, Diskon */}
            <div>
              <Label htmlFor="itemWeight">
                Timbangan (kg)
                {loadingWeight && (
                  <span className="ml-2 text-xs text-gray-500">(Menghitung...)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="itemWeight"
                  type="number"
                  step="0.0001"
                  value={itemWeight}
                  onChange={(e) => setItemWeight(e.target.value)}
                  placeholder="0.0000"
                  disabled={loadingWeight}
                  className={loadingWeight ? "opacity-60 cursor-wait" : ""}
                />
                {loadingWeight && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Berat timbangan akan otomatis terisi saat semua field terisi
              </p>
            </div>
            <div>
              <Label htmlFor="itemPrice">{getPriceLabel()} <span className="text-red-500">*</span></Label>
              <Input
                id="itemPrice"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="itemDiscount">Diskon (%)</Label>
              <Input
                id="itemDiscount"
                type="number"
                value={itemDiscount}
                onChange={(e) => setItemDiscount(e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === '' || e.target.value === null) {
                    setItemDiscount('0');
                  }
                }}
                min="0"
                max="100"
                placeholder="0"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="grid-summary m-lg p-md bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600">Ketebalan</Label>
              <div className="font-medium text-blue-600">{itemThickness}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">{selectedShape?.dimensi === "1D" ? "Ukuran Panjang" : "Ukuran Volume"}</Label>
              <div className="font-medium text-green-600">{itemArea}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">{getPriceSummaryLabel()}</Label>
              <div className="font-medium text-orange-600">{itemPricePerUnit}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Item</Label>
              <div className="font-medium text-red-600">{itemTotal}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Timbangan</Label>
              <div className="font-medium text-purple-600">
                {((parseFloat(itemQty) || 0) * (parseFloat(itemWeight) || 0)).toFixed(4)} kg
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <Label htmlFor="itemNotes">Catatan (Opsional)</Label>
            <Textarea
              id="itemNotes"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Masukkan catatan tambahan untuk item ini (opsional)..."
              className="min-h-[100px] resize-y"
            />
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleAddItem} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Item List Table */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title">Daftar Item dalam SO</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="section-content">
          <Table className="table-standard">
            <TableHeader className="table-header-standard">
              <TableRow>
                <TableHead className="table-header-cell-standard">#</TableHead>
                <TableHead className="table-header-cell-standard">Jenis Barang</TableHead>
                <TableHead className="table-header-cell-standard">Bentuk</TableHead>
                <TableHead className="table-header-cell-standard">Grade</TableHead>
                <TableHead className="table-header-cell-standard">Dimensi</TableHead>
                <TableHead className="table-header-cell-standard">Qty</TableHead>
                <TableHead className="table-header-cell-standard">Luas/item</TableHead>
                <TableHead className="table-header-cell-standard">Harga</TableHead>
                <TableHead className="table-header-cell-standard">Satuan</TableHead>
                <TableHead className="table-header-cell-standard">Jenis Potongan</TableHead>
                <TableHead className="table-header-cell-standard">Diskon</TableHead>
                <TableHead className="table-header-cell-standard">Total</TableHead>
                <TableHead className="table-header-cell-standard">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="table-cell-standard">{index + 1}</TableCell>
                  <TableCell className="table-cell-standard">{item.jenisBarang}</TableCell>
                  <TableCell className="table-cell-standard">{item.bentuk}</TableCell>
                  <TableCell className="table-cell-standard">{item.grade}</TableCell>
                  <TableCell className="table-cell-standard">{item.dimensi}</TableCell>
                  <TableCell className="table-cell-standard">{item.qty}</TableCell>
                  <TableCell className="table-cell-standard">{item.luasPerItem}</TableCell>
                  <TableCell className="table-cell-standard">{item.hargaDisplay}</TableCell>
                  <TableCell className="table-cell-standard">{item.satuanDisplay}</TableCell>
                  <TableCell className="table-cell-standard">{item.jenis_potongan}</TableCell>
                  <TableCell className="table-cell-standard">{item.diskon}</TableCell>
                  <TableCell className="table-cell-standard">{item.total}</TableCell>
                  <TableCell className="table-cell-standard">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="table-cell-standard text-center text-gray-500 py-8">
                    Belum ada item yang ditambahkan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Label htmlFor="includePPN" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Sertakan PPN (11%)
                </Label>
                <Switch
                  id="includePPN"
                  checked={includePPN}
                  onCheckedChange={setIncludePPN}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="priceIncludesPPN" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Harga per item sudah include PPN
                </Label>
                <Switch
                  id="priceIncludesPPN"
                  checked={priceIncludesPPN}
                  onCheckedChange={setPriceIncludesPPN}
                  disabled={!includePPN}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Subtotal</Label>
              <div className="text-lg font-semibold">{formatCurrency(subtotal)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Diskon SO (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={diskonSO}
                  onChange={(e) => setDiskonSO(e.target.value)}
                  className="w-24 text-center"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              {diskonSOAmount > 0 && (
                <div className="text-sm text-orange-600 mt-1">
                  ({formatCurrency(diskonSOAmount)})
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Diskon SO</Label>
              <div className="text-lg font-semibold text-red-600">{formatCurrency(totalDiscountSO)}</div>
            </div>
            {priceIncludesPPN && includePPN && (
              <div>
                <Label className="text-sm text-gray-600">DPP (Dasar Pengenaan Pajak)</Label>
                <div className="text-lg font-semibold text-blue-600">{formatCurrency(dpp)}</div>
                <div className="text-xs text-gray-500">
                  Harga sebelum PPN
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-600">
                PPN (11%)
                {priceIncludesPPN && includePPN && (
                  <span className="text-xs text-gray-500 ml-1">(sudah termasuk)</span>
                )}
              </Label>
              <div className="text-lg font-semibold">{formatCurrency(ppn)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Harga SO</Label>
              <div className="text-xl font-bold text-green-700">{formatCurrency(totalHargaSO)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons: only Cetak */}
      <div className="flex justify-center gap-4">
        {hasRole(['admin', 'manager', 'supervisor']) && (
          <Button
            size="lg"
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={handlePrintSalesOrder}
            disabled={printLoading}
          >
            {printLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            Cetak
          </Button>
        )}
      </div>

      {/* Data Table Modal for Shape Selection */}
      <DataTableModal
        open={shapeModalOpen}
        onOpenChange={setShapeModalOpen}
        onItemSelect={handleShapeSelect}
        data={itemShapeOptions}
        columns={shapeColumns}
        title="Pilih Bentuk Barang"
        searchPlaceholder="Cari bentuk barang..."
        selectButtonText="Pilih"
      />

      {/* Custom Modal for Group Item Selection with Filter and Pagination */}
      <Dialog open={groupItemModalOpen} onOpenChange={setGroupItemModalOpen}>
        <DialogContent className="modal-content-standard max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="modal-header-standard flex-shrink-0 px-6 pt-6 pb-4">
            <DialogTitle className="page-title">Pilih Item</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 px-6 pb-6">
            {/* Filter Toggle Button */}
            <div className="flex-shrink-0 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGroupItemFilters(!showGroupItemFilters)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </span>
                {showGroupItemFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Filter Form */}
            {showGroupItemFilters && (
              <Card className="card-standard mb-4 flex-shrink-0">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedShape?.tipe_barang?.panjang && (
                      <div>
                        <Label htmlFor="filter-panjang">Panjang (mm)</Label>
                        <Input
                          id="filter-panjang"
                          type="number"
                          value={groupItemFilters.panjang}
                          onChange={(e) => handleFilterChange('panjang', e.target.value)}
                          placeholder="Panjang"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.lebar && (
                      <div>
                        <Label htmlFor="filter-lebar">Lebar (mm)</Label>
                        <Input
                          id="filter-lebar"
                          type="number"
                          value={groupItemFilters.lebar}
                          onChange={(e) => handleFilterChange('lebar', e.target.value)}
                          placeholder="Lebar"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.tebal && (
                      <div>
                        <Label htmlFor="filter-tebal">Tebal (mm)</Label>
                        <Input
                          id="filter-tebal"
                          type="number"
                          value={groupItemFilters.tebal}
                          onChange={(e) => handleFilterChange('tebal', e.target.value)}
                          placeholder="Tebal"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.diameter_luar && (
                      <div>
                        <Label htmlFor="filter-diameter-luar">Diameter Luar (mm)</Label>
                        <Input
                          id="filter-diameter-luar"
                          type="number"
                          value={groupItemFilters.diameter_luar}
                          onChange={(e) => handleFilterChange('diameter_luar', e.target.value)}
                          placeholder="Diameter Luar"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.diameter_dalam && (
                      <div>
                        <Label htmlFor="filter-diameter-dalam">Diameter Dalam (mm)</Label>
                        <Input
                          id="filter-diameter-dalam"
                          type="number"
                          value={groupItemFilters.diameter_dalam}
                          onChange={(e) => handleFilterChange('diameter_dalam', e.target.value)}
                          placeholder="Diameter Dalam"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.diameter && (
                      <div>
                        <Label htmlFor="filter-diameter">Diameter (mm)</Label>
                        <Input
                          id="filter-diameter"
                          type="number"
                          value={groupItemFilters.diameter}
                          onChange={(e) => handleFilterChange('diameter', e.target.value)}
                          placeholder="Diameter"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.sisi1 && (
                      <div>
                        <Label htmlFor="filter-sisi1">Sisi 1 (mm)</Label>
                        <Input
                          id="filter-sisi1"
                          type="number"
                          value={groupItemFilters.sisi1}
                          onChange={(e) => handleFilterChange('sisi1', e.target.value)}
                          placeholder="Sisi 1"
                        />
                      </div>
                    )}
                    {selectedShape?.tipe_barang?.sisi2 && (
                      <div>
                        <Label htmlFor="filter-sisi2">Sisi 2 (mm)</Label>
                        <Input
                          id="filter-sisi2"
                          type="number"
                          value={groupItemFilters.sisi2}
                          onChange={(e) => handleFilterChange('sisi2', e.target.value)}
                          placeholder="Sisi 2"
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="filter-min-qty-utuh">Min Qty Utuh</Label>
                      <Input
                        id="filter-min-qty-utuh"
                        type="number"
                        value={groupItemFilters.min_quantity_utuh}
                        onChange={(e) => handleFilterChange('min_quantity_utuh', e.target.value)}
                        placeholder="Min"
                      />
                    </div>
                    <div>
                      <Label htmlFor="filter-max-qty-utuh">Max Qty Utuh</Label>
                      <Input
                        id="filter-max-qty-utuh"
                        type="number"
                        value={groupItemFilters.max_quantity_utuh}
                        onChange={(e) => handleFilterChange('max_quantity_utuh', e.target.value)}
                        placeholder="Max"
                      />
                    </div>
                    <div>
                      <Label htmlFor="filter-min-qty-potongan">Min Qty Potongan</Label>
                      <Input
                        id="filter-min-qty-potongan"
                        type="number"
                        value={groupItemFilters.min_quantity_potongan}
                        onChange={(e) => handleFilterChange('min_quantity_potongan', e.target.value)}
                        placeholder="Min"
                      />
                    </div>
                    <div>
                      <Label htmlFor="filter-max-qty-potongan">Max Qty Potongan</Label>
                      <Input
                        id="filter-max-qty-potongan"
                        type="number"
                        value={groupItemFilters.max_quantity_potongan}
                        onChange={(e) => handleFilterChange('max_quantity_potongan', e.target.value)}
                        placeholder="Max"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleApplyFilters} className="flex-1">
                        Terapkan
                      </Button>
                      <Button onClick={handleResetFilters} variant="outline" className="flex-1">
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Table with scroll */}
            <Card className="card-standard flex-1 min-h-0 flex flex-col border">
              <CardContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div
                    className="flex-1 overflow-y-auto overflow-x-auto relative"
                    style={{
                      scrollbarWidth: 'auto',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                  >
                    <Table className="table-standard w-full">
                      <TableHeader className="table-header-standard sticky top-0 bg-white z-10 border-b">
                        <TableRow>
                          <TableHead className="table-header-cell-standard">ID</TableHead>
                          {selectedShape?.tipe_barang?.panjang && (
                            <TableHead className="table-header-cell-standard">Panjang (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.lebar && (
                            <TableHead className="table-header-cell-standard">Lebar (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.tebal && (
                            <TableHead className="table-header-cell-standard">Tebal (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.diameter_luar && (
                            <TableHead className="table-header-cell-standard">D. Luar (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.diameter_dalam && (
                            <TableHead className="table-header-cell-standard">D. Dalam (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.diameter && (
                            <TableHead className="table-header-cell-standard">Diameter (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.sisi1 && (
                            <TableHead className="table-header-cell-standard">Sisi 1 (mm)</TableHead>
                          )}
                          {selectedShape?.tipe_barang?.sisi2 && (
                            <TableHead className="table-header-cell-standard">Sisi 2 (mm)</TableHead>
                          )}
                          <TableHead className="table-header-cell-standard">Qty Utuh</TableHead>
                          <TableHead className="table-header-cell-standard">Qty Potongan</TableHead>
                          <TableHead className="table-header-cell-standard text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupItemOptions.map((item, index) => (
                          <TableRow key={item.id || index} className="hover:bg-gray-50">
                            <TableCell className="table-cell-standard">{item.id}</TableCell>
                            {selectedShape?.tipe_barang?.panjang && (
                              <TableCell className="table-cell-standard">{item.panjang?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.lebar && (
                              <TableCell className="table-cell-standard">{item.lebar?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.tebal && (
                              <TableCell className="table-cell-standard">{item.tebal?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.diameter_luar && (
                              <TableCell className="table-cell-standard">{item.diameter_luar?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.diameter_dalam && (
                              <TableCell className="table-cell-standard">{item.diameter_dalam?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.diameter && (
                              <TableCell className="table-cell-standard">{item.diameter?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.sisi1 && (
                              <TableCell className="table-cell-standard">{item.sisi1?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            {selectedShape?.tipe_barang?.sisi2 && (
                              <TableCell className="table-cell-standard">{item.sisi2?.toLocaleString('id-ID') || '-'}</TableCell>
                            )}
                            <TableCell className="table-cell-standard">{item.quantity_utuh?.toLocaleString('id-ID') || '-'}</TableCell>
                            <TableCell className="table-cell-standard">{item.quantity_potongan?.toLocaleString('id-ID') || '-'}</TableCell>
                            <TableCell className="table-cell-standard text-center">
                              <Button
                                size="sm"
                                onClick={() => handleSelectGroupItem(item)}
                                className="btn-primary"
                              >
                                Pilih
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {groupItemOptions.length === 0 && !loadingGroupItem && (
                          <TableRow>
                            <TableCell colSpan={7} className="table-cell-standard text-center text-gray-500 py-8">
                              Tidak ada data
                            </TableCell>
                          </TableRow>
                        )}
                        {loadingGroupItem && (
                          <TableRow>
                            <TableCell colSpan={7} className="table-cell-standard text-center text-gray-500 py-8">
                              Memuat data...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {groupItemPagination.total > 0 && (
              <div className="flex-shrink-0 mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Menampilkan {((groupItemPagination.current_page - 1) * groupItemPagination.per_page) + 1} - {Math.min(groupItemPagination.current_page * groupItemPagination.per_page, groupItemPagination.total)} dari {groupItemPagination.total} data
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(groupItemPagination.current_page - 1)}
                    disabled={groupItemPagination.current_page === 1 || loadingGroupItem}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-sm text-gray-600 px-2">
                    Halaman {groupItemPagination.current_page} dari {groupItemPagination.last_page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(groupItemPagination.current_page + 1)}
                    disabled={groupItemPagination.current_page === groupItemPagination.last_page || loadingGroupItem}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Modal Component */}
      <AlertComponent />
    </SalesOrderLayout >
  );
}
