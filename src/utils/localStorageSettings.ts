const STORAGE_KEYS = {
  API_KEY: 'jal_apiKey',
  HOPPIE_ID: 'jal_hoppieId',
  SIMBRIEF_ID: 'jal_simbriefId'
};

export const getSettings = () => {
  if (typeof window === 'undefined') {
    return {
      apiKey: '',
      hoppieId: '',
      simbriefId: ''
    };
  }

  return {
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
    hoppieId: localStorage.getItem(STORAGE_KEYS.HOPPIE_ID) || '',
    simbriefId: localStorage.getItem(STORAGE_KEYS.SIMBRIEF_ID) || ''
  };
};

export const clearSettings = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem(STORAGE_KEYS.HOPPIE_ID);
  localStorage.removeItem(STORAGE_KEYS.SIMBRIEF_ID);
};