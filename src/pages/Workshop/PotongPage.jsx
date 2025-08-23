import { useEffect, useState } from "react";
import POSelector from "@/components/workshop/POSelector";
import AddCutDialog from "@/components/workshop/AddCutDialog";
import CutReportTable from "@/components/workshop/CutReportTable";
import { getPOList } from "@/services/workshopService";

export default function PotongPage() {
  const [poList, setPoList] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const fetchPO = async () => {
    const data = await getPOList();
    setPoList(data);
    if (!selectedPO && data.length > 0) {
      setSelectedPO(data[0]);
    }
  };

  useEffect(() => {
    fetchPO();
  }, []);

  const handleRefresh = () => {
    setRefresh((prev) => !prev); // trigger re-render
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <POSelector
          poList={poList}
          selectedPO={selectedPO}
          onChange={(po) => setSelectedPO(po)}
        />
        <AddCutDialog selectedPO={selectedPO} onSave={handleRefresh} />
      </div>

      <div className="mt-6">
        <CutReportTable selectedPO={selectedPO} refresh={refresh} />
      </div>
    </div>
  );
}
