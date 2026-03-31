export const CONFIG = {
  get USE_MOCK() {
    // Default to true (Demo Mode) if not explicitly set to 'false'
    return localStorage.getItem('use_mock_data') !== 'false';
  },
  set USE_MOCK(value: boolean) {
    localStorage.setItem('use_mock_data', String(value));
  }
};
