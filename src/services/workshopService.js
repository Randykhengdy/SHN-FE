const STORAGE_KEY = "workshop_data";

const getStoredWorkshops = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveStoredWorkshops = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const workshopService = {
  getAll() {
    return Promise.resolve(getStoredWorkshops());
  },

  create(payload) {
    const data = getStoredWorkshops();
    const newData = {
      id: Date.now(), // simple unique ID
      ...payload,
      deleted: false,
    };
    data.push(newData);
    saveStoredWorkshops(data);
    return Promise.resolve(newData);
  },

  update(id, payload) {
    const data = getStoredWorkshops();
    const index = data.findIndex((item) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...payload };
      saveStoredWorkshops(data);
      return Promise.resolve(data[index]);
    }
    return Promise.reject("Not found");
  },

  delete(id) {
    const data = getStoredWorkshops();
    const index = data.findIndex((item) => item.id === id);
    if (index !== -1) {
      data[index].deleted = true;
      saveStoredWorkshops(data);
      return Promise.resolve();
    }
    return Promise.reject("Not found");
  },

  restore(id) {
    const data = getStoredWorkshops();
    const index = data.findIndex((item) => item.id === id);
    if (index !== -1 && data[index].deleted) {
      data[index].deleted = false;
      saveStoredWorkshops(data);
      return Promise.resolve();
    }
    return Promise.reject("Not found or not deleted");
  },

  forceDelete(id) {
    const data = getStoredWorkshops().filter((item) => item.id !== id);
    saveStoredWorkshops(data);
    return Promise.resolve();
  },

  getTrashed() {
    const data = getStoredWorkshops().filter((item) => item.deleted);
    return Promise.resolve(data);
  },

  getAllWithTrashed() {
    return Promise.resolve(getStoredWorkshops());
  },
};
